import { Rocket, Sparkles } from "lucide-react";
import Image from "next/image";

import Loading from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Page } from "@/types";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";

export const DeployButtonContent = ({
  pages,
  options,
  prompts,
}: {
  pages: Page[];
  options?: {
    title?: string;
    description?: string;
  };
  prompts: string[];
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [config, setConfig] = useState({
    title: "",
  });

  const createProject = async () => {
    if (!config.title) {
      toast.error("Please enter a title for your project.");
      return;
    }
    setLoading(true);

    try {
      const res = await api.post("/projects", {
        title: config.title,
        pages,
        prompts,
        isPublic: true,
      });
      if (res.data.ok) {
        toast.success("Project published successfully! 🎉");
        router.push(`/projects/${res.data.project.id}?deploy=true`);
      } else {
        toast.error(res?.data?.error || "Failed to create project");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 border-b border-neutral-800">
        <div className="flex items-center justify-center -space-x-3 mb-4">
          <div className="size-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg flex items-center justify-center z-10 animate-pulse">
            <Sparkles className="size-5 text-white" />
          </div>
          <div className="size-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 shadow-xl flex items-center justify-center z-20 ring-2 ring-neutral-900">
            <Image src="/groq-coder-icon.jpg" alt="Groq Coder" width={40} height={40} className="rounded-full" />
          </div>
          <div className="size-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg flex items-center justify-center z-10 animate-pulse">
            <Rocket className="size-5 text-white" />
          </div>
        </div>
        <p className="text-xl font-bold text-white text-center">
          Publish Your Project! 🚀
        </p>
        <p className="text-sm text-neutral-400 mt-2 text-center">
          {options?.description ??
            "Save and share your creation with the world. Your project will be visible in the Community Gallery."}
        </p>
      </header>
      <main className="space-y-4 p-6 bg-neutral-900">
        <div>
          <p className="text-sm text-neutral-300 mb-2">
            Choose a title for your project:
          </p>
          <Input
            type="text"
            placeholder="My Awesome Website"
            value={config.title}
            onChange={(e) => setConfig({ ...config, title: e.target.value })}
            className="!bg-neutral-800 !border-neutral-700 !text-white !placeholder:text-neutral-500 focus:!border-pink-500 focus:!ring-pink-500/20"
          />
        </div>
        <div>
          <p className="text-sm text-neutral-300 mb-2">
            Ready to go live?
          </p>
          <Button
            variant="default"
            onClick={createProject}
            className="relative w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold"
            disabled={loading}
          >
            {loading ? (
              <>
                Publishing... <Loading className="ml-2 size-4 animate-spin" />
              </>
            ) : (
              <>
                Publish Project <Rocket className="ml-2 size-4" />
              </>
            )}
          </Button>
        </div>
      </main>
    </>
  );
};
