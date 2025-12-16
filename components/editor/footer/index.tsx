import { HelpCircle, LogIn, RefreshCcw, SparkleIcon } from "lucide-react";
import { HtmlHistory, Page } from "@/types";
import { Button } from "@/components/ui/button";
import { MdAdd } from "react-icons/md";
import { History } from "@/components/editor/history";
import { UserMenu } from "@/components/user-menu";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";
import { useLocalStorage } from "react-use";
import { isTheSameHtml } from "@/lib/compare-html-diff";
import { DeviceConfig, DeviceSelector } from "../device-selector";

export function Footer({
  pages,
  isNew = false,
  htmlHistory,
  setPages,
  device,
  setDevice,
  iframeRef,
  isDeviceRotated,
  setIsDeviceRotated,
}: {
  pages: Page[];
  isNew?: boolean;
  htmlHistory?: HtmlHistory[];
  device: DeviceConfig;
  setPages: (pages: Page[]) => void;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
  setDevice: React.Dispatch<React.SetStateAction<DeviceConfig>>;
  isDeviceRotated: boolean;
  setIsDeviceRotated: React.Dispatch<React.SetStateAction<boolean>>;
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
        {/* Advanced Device Selector */}
        <div className="max-lg:hidden">
          <DeviceSelector
            selectedDevice={device}
            isRotated={isDeviceRotated}
            onDeviceChange={setDevice}
            onRotateToggle={() => setIsDeviceRotated((prev) => !prev)}
          />
        </div>
      </div>
    </footer>
  );
}
