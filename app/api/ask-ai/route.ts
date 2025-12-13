/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import OpenAI from "openai";
import Groq from "groq-sdk";

import {
  ALL_PROVIDERS,
  FREE_PROVIDERS,
  BYOK_PROVIDERS,
  getModelById,
  getProviderById,
  DEFAULT_MODEL,
  DEFAULT_PROVIDER,
} from "@/lib/providers";
import {
  INITIAL_SYSTEM_PROMPT,
  FOLLOW_UP_SYSTEM_PROMPT,
  SEARCH_START,
  DIVIDER,
  REPLACE_END,
  NEW_PAGE_START,
  NEW_PAGE_END,
  UPDATE_PAGE_START,
  UPDATE_PAGE_END,
  MAX_REQUESTS_PER_IP,
} from "@/lib/prompts";
import {
  REACT_SYSTEM_PROMPT,
  NEXTJS_SYSTEM_PROMPT,
  REACT_FOLLOW_UP_PROMPT,
  parseReactFiles,
} from "@/lib/prompts-react";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Page, ProjectType, CodeFile } from "@/types";

// Rate limiting for anonymous users
const ipAddresses = new Map<string, number>();

// Helper: Calculate similarity between two strings (0-1)
function stringSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  
  if (longer.length === 0) return 1.0;
  
  // Quick check for identical strings
  if (s1 === s2) return 1.0;
  
  // Levenshtein distance calculation
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  
  return (longer.length - costs[s2.length]) / longer.length;
}

