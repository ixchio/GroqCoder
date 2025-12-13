import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Minus } from "lucide-react";

export const SelectedFiles = ({
  files,
  isAiWorking,
  onDelete,
}: {
  files: string[];
  isAiWorking: boolean;
  onDelete: (file: string) => void;
}) => {
  if (files.length === 0) return null;
  return (
    <div className="px-4 pt-3">
      <div className="flex items-center justify-start gap-2">
        {files.map((file) => (
          <div
            key={file}
            className="flex items-center relative justify-start gap-2 p-1 bg-neutral-700 rounded-md"
          >
            <Image
              src={file}
              alt="uploaded image"
              className="size-12 rounded-md object-cover"
              width={40}
              height={40}
            />
            <Button
              size="iconXsss"
              variant="secondary"
              className={`absolute top-0.5 right-0.5 ${
                isAiWorking ? "opacity-50 !cursor-not-allowed" : ""
              }`}
              disabled={isAiWorking}
              onClick={() => onDelete(file)}
            >
              <Minus className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
