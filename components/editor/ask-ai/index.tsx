"use client";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import classNames from "classnames";
import { toast } from "sonner";
import { useLocalStorage, useUpdateEffect } from "react-use";
import { ArrowUp, ChevronDown, Crosshair, Camera } from "lucide-react";
import { FaStopCircle } from "react-icons/fa";

import ProModal from "@/components/pro-modal";
import { Button } from "@/components/ui/button";
import { MODELS } from "@/lib/providers";
import { HtmlHistory, Page, Project } from "@/types";
// import { InviteFriends } from "@/components/invite-friends";
import { Settings } from "@/components/editor/ask-ai/settings";
import { LoginModal } from "@/components/login-modal";
import { ReImagine } from "@/components/editor/ask-ai/re-imagine";
import Loading from "@/components/loading";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipContent } from "@radix-ui/react-tooltip";
import { SelectedHtmlElement } from "./selected-html-element";
import { FollowUpTooltip } from "./follow-up-tooltip";
import { isTheSameHtml } from "@/lib/compare-html-diff";
import { useCallAi, StreamStats } from "@/hooks/useCallAi";
import { SelectedFiles } from "./selected-files";
import { Uploader } from "./uploader";
import { SuggestionChips } from "./suggestions";
import { generateSmartSuggestions, Suggestion } from "@/components/contexts/chat-context";

