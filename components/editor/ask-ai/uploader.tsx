import { useRef, useState } from "react";
import { Images, Upload } from "lucide-react";
import Image from "next/image";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Page, Project } from "@/types";
import Loading from "@/components/loading";
import { RiCheckboxCircleFill } from "react-icons/ri";
import { useUser } from "@/hooks/useUser";
import { LoginModal } from "@/components/login-modal";
import { DeployButtonContent } from "../deploy-button/content";

export const Uploader = ({
  pages,
  onLoading,
  isLoading,
  onFiles,
  onSelectFile,
  selectedFiles,
  files,
  project,
}: {
  pages: Page[];
  onLoading: (isLoading: boolean) => void;
  isLoading: boolean;
  files: string[];
  onFiles: React.Dispatch<React.SetStateAction<string[]>>;
  onSelectFile: (file: string) => void;
  selectedFiles: string[];
  project?: Project | null;
}) => {
  const { user } = useUser();

  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = async (files: FileList | null) => {
    if (!files) return;
    if (!project) return;

    onLoading(true);

    const images = Array.from(files).filter((file) => {
      return file.type.startsWith("image/");
    });

    const data = new FormData();
    images.forEach((image) => {
      data.append("images", image);
    });

    const response = await fetch(
      `/api/me/projects/${project.space_id}/images`,
      {
        method: "POST",
        body: data,
      }
    );
    if (response.ok) {
      const data = await response.json();
      onFiles((prev) => [...prev, ...data.uploadedFiles]);
    }
    onLoading(false);
  };

  // TODO FIRST PUBLISH YOUR PROJECT TO UPLOAD IMAGES.
  return user?.id ? (
    <Popover open={open} onOpenChange={setOpen}>
      <form>
        <PopoverTrigger asChild>
          <Button
            size="iconXs"
            variant="outline"
            className="!border-neutral-600 !text-neutral-400 !hover:!border-neutral-500 hover:!text-neutral-300"
          >
            <Images className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="!rounded-2xl !p-0 !bg-white !border-neutral-100 min-w-xs text-center overflow-hidden"
        >
          {project?.space_id ? (
            <>
              <header className="bg-neutral-50 p-6 border-b border-neutral-200/60">
                <div className="flex items-center justify-center -space-x-4 mb-3">
                  <div className="size-9 rounded-full bg-pink-200 shadow-2xs flex items-center justify-center text-xl opacity-50">
                    🎨
                  </div>
                  <div className="size-11 rounded-full bg-amber-200 shadow-2xl flex items-center justify-center text-2xl z-2">
                    🖼️
                  </div>
                  <div className="size-9 rounded-full bg-sky-200 shadow-2xs flex items-center justify-center text-xl opacity-50">
                    💻
                  </div>
                </div>
                <p className="text-xl font-semibold text-neutral-950">
                  Add Custom Images
                </p>
                <p className="text-sm text-neutral-500 mt-1.5">
                  Upload images to your project and use them with DeepSite!
                </p>
              </header>
              <main className="space-y-4 p-5">
                <div>
                  <p className="text-xs text-left text-neutral-700 mb-2">
                    Uploaded Images
                  </p>
                  <div className="grid grid-cols-4 gap-1 flex-wrap max-h-40 overflow-y-auto">
                    {files.map((file) => (
                      <div
                        key={file}
                        className="select-none relative cursor-pointer bg-white rounded-md border-[2px] border-white hover:shadow-2xl transition-all duration-300"
                        onClick={() => onSelectFile(file)}
                      >
                        <Image
                          src={file}
                          alt="uploaded image"
                          width={56}
                          height={56}
                          className="object-cover w-full rounded-sm aspect-square"
                        />
                        {selectedFiles.includes(file) && (
                          <div className="absolute top-0 right-0 h-full w-full flex items-center justify-center bg-black/50 rounded-md">
                            <RiCheckboxCircleFill className="size-6 text-neutral-100" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-left text-neutral-700 mb-2">
                    Or import images from your computer
                  </p>
                  <Button
                    variant="black"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loading
                          overlay={false}
                          className="ml-2 size-4 animate-spin"
                        />
                        Uploading image(s)...
                      </>
                    ) : (
                      <>
                        <Upload className="size-4" />
                        Upload Images
                      </>
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={(e) => uploadFiles(e.target.files)}
                  />
                </div>
              </main>
            </>
          ) : (
            <DeployButtonContent
              pages={pages}
              prompts={[]}
              options={{
                description: "Publish your project first to add custom images.",
              }}
            />
          )}
        </PopoverContent>
      </form>
    </Popover>
  ) : (
    <>
      <Button
        size="iconXs"
        variant="outline"
        className="!border-neutral-600 !text-neutral-400 !hover:!border-neutral-500 hover:!text-neutral-300"
        onClick={() => setOpen(true)}
      >
        <Images className="size-4" />
      </Button>
      <LoginModal
        open={open}
        onClose={() => setOpen(false)}
        pages={pages}
        title="Log In to add Custom Images"
        description="Log In through your Hugging Face account to publish your project and increase your monthly free limit."
      />
    </>
  );
};
