import { HelpCircle, LogIn, RefreshCcw, SparkleIcon } from "lucide-react";
import { FaMobileAlt } from "react-icons/fa";
import { FaLaptopCode } from "react-icons/fa6";
import classNames from "classnames";
import { HtmlHistory, Page } from "@/types";
import { Button } from "@/components/ui/button";
import { MdAdd } from "react-icons/md";
import { History } from "@/components/editor/history";
import { UserMenu } from "@/components/user-menu";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";
import { useLocalStorage } from "react-use";
import { isTheSameHtml } from "@/lib/compare-html-diff";

export function Footer({
  pages,
  isNew = false,
  htmlHistory,
  setPages,
  device,
  setDevice,
  iframeRef,
}: {
  pages: Page[];
  isNew?: boolean;
  htmlHistory?: HtmlHistory[];
  device: "desktop" | "mobile";
  setPages: (pages: Page[]) => void;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
  setDevice: React.Dispatch<React.SetStateAction<"desktop" | "mobile">>;
}) {
  const { user, openLoginWindow } = useUser();

  const handleRefreshIframe = () => {
    if (iframeRef?.current) {
      const iframe = iframeRef.current;
      const content = iframe.srcdoc;
      iframe.srcdoc = "";
      setTimeout(() => {
        iframe.srcdoc = content;
      }, 10);
    }
  };

  const [, setStorage] = useLocalStorage("pages");
  const handleClick = async () => {
    if (pages && !isTheSameHtml(pages[0].html)) {
      setStorage(pages);
    }
    openLoginWindow();
  };

  return (
    <footer className="border-t bg-slate-200 border-slate-300 dark:bg-neutral-950 dark:border-neutral-800 px-3 py-2 flex items-center justify-between sticky bottom-0 z-20">
      <div className="flex items-center gap-2">
        {user ? (
          user?.isLocalUse ? (
            <>
              <div className="max-w-max bg-amber-500/10 rounded-full px-3 py-1 text-amber-500 border border-amber-500/20 text-sm font-semibold">
                Local Usage
              </div>
            </>
          ) : (
            <UserMenu className="!p-1 !pr-3 !h-auto" />
          )
        ) : (
          <Button size="sm" variant="default" onClick={handleClick}>
            <LogIn className="text-sm" />
            Log In
          </Button>
        )}
        {user && !isNew && <p className="text-neutral-700">|</p>}
        {!isNew && (
          <Link href="/projects/new">
            <Button size="sm" variant="secondary">
              <MdAdd className="text-sm" />
              New <span className="max-lg:hidden">Project</span>
            </Button>
          </Link>
        )}
        {htmlHistory && htmlHistory.length > 0 && (
          <>
            <p className="text-neutral-700">|</p>
            <History history={htmlHistory} setPages={setPages} />
          </>
        )}
      </div>
      <div className="flex justify-end items-center gap-2.5">
        <a
          href="/gallery"
          target="_blank"
        >
          <Button size="sm" variant="ghost">
            <SparkleIcon className="size-3.5" />
            <span className="max-lg:hidden">Community Gallery</span>
          </Button>
        </a>
        <Link href="/help">
          <Button size="sm" variant="outline">
            <HelpCircle className="size-3.5" />
            <span className="max-lg:hidden">Help</span>
          </Button>
        </Link>
        <Button size="sm" variant="outline" onClick={handleRefreshIframe}>
          <RefreshCcw className="size-3.5" />
          <span className="max-lg:hidden">Refresh Preview</span>
        </Button>
        {/* Beautiful Device Toggle */}
        <div className="flex items-center gap-1.5 max-lg:hidden">
          <div className="relative flex items-center rounded-xl p-1 bg-neutral-800/90 backdrop-blur-sm border border-neutral-700/50 shadow-lg">
            {/* Animated sliding background pill */}
            <div
              className={classNames(
                "absolute top-1 h-[calc(100%-8px)] w-10 rounded-lg transition-all duration-300 ease-out",
                "bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg",
                "shadow-violet-500/30",
                {
                  "left-1": device === "desktop",
                  "left-[calc(50%+2px)]": device === "mobile",
                }
              )}
            />
            
            {/* Desktop Button */}
            <button
              onClick={() => setDevice("desktop")}
              className={classNames(
                "relative z-10 flex items-center justify-center w-10 h-8 rounded-lg transition-all duration-300 cursor-pointer",
                {
                  "text-white": device === "desktop",
                  "text-neutral-400 hover:text-neutral-200": device !== "desktop",
                }
              )}
              title="Desktop view"
            >
              <FaLaptopCode className="size-4" />
            </button>
            
            {/* Mobile Button */}
            <button
              onClick={() => setDevice("mobile")}
              className={classNames(
                "relative z-10 flex items-center justify-center w-10 h-8 rounded-lg transition-all duration-300 cursor-pointer",
                {
                  "text-white": device === "mobile",
                  "text-neutral-400 hover:text-neutral-200": device !== "mobile",
                }
              )}
              title="Mobile view"
            >
              <FaMobileAlt className="size-4" />
            </button>
          </div>
          
          {/* Current device label with subtle animation */}
          <span className={classNames(
            "text-xs font-medium px-2 py-1 rounded-md transition-all duration-300",
            {
              "text-violet-400 bg-violet-500/10": device === "desktop",
              "text-fuchsia-400 bg-fuchsia-500/10": device === "mobile",
            }
          )}>
            {device === "desktop" ? "Desktop" : "Mobile"}
          </span>
        </div>
      </div>
    </footer>
  );
}
