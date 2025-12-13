"use client";

import { Suggestion } from "@/components/contexts/chat-context";
import classNames from "classnames";
import { 
  Palette, 
  Layout, 
  Sparkles, 
  Wrench, 
  Wand2,
  ChevronRight 
} from "lucide-react";

interface SuggestionChipsProps {
  suggestions: Suggestion[];
  onSelect: (suggestion: Suggestion) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Get icon component based on suggestion category
 */
function getCategoryIcon(category: Suggestion["category"]) {
  switch (category) {
    case "style":
      return Palette;
    case "layout":
      return Layout;
    case "feature":
      return Sparkles;
    case "fix":
      return Wrench;
    case "enhance":
      return Wand2;
    default:
      return ChevronRight;
  }
}

/**
 * Get color classes based on suggestion category
 */
function getCategoryColors(category: Suggestion["category"]) {
  switch (category) {
    case "style":
      return "bg-pink-500/10 text-pink-400 border-pink-500/20 hover:bg-pink-500/20";
    case "layout":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20";
    case "feature":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20";
    case "fix":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20";
    case "enhance":
      return "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20";
    default:
      return "bg-neutral-500/10 text-neutral-400 border-neutral-500/20 hover:bg-neutral-500/20";
  }
}

/**
 * Suggestion Chips component for quick action suggestions
 */
export function SuggestionChips({
  suggestions,
  onSelect,
  disabled = false,
  className,
}: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className={classNames("flex flex-wrap gap-2", className)}>
      {suggestions.map((suggestion) => {
        const Icon = getCategoryIcon(suggestion.category);
        const colorClasses = getCategoryColors(suggestion.category);

        return (
          <button
            key={suggestion.id}
            onClick={() => onSelect(suggestion)}
            disabled={disabled}
            className={classNames(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
              colorClasses,
              {
                "opacity-50 cursor-not-allowed": disabled,
                "cursor-pointer": !disabled,
              }
            )}
          >
            <Icon className="size-3" />
            {suggestion.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Compact suggestion chips for inline display
 */
export function CompactSuggestionChips({
  suggestions,
  onSelect,
  disabled = false,
  maxVisible = 3,
}: SuggestionChipsProps & { maxVisible?: number }) {
  const visibleSuggestions = suggestions.slice(0, maxVisible);
  const remainingCount = suggestions.length - maxVisible;

  if (suggestions.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-neutral-500 mr-1">Try:</span>
      {visibleSuggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          onClick={() => onSelect(suggestion)}
          disabled={disabled}
          className={classNames(
            "px-2 py-0.5 rounded text-[10px] bg-neutral-700/50 text-neutral-400 hover:bg-neutral-600/50 hover:text-neutral-300 transition-colors",
            {
              "opacity-50 cursor-not-allowed": disabled,
              "cursor-pointer": !disabled,
            }
          )}
        >
          {suggestion.label}
        </button>
      ))}
      {remainingCount > 0 && (
        <span className="text-[10px] text-neutral-500">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}

export default SuggestionChips;
