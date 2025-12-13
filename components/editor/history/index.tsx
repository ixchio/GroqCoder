import { History as HistoryIcon } from "lucide-react";
import { HtmlHistory, Page } from "@/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function History({
  history,
  setPages,
}: {
  history: HtmlHistory[];
  setPages: (pages: Page[]) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="max-lg:hidden">
          <HistoryIcon className="size-4 text-neutral-300" />
          {history?.length} edit{history.length !== 1 ? "s" : ""}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="!rounded-2xl !p-0 overflow-hidden !bg-neutral-900"
        align="start"
      >
        <header className="text-sm px-4 py-3 border-b gap-2 bg-neutral-950 border-neutral-800 font-semibold text-neutral-200">
          History
        </header>
        <main className="px-4 space-y-3">
          <ul className="max-h-[250px] overflow-y-auto">
            {history?.map((item, index) => (
              <li
                key={index}
                className="text-gray-300 text-xs py-2 border-b border-gray-800 last:border-0 flex items-center justify-between gap-2"
              >
                <div className="">
                  <span className="line-clamp-1">{item.prompt}</span>
                  <span className="text-gray-500 text-[10px]">
                    {new Date(item.createdAt).toLocaleDateString("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                      year: "2-digit",
                    }) +
                      " " +
                      new Date(item.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      })}
                  </span>
                </div>
                <Button
                  variant="sky"
                  size="xs"
                  onClick={() => {
                    console.log(item);
                    setPages(item.pages);
                  }}
                >
                  Select
                </Button>
              </li>
            ))}
          </ul>
        </main>
      </PopoverContent>
    </Popover>
  );
}
