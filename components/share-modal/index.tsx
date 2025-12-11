"use client";

import { useState } from "react";
import { Share2, Copy, Check, Twitter, MessageCircle, Link2 } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ShareModalProps {
  projectId?: string;
  projectTitle?: string;
  trigger?: React.ReactNode;
}

export function ShareModal({ projectId, projectTitle = "My Project", trigger }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  
  const shareUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/projects/${projectId}` 
    : "";
  
  const shareText = `Check out "${projectTitle}" - built with Groq Coder! ⚡`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const shareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(url, "_blank");
  };

  const shareToDiscord = () => {
    // Discord doesn't have a direct share URL, so we copy a formatted message
    const discordMessage = `**${projectTitle}** 🚀\n${shareText}\n${shareUrl}`;
    navigator.clipboard.writeText(discordMessage);
    toast.success("Discord message copied! Paste it in your server.");
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: projectTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or error
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-neutral-900/95 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-pink-400" />
            Share Your Creation
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Preview */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-white/60 mb-1">Sharing</p>
            <p className="font-semibold text-white truncate">{projectTitle}</p>
          </div>

          {/* Quick share buttons */}
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={shareToTwitter}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:-translate-y-1"
            >
              <div className="w-10 h-10 rounded-full bg-[#1DA1F2]/20 flex items-center justify-center">
                <Twitter className="w-5 h-5 text-[#1DA1F2]" />
              </div>
              <span className="text-xs text-white/60">Twitter</span>
            </button>

            <button
              onClick={shareToWhatsApp}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:-translate-y-1"
            >
              <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
              </div>
              <span className="text-xs text-white/60">WhatsApp</span>
            </button>

            <button
              onClick={shareToDiscord}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:-translate-y-1"
            >
              <div className="w-10 h-10 rounded-full bg-[#5865F2]/20 flex items-center justify-center">
                <FaDiscord className="w-5 h-5 text-[#5865F2]" />
              </div>
              <span className="text-xs text-white/60">Discord</span>
            </button>

            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <button
                onClick={nativeShare}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:-translate-y-1"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-white/70" />
                </div>
                <span className="text-xs text-white/60">More</span>
              </button>
            )}
          </div>

          {/* Copy link */}
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 truncate">
              {shareUrl || "Project URL will appear here"}
            </div>
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="icon"
              className="shrink-0 border-white/10 hover:bg-white/10"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Embed code */}
          <div className="space-y-2">
            <p className="text-sm text-white/60 flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Embed in your website
            </p>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 font-mono text-xs text-white/50 overflow-x-auto">
              {`<iframe src="${shareUrl}" width="100%" height="600" />`}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ShareModal;
