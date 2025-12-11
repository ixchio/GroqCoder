"use client";

import { useState } from "react";
import { Download, FileDown, Files, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadProjectAsZip, downloadSinglePage, copyHtmlToClipboard } from "@/lib/download-utils";
import { Page } from "@/types";

interface DownloadButtonProps {
  pages: Page[];
  currentPage: Page;
  projectTitle?: string;
  disabled?: boolean;
}

export function DownloadButton({
  pages,
  currentPage,
  projectTitle,
  disabled = false,
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadZip = async () => {
    if (pages.length === 0) {
      toast.error("No pages to download");
      return;
    }

    setIsDownloading(true);
    try {
      await downloadProjectAsZip(pages, projectTitle);
      toast.success("Project downloaded successfully!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download project");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadCurrentPage = () => {
    if (!currentPage?.html) {
      toast.error("No page to download");
      return;
    }

    try {
      downloadSinglePage(currentPage, projectTitle);
      toast.success("Page downloaded successfully!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download page");
    }
  };

  const handleCopyHtml = async () => {
    if (!currentPage?.html) {
      toast.error("No HTML to copy");
      return;
    }

    const success = await copyHtmlToClipboard(currentPage.html);
    if (success) {
      toast.success("HTML copied to clipboard!");
    } else {
      toast.error("Failed to copy HTML");
    }
  };

  const hasContent = pages.length > 0 && pages.some(p => p.html && p.html.length > 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || !hasContent || isDownloading}
          className="gap-2"
        >
          {isDownloading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          <span className="hidden sm:inline">Download</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleDownloadZip} className="gap-2 cursor-pointer">
          <Files className="size-4" />
          Download as ZIP
          {pages.length > 1 && (
            <span className="ml-auto text-xs text-neutral-500">
              {pages.length} files
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadCurrentPage} className="gap-2 cursor-pointer">
          <FileDown className="size-4" />
          Download current page
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyHtml} className="gap-2 cursor-pointer">
          <svg
            className="size-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Copy HTML
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
