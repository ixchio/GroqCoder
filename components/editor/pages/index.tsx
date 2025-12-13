import { Page } from "@/types";
import { ListPagesItem } from "./page";

export function ListPages({
  pages,
  currentPage,
  onSelectPage,
  onDeletePage,
}: {
  pages: Array<Page>;
  currentPage: string;
  onSelectPage: (path: string, newPath?: string) => void;
  onNewPage: () => void;
  onDeletePage: (path: string) => void;
}) {
  return (
    <div className="w-full flex items-center justify-start bg-neutral-950 overflow-auto flex-nowrap min-h-[44px]">
      {pages.map((page, i) => (
        <ListPagesItem
          key={i}
          page={page}
          currentPage={currentPage}
          onSelectPage={onSelectPage}
          onDeletePage={onDeletePage}
          index={i}
        />
      ))}
    </div>
  );
}
