import { useLocalStorage } from "react-use";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CheckCheck } from "lucide-react";
import { isTheSameHtml } from "@/lib/compare-html-diff";
import { Page } from "@/types";

export const ProModal = ({
  open,
  pages,
  onClose,
}: {
  open: boolean;
  pages: Page[];
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [, setStorage] = useLocalStorage("pages");
  const handleProClick = () => {
    if (pages && !isTheSameHtml(pages?.[0].html)) {
      setStorage(pages);
    }
    onClose(false);
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg lg:!p-8 !rounded-3xl !bg-white !border-neutral-100">
        <DialogTitle className="hidden" />
        <main className="flex flex-col items-start text-left relative pt-2">
          <div className="flex items-center justify-start -space-x-4 mb-5">
            <div className="size-14 rounded-full bg-pink-200 shadow-2xs flex items-center justify-center text-3xl opacity-50">
              🚀
            </div>
            <div className="size-16 rounded-full bg-amber-200 shadow-2xl flex items-center justify-center text-4xl z-2">
              🤩
            </div>
            <div className="size-14 rounded-full bg-sky-200 shadow-2xs flex items-center justify-center text-3xl opacity-50">
              🥳
            </div>
          </div>
          <h2 className="text-2xl font-bold text-neutral-950">
            Only $9 to enhance your possibilities
          </h2>
          <p className="text-neutral-500 text-base mt-2 max-w-sm">
            It seems like you have reached the rate limit. Please wait a moment or sign in.
          </p>
          <hr className="bg-neutral-200 w-full max-w-[150px] my-6" />
          <p className="text-lg mt-3 text-neutral-900 font-semibold">
            Sign in to unlock higher limits and save your projects ⚡
          </p>
          <ul className="mt-3 space-y-1 text-neutral-500">
            <li className="text-sm text-neutral-500 space-x-2 flex items-center justify-start gap-2 mb-3">
              You&apos;ll also unlock some Hugging Face PRO features, like:
            </li>
            <li className="text-sm space-x-2 flex items-center justify-start gap-2">
              <CheckCheck className="text-emerald-500 size-4" />
              Get acces to thousands of AI app (ZeroGPU) with high quota
            </li>
            <li className="text-sm space-x-2 flex items-center justify-start gap-2">
              <CheckCheck className="text-emerald-500 size-4" />
              Get exclusive early access to new features and updates
            </li>
            <li className="text-sm space-x-2 flex items-center justify-start gap-2">
              <CheckCheck className="text-emerald-500 size-4" />
              Get free credits across all Inference Providers
            </li>
            <li className="text-sm text-neutral-500 space-x-2 flex items-center justify-start gap-2 mt-3">
              ... and lots more!
            </li>
          </ul>
          <Button
            variant="black"
            size="lg"
            className="w-full !text-base !h-11 mt-8"
            onClick={handleProClick}
          >
            Subscribe to PRO ($9/month)
          </Button>
        </main>
      </DialogContent>
    </Dialog>
  );
};

export default ProModal;
