"use client";

import Image from "next/image";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface UserMenuProps {
  user: Session["user"];
}

function getUserInitials(name: string) {
  const [firstName, lastName] = name.split(" ");
  return lastName ? `${firstName[0]}${lastName[0]}` : firstName.slice(0, 2);
}

const userContentImageLoader = ({
  src,
  width,
}: {
  src: string;
  width: number;
}) => {
  // githubusercontent
  return `${src}&s=${width}`;
};

export function UserMenu({ user }: UserMenuProps) {
  return (
    <div className="flex items-center justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 rounded-full md:mr-2"
          >
            {user?.image ? (
              <Image
                loader={userContentImageLoader}
                className="select-none rounded-full ring-1 ring-zinc-100/10 transition-opacity duration-300 hover:opacity-80"
                src={user.image ?? ""}
                alt={user.name ?? "Avatar"}
                height={48}
                width={48}
              />
            ) : (
              <div className="flex size-7 shrink-0 select-none items-center justify-center rounded-full bg-muted/50 text-xs font-medium uppercase text-muted-foreground">
                {user?.name ? getUserInitials(user?.name) : null}
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} align="start" className="w-fit">
          <DropdownMenuItem className="flex-col items-start">
            <div className="text-xs font-medium">{user?.name}</div>
            <div className="text-xs text-zinc-500">{user?.email}</div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
