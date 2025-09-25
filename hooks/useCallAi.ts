import { useState, useRef } from "react";
import { toast } from "sonner";
import { MODELS } from "@/lib/providers";
import { Page } from "@/types";

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
}

export const useCallAi = ({
  onNewPrompt,
  onSuccess,
  onScrollToBottom,
  setPages,
  setCurrentPage,
  pages,
  isAiWorking,
  setisAiWorking,
}: UseCallAiProps) => {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [controller, setController] = useState<AbortController | null>(null);

  const callAiNewProject = async (prompt: string, model: string | undefined, provider: string | undefined, redesignMarkdown?: string, handleThink?: (think: string) => void, onFinishThink?: () => void) => {
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

        const read = async () => {
          const { done, value } = await reader.read();
          if (done) {
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

            const newPages = formatPages(contentResponse);
            onSuccess(newPages, prompt);

            return { success: true, pages: newPages };
          }

          const chunk = decoder.decode(value, { stream: true });
          contentResponse += chunk;
          
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

  const callAiNewPage = async (prompt: string, model: string | undefined, provider: string | undefined, currentPagePath: string, previousPrompts?: string[]) => {
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

        const read = async () => {
          const { done, value } = await reader.read();
          if (done) {
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
            
            if (selectedModel?.isThinker) {
              // Reset to default model if using thinker model
              // Note: You might want to add a callback for this
            }
            
            if (audio.current) audio.current.play();

            const newPage = formatPage(contentResponse, currentPagePath);
            if (!newPage) { return { error: "api_error", message: "Failed to format page" } }
            onSuccess([...pages, newPage], prompt);

            return { success: true, pages: [...pages, newPage] };
          }

          const chunk = decoder.decode(value, { stream: true });
          contentResponse += chunk;
          
          if (selectedModel?.isThinker) {
            const thinkMatch = contentResponse.match(/<think>[\s\S]*/)?.[0];
            if (thinkMatch && !contentResponse?.includes("</think>")) {
              // contentThink += chunk;
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

  const callAiFollowUp = async (prompt: string, model: string | undefined, provider: string | undefined, previousPrompts: string[], selectedElementHtml?: string, files?: string[]) => {
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

  // Stop the current AI generation
  const stopController = () => {
    if (controller) {
      controller.abort();
      setController(null);
      setisAiWorking(false);
    }
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
    callAiNewPage,
    stopController,
    controller,
    audio,
  };
};
