/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { toast } from "sonner";
import { MdSave } from "react-icons/md";
import { useParams } from "next/navigation";

import Loading from "@/components/loading";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Page } from "@/types";

export function SaveButton({
  pages,
  prompts,
}: {
  pages: Page[];
  prompts: string[];
}) {
  // get params from URL
  const { namespace, repoId } = useParams<{
    namespace: string;
    repoId: string;
  }>();
  const [loading, setLoading] = useState(false);

  const updateSpace = async () => {
    setLoading(true);

    try {
      const res = await api.put(`/me/projects/${namespace}/${repoId}`, {
        pages,
        prompts,
      });
      if (res.data.ok) {
        toast.success("Your space is updated! 🎉", {
          action: {
            label: "See Space",
            onClick: () => {
              window.open(
                `https://huggingface.co/spaces/${namespace}/${repoId}`,
                "_blank"
              );
            },
          },
        });
      } else {
        toast.error(res?.data?.error || "Failed to update space");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <Button
        variant="default"
        className="max-lg:hidden !px-4 relative"
        onClick={updateSpace}
      >
        <MdSave className="size-4" />
        Publish your Project{" "}
        {loading && <Loading className="ml-2 size-4 animate-spin" />}
      </Button>
      <Button
        variant="default"
        size="sm"
        className="lg:hidden relative"
        onClick={updateSpace}
      >
        Publish {loading && <Loading className="ml-2 size-4 animate-spin" />}
      </Button>
    </>
  );
}
