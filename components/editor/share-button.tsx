
import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { FaLinkedin, FaTwitter, FaWhatsapp } from "react-icons/fa";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Project } from "@/types";
import { toast } from "sonner";
import { useCopyToClipboard } from "react-use";

interface ShareButtonProps {
  project?: Project | null;
}

export const ShareButton = ({ project }: ShareButtonProps) => {
  const [open, setOpen] = useState(false);
  const [, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);

  if (!project?.id) return null;

  const projectUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/projects/${project.id}`
    : `https://groq-coder.vercel.app/projects/${project.id}`;

  const handleCopy = () => {
    copyToClipboard(projectUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = [
    {
      name: "Twitter",
      icon: FaTwitter,
      color: "text-sky-500",
      url: `https://twitter.com/intent/tweet?text=Check out my creative project built with Groq Coder! ⚡&url=${encodeURIComponent(projectUrl)}`,
    },
    {
      name: "LinkedIn",
      icon: FaLinkedin,
      color: "text-blue-600",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(projectUrl)}`,
    },
    {
      name: "WhatsApp",
      icon: FaWhatsapp,
      color: "text-green-500",
      url: `https://wa.me/?text=Check out my project! ${encodeURIComponent(projectUrl)}`,
    },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 hover:text-indigo-300"
        >
          <Share2 className="size-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 overflow-hidden bg-neutral-950 border-neutral-800" align="end">
        <div className="p-4 bg-neutral-900 border-b border-neutral-800">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Share2 className="size-4 text-indigo-400" />
            Share Creative
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Share your project with the world!
          </p>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-400">Public Link</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-xs text-neutral-300 truncate font-mono">
                {projectUrl}
              </div>
              <Button
                size="icon"
                variant="outline"
                className="shrink-0 border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white size-9"
                onClick={handleCopy}
              >
                {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {shareLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 transition-all group"
              >
                <link.icon className={`size-6 ${link.color} group-hover:scale-110 transition-transform`} />
                <span className="text-[10px] text-neutral-400 font-medium">{link.name}</span>
              </a>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
