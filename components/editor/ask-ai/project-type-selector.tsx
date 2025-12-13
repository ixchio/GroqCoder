"use client";

import { ProjectType } from "@/types";
import { Button } from "@/components/ui/button";
import { Code2, FileCode, Layers } from "lucide-react";
import classNames from "classnames";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PROJECT_TYPES: {
  id: ProjectType;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    id: "html",
    label: "HTML",
    icon: <FileCode className="size-4" />,
    description: "Single HTML file with CSS & JS",
  },
  {
    id: "react",
    label: "React",
    icon: <Code2 className="size-4" />,
    description: "React app with Vite & Tailwind",
  },
  {
    id: "nextjs",
    label: "Next.js",
    icon: <Layers className="size-4" />,
    description: "Next.js App Router with TypeScript",
  },
];

export function ProjectTypeSelector({
  value,
  onChange,
  disabled = false,
}: {
  value: ProjectType;
  onChange: (type: ProjectType) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1 bg-neutral-800/50 rounded-lg p-0.5">
      {PROJECT_TYPES.map((type) => (
        <Tooltip key={type.id}>
          <TooltipTrigger asChild>
            <Button
              size="xs"
              variant={value === type.id ? "default" : "ghost"}
              onClick={() => onChange(type.id)}
              disabled={disabled}
              className={classNames("h-7 px-2 gap-1.5 text-xs", {
                "!bg-neutral-700 !text-white": value === type.id,
                "!text-neutral-400 hover:!text-white hover:!bg-neutral-700/50":
                  value !== type.id,
              })}
            >
              {type.icon}
              {type.label}
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="bg-neutral-950 text-xs text-neutral-200 py-1 px-2 rounded-md"
          >
            {type.description}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
