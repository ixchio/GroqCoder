"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

/**
 * Chat message representing a user prompt or AI response
 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    provider?: string;
    tokens?: number;
    elapsed?: number;
    linesChanged?: number[][];
    pageModified?: string;
  };
}

/**
 * Suggestion for quick actions
 */
export interface Suggestion {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
  category: "style" | "layout" | "feature" | "fix" | "enhance";
}

/**
 * Preview error detected in the iframe
 */
export interface PreviewError {
  id: string;
  message: string;
  type: "js" | "css" | "html" | "network";
  line?: number;
  column?: number;
  timestamp: Date;
}

/**
 * Chat context state
 */
interface ChatContextState {
  messages: ChatMessage[];
  suggestions: Suggestion[];
  previewErrors: PreviewError[];
  isProcessing: boolean;
}

/**
 * Chat context actions
 */
interface ChatContextActions {
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  clearMessages: () => void;
  setSuggestions: (suggestions: Suggestion[]) => void;
  addPreviewError: (error: Omit<PreviewError, "id" | "timestamp">) => void;
  clearPreviewErrors: () => void;
  setIsProcessing: (processing: boolean) => void;
  getConversationContext: () => string;
}

type ChatContextType = ChatContextState & ChatContextActions;

const ChatContext = createContext<ChatContextType | undefined>(undefined);

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Smart suggestions based on conversation and current code
 */
const DEFAULT_SUGGESTIONS: Suggestion[] = [
  {
    id: "dark-mode",
    label: "Add dark mode",
    prompt: "Add a dark mode toggle that switches between light and dark themes",
    category: "feature",
  },
  {
    id: "responsive",
    label: "Make responsive",
    prompt: "Make this design fully responsive for mobile, tablet, and desktop",
    category: "layout",
  },
  {
    id: "animations",
    label: "Add animations",
    prompt: "Add smooth entrance animations and hover effects to make the UI more interactive",
    category: "enhance",
  },
  {
    id: "improve-contrast",
    label: "Improve contrast",
    prompt: "Improve the color contrast for better accessibility",
    category: "style",
  },
  {
    id: "sticky-header",
    label: "Sticky header",
    prompt: "Make the header sticky so it stays visible when scrolling",
    category: "layout",
  },
  {
    id: "gradient-bg",
    label: "Add gradient",
    prompt: "Add a beautiful gradient background to the hero section",
    category: "style",
  },
];

/**
 * ChatProvider component
 */
export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestionsState] = useState<Suggestion[]>(DEFAULT_SUGGESTIONS);
  const [previewErrors, setPreviewErrors] = useState<PreviewError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addMessage = useCallback((message: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateId(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const setSuggestions = useCallback((newSuggestions: Suggestion[]) => {
    setSuggestionsState(newSuggestions);
  }, []);

  const addPreviewError = useCallback((error: Omit<PreviewError, "id" | "timestamp">) => {
    const newError: PreviewError = {
      ...error,
      id: generateId(),
      timestamp: new Date(),
    };
    setPreviewErrors((prev) => {
      // Avoid duplicates
      const exists = prev.some((e) => e.message === error.message);
      if (exists) return prev;
      return [...prev, newError];
    });
  }, []);

  const clearPreviewErrors = useCallback(() => {
    setPreviewErrors([]);
  }, []);

  /**
   * Get conversation context for AI prompts
   * Returns a formatted string of recent conversation for context
   */
  const getConversationContext = useCallback((): string => {
    if (messages.length === 0) return "";
    
    // Get last 5 messages for context
    const recentMessages = messages.slice(-5);
    
    return recentMessages
      .map((msg) => {
        const role = msg.role === "user" ? "User" : "Assistant";
        return `${role}: ${msg.content}`;
      })
      .join("\n\n");
  }, [messages]);

  const value: ChatContextType = {
    messages,
    suggestions,
    previewErrors,
    isProcessing,
    addMessage,
    clearMessages,
    setSuggestions,
    addPreviewError,
    clearPreviewErrors,
    setIsProcessing,
    getConversationContext,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

/**
 * Hook to use chat context
 */
export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

/**
 * Generate context-aware suggestions based on current HTML content
 */
export function generateSmartSuggestions(html: string): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const htmlLower = html.toLowerCase();

  // Check for missing features and suggest them
  if (!htmlLower.includes("dark") && !htmlLower.includes("theme")) {
    suggestions.push({
      id: "add-dark-mode",
      label: "Add dark mode",
      prompt: "Add a dark mode toggle with smooth transitions between themes",
      category: "feature",
    });
  }

  if (!htmlLower.includes("@media") && !htmlLower.includes("responsive")) {
    suggestions.push({
      id: "make-responsive",
      label: "Make responsive",
      prompt: "Make this layout responsive for all screen sizes",
      category: "layout",
    });
  }

  if (!htmlLower.includes("animation") && !htmlLower.includes("transition")) {
    suggestions.push({
      id: "add-animations",
      label: "Add animations",
      prompt: "Add subtle animations and transitions for better UX",
      category: "enhance",
    });
  }

  if (htmlLower.includes("header") && !htmlLower.includes("sticky") && !htmlLower.includes("fixed")) {
    suggestions.push({
      id: "sticky-header",
      label: "Sticky header",
      prompt: "Make the header sticky at the top while scrolling",
      category: "layout",
    });
  }

  if (htmlLower.includes("button") && !htmlLower.includes("hover")) {
    suggestions.push({
      id: "button-hover",
      label: "Add hover effects",
      prompt: "Add hover effects to all buttons for better interactivity",
      category: "style",
    });
  }

  if (htmlLower.includes("form") && !htmlLower.includes("validation")) {
    suggestions.push({
      id: "form-validation",
      label: "Add form validation",
      prompt: "Add client-side form validation with helpful error messages",
      category: "feature",
    });
  }

  if (!htmlLower.includes("gradient")) {
    suggestions.push({
      id: "add-gradient",
      label: "Add gradient",
      prompt: "Add a modern gradient background to enhance the design",
      category: "style",
    });
  }

  if (!htmlLower.includes("footer")) {
    suggestions.push({
      id: "add-footer",
      label: "Add footer",
      prompt: "Add a professional footer with links and copyright",
      category: "layout",
    });
  }

  // Return top 6 suggestions
  return suggestions.slice(0, 6);
}

export default ChatContext;
