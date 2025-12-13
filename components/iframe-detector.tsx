"use client";

import { useEffect, useState } from "react";
import IframeWarningModal from "./iframe-warning-modal";

export default function IframeDetector() {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Helper function to check if a hostname is from allowed domains
    const isAllowedDomain = (hostname: string) => {
      const host = hostname.toLowerCase();
      return (
        host.endsWith(".huggingface.co") ||
        host.endsWith(".hf.co") ||
        host === "huggingface.co" ||
        host === "hf.co"
      );
    };

    // Check if the current window is in an iframe
    const isInIframe = () => {
      try {
        return window.self !== window.top;
      } catch {
        // If we can't access window.top due to cross-origin restrictions,
        // we're likely in an iframe
        return true;
      }
    };

    // Additional check: compare window location with parent location
    const isEmbedded = () => {
      try {
        return window.location !== window.parent.location;
      } catch {
        // Cross-origin iframe
        return true;
      }
    };

    // Check if we're in an iframe from a non-allowed domain
    const shouldShowWarning = () => {
      if (!isInIframe() && !isEmbedded()) {
        return false; // Not in an iframe
      }

      try {
        // Try to get the parent's hostname
        const parentHostname = window.parent.location.hostname;
        return !isAllowedDomain(parentHostname);
      } catch {
        // Cross-origin iframe - try to get referrer instead
        try {
          if (document.referrer) {
            const referrerUrl = new URL(document.referrer);
            return !isAllowedDomain(referrerUrl.hostname);
          }
        } catch {
          // If we can't determine the parent domain, assume it's not allowed
        }
        return true;
      }
    };

    if (shouldShowWarning()) {
      // Show warning modal instead of redirecting immediately
      setShowWarning(true);
    }
  }, []);

  return (
    <IframeWarningModal isOpen={showWarning} onOpenChange={setShowWarning} />
  );
}
