import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { MODELS } from "@/lib/providers";
import { Page } from "@/types";

// Stream statistics for real-time progress tracking
export interface StreamStats {
  chars: number;
  tokens: number;
  elapsed: number;
  isStreaming: boolean;
}

interface UseCallAiProps {
  onNewPrompt: (prompt: string) => void;
  onSuccess: (page: Page[], p: string, n?: number[][]) => void;
  onScrollToBottom: () => void;
  setPages: React.Dispatch<React.SetStateAction<Page[]>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<string>>;
  currentPage: Page;
  pages: Page[];
  isAiWorking: boolean;
  setisAiWorking: React.Dispatch<React.SetStateAction<boolean>>;
  onStreamProgress?: (stats: StreamStats) => void;
}

export const useCallAi = ({
  onNewPrompt,
  onSuccess,
  onScrollToBottom,
  setPages,
  setCurrentPage,
  currentPage,
  pages,
  isAiWorking,
  setisAiWorking,
  onStreamProgress,
}: UseCallAiProps) => {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [controller, setController] = useState<AbortController | null>(null);
  
  // Ref to always have latest pages - fixes stale closure issues in async callbacks
  const pagesRef = useRef<Page[]>(pages);
  const currentPageRef = useRef<Page>(currentPage);
  
  // Keep refs in sync with state
  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);
  
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  const callAiNewProject = async (prompt: string, model: string | undefined, provider: string | undefined, redesignMarkdown?: string, handleThink?: (think: string) => void, onFinishThink?: () => void, projectType: string = "html") => {
    if (isAiWorking) return;
    if (!redesignMarkdown && !prompt.trim()) return;
    
    setisAiWorking(true);
    
    const abortController = new AbortController();
    setController(abortController);
    
    try {
      onNewPrompt(prompt);
      
      const request = await fetch("/api/ask-ai", {
        method: "POST",
        body: JSON.stringify({
          prompt,
          provider,
          model,
          redesignMarkdown,
          projectType,
        }),
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": window.location.hostname,
        },
        signal: abortController.signal,
      });

      if (request && request.body) {
        const reader = request.body.getReader();
        const decoder = new TextDecoder("utf-8");
        const selectedModel = MODELS.find(
          (m: { value: string }) => m.value === model
        );
        let contentResponse = "";
        const startTime = Date.now();

        // Report initial streaming state
        onStreamProgress?.({
          chars: 0,
          tokens: 0,
          elapsed: 0,
          isStreaming: true,
        });

        const read = async () => {
          const { done, value } = await reader.read();
          if (done) {
            // Report final stats
            onStreamProgress?.({
              chars: contentResponse.length,
              tokens: Math.round(contentResponse.length / 4),
              elapsed: Math.round((Date.now() - startTime) / 1000),
              isStreaming: false,
            });

            const isJson =
              contentResponse.trim().startsWith("{") &&
              contentResponse.trim().endsWith("}");
            const jsonResponse = isJson ? JSON.parse(contentResponse) : null;
            
            if (jsonResponse && !jsonResponse.ok) {
              if (jsonResponse.openLogin) {
                return { error: "login_required" };
              } else if (jsonResponse.openSelectProvider) {
                return { error: "provider_required", message: jsonResponse.message };
              } else if (jsonResponse.openProModal) {
                return { error: "pro_required" };
              } else {
                toast.error(jsonResponse.message);
                setisAiWorking(false);
                return { error: "api_error", message: jsonResponse.message };
              }
            }

            toast.success("AI responded successfully");
            setisAiWorking(false);
            
            if (audio.current) audio.current.play();

            const newPages = formatPages(contentResponse);
            onSuccess(newPages, prompt);
            return { success: true, pages: newPages };

          }

          const chunk = decoder.decode(value, { stream: true });
          contentResponse += chunk;

          // Report progress during streaming
          onStreamProgress?.({
            chars: contentResponse.length,
            tokens: Math.round(contentResponse.length / 4),
            elapsed: Math.round((Date.now() - startTime) / 1000),
            isStreaming: true,
          });
          
          if (selectedModel?.isThinker) {
            const thinkMatch = contentResponse.match(/<think>[\s\S]*/)?.[0];
            if (thinkMatch && !contentResponse?.includes("</think>")) {
              handleThink?.(thinkMatch.replace("<think>", "").trim());
              return read();
            }
          }

          if (contentResponse.includes("</think>")) {
            onFinishThink?.();
          }

          formatPages(contentResponse);
          return read();
        };

        return await read();
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setisAiWorking(false);
      toast.error(error.message);
      if (error.openLogin) {
        return { error: "login_required" };
      }
      return { error: "network_error", message: error.message };
    }
  };

  const callAiNewPage = async (prompt: string, model: string | undefined, provider: string | undefined, currentPagePath: string, previousPrompts?: string[], projectType: string = "html") => {
    if (isAiWorking) return;
    if (!prompt.trim()) return;
    
    setisAiWorking(true);
    
    const abortController = new AbortController();
    setController(abortController);
    
    try {
      onNewPrompt(prompt);
      
      const request = await fetch("/api/ask-ai", {
        method: "POST",
        body: JSON.stringify({
          prompt,
          provider,
          model,
          pages,
          previousPrompts,
          projectType,
        }),
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": window.location.hostname,
        },
        signal: abortController.signal,
      });

      if (request && request.body) {
        const reader = request.body.getReader();
        const decoder = new TextDecoder("utf-8");
        const selectedModel = MODELS.find(
          (m: { value: string }) => m.value === model
        );
        let contentResponse = "";
        const startTime = Date.now();

        // Report initial streaming state
        onStreamProgress?.({
          chars: 0,
          tokens: 0,
          elapsed: 0,
          isStreaming: true,
        });

        const read = async () => {
          const { done, value } = await reader.read();
          if (done) {
            // Report final stats
            onStreamProgress?.({
              chars: contentResponse.length,
              tokens: Math.round(contentResponse.length / 4),
              elapsed: Math.round((Date.now() - startTime) / 1000),
              isStreaming: false,
            });

            const isJson =
              contentResponse.trim().startsWith("{") &&
              contentResponse.trim().endsWith("}");
            const jsonResponse = isJson ? JSON.parse(contentResponse) : null;
            
            if (jsonResponse && !jsonResponse.ok) {
              if (jsonResponse.openLogin) {
                // Handle login required
                return { error: "login_required" };
              } else if (jsonResponse.openSelectProvider) {
                // Handle provider selection required
                return { error: "provider_required", message: jsonResponse.message };
              } else if (jsonResponse.openProModal) {
                // Handle pro modal required
                return { error: "pro_required" };
              } else {
                toast.error(jsonResponse.message);
                setisAiWorking(false);
                return { error: "api_error", message: jsonResponse.message };
              }
            }

            toast.success("AI responded successfully");
            setisAiWorking(false);
            
            if (audio.current) audio.current.play();

            const newPage = formatPage(contentResponse, currentPagePath);
            if (!newPage) { return { error: "api_error", message: "Failed to format page" } }
            onSuccess([...pages, newPage], prompt);

            return { success: true, pages: [...pages, newPage] };
          }

          const chunk = decoder.decode(value, { stream: true });
          contentResponse += chunk;

          // Report progress during streaming
          onStreamProgress?.({
            chars: contentResponse.length,
            tokens: Math.round(contentResponse.length / 4),
            elapsed: Math.round((Date.now() - startTime) / 1000),
            isStreaming: true,
          });
          
          if (selectedModel?.isThinker) {
            const thinkMatch = contentResponse.match(/<think>[\s\S]*/)?.[0];
            if (thinkMatch && !contentResponse?.includes("</think>")) {
              return read();
            }
          }

          formatPage(contentResponse, currentPagePath);
          return read();
        };

        return await read();
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setisAiWorking(false);
      toast.error(error.message);
      if (error.openLogin) {
        return { error: "login_required" };
      }
      return { error: "network_error", message: error.message };
    }
  };

  const callAiFollowUp = async (prompt: string, model: string | undefined, provider: string | undefined, previousPrompts: string[], selectedElementHtml?: string, files?: string[], projectType: string = "html") => {
    if (isAiWorking) return;
    if (!prompt.trim()) return;
    
    setisAiWorking(true);
    
    const abortController = new AbortController();
    setController(abortController);
    
    try {
      onNewPrompt(prompt);
      
      const request = await fetch("/api/ask-ai", {
        method: "PUT",
        body: JSON.stringify({
          prompt,
          provider,
          previousPrompts,
          model,
          pages,
          selectedElementHtml,
          files,
          projectType,
        }),
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": window.location.hostname,
        },
        signal: abortController.signal,
      });

      if (request && request.body) {
        const res = await request.json();
        
        if (!request.ok) {
          if (res.openLogin) {
            setisAiWorking(false);
            return { error: "login_required" };
          } else if (res.openSelectProvider) {
            setisAiWorking(false);
            return { error: "provider_required", message: res.message };
          } else if (res.openProModal) {
            setisAiWorking(false);
            return { error: "pro_required" };
          } else {
            toast.error(res.message);
            setisAiWorking(false);
            return { error: "api_error", message: res.message };
          }
        }

        toast.success("AI responded successfully");
        setisAiWorking(false);

        setPages(res.pages);
        onSuccess(res.pages, prompt, res.updatedLines);
        
        if (audio.current) audio.current.play();

        return { success: true, html: res.html, updatedLines: res.updatedLines };
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setisAiWorking(false);
      toast.error(error.message);
      if (error.openLogin) {
        return { error: "login_required" };
      }
      return { error: "network_error", message: error.message };
    }
  };

  /**
   * Smooth streaming follow-up using delta-based updates (Lovable/v0 style)
   * This applies changes in real-time as the AI generates them
   */
  const callAiFollowUpSmooth = async (
    prompt: string,
    model: string | undefined,
    provider: string | undefined,
    previousPrompts: string[],
    iframeRef: React.RefObject<HTMLIFrameElement | null>,
    selectedElementHtml?: string,
    files?: string[],
    projectType: string = "html"
  ) => {
    if (isAiWorking) return;
    if (!prompt.trim()) return;

    // Check if iframe is available
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) {
      console.warn("[SmoothStreaming] No iframe available, falling back to standard method");
      return callAiFollowUp(prompt, model, provider, previousPrompts, selectedElementHtml, files, projectType);
    }

    setisAiWorking(true);

    const abortController = new AbortController();
    setController(abortController);

    const startTime = Date.now();

    try {
      onNewPrompt(prompt);

      // Import JSON delta streaming utilities (preferred) with fallback to legacy
      const { JSONDeltaParser, DeltaApplier } = await import("@/lib/json-delta-streaming");
      // Also import legacy parser for fallback
      const { StreamingDiffParser, SmoothDOMOrchestrator } = await import("@/lib/smooth-streaming");

      const iframeDoc = iframe.contentDocument;
      
      // Use both parsers - JSON delta as primary, legacy as fallback
      const jsonParser = new JSONDeltaParser();
      const deltaApplier = new DeltaApplier(iframeDoc);
      
      // Legacy fallback
      const legacyParser = new StreamingDiffParser();
      const legacyOrchestrator = new SmoothDOMOrchestrator(iframeDoc);

      // Report initial state
      onStreamProgress?.({
        chars: 0,
        tokens: 0,
        elapsed: 0,
        isStreaming: true,
      });

      const request = await fetch("/api/ask-ai", {
        method: "PUT",
        body: JSON.stringify({
          prompt,
          provider,
          previousPrompts,
          model,
          pages,
          selectedElementHtml,
          files,
          projectType,
          useDeltaFormat: true, // Tell API to use delta format
        }),
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": window.location.hostname,
        },
        signal: abortController.signal,
      });

      if (!request.ok) {
        const errorData = await request.json();
        setisAiWorking(false);
        
        if (errorData.openLogin) {
          return { error: "login_required" };
        } else if (errorData.openSelectProvider) {
          return { error: "provider_required", message: errorData.message };
        }
        
        toast.error(errorData.message || "Request failed");
        return { error: "api_error", message: errorData.message };
      }

      if (!request.body) {
        throw new Error("No response body");
      }

      // Stream and apply updates in real-time
      const reader = request.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let totalChars = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Flush any remaining legacy updates
          await legacyOrchestrator.forceFlush();

          // Report completion
          onStreamProgress?.({
            chars: totalChars,
            tokens: Math.round(totalChars / 4),
            elapsed: Math.round((Date.now() - startTime) / 1000),
            isStreaming: false,
          });

          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        totalChars += chunk.length;

        // Strategy 1: Try JSON delta format (preferred, more reliable)
        const jsonDeltas = jsonParser.parseStreamChunk(chunk);
        
        for (const delta of jsonDeltas) {
          // Apply delta directly to DOM
          deltaApplier.applyDelta(delta);
        }
        
        // Strategy 2: If no JSON deltas, try legacy HTML comment markers
        if (jsonDeltas.length === 0) {
          const legacyDiffs = legacyParser.parseStreamChunk(chunk);
          for (const diff of legacyDiffs) {
            legacyOrchestrator.queueUpdate(diff);
          }
        }

        // Report progress
        onStreamProgress?.({
          chars: totalChars,
          tokens: Math.round(totalChars / 4),
          elapsed: Math.round((Date.now() - startTime) / 1000),
          isStreaming: true,
        });
      }

      // Get the raw buffer and actual applied count for determining success
      const rawBuffer = jsonParser.getBuffer() || legacyParser.getBuffer();
      const appliedDiffs = deltaApplier.getAppliedCount() + legacyOrchestrator.getAppliedCount();
      
      // Use refs to get latest state (avoids stale closure bugs in async code)
      const latestPages = pagesRef.current;
      const currentPagePath = currentPageRef.current.path;
      
      // Determine which page to update - use exact match on currentPage.path
      const targetPageIndex = latestPages.findIndex(p => p.path === currentPagePath);
      
      if (targetPageIndex === -1) {
        console.error('[SmoothStreaming] Could not find current page:', currentPagePath);
        toast.error('Could not find page to update');
        setisAiWorking(false);
        return { error: 'page_not_found', message: `Page ${currentPagePath} not found` };
      }

      // Check if any diffs were actually applied - if not, use fallback mechanism
      if (appliedDiffs === 0 && rawBuffer.length > 0) {
        console.log('[SmoothStreaming] No diffs applied, using fallback extraction...');
        
        // Try using the existing formatPages helper (uses START_TITLE format)
        const parsedPages = formatPagesFromBuffer(rawBuffer);
        
        if (parsedPages && parsedPages.length > 0) {
          console.log('[SmoothStreaming] Fallback: Found pages via formatPages');
          
          // Apply to iframe
          const newHtml = parsedPages[0].html;
          iframeDoc.open();
          iframeDoc.write(newHtml);
          iframeDoc.close();
          
          // Update the correct page in state
          const updatedPages = [...latestPages];
          updatedPages[targetPageIndex] = {
            ...updatedPages[targetPageIndex],
            html: newHtml,
          };
          
          setPages(updatedPages);
          onSuccess(updatedPages, prompt);
          
          toast.success('✨ Changes applied successfully');
          setisAiWorking(false);
          if (audio.current) audio.current.play();
          
          return { success: true, totalDiffs: 1 };
        }
        
        // Try direct HTML extraction as last resort
        const htmlDocMatch = rawBuffer.match(/```html\s*(<!DOCTYPE html>[\s\S]*?<\/html>)\s*```/i) ||
                            rawBuffer.match(/(<!DOCTYPE html>[\s\S]*?<\/html>)/i);
        
        if (htmlDocMatch && htmlDocMatch[1] && htmlDocMatch[1].length > 100) {
          const extractedHtml = htmlDocMatch[1].trim();
          console.log('[SmoothStreaming] Fallback: Extracted HTML directly');
          
          // Apply to iframe
          iframeDoc.open();
          iframeDoc.write(extractedHtml);
          iframeDoc.close();
          
          // Update the correct page
          const updatedPages = [...latestPages];
          updatedPages[targetPageIndex] = {
            ...updatedPages[targetPageIndex],
            html: extractedHtml,
          };
          
          setPages(updatedPages);
          onSuccess(updatedPages, prompt);
          
          toast.success('✨ Changes applied successfully');
          setisAiWorking(false);
          if (audio.current) audio.current.play();
          
          return { success: true, totalDiffs: 1 };
        }
        
        // Nothing worked - show error
        console.error('[SmoothStreaming] Could not extract any HTML from response');
        toast.error('AI response was not in expected format. Try rephrasing your request.');
        setisAiWorking(false);
        return { error: 'parse_error', message: 'Could not extract code from AI response' };
      }

      // SUCCESS! Sync the DOM changes back to the pages state
      // Extract the updated HTML from the iframe
      const updatedHtml = iframeDoc.documentElement.outerHTML;
      const fullHtml = `<!DOCTYPE html>\n${updatedHtml}`;
      
      // Update the correct page using deterministic targeting
      const updatedPages = [...latestPages];
      updatedPages[targetPageIndex] = {
        ...updatedPages[targetPageIndex],
        html: fullHtml,
      };
      
      // Use functional update to ensure we're not overwriting concurrent changes
      setPages(updatedPages);
      
      // Call onSuccess to properly update editor and history
      onSuccess(updatedPages, prompt);
      
      console.log(`[SmoothStreaming] Synced ${appliedDiffs} changes to ${currentPagePath}`);
      
      toast.success(`✨ Applied ${appliedDiffs} updates smoothly`);
      setisAiWorking(false);

      if (audio.current) audio.current.play();

      return { success: true, totalDiffs: appliedDiffs };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setisAiWorking(false);
      
      if (error.name === "AbortError") {
        console.log("[SmoothStreaming] Request cancelled");
        return { error: "cancelled" };
      }

      toast.error(error.message);
      return { error: "network_error", message: error.message };
    }
  };

  // Stop the current AI generation
  const stopController = () => {
    if (controller) {
      controller.abort();
      setController(null);
      setisAiWorking(false);
    }
  };

  // Helper function to extract pages from buffer without side effects (for fallback)
  const formatPagesFromBuffer = (content: string): Page[] => {
    const result: Page[] = [];
    if (!content.match(/<<<<<<< START_TITLE (.*?) >>>>>>> END_TITLE/)) {
      // Try NEW_PAGE format as well
      const newPageRegex = /<<<<<<< NEW_PAGE_START\s+([^\s]+)\s+>>>>>>> NEW_PAGE_END/g;
      if (!content.match(newPageRegex)) {
        return result;
      }
    }

    const cleanedContent = content.replace(
      /[\s\S]*?<<<<<<< START_TITLE (.*?) >>>>>>> END_TITLE/,
      "<<<<<<< START_TITLE $1 >>>>>>> END_TITLE"
    );
    const htmlChunks = cleanedContent.split(
      /<<<<<<< START_TITLE (.*?) >>>>>>> END_TITLE/
    );
    const processedChunks = new Set<number>();

    htmlChunks.forEach((chunk, index) => {
      if (processedChunks.has(index) || !chunk?.trim()) {
        return;
      }
      const htmlContent = extractHtmlContent(htmlChunks[index + 1]);

      if (htmlContent) {
        result.push({
          path: chunk.trim(),
          html: htmlContent,
        });
        processedChunks.add(index);
        processedChunks.add(index + 1);
      }
    });

    return result;
  };

  const formatPages = (content: string) => {
    const pages: Page[] = [];
    if (!content.match(/<<<<<<< START_TITLE (.*?) >>>>>>> END_TITLE/)) {
      return pages;
    }

    const cleanedContent = content.replace(
      /[\s\S]*?<<<<<<< START_TITLE (.*?) >>>>>>> END_TITLE/,
      "<<<<<<< START_TITLE $1 >>>>>>> END_TITLE"
    );
    const htmlChunks = cleanedContent.split(
      /<<<<<<< START_TITLE (.*?) >>>>>>> END_TITLE/
    );
    const processedChunks = new Set<number>();

    htmlChunks.forEach((chunk, index) => {
      if (processedChunks.has(index) || !chunk?.trim()) {
        return;
      }
      const htmlContent = extractHtmlContent(htmlChunks[index + 1]);

      if (htmlContent) {
        const page: Page = {
          path: chunk.trim(),
          html: htmlContent,
        };
        pages.push(page);

        if (htmlContent.length > 200) {
          onScrollToBottom();
        }

        processedChunks.add(index);
        processedChunks.add(index + 1);
      }
    });
    if (pages.length > 0) {
      setPages(pages);
      const lastPagePath = pages[pages.length - 1]?.path;
      setCurrentPage(lastPagePath || "index.html");
    }

    return pages;
  };

  const formatPage = (content: string, currentPagePath: string) => {
    if (!content.match(/<<<<<<< START_TITLE (.*?) >>>>>>> END_TITLE/)) {
      return null;
    }

    const cleanedContent = content.replace(
      /[\s\S]*?<<<<<<< START_TITLE (.*?) >>>>>>> END_TITLE/,
      "<<<<<<< START_TITLE $1 >>>>>>> END_TITLE"
    );

    const htmlChunks = cleanedContent.split(
      /<<<<<<< START_TITLE (.*?) >>>>>>> END_TITLE/
    )?.filter(Boolean);

    const pagePath = htmlChunks[0]?.trim() || "";
    const htmlContent = extractHtmlContent(htmlChunks[1]);

    if (!pagePath || !htmlContent) {
      return null;
    }

    const page: Page = {
      path: pagePath,
      html: htmlContent,
    };

    setPages(prevPages => {
      const existingPageIndex = prevPages.findIndex(p => p.path === currentPagePath || p.path === pagePath);
      
      if (existingPageIndex !== -1) {
        const updatedPages = [...prevPages];
        updatedPages[existingPageIndex] = page;
        return updatedPages;
      } else {
        return [...prevPages, page];
      }
    });

    setCurrentPage(pagePath);

    if (htmlContent.length > 200) {
      onScrollToBottom();
    }

    return page;
  };

  // Helper function to extract and clean HTML content
  const extractHtmlContent = (chunk: string): string => {
    if (!chunk) return "";

    // Extract HTML content
    const htmlMatch = chunk.trim().match(/<!DOCTYPE html>[\s\S]*/);
    if (!htmlMatch) return "";

    let htmlContent = htmlMatch[0];

    // Ensure proper HTML structure
    htmlContent = ensureCompleteHtml(htmlContent);

    // Remove markdown code blocks if present
    htmlContent = htmlContent.replace(/```/g, "");

    return htmlContent;
  };

  // Helper function to ensure HTML has complete structure
  const ensureCompleteHtml = (html: string): string => {
    let completeHtml = html;

    // Add missing head closing tag
    if (completeHtml.includes("<head>") && !completeHtml.includes("</head>")) {
      completeHtml += "\n</head>";
    }

    // Add missing body closing tag
    if (completeHtml.includes("<body") && !completeHtml.includes("</body>")) {
      completeHtml += "\n</body>";
    }

    // Add missing html closing tag
    if (!completeHtml.includes("</html>")) {
      completeHtml += "\n</html>";
    }

    return completeHtml;
  };

  return {
    callAiNewProject,
    callAiFollowUp,
    callAiFollowUpSmooth,
    callAiNewPage,
    stopController,
    controller,
    audio,
  };
};
