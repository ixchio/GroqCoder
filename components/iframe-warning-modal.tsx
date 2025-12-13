"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertTriangle } from "lucide-react";

interface IframeWarningModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function IframeWarningModal({
  isOpen,
}: // onOpenChange,
IframeWarningModalProps) {
  const handleVisitSite = () => {
    window.open("https://deepsite.hf.co", "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <DialogTitle>Unauthorized Embedding</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            You&apos;re viewing DeepSite through an unauthorized iframe. For the
            best experience and security, please visit the official website
            directly.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium">Why visit the official site?</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Better performance and security</li>
            <li>• Full functionality access</li>
            <li>• Latest features and updates</li>
            <li>• Proper authentication support</li>
          </ul>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button onClick={handleVisitSite} className="w-full sm:w-auto">
            <ExternalLink className="mr-2 h-4 w-4" />
            Visit Deepsite.hf.co
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