// Helper: Normalize whitespace for comparison
function normalizeWhitespace(str: string): string {
  return str
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

// Helper: Find best fuzzy match in the page HTML
function findBestFuzzyMatch(
  pageHtml: string,
  searchBlock: string,
  minSimilarity: number = 0.7
): { start: number; end: number; matchedText: string } | null {
  const normalizedSearch = normalizeWhitespace(searchBlock);
  const searchLines = normalizedSearch.split('\n');
  const pageLines = pageHtml.split('\n');
  
  let bestMatch: { start: number; end: number; matchedText: string; similarity: number } | null = null;
  
  // Slide through the page looking for similar blocks
  for (let i = 0; i <= pageLines.length - searchLines.length; i++) {
    const windowLines = pageLines.slice(i, i + searchLines.length + 2); // +2 for flexibility
    const windowText = windowLines.join('\n');
    const normalizedWindow = normalizeWhitespace(windowText);
    
    const similarity = stringSimilarity(normalizedSearch, normalizedWindow);
    
    if (similarity >= minSimilarity && (!bestMatch || similarity > bestMatch.similarity)) {
      // Calculate actual character positions
      const startPos = pageLines.slice(0, i).join('\n').length + (i > 0 ? 1 : 0);
      const matchedText = pageLines.slice(i, i + searchLines.length).join('\n');
      
      bestMatch = {
        start: startPos,
        end: startPos + matchedText.length,
        matchedText,
        similarity
      };
    }
  }
  
  return bestMatch ? { start: bestMatch.start, end: bestMatch.end, matchedText: bestMatch.matchedText } : null;
}

// Helper: Extract full HTML from AI response (fallback for when SEARCH/REPLACE fails)
function extractFullHtmlFromResponse(response: string): string | null {
  // Try to find complete HTML document
  const htmlDocMatch = response.match(/<!DOCTYPE html>[\s\S]*<\/html>/i) || 
                       response.match(/<html[\s\S]*<\/html>/i);
  if (htmlDocMatch) return htmlDocMatch[0];
  
  // Try to find HTML in code blocks
  const codeBlockMatch = response.match(/```html\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1].trim().length > 100) {
    return codeBlockMatch[1].trim();
  }
  
  // Try to find body content
  const bodyMatch = response.match(/<body[\s\S]*<\/body>/i);
  if (bodyMatch) return bodyMatch[0];
  
  return null;
}

// Helper to decrypt API keys
function decryptKey(encrypted: string): string {
  const secret = process.env.API_KEYS_SECRET || process.env.NEXTAUTH_SECRET || "default-secret";
  const buffer = Buffer.from(encrypted, "base64");
  const secretBuffer = Buffer.from(secret);
  const decrypted = buffer.map((byte, i) => byte ^ secretBuffer[i % secretBuffer.length]);
  return Buffer.from(decrypted).toString("utf-8");
}

// Create AI client based on provider
function createClient(
  providerId: string,
  apiKey: string
): OpenAI | Groq {
  const provider = getProviderById(providerId);
  
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  // Use Groq SDK for Groq provider for better performance
  if (providerId === "groq") {
    return new Groq({ apiKey });
  }

  // OpenRouter requires additional headers
  if (providerId === "openrouter") {
    return new OpenAI({
      apiKey,
      baseURL: provider.baseUrl,
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-Title": "Groq Coder",
      },
    });
  }

  // Use OpenAI-compatible client for all other providers
  return new OpenAI({
    apiKey,
    baseURL: provider.baseUrl,
  });
}

// Get API key for provider
async function getApiKey(
  providerId: string,
  userEmail?: string
): Promise<string> {
  // For free providers, use environment variables
  if (FREE_PROVIDERS[providerId]) {
    const envKey = process.env[`${providerId.toUpperCase()}_API_KEY`];
    if (envKey) return envKey;
    throw new Error(`No API key configured for ${providerId}`);
  }

  // For BYOK providers, get user's key from database
  if (BYOK_PROVIDERS[providerId]) {
    if (!userEmail) {
      throw new Error(`Please sign in and add your ${ALL_PROVIDERS[providerId].name} API key in settings`);
    }

    await connectToDatabase();
    const user = await User.findOne({ email: userEmail });

    if (!user?.apiKeys?.[providerId as keyof typeof user.apiKeys]) {
      throw new Error(`Please add your ${ALL_PROVIDERS[providerId].name} API key in settings`);
    }

    return decryptKey(user.apiKeys[providerId as keyof typeof user.apiKeys]);
  }

  throw new Error(`Unknown provider: ${providerId}`);
}

// POST - Generate new content
export async function POST(request: NextRequest) {
  const authHeaders = await headers();
  const session = await getServerSession(authOptions);

  const body = await request.json();
  const {
    prompt,
    provider: requestedProvider,
    model: requestedModel,
    redesignMarkdown,
    previousPrompts,
    pages,
    projectType = "html" as ProjectType,
  } = body;

  // Select system prompt based on project type
  const getSystemPrompt = (type: ProjectType): string => {
    switch (type) {
      case "react":
        return REACT_SYSTEM_PROMPT;
      case "nextjs":
        return NEXTJS_SYSTEM_PROMPT;
      default:
        return INITIAL_SYSTEM_PROMPT;
    }
  };

  // Validate required fields
  if (!prompt && !redesignMarkdown) {
    return NextResponse.json(
      { ok: false, error: "Missing prompt" },
      { status: 400 }
    );
  }

  // Get selected model and provider
  const modelId = requestedModel || DEFAULT_MODEL;
  const providerId = requestedProvider || DEFAULT_PROVIDER;

  const selectedModel = getModelById(modelId);
  if (!selectedModel) {
    return NextResponse.json(
      { ok: false, error: "Invalid model selected" },
      { status: 400 }
    );
  }

  // Validate provider matches model
  if (selectedModel.provider !== providerId) {
    return NextResponse.json(
      {
        ok: false,
        error: `Model ${selectedModel.name} requires ${ALL_PROVIDERS[selectedModel.provider].name} provider`,
        openSelectProvider: true,
      },
      { status: 400 }
    );
  }

  // Rate limiting for anonymous users
  const forwardedFor = authHeaders.get("x-forwarded-for") || "";
  const ip: string = forwardedFor.includes(",")
    ? forwardedFor.split(",")[1]?.trim() || "unknown"
    : forwardedFor || "unknown";

  if (!session?.user?.email && BYOK_PROVIDERS[providerId]) {
    return NextResponse.json(
      {
        ok: false,
        openLogin: true,
        message: "Sign in and add your API key to use this provider",
      },
      { status: 401 }
    );
  }

  if (!session?.user?.email && FREE_PROVIDERS[providerId]) {
    ipAddresses.set(ip, (ipAddresses.get(ip) || 0) + 1);
    if (ipAddresses.get(ip)! > MAX_REQUESTS_PER_IP) {
      return NextResponse.json(
        {
          ok: false,
          openLogin: true,
          message: "Sign in to continue using the service",
        },
        { status: 429 }
      );
    }
  }

  try {
    // Get API key
    const apiKey = await getApiKey(providerId, session?.user?.email);

    // Create client
    const client = createClient(providerId, apiKey);

    // Helper to estimate token count (rough: ~4 chars per token)
    const estimateTokens = (text: string) => Math.ceil(text.length / 4);

    // Helper to truncate HTML content to fit within token limits
    const truncateContext = (content: string, maxTokens: number): string => {
      const estimatedTokens = estimateTokens(content);
      if (estimatedTokens <= maxTokens) return content;
      
      // Truncate to approximately maxTokens
      const maxChars = maxTokens * 4;
      const truncated = content.substring(0, maxChars);
      return truncated + "\n<!-- ...content truncated due to length... -->";
    };

    // Prepare messages
    const messages: any[] = [
      {
        role: "system",
        content: getSystemPrompt(projectType),
      },
    ];

    // Calculate available tokens for context (leaving room for response)
    const modelContextLength = selectedModel.contextLength || 8000;
    const maxContextTokens = Math.min(modelContextLength - 4000, 60000); // Leave 4k for response, cap at 60k

    if (pages?.length > 1) {
      // Truncate pages if too large
      const pagesContext = pages
        .map((p: Page) => `- ${p.path} \n${truncateContext(p.html, Math.floor(maxContextTokens / pages.length))}`)
        .join("\n");
      
      const promptsContext = previousPrompts
        .map((p: string) => `- ${p}`)
        .join("\n");

      messages.push({
        role: "assistant",
        content: `Here are the current pages:\n\n${pagesContext}\n\nNow, please create a new page based on this code. Also here are the previous prompts:\n\n${promptsContext}`,
      });
    }

    messages.push({
      role: "user",
      content: redesignMarkdown
        ? `Here is my current design as a markdown:\n\n${truncateContext(redesignMarkdown, maxContextTokens)}\n\nNow, please create a new design based on this markdown.`
        : prompt,
    });

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const response = new NextResponse(stream.readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });

    // Stream the response
    (async () => {
      try {
        const chatCompletion = await (client as any).chat.completions.create({
          model: modelId,
          messages,
          max_tokens: 16384,
          stream: true,
        });

        for await (const chunk of chatCompletion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            await writer.write(encoder.encode(content));
          }
        }
      } catch (error: any) {
        console.error("Streaming error:", error);
        
        // Parse Groq-specific errors
        let errorMessage = error.message || "An error occurred";
        let openSelectProvider = true;
        
        // Handle rate limit / TPM errors
        if (error.status === 413 || errorMessage.includes("tokens per minute") || errorMessage.includes("TPM")) {
          errorMessage = "Request too large. Try a shorter prompt or use a model with higher limits.";
          openSelectProvider = true;
        }
        
        // Handle rate limit errors
        if (error.status === 429 || errorMessage.includes("rate limit")) {
          errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
          openSelectProvider = false;
        }
        
        // Handle authentication errors
        if (error.status === 401 || error.status === 403) {
          errorMessage = "API key invalid or expired. Please check your settings.";
          openSelectProvider = true;
        }
        
        await writer.write(
          encoder.encode(
            JSON.stringify({
              ok: false,
              message: errorMessage,
              openSelectProvider,
            })
          )
        );
      } finally {
        await writer.close();
      }
    })();

    return response;
  } catch (error: any) {
    console.error("API route error:", error);
    
    let errorMessage = error.message || "An error occurred";
    
    // Parse Groq API error responses
    if (error.error?.message) {
      errorMessage = error.error.message;
    }
    
    return NextResponse.json(
      {
        ok: false,
        message: errorMessage,
        openSelectProvider: BYOK_PROVIDERS[providerId] ? false : true,
        openSettings: BYOK_PROVIDERS[providerId] ? true : false,
      },
      { status: 500 }
    );
  }
}

// PUT - Update existing content
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const authHeaders = await headers();

  const body = await request.json();
  const {
    prompt,
    previousPrompts,
    provider: requestedProvider,
    selectedElementHtml,
    model: requestedModel,
    pages,
    files,
    projectType = "html" as ProjectType,
  } = body;

  if (!prompt || !pages?.length) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  const modelId = requestedModel || DEFAULT_MODEL;
  const providerId = requestedProvider || DEFAULT_PROVIDER;

  const selectedModel = getModelById(modelId);
  if (!selectedModel) {
    return NextResponse.json(
      { ok: false, error: "Invalid model selected" },
      { status: 400 }
    );
  }

  // Rate limiting for anonymous users
  const forwardedFor2 = authHeaders.get("x-forwarded-for") || "";
  const ip: string = forwardedFor2.includes(",")
    ? forwardedFor2.split(",")[1]?.trim() || "unknown"
    : forwardedFor2 || "unknown";

  if (!session?.user?.email && BYOK_PROVIDERS[providerId]) {
    return NextResponse.json(
      {
        ok: false,
        openLogin: true,
        message: "Sign in and add your API key to use this provider",
      },
      { status: 401 }
    );
  }

  if (!session?.user?.email && FREE_PROVIDERS[providerId]) {
    ipAddresses.set(ip, (ipAddresses.get(ip) || 0) + 1);
    if (ipAddresses.get(ip)! > MAX_REQUESTS_PER_IP) {
      return NextResponse.json(
        {
          ok: false,
          openLogin: true,
          message: "Sign in to continue using the service",
        },
        { status: 429 }
      );
    }
  }

  try {
    const apiKey = await getApiKey(providerId, session?.user?.email);
    const client = createClient(providerId, apiKey);

    // Helper to estimate token count (rough: ~4 chars per token)
    const estimateTokens = (text: string) => Math.ceil(text.length / 4);

    // Helper to truncate HTML content to fit within token limits
    const truncateHtml = (content: string, maxTokens: number): string => {
      const estimatedTokens = estimateTokens(content);
      if (estimatedTokens <= maxTokens) return content;
      
      const maxChars = maxTokens * 4;
      const truncated = content.substring(0, maxChars);
      return truncated + "\n<!-- ...truncated... -->";
    };

    // Calculate available tokens for context
    const modelContextLength = selectedModel.contextLength || 8000;
    const maxContextTokens = Math.min(modelContextLength - 4000, 60000);
    const tokensPerPage = Math.floor(maxContextTokens / (pages?.length || 1));

    // Build a clear, structured prompt for the AI
    let userMessage = "";
    
    // Add the current pages as context (with truncation)
    userMessage += "CURRENT HTML PAGES TO MODIFY:\n\n";
    pages?.forEach((p: Page) => {
      const truncatedHtml = truncateHtml(p.html, tokensPerPage);
      userMessage += `=== ${p.path} ===\n\`\`\`html\n${truncatedHtml}\n\`\`\`\n\n`;
    });
    
    // Add previous prompts context if available (limit to last 3)
    if (previousPrompts && previousPrompts.length > 0) {
      userMessage += "PREVIOUS CONVERSATION:\n";
      const recentPrompts = previousPrompts.slice(-3);
      recentPrompts.forEach((p: string) => {
        userMessage += `- ${p}\n`;
      });
      userMessage += "\n";
    }
    
    // Add selected element context if available
    if (selectedElementHtml) {
      userMessage += `IMPORTANT: Focus on modifying ONLY this element:\n\`\`\`html\n${selectedElementHtml}\n\`\`\`\n\n`;
    }
    
    // Add available images if any
    if (files?.length > 0) {
      userMessage += `AVAILABLE IMAGES:\n${files.map((f: string) => `- ${f}`).join("\n")}\n\n`;
    }
    
    // Add the actual user request
    userMessage += `USER REQUEST:\n${prompt}\n\nPlease modify the HTML according to the request above. Use the SEARCH/REPLACE format to make precise changes.`;

    // Select appropriate follow-up prompt
    const systemPrompt = 
      (projectType === "react" || projectType === "nextjs") 
        ? REACT_FOLLOW_UP_PROMPT 
        : FOLLOW_UP_SYSTEM_PROMPT;

    const response = await (client as any).chat.completions.create({
      model: modelId,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      max_tokens: 16384,
    });

    const chunk = response.choices[0]?.message?.content;
    console.log("AI Response for follow-up:", chunk?.substring(0, 500)); // Debug logging
    
    if (!chunk) {
      return NextResponse.json(
        { ok: false, message: "No content returned from the model" },
        { status: 400 }
      );
    }

    // Process the response - parse SEARCH/REPLACE blocks
    const updatedLines: number[][] = [];
    const updatedPages = [...(pages || [])];

    // Process the response based on project type
    if (projectType === "react" || projectType === "nextjs") {
      // For React/Next.js, we expect full file rewrites
      const parsedFiles = parseReactFiles(chunk);
      
      if (parsedFiles.length === 0) {
        console.warn("No React files found in response");
      }
      
      parsedFiles.forEach((file) => {
        const existingPageIndex = updatedPages.findIndex((p) => p.path === file.path);
        
        if (existingPageIndex !== -1) {
          // Update existing file
          updatedPages[existingPageIndex] = {
            path: file.path,
            html: file.content, // 'html' property stores content for all file types in this schema
          };
          updatedLines.push([1, file.content.split('\n').length]); // Mark whole file as updated
        } else {
          // Add new file
          updatedPages.push({
            path: file.path,
            html: file.content,
          });
        }
      });
    } else {
      // Standard HTML path - use SEARCH/REPLACE parsing
    
    // Parse UPDATE_PAGE blocks
    const updatePageRegex = new RegExp(
      `${UPDATE_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\s]+)\\s*${UPDATE_PAGE_END.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      )}([\\s\\S]*?)(?=${UPDATE_PAGE_START.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      )}|${NEW_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|$)`,
      "g"
    );

    let updatePageMatch;
    while ((updatePageMatch = updatePageRegex.exec(chunk)) !== null) {
      const [, pagePath, pageContent] = updatePageMatch;
      const pageIndex = updatedPages.findIndex((p) => p.path === pagePath);

      if (pageIndex !== -1) {
        let pageHtml = updatedPages[pageIndex].html;
        let processedContent = pageContent;

        const htmlMatch = pageContent.match(/```html\s*([\s\S]*?)\s*```/);
        if (htmlMatch) {
          processedContent = htmlMatch[1];
        }

        let position = 0;
        let moreBlocks = true;
        let changesApplied = 0;
        let changesFailed = 0;

        while (moreBlocks) {
          const searchStartIndex = processedContent.indexOf(SEARCH_START, position);
          if (searchStartIndex === -1) {
            moreBlocks = false;
            continue;
          }

          const dividerIndex = processedContent.indexOf(DIVIDER, searchStartIndex);
          if (dividerIndex === -1) {
            moreBlocks = false;
            continue;
          }

          const replaceEndIndex = processedContent.indexOf(REPLACE_END, dividerIndex);
          if (replaceEndIndex === -1) {
            moreBlocks = false;
            continue;
          }

          const searchBlock = processedContent.substring(
            searchStartIndex + SEARCH_START.length,
            dividerIndex
          );
          const replaceBlock = processedContent.substring(
            dividerIndex + DIVIDER.length,
            replaceEndIndex
          );

          // Clean up the blocks - remove leading/trailing newlines but preserve internal whitespace
          const cleanSearchBlock = searchBlock.replace(/^\n+|\n+$/g, '');
          const cleanReplaceBlock = replaceBlock.replace(/^\n+|\n+$/g, '');

          console.log("Processing SEARCH/REPLACE block:");
          console.log("Search block (first 200 chars):", cleanSearchBlock.substring(0, 200));

          if (cleanSearchBlock.trim() === "") {
            // Insert at beginning
            pageHtml = `${cleanReplaceBlock}\n${pageHtml}`;
            updatedLines.push([1, cleanReplaceBlock.split("\n").length]);
            console.log("Inserted new content at beginning");
            changesApplied++;
          } else {
            // Try multiple matching strategies
            let blockPosition = -1;
            let actualSearchText = cleanSearchBlock;
            
            // Strategy 1: Exact match
            blockPosition = pageHtml.indexOf(cleanSearchBlock);
            
            // Strategy 2: Remove all whitespace from both and compare
            if (blockPosition === -1) {
              const compactSearch = cleanSearchBlock.replace(/\s+/g, ' ').trim();
              const pageLines = pageHtml.split('\n');
              
              // Sliding window comparison
              const searchLineCount = cleanSearchBlock.split('\n').length;
              
              for (let i = 0; i <= pageLines.length - searchLineCount; i++) {
                const windowLines = pageLines.slice(i, i + searchLineCount + 2); // +2 for flexibility
                const windowText = windowLines.join('\n');
                const compactWindow = windowText.replace(/\s+/g, ' ').trim();
                
                if (compactWindow.includes(compactSearch) || compactSearch.includes(compactWindow.substring(0, compactSearch.length))) {
                  // Found approximate match, get the original text
                  actualSearchText = windowLines.slice(0, searchLineCount).join('\n');
                  blockPosition = pageHtml.indexOf(actualSearchText);
                  if (blockPosition !== -1) {
                    console.log("Found match using whitespace-normalized comparison at line:", i + 1);
                    break;
                  }
                }
              }
            }
            
            // Strategy 3: Line-by-line trimmed comparison
            if (blockPosition === -1) {
              const searchLines = cleanSearchBlock.split('\n').map(l => l.trim());
              const pageLines = pageHtml.split('\n');
              
              for (let i = 0; i <= pageLines.length - searchLines.length; i++) {
                let allMatch = true;
                for (let j = 0; j < searchLines.length; j++) {
                  if (pageLines[i + j].trim() !== searchLines[j]) {
                    allMatch = false;
                    break;
                  }
                }
                
                if (allMatch) {
                  // Found a match - get original text with proper whitespace
                  actualSearchText = pageLines.slice(i, i + searchLines.length).join('\n');
                  blockPosition = pageHtml.indexOf(actualSearchText);
                  if (blockPosition !== -1) {
                    console.log("Found match using line-by-line trimmed comparison at line:", i + 1);
                    break;
                  }
                }
              }
            }
            
            // Strategy 4: Single most unique line matching
            if (blockPosition === -1) {
              const searchLines = cleanSearchBlock.split('\n').filter(l => l.trim().length > 10);
              for (const uniqueLine of searchLines) {
                const trimmedLine = uniqueLine.trim();
                const lineIndex = pageHtml.indexOf(trimmedLine);
                if (lineIndex !== -1) {
                  // Found a unique line, now try to match the context around it
                  const beforeContext = pageHtml.substring(Math.max(0, lineIndex - 200), lineIndex);
                  const afterContext = pageHtml.substring(lineIndex, Math.min(pageHtml.length, lineIndex + trimmedLine.length + 200));
                  
                  // Check if first and last lines of search exist in context
                  const firstSearchLine = cleanSearchBlock.split('\n')[0].trim();
                  const lastSearchLine = cleanSearchBlock.split('\n').slice(-1)[0].trim();
                  
                  if ((beforeContext + trimmedLine + afterContext).includes(firstSearchLine) ||
                      (beforeContext + trimmedLine + afterContext).includes(lastSearchLine)) {
                    // Good enough match - find the full block
                    const fullContext = beforeContext + afterContext;
                    const startMatch = fullContext.indexOf(firstSearchLine);
                    if (startMatch !== -1) {
                      const approximateStart = Math.max(0, lineIndex - 200) + startMatch;
                      // Try to extract the matching section
                      const endMatch = pageHtml.indexOf(lastSearchLine, approximateStart);
                      if (endMatch !== -1) {
                        actualSearchText = pageHtml.substring(approximateStart, endMatch + lastSearchLine.length);
                        blockPosition = approximateStart;
                        console.log("Found match using unique line strategy");
                      }
                    }
                  }
                  break;
                }
              }
            }
            
            if (blockPosition !== -1) {
              const beforeText = pageHtml.substring(0, blockPosition);
              const startLineNumber = beforeText.split("\n").length;
              const replaceLines = cleanReplaceBlock.split("\n").length;
              const endLineNumber = startLineNumber + replaceLines - 1;

              updatedLines.push([startLineNumber, endLineNumber]);
              pageHtml = pageHtml.substring(0, blockPosition) + cleanReplaceBlock + pageHtml.substring(blockPosition + actualSearchText.length);
              console.log("Successfully replaced content at line:", startLineNumber);
              changesApplied++;
            } else {
              // Strategy 5: Fuzzy matching using string similarity
              console.log("Trying fuzzy matching strategy...");
              const fuzzyMatch = findBestFuzzyMatch(pageHtml, cleanSearchBlock, 0.6);
              
              if (fuzzyMatch) {
                console.log("Found fuzzy match with similarity threshold 0.6");
                const beforeText = pageHtml.substring(0, fuzzyMatch.start);
                const startLineNumber = beforeText.split("\n").length;
                const replaceLines = cleanReplaceBlock.split("\n").length;
                const endLineNumber = startLineNumber + replaceLines - 1;

                updatedLines.push([startLineNumber, endLineNumber]);
                pageHtml = pageHtml.substring(0, fuzzyMatch.start) + cleanReplaceBlock + pageHtml.substring(fuzzyMatch.end);
                console.log("Successfully replaced content using fuzzy match at line:", startLineNumber);
                changesApplied++;
              } else {
                console.warn("Could not find search block in page HTML.");
                console.warn("Search block preview:", cleanSearchBlock.substring(0, 300));
                changesFailed++;
              }
            }
          }

          position = replaceEndIndex + REPLACE_END.length;
        }

        console.log(`Changes applied: ${changesApplied}, Changes failed: ${changesFailed}`);
        
        // If all changes failed, try fallback: extract full HTML from response
        if (changesApplied === 0 && changesFailed > 0) {
          console.warn("All SEARCH/REPLACE blocks failed. Attempting fallback extraction...");
          
          const extractedHtml = extractFullHtmlFromResponse(chunk);
          if (extractedHtml && extractedHtml.length > 200) {
            console.log("Fallback: Found complete HTML in response, using as full replacement");
            pageHtml = extractedHtml;
            updatedLines.push([1, extractedHtml.split('\n').length]);
            changesApplied = 1;
            changesFailed = 0;
          } else {
            console.warn("Fallback extraction also failed.");
            throw new Error("Unable to apply changes: The AI generated code that didn't match the existing file. Please try rephrasing your request to be more specific, or start a new project for major redesigns.");
          }
        }

        updatedPages[pageIndex].html = pageHtml;

        if (pagePath === "/" || pagePath === "/index" || pagePath === "index" || pagePath === "index.html") {
          // Updated the main page
          updatedPages[pageIndex].html = pageHtml;
        }
      } else {
        console.warn("Page not found for path:", pagePath);
      }
    }

    // Parse NEW_PAGE blocks
    const newPageRegex = new RegExp(
      `${NEW_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\s]+)\\s*${NEW_PAGE_END.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      )}([\\s\\S]*?)(?=${UPDATE_PAGE_START.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      )}|${NEW_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|$)`,
      "g"
    );

    let newPageMatch;
    while ((newPageMatch = newPageRegex.exec(chunk)) !== null) {
      const [, pagePath, pageContent] = newPageMatch;
      let pageHtml = pageContent;

      const htmlMatch = pageContent.match(/```html\s*([\s\S]*?)\s*```/);
      if (htmlMatch) {
        pageHtml = htmlMatch[1];
      }

      const existingPageIndex = updatedPages.findIndex((p) => p.path === pagePath);

      if (existingPageIndex !== -1) {
        updatedPages[existingPageIndex] = {
          path: pagePath,
          html: pageHtml.trim(),
        };
      } else {
        updatedPages.push({
          path: pagePath,
          html: pageHtml.trim(),
        });
      }
    }
    }

    const hasChanges = updatedLines.length > 0 || updatedPages.length > pages.length || JSON.stringify(updatedPages) !== JSON.stringify(pages);
    
    if (!hasChanges) {
      throw new Error("The AI did not generate any code changes. Please try rephrasing your request.");
    }

    return NextResponse.json({
      ok: true,
      updatedLines,
      pages: updatedPages,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error.message || "An error occurred",
        openSelectProvider: BYOK_PROVIDERS[providerId] ? false : true,
        openSettings: BYOK_PROVIDERS[providerId] ? true : false,
      },
      { status: 500 }
    );
  }
}
