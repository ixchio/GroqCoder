"use client";
import { useUpdateEffect } from "react-use";
import { useMemo, useState } from "react";
import classNames from "classnames";
import { toast } from "sonner";
import { useThrottleFn } from "react-use";

import { cn } from "@/lib/utils";
import { GridPattern } from "@/components/magic-ui/grid-pattern";
import { htmlTagToText } from "@/lib/html-tag-to-text";
import { Page } from "@/types";

// Error type for preview errors
export interface PreviewErrorInfo {
  message: string;
  type: "js" | "css" | "html" | "network";
  line?: number;
  column?: number;
}

export const Preview = ({
  html,
  isResizing,
  isAiWorking,
  ref,
  device,
  currentTab,
  iframeRef,
  pages,
  setCurrentPage,
  isEditableModeEnabled,
  onClickElement,
  onError,
}: {
  html: string;
  isResizing: boolean;
  isAiWorking: boolean;
  pages: Page[];
  setCurrentPage: React.Dispatch<React.SetStateAction<string>>;
  ref: React.RefObject<HTMLDivElement | null>;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
  device: "desktop" | "mobile";
  currentTab: string;
  isEditableModeEnabled?: boolean;
  onClickElement?: (element: HTMLElement) => void;
  onError?: (error: PreviewErrorInfo) => void;
}) => {
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(
    null
  );

  const handleMouseOver = (event: MouseEvent) => {
    if (iframeRef?.current) {
      const iframeDocument = iframeRef.current.contentDocument;
      if (iframeDocument) {
        const targetElement = event.target as HTMLElement;
        if (
          hoveredElement !== targetElement &&
          targetElement !== iframeDocument.body
        ) {
          setHoveredElement(targetElement);
          targetElement.classList.add("hovered-element");
        } else {
          return setHoveredElement(null);
        }
      }
    }
  };
  const handleMouseOut = () => {
    setHoveredElement(null);
  };
  const handleClick = (event: MouseEvent) => {
    if (iframeRef?.current) {
      const iframeDocument = iframeRef.current.contentDocument;
      if (iframeDocument) {
        const targetElement = event.target as HTMLElement;
        if (targetElement !== iframeDocument.body) {
          onClickElement?.(targetElement);
        }
      }
    }
  };
  const handleCustomNavigation = (event: MouseEvent) => {
    if (iframeRef?.current) {
      const iframeDocument = iframeRef.current.contentDocument;
      if (iframeDocument) {
        const findClosestAnchor = (
          element: HTMLElement
        ): HTMLAnchorElement | null => {
          let current = element;
          while (current && current !== iframeDocument.body) {
            if (current.tagName === "A") {
              return current as HTMLAnchorElement;
            }
            current = current.parentElement as HTMLElement;
          }
          return null;
        };

        const anchorElement = findClosestAnchor(event.target as HTMLElement);
        if (anchorElement) {
          let href = anchorElement.getAttribute("href");
          if (href) {
            event.stopPropagation();
            event.preventDefault();

            if (href.includes("#") && !href.includes(".html")) {
              // Skip if href is just "#" or empty hash
              if (href === "#" || href.trim() === "") {
                return;
              }
              try {
                const targetElement = iframeDocument.querySelector(href);
                if (targetElement) {
                  targetElement.scrollIntoView({ behavior: "smooth" });
                }
              } catch {
                // Invalid selector, ignore
              }
              return;
            }

            href = href.split(".html")[0] + ".html";
            const isPageExist = pages.some((page) => page.path === href);
            if (isPageExist) {
              setCurrentPage(href);
            }
          }
        }
      }
    }
  };

  useUpdateEffect(() => {
    const cleanupListeners = () => {
      if (iframeRef?.current?.contentDocument) {
        const iframeDocument = iframeRef.current.contentDocument;
        iframeDocument.removeEventListener("mouseover", handleMouseOver);
        iframeDocument.removeEventListener("mouseout", handleMouseOut);
        iframeDocument.removeEventListener("click", handleClick);
      }
    };

    if (iframeRef?.current) {
      const iframeDocument = iframeRef.current.contentDocument;
      if (iframeDocument) {
        cleanupListeners();

        if (isEditableModeEnabled) {
          iframeDocument.addEventListener("mouseover", handleMouseOver);
          iframeDocument.addEventListener("mouseout", handleMouseOut);
          iframeDocument.addEventListener("click", handleClick);
        }
      }
    }

    return cleanupListeners;
  }, [iframeRef, isEditableModeEnabled]);

  const selectedElement = useMemo(() => {
    if (!isEditableModeEnabled) return null;
    if (!hoveredElement) return null;
    return hoveredElement;
  }, [hoveredElement, isEditableModeEnabled]);

  const throttledHtml = useThrottleFn((html) => html, 1000, [html]);

  return (
    <div
      ref={ref}
      className={classNames(
        "w-full border-l border-gray-900 h-full relative z-0 flex items-center justify-center",
        {
          "lg:p-4": currentTab !== "preview",
          "max-lg:h-0": currentTab === "chat",
          "max-lg:h-full": currentTab === "preview",
        }
      )}
      onClick={(e) => {
        if (isAiWorking) {
          e.preventDefault();
          e.stopPropagation();
          toast.warning("Please wait for the AI to finish working.");
        }
      }}
    >
      <GridPattern
        x={-1}
        y={-1}
        strokeDasharray={"4 2"}
        className={cn(
          "[mask-image:radial-gradient(900px_circle_at_center,white,transparent)]"
        )}
      />
      
      {!isAiWorking && hoveredElement && selectedElement && (
        <div
          className="cursor-pointer absolute z-10 pointer-events-none transition-all duration-150 ease-out"
          style={{
            top:
              selectedElement.getBoundingClientRect().top +
              (currentTab === "preview" ? 0 : 24),
            left:
              selectedElement.getBoundingClientRect().left +
              (currentTab === "preview" ? 0 : 24),
            width: selectedElement.getBoundingClientRect().width,
            height: selectedElement.getBoundingClientRect().height,
          }}
        >
          {/* Outer glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 via-sky-500/30 to-purple-500/30 rounded-lg blur-sm animate-pulse" />
          
          {/* Main highlight box */}
          <div className="absolute inset-0 bg-sky-500/10 border-2 border-sky-400 rounded-lg shadow-[0_0_10px_rgba(56,189,248,0.5)]">
            {/* Corner indicators */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-sky-400 rounded-tl-sm" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-sky-400 rounded-tr-sm" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-sky-400 rounded-bl-sm" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-sky-400 rounded-br-sm" />
          </div>
          
          {/* Element tag label */}
          <span className="absolute top-0 left-0 -translate-y-full bg-gradient-to-r from-sky-500 to-purple-500 text-white text-xs font-medium px-2.5 py-1 rounded-t-md shadow-lg">
            {htmlTagToText(selectedElement.tagName.toLowerCase())}
            <span className="ml-1.5 opacity-70">Click to select</span>
          </span>
        </div>
      )}
      <iframe
        id="preview-iframe"
        ref={iframeRef}
        title="output"
        className={classNames(
          "w-full select-none transition-all duration-200 bg-white h-full",
          {
            "pointer-events-none": isResizing || isAiWorking,
            "lg:max-w-md lg:mx-auto lg:!rounded-[42px] lg:border-[8px] lg:border-neutral-700 lg:shadow-2xl lg:h-[80dvh] lg:max-h-[996px]":
              device === "mobile",
            "lg:border-[8px] lg:border-neutral-700 lg:shadow-2xl lg:rounded-[24px]":
              currentTab !== "preview" && device === "desktop",
          }
        )}
        srcDoc={isAiWorking ? (throttledHtml as string) : html}
        onLoad={() => {
          if (iframeRef?.current?.contentWindow?.document?.body) {
            iframeRef.current.contentWindow.document.body.scrollIntoView({
              block: isAiWorking ? "end" : "start",
              inline: "nearest",
              behavior: isAiWorking ? "instant" : "smooth",
            });
          }
          // add event listener to all links in the iframe to handle navigation
          if (iframeRef?.current?.contentWindow?.document) {
            const links =
              iframeRef.current.contentWindow.document.querySelectorAll("a");
            links.forEach((link) => {
              link.addEventListener("click", handleCustomNavigation);
            });
          }
          
          // Set up error detection in iframe
          if (iframeRef?.current?.contentWindow && onError) {
            const iframeWindow = iframeRef.current.contentWindow;
            
            // Capture JavaScript errors
            iframeWindow.onerror = (message, _source, lineno, colno) => {
              onError({
                message: String(message),
                type: "js",
                line: lineno,
                column: colno,
              });
              return true; // Prevent default error handling
            };
            
            // Capture unhandled promise rejections
            iframeWindow.onunhandledrejection = (event) => {
              onError({
                message: `Unhandled Promise: ${event.reason}`,
                type: "js",
              });
            };
            
            // Override console.error to capture errors
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const win = iframeWindow as any;
            if (win.console && win.console.error) {
              const originalConsoleError = win.console.error;
              win.console.error = (...args: unknown[]) => {
                onError({
                  message: args.map(arg => String(arg)).join(" "),
                  type: "js",
                });
                originalConsoleError.apply(win.console, args);
              };
            }
          }
        }}
      />
    </div>
  );
};
