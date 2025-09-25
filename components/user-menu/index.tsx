import {
  ChartSpline,
  CirclePlus,
  FolderCode,
  Import,
  LogOut,
} from "lucide-react";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";

export const UserMenu = ({ className }: { className?: string }) => {
  const { logout, user } = useUser();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`${className}`}>
          <Avatar className="size-8 mr-1">
            <AvatarImage src={user?.avatarUrl} alt="@shadcn" />
            <AvatarFallback className="text-sm">
              {user?.fullname?.charAt(0).toUpperCase() ?? "E"}
            </AvatarFallback>
          </Avatar>
          <span className="max-lg:hidden">{user?.fullname}</span>
          <span className="lg:hidden">
            {user?.fullname.slice(0, 10)}
            {(user?.fullname?.length ?? 0) > 10 ? "..." : ""}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel className="font-bold flex items-center gap-2 justify-center">
          My Account
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/projects/new">
            <DropdownMenuItem>
              <CirclePlus className="size-4 text-neutral-100" />
              New Project
            </DropdownMenuItem>
          </Link>
          <Link href="/projects">
            <DropdownMenuItem>
              <Import className="size-4 text-neutral-100" />
              Import Project
            </DropdownMenuItem>
          </Link>
          <Link href="/projects">
            <DropdownMenuItem>
              <FolderCode className="size-4 text-neutral-100" />
              View Projects
            </DropdownMenuItem>
          </Link>
          <a href="https://huggingface.co/settings/billing" target="_blank">
            <DropdownMenuItem>
              <ChartSpline className="size-4 text-neutral-100" />
              Usage Quota
            </DropdownMenuItem>
          </a>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            if (confirm("Are you sure you want to log out?")) {
              logout();
            }
          }}
        >
          <Button size="xs" variant="destructive" className="w-full">
            <LogOut className="size-4" />
            Log out
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
