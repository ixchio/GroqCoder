"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, History, RotateCcw, Sparkles } from "lucide-react";
import { HtmlHistory, Page } from "@/types";
import { Button } from "@/components/ui/button";
import classNames from "classnames";

interface PromptHistoryPanelProps {
  htmlHistory: HtmlHistory[];
  currentPrompts: string[];
  setPages: (pages: Page[]) => void;
  isAiWorking: boolean;
}

export function PromptHistoryPanel({
  htmlHistory,
  currentPrompts,
  setPages,
  isAiWorking,
}: PromptHistoryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const historyItems = htmlHistory.map((item, i) => ({
    ...item,
    isCurrent: false,
    index: i,
  }));

  if (htmlHistory.length === 0 && currentPrompts.length === 0) {
    return null;
  }

  const handleRestore = (historyIndex: number) => {
    const item = htmlHistory[historyIndex];
    if (item) {
      setPages(item.pages);
      setSelectedIndex(historyIndex);
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="border-t border-neutral-700 bg-neutral-900">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-neutral-800/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-neutral-300">
          <History className="size-4" />
          <span className="text-sm font-medium">Prompt History</span>
          <span className="text-xs text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded">
            {htmlHistory.length + currentPrompts.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="size-4 text-neutral-500" />
        ) : (
          <ChevronRight className="size-4 text-neutral-500" />
        )}
      </button>

      {/* History List */}
      {isExpanded && (
        <div className="max-h-[200px] overflow-y-auto">
          {/* Current prompts (not yet in history) */}
          {currentPrompts.length > 0 && (
            <div className="px-2 pb-1">
              {currentPrompts.slice(-3).map((prompt, i) => (
                <div
                  key={`current-${i}`}
                  className="flex items-start gap-2 px-2 py-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50 mb-1"
                >
                  <Sparkles className="size-3.5 text-sky-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-300 line-clamp-2">
                      {prompt}
                    </p>
                    <p className="text-[10px] text-sky-400 mt-0.5">
                      Current session
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* History items */}
          {historyItems.length > 0 && (
            <div className="px-2 pb-2 space-y-1">
              {historyItems.slice(0, 10).map((item, i) => (
                <div
                  key={`history-${i}`}
                  className={classNames(
                    "flex items-start gap-2 px-2 py-2 rounded-lg transition-colors cursor-pointer group",
                    {
                      "bg-sky-500/10 border border-sky-500/30": selectedIndex === item.index,
                      "hover:bg-neutral-800/50": selectedIndex !== item.index,
                    }
                  )}
                  onClick={() => !isAiWorking && handleRestore(item.index)}
                >
                  <div className="size-5 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] text-neutral-400">
                      {htmlHistory.length - item.index}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-300 line-clamp-2">
                      {item.prompt}
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      {formatTime(item.createdAt)}
                    </p>
                  </div>
                  <Button
                    size="iconXs"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isAiWorking}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestore(item.index);
                    }}
                  >
                    <RotateCcw className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {htmlHistory.length === 0 && currentPrompts.length === 0 && (
            <div className="px-4 py-6 text-center text-neutral-500 text-sm">
              <History className="size-8 mx-auto mb-2 opacity-50" />
              <p>No history yet</p>
              <p className="text-xs">Your prompts will appear here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
