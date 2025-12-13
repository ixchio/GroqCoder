import Link from "next/link";
import { formatDistance } from "date-fns";
import { EllipsisVertical, Trash2, ExternalLink } from "lucide-react";

import { Project } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ProjectCard({ project }: { project: Project }) {
  // API returns 'id', legacy uses '_id' or 'space_id'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projectId = project.id || (project as any)._id || (project as any).space_id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projectTitle = project.title || (project as any).space_id || "Untitled Project";
  const projectLink = `/projects/${projectId}`;
  
  return (
    <div className="text-neutral-200 space-y-4 group cursor-pointer">
      <Link
        href={projectLink}
        className="relative bg-neutral-900 rounded-2xl overflow-hidden h-44 w-full flex items-center justify-end flex-col px-3 border border-neutral-800 hover:border-neutral-700 transition-all"
      >
        {/* Gradient placeholder instead of iframe */}
        {project.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnail}
            alt={projectTitle}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : project.pages && project.pages.length > 0 ? (
          <iframe
            srcDoc={project.pages[0].html}
            title={projectTitle}
            className="absolute inset-0 w-[400%] h-[400%] origin-top-left scale-25 pointer-events-none border-none bg-white"
            tabIndex={-1}
            loading="lazy"
            sandbox="allow-scripts"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
            <div className="text-center px-4">
              <p className="text-2xl font-bold text-neutral-600 line-clamp-2">{projectTitle}</p>
            </div>
          </div>
        )}

        <Button
          variant="default"
          className="w-full transition-all duration-200 translate-y-full group-hover:-translate-y-3 z-10"
        >
          Open project
        </Button>
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-neutral-200 text-base font-semibold line-clamp-1">
            {projectTitle}
          </p>
          <p className="text-sm text-neutral-500">
            Updated{" "}
            {formatDistance(
              new Date(project.updatedAt || Date.now()),
              new Date(),
              {
                addSuffix: true,
              }
            )}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <EllipsisVertical className="text-neutral-400 size-5 hover:text-neutral-300 transition-colors duration-200 cursor-pointer" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuGroup>
              <Link href={projectLink} target="_blank">
                <DropdownMenuItem>
                  <ExternalLink className="size-4 text-neutral-100" />
                  Open in new tab
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem className="text-red-400 focus:text-red-400">
                <Trash2 className="size-4" />
                Delete project
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