export function AskAI({
  isNew,
  project,
  images,
  currentPage,
  previousPrompts,
  onScrollToBottom,
  isAiWorking,
  setisAiWorking,
  isEditableModeEnabled = false,
  pages,
  htmlHistory,
  selectedElement,
  setSelectedElement,
  selectedFiles,
  setSelectedFiles,
  setIsEditableModeEnabled,
  onNewPrompt,
  onSuccess,
  setPages,
  setCurrentPage,
}: {
  project?: Project | null;
  currentPage: Page;
  images?: string[];
  pages: Page[];
  onScrollToBottom: () => void;
  previousPrompts: string[];
  isAiWorking: boolean;
  onNewPrompt: (prompt: string) => void;
  htmlHistory?: HtmlHistory[];
  setisAiWorking: React.Dispatch<React.SetStateAction<boolean>>;
  isNew?: boolean;
  onSuccess: (page: Page[], p: string, n?: number[][]) => void;
  isEditableModeEnabled: boolean;
  setIsEditableModeEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  selectedElement?: HTMLElement | null;
  setSelectedElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  selectedFiles: string[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<string[]>>;
  setPages: React.Dispatch<React.SetStateAction<Page[]>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<string>>;
}) {
  const refThink = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useLocalStorage("provider", "auto");
  const [model, setModel] = useLocalStorage("model", MODELS[0].value);
  const [openProvider, setOpenProvider] = useState(false);
  const [providerError, setProviderError] = useState("");
  const [openProModal, setOpenProModal] = useState(false);
  const [openThink, setOpenThink] = useState(false);
  const [isThinking, setIsThinking] = useState(true);
  const [think, setThink] = useState("");
  const [isFollowUp, setIsFollowUp] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<string[]>(images ?? []);
  const [streamStats, setStreamStats] = useState<StreamStats>({
    chars: 0,
    tokens: 0,
    elapsed: 0,
    isStreaming: false,
  });
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Generate smart suggestions based on current HTML
  useEffect(() => {
    if (currentPage?.html && !isAiWorking) {
      const smartSuggestions = generateSmartSuggestions(currentPage.html);
      setSuggestions(smartSuggestions);
    }
  }, [currentPage?.html, isAiWorking]);

  // Memoized callback to prevent unnecessary re-renders
  const handleStreamProgress = useCallback((stats: StreamStats) => {
    setStreamStats(stats);
  }, []);

  const {
    callAiNewProject,
    callAiFollowUp,
    callAiNewPage,
    stopController,
    audio: hookAudio,
  } = useCallAi({
    onNewPrompt,
    onSuccess,
    onScrollToBottom,
    setPages,
    setCurrentPage,
    currentPage,
    pages,
    isAiWorking,
    setisAiWorking,
    onStreamProgress: handleStreamProgress,
  });

  const selectedModel = useMemo(() => {
    return MODELS.find((m: { value: string }) => m.value === model);
  }, [model]);

  const callAi = async (redesignMarkdown?: string) => {
    if (isAiWorking) return;
    if (!redesignMarkdown && !prompt.trim()) return;

    if (isFollowUp && !redesignMarkdown && !isSameHtml) {
      // Use follow-up function for existing projects
      const selectedElementHtml = selectedElement
        ? selectedElement.outerHTML
        : "";

      const result = await callAiFollowUp(
        prompt,
        model,
        provider,
        previousPrompts,
        selectedElementHtml,
        selectedFiles,
        project?.projectType || "html"
      );

      if (result?.error) {
        handleError(result.error, result.message);
        return;
      }

      if (result?.success) {
        setPrompt("");
      }
    } else if (isFollowUp && pages.length > 1 && isSameHtml) {
      const result = await callAiNewPage(
        prompt,
        model,
        provider,
        currentPage.path,
        [
          ...(previousPrompts ?? []),
          ...(htmlHistory?.map((h) => h.prompt) ?? []),
        ],
        project?.projectType || "html"
      );
      if (result?.error) {
        handleError(result.error, result.message);
        return;
      }

      if (result?.success) {
        setPrompt("");
      }
    } else {
      const result = await callAiNewProject(
        prompt,
        model,
        provider,
        redesignMarkdown,
        handleThink,
        () => {
          setIsThinking(false);
        },
        project?.projectType || "html"
      );

      if (result?.error) {
        handleError(result.error, result.message);
        return;
      }

      if (result?.success) {
        setPrompt("");
        if (selectedModel?.isThinker) {
          setModel(MODELS[0].value);
        }
      }
    }
  };

  const handleThink = (think: string) => {
    setThink(think);
    setIsThinking(true);
    setOpenThink(true);
  };

  const handleError = (error: string, message?: string) => {
    switch (error) {
      case "login_required":
        setOpen(true);
        break;
      case "provider_required":
        setOpenProvider(true);
        setProviderError(message || "");
        break;
      case "pro_required":
        setOpenProModal(true);
        break;
      case "api_error":
        toast.error(message || "An error occurred");
        break;
      case "network_error":
        toast.error(message || "Network error occurred");
        break;
      default:
        toast.error("An unexpected error occurred");
    }
  };

  useUpdateEffect(() => {
    if (refThink.current) {
      refThink.current.scrollTop = refThink.current.scrollHeight;
    }
  }, [think]);

  useUpdateEffect(() => {
    if (!isThinking) {
      setOpenThink(false);
    }
  }, [isThinking]);

  const isSameHtml = useMemo(() => {
    return isTheSameHtml(currentPage.html);
  }, [currentPage.html]);

  // Handle suggestion chip click
  const handleSuggestionSelect = (suggestion: Suggestion) => {
    setPrompt(suggestion.prompt);
    // Auto-submit after a short delay
    setTimeout(() => {
      callAi();
    }, 100);
  };

  return (
    <div className="px-3">
      <div className="relative bg-neutral-800 border border-neutral-700 rounded-2xl ring-[4px] focus-within:ring-neutral-500/30 focus-within:border-neutral-600 ring-transparent z-10 w-full group">
        {think && (
          <div className="w-full border-b border-neutral-700 relative overflow-hidden">
            <header
              className="flex items-center justify-between px-5 py-2.5 group hover:bg-neutral-600/20 transition-colors duration-200 cursor-pointer"
              onClick={() => {
                setOpenThink(!openThink);
              }}
            >
              <p className="text-sm font-medium text-neutral-300 group-hover:text-neutral-200 transition-colors duration-200">
                {isThinking ? "Groq Coder is thinking..." : "Groq Coder's plan"}
              </p>
              <ChevronDown
                className={classNames(
                  "size-4 text-neutral-400 group-hover:text-neutral-300 transition-all duration-200",
                  {
                    "rotate-180": openThink,
                  }
                )}
              />
            </header>
            <main
              ref={refThink}
              className={classNames(
                "overflow-y-auto transition-all duration-200 ease-in-out",
                {
                  "max-h-[0px]": !openThink,
                  "min-h-[250px] max-h-[250px] border-t border-neutral-700":
                    openThink,
                }
              )}
            >
              <p className="text-[13px] text-neutral-400 whitespace-pre-line px-5 pb-4 pt-3">
                {think}
              </p>
            </main>
          </div>
        )}
        <SelectedFiles
          files={selectedFiles}
          isAiWorking={isAiWorking}
          onDelete={(file) =>
            setSelectedFiles((prev) => prev.filter((f) => f !== file))
          }
        />
        {selectedElement && (
          <div className="px-4 pt-3">
            <SelectedHtmlElement
              element={selectedElement}
              isAiWorking={isAiWorking}
              onDelete={() => setSelectedElement(null)}
            />
          </div>
        )}
        {/* Smart Suggestions - show when not working and has suggestions */}
        {!isAiWorking && suggestions.length > 0 && isFollowUp && !isSameHtml && (
          <div className="px-4 pt-3">
            <SuggestionChips
              suggestions={suggestions}
              onSelect={handleSuggestionSelect}
              disabled={isAiWorking}
            />
          </div>
        )}
        <div className="w-full relative flex items-center justify-between">
          {(isAiWorking || isUploading) && (
            <div className="absolute bg-neutral-800 top-0 left-4 w-[calc(100%-30px)] h-full z-1 flex items-start pt-3.5 justify-between max-lg:text-sm">
              <div className="flex items-center justify-start gap-2">
                <Loading overlay={false} className="!size-4 opacity-50" />
                <p className="text-neutral-400 text-sm">
                  {isUploading ? (
                    "Uploading images..."
                  ) : isAiWorking && !isSameHtml ? (
                    "AI is working..."
                  ) : (
                    <span className="inline-flex">
                      {[
                        "G",
                        "r",
                        "o",
                        "q",
                        " ",
                        "C",
                        "o",
                        "d",
                        "e",
                        "r",
                        " ",
                        "i",
                        "s",
                        " ",
                        "T",
                        "h",
                        "i",
                        "n",
                        "k",
                        "i",
                        "n",
                        "g",
                        ".",
                        ".",
                        ".",
                      ].map((char, index) => (
                        <span
                          key={index}
                          className="bg-gradient-to-r from-neutral-100 to-neutral-300 bg-clip-text text-transparent animate-pulse"
                          style={{
                            animationDelay: `${index * 0.1}s`,
                            animationDuration: "1.3s",
                            animationIterationCount: "infinite",
                          }}
                        >
                          {char === " " ? "\u00A0" : char}
                        </span>
                      ))}
                    </span>
                  )}
                </p>
              </div>
              {isAiWorking && (
                <div className="flex items-center gap-3">
                  {/* Stream Stats Display */}
                  {streamStats.isStreaming && (
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
                      <span className="bg-neutral-700/50 px-1.5 py-0.5 rounded">
                        {streamStats.chars.toLocaleString()} chars
                      </span>
                      <span className="bg-neutral-700/50 px-1.5 py-0.5 rounded">
                        ~{streamStats.tokens.toLocaleString()} tokens
                      </span>
                      <span className="bg-neutral-700/50 px-1.5 py-0.5 rounded">
                        {streamStats.elapsed}s
                      </span>
                    </div>
                  )}
                  <div
                    className="text-xs text-neutral-400 px-1 py-0.5 rounded-md border border-neutral-600 flex items-center justify-center gap-1.5 bg-neutral-800 hover:brightness-110 transition-all duration-200 cursor-pointer"
                    onClick={stopController}
                  >
                    <FaStopCircle />
                    Stop generation
                  </div>
                </div>
              )}
            </div>
          )}
          <textarea
            disabled={isAiWorking}
            className={classNames(
              "w-full bg-transparent text-sm outline-none text-white placeholder:text-neutral-400 p-4 resize-none",
              {
                "!pt-2.5": selectedElement && !isAiWorking,
              }
            )}
            placeholder={
              selectedElement
                ? `Ask Groq Coder about ${selectedElement.tagName.toLowerCase()}...`
                : isFollowUp && (!isSameHtml || pages?.length > 1)
                ? "Ask Groq Coder for edits"
                : "Ask Groq Coder anything..."
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                callAi();
              }
            }}
          />
        </div>
        <div className="flex items-center justify-between gap-2 px-4 pb-3 mt-2">
          <div className="flex-1 flex items-center justify-start gap-1.5">
            <Uploader
              pages={pages}
              onLoading={setIsUploading}
              isLoading={isUploading}
              onFiles={setFiles}
              onSelectFile={(file) => {
                if (selectedFiles.includes(file)) {
                  setSelectedFiles((prev) => prev.filter((f) => f !== file));
                } else {
                  setSelectedFiles((prev) => [...prev, file]);
                }
              }}
              files={files}
              selectedFiles={selectedFiles}
              project={project}
            />
            {isNew && (
              <>
                <ReImagine onRedesign={(md) => callAi(md)} />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="iconXs"
                      variant="outline"
                      className="!border-neutral-600 !text-neutral-400 hover:!border-purple-500 hover:!text-purple-400"
                      onClick={() => {
                        // Set a vision model and prompt for cloning
                        const visionModel = MODELS.find((m: { isVision?: boolean }) => m.isVision);
                        if (visionModel) {
                          setModel(visionModel.value);
                        }
                        setPrompt("Clone this screenshot exactly. Recreate the UI with pixel-perfect accuracy, matching all colors, typography, spacing, and layout.");
                        toast.info("Select a screenshot image using the Images button, then click send!");
                      }}
                    >
                      <Camera className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    align="start"
                    className="bg-neutral-950 text-xs text-neutral-200 py-1 px-2 rounded-md -translate-y-0.5"
                  >
                    Clone a screenshot - Upload an image and AI will recreate it
                  </TooltipContent>
                </Tooltip>
              </>
            )}
            {!isSameHtml && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="xs"
                    variant={isEditableModeEnabled ? "default" : "outline"}
                    onClick={() => {
                      setIsEditableModeEnabled?.(!isEditableModeEnabled);
                    }}
                    className={classNames("h-[28px]", {
                      "!text-neutral-400 hover:!text-neutral-200 !border-neutral-600 !hover:!border-neutral-500":
                        !isEditableModeEnabled,
                    })}
                  >
                    <Crosshair className="size-4" />
                    Edit
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  align="start"
                  className="bg-neutral-950 text-xs text-neutral-200 py-1 px-2 rounded-md -translate-y-0.5"
                >
                  Select an element on the page to ask Groq Coder edit it
                  directly.
                </TooltipContent>
              </Tooltip>
            )}
            {/* <InviteFriends /> */}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Settings
              provider={provider as string}
              model={model as string}
              onChange={setProvider}
              onModelChange={setModel}
              open={openProvider}
              error={providerError}
              isFollowUp={!isSameHtml && isFollowUp}
              onClose={setOpenProvider}
            />
            <Button
              size="iconXs"
              disabled={isAiWorking || !prompt.trim()}
              onClick={() => callAi()}
            >
              <ArrowUp className="size-4" />
            </Button>
          </div>
        </div>
        <LoginModal open={open} onClose={() => setOpen(false)} pages={pages} />
        <ProModal
          pages={pages}
          open={openProModal}
          onClose={() => setOpenProModal(false)}
        />

        {!isSameHtml && (
          <div className="absolute top-0 right-0 -translate-y-[calc(100%+8px)] select-none text-xs text-neutral-400 flex items-center justify-center gap-2 bg-neutral-800 border border-neutral-700 rounded-md p-1 pr-2.5">
            <label
              htmlFor="diff-patch-checkbox"
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <Checkbox
                id="diff-patch-checkbox"
                checked={isFollowUp}
                onCheckedChange={(e) => {
                  if (e === true && !isSameHtml && selectedModel?.isThinker) {
                    setModel(MODELS[0].value);
                  }
                  setIsFollowUp(e === true);
                }}
              />
              Diff-Patch Update
            </label>
            <FollowUpTooltip />
          </div>
        )}
      </div>
      <audio ref={hookAudio} id="audio" className="hidden">
        <source src="/success.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
