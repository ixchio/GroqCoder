/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import OpenAI from "openai";
import { Groq } from "groq-sdk";

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
  DELTA_FOLLOW_UP_SYSTEM_PROMPT,
  NEW_PAGE_START,
  NEW_PAGE_END,
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
import { getUpdatedLineRanges } from "@/lib/diff-utils";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Page, ProjectType, CodeFile } from "@/types";
import {
  checkApiRateLimit,
  recordApiRequest,
  createRateLimitIdentifier,
  API_RATE_LIMITS,
} from "@/lib/api-rate-limit";
import { decryptKey } from "@/lib/api-keys";



// Create AI client based on provider
function createClient(
  providerId: string,
  apiKey: string
): OpenAI | Groq {
  const provider = getProviderById(providerId);
  
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  // Use native Groq SDK for Groq provider (faster, better streaming)
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

  // Use OpenAI-compatible client for all other providers (Cerebras, HuggingFace)
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
    const identifier = createRateLimitIdentifier(ip);
    const rateLimit = checkApiRateLimit(identifier, API_RATE_LIMITS.anonymous);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          openLogin: true,
          message: "Sign in to continue using the service",
        },
        { status: 429 }
      );
    }
    recordApiRequest(identifier);
  }

  try {
    // Get API key
    const apiKey = await getApiKey(providerId, session?.user?.email);

    // Create client
    const client = createClient(providerId, apiKey);

    // Fetch user's custom rules if logged in
    let customRules = "";
    if (session?.user?.email) {
      await connectToDatabase();
      const user = await User.findOne({ email: session.user.email });
      if (user?.customRules) {
        customRules = user.customRules;
      }
    }

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

    // Build system prompt with custom rules
    let systemPromptContent = getSystemPrompt(projectType);
    if (customRules) {
      systemPromptContent += `\n\n## GLOBAL PROJECT CONTEXT (User-defined rules - ALWAYS follow these):\n${customRules}`;
    }

    // Prepare messages
    const messages: any[] = [
      {
        role: "system",
        content: systemPromptContent,
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
    useDeltaFormat = false, // Smooth streaming mode
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
    const identifier = createRateLimitIdentifier(ip);
    const rateLimit = checkApiRateLimit(identifier, API_RATE_LIMITS.anonymous);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          openLogin: true,
          message: "Sign in to continue using the service",
        },
        { status: 429 }
      );
    }
    recordApiRequest(identifier);
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

    // Fetch user's custom rules if logged in
    let customRules = "";
    if (session?.user?.email) {
      const user = await User.findOne({ email: session.user.email });
      if (user?.customRules) {
        customRules = user.customRules;
      }
    }

    // Select appropriate follow-up prompt based on project type and delta format
    let systemPrompt: string;
    if (useDeltaFormat) {
      // Use delta format for smooth streaming (Lovable/v0 style)
      systemPrompt = DELTA_FOLLOW_UP_SYSTEM_PROMPT;
    } else if (projectType === "react" || projectType === "nextjs") {
      systemPrompt = REACT_FOLLOW_UP_PROMPT;
    } else {
      systemPrompt = FOLLOW_UP_SYSTEM_PROMPT;
    }

    // Append custom rules if present
    if (customRules) {
      systemPrompt += `\n\n## GLOBAL PROJECT CONTEXT (User-defined rules - ALWAYS follow these):\n${customRules}`;
    }

    // If using delta format, stream the response for real-time updates
    if (useDeltaFormat) {
      const stream = await (client as any).chat.completions.create({
        model: modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 16384,
        stream: true, // Enable streaming for delta format
      });

      // Create streaming response
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new NextResponse(readableStream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Non-streaming response (original behavior)
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
      // Standard HTML path - parse full HTML from AI response
      // The AI now returns complete updated files using NEW_PAGE format
      
      const newPageRegex = new RegExp(
        `${NEW_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\s]+)\\s*${NEW_PAGE_END.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}([\\s\\S]*?)(?=${NEW_PAGE_START.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}|$)`,
        "g"
      );

      let newPageMatch;
      let foundAnyPages = false;
      
      while ((newPageMatch = newPageRegex.exec(chunk)) !== null) {
        foundAnyPages = true;
        const [, pagePath, pageContent] = newPageMatch;
        let newHtml = pageContent;

        // Extract HTML from code block if present
        const htmlMatch = pageContent.match(/```html\s*([\s\S]*?)\s*```/);
        if (htmlMatch) {
          newHtml = htmlMatch[1];
        }
        
        newHtml = newHtml.trim();
        
        if (!newHtml || newHtml.length < 50) {
          console.warn("Extracted HTML too short, skipping:", pagePath);
          continue;
        }

        const existingPageIndex = updatedPages.findIndex((p) => p.path === pagePath);

        if (existingPageIndex !== -1) {
          // Update existing page - compute diff for highlighting
          const oldHtml = updatedPages[existingPageIndex].html;
          const lineRanges = getUpdatedLineRanges(oldHtml, newHtml);
          
          updatedPages[existingPageIndex] = {
            path: pagePath,
            html: newHtml,
          };
          
          // Add computed line ranges for highlighting
          updatedLines.push(...lineRanges);
          
          console.log(`Updated ${pagePath}: ${lineRanges.length} changed regions`);
        } else {
          // Add new page
          updatedPages.push({
            path: pagePath,
            html: newHtml,
          });
          // Mark entire new file as updated
          updatedLines.push([1, newHtml.split('\n').length]);
          console.log(`Added new page: ${pagePath}`);
        }
      }
      
      // Fallback: Try to extract HTML directly if no NEW_PAGE blocks found
      if (!foundAnyPages) {
        console.log("No NEW_PAGE blocks found, trying direct HTML extraction...");
        
        // Try to find complete HTML in the response
        const htmlDocMatch = chunk.match(/```html\s*(<!DOCTYPE html>[\s\S]*?<\/html>)\s*```/i) ||
                            chunk.match(/(<!DOCTYPE html>[\s\S]*?<\/html>)/i);
        
        if (htmlDocMatch && htmlDocMatch[1]) {
          const newHtml = htmlDocMatch[1].trim();
          const mainPageIndex = updatedPages.findIndex((p) => 
            p.path === "index.html" || p.path === "/" || p.path === "index"
          );
          
          if (mainPageIndex !== -1) {
            const oldHtml = updatedPages[mainPageIndex].html;
            const lineRanges = getUpdatedLineRanges(oldHtml, newHtml);
            
            updatedPages[mainPageIndex] = {
              path: updatedPages[mainPageIndex].path,
              html: newHtml,
            };
            
            updatedLines.push(...lineRanges);
            console.log(`Fallback: Updated main page with ${lineRanges.length} changed regions`);
          } else if (updatedPages.length > 0) {
            // Update the first page if no index.html found
            const oldHtml = updatedPages[0].html;
            const lineRanges = getUpdatedLineRanges(oldHtml, newHtml);
            
            updatedPages[0] = {
              path: updatedPages[0].path,
              html: newHtml,
            };
            
            updatedLines.push(...lineRanges);
            console.log(`Fallback: Updated first page with ${lineRanges.length} changed regions`);
          }
        } else {
          console.warn("Could not extract any HTML from AI response");
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
