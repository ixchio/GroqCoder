"use client";

import { useState } from "react";
import { AlertTriangle, Bug, Wand2, X, ChevronDown, ChevronUp } from "lucide-react";
import { PreviewError } from "@/components/contexts/chat-context";
import { Button } from "@/components/ui/button";
import classNames from "classnames";

interface PreviewErrorsPanelProps {
  errors: PreviewError[];
  onAutoFix: (errors: PreviewError[]) => void;
  onDismiss: (errorId: string) => void;
  onDismissAll: () => void;
  isFixing?: boolean;
}

/**
 * Get error type icon
 */
function getErrorTypeIcon(type: PreviewError["type"]) {
  switch (type) {
    case "js":
      return Bug;
    case "css":
    case "html":
    case "network":
    default:
      return AlertTriangle;
  }
}

/**
 * Get error type color
 */
function getErrorTypeColor(type: PreviewError["type"]) {
  switch (type) {
    case "js":
      return "text-red-400 bg-red-500/10 border-red-500/20";
    case "css":
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    case "html":
      return "text-orange-400 bg-orange-500/10 border-orange-500/20";
    case "network":
      return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    default:
      return "text-neutral-400 bg-neutral-500/10 border-neutral-500/20";
  }
}

/**
 * Preview Errors Panel component
 * Shows detected errors in the preview iframe with auto-fix option
 */
export function PreviewErrorsPanel({
  errors,
  onAutoFix,
  onDismiss,
  onDismissAll,
  isFixing = false,
}: PreviewErrorsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (errors.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 right-4 z-20 max-w-md">
      <div className="bg-neutral-900/95 backdrop-blur-sm border border-neutral-700 rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2 bg-neutral-800/50 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-red-400" />
            <span className="text-sm font-medium text-neutral-200">
              {errors.length} Error{errors.length !== 1 ? "s" : ""} Detected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="ghost"
              className="text-neutral-400 hover:text-neutral-200"
              onClick={(e) => {
                e.stopPropagation();
                onDismissAll();
              }}
            >
              <X className="size-3" />
            </Button>
            {isExpanded ? (
              <ChevronUp className="size-4 text-neutral-400" />
            ) : (
              <ChevronDown className="size-4 text-neutral-400" />
            )}
          </div>
        </div>

        {/* Error List */}
        {isExpanded && (
          <>
            <div className="max-h-32 overflow-y-auto">
              {errors.map((error) => {
                const Icon = getErrorTypeIcon(error.type);
                const colorClass = getErrorTypeColor(error.type);

                return (
                  <div
                    key={error.id}
                    className="flex items-start gap-2 px-3 py-2 border-t border-neutral-800 group"
                  >
                    <div className={classNames("p-1 rounded", colorClass)}>
                      <Icon className="size-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-300 truncate">
                        {error.message}
                      </p>
                      {error.line && (
                        <p className="text-[10px] text-neutral-500">
                          Line {error.line}
                          {error.column && `:${error.column}`}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => onDismiss(error.id)}
                      className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-neutral-300 transition-opacity"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Auto-fix Button */}
            <div className="px-3 py-2 border-t border-neutral-800 bg-neutral-800/30">
              <Button
                size="sm"
                className="w-full gap-2"
                onClick={() => onAutoFix(errors)}
                disabled={isFixing}
              >
                <Wand2 className={classNames("size-4", { "animate-pulse": isFixing })} />
                {isFixing ? "Fixing..." : `Fix ${errors.length} Error${errors.length !== 1 ? "s" : ""} with AI`}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Compact error indicator for header/toolbar
 */
export function ErrorIndicator({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
    >
      <AlertTriangle className="size-3" />
      <span className="text-xs font-medium">{count}</span>
    </button>
  );
}

export default PreviewErrorsPanel;
