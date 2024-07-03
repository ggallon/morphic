import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { IconLogo } from "@/components/ui/icons";
import { HistoryContainer } from "./history-container";
import { ModeToggle } from "./mode-toggle";
import { UserMenu } from "./user-menu";

async function UserOrLogin() {
  const session = await auth();
  return (
    <div className="flex items-center">
      {session?.user ? (
        <UserMenu user={session.user} />
      ) : (
        <Button variant="link" asChild className="-ml-2">
          <Link href="/login">Login</Link>
        </Button>
      )}
    </div>
  );
}

export const Header: React.FC = async () => {
  return (
    <header className="fixed z-10 flex w-full items-center justify-between bg-background/80 p-1 backdrop-blur md:bg-transparent md:p-2 md:backdrop-blur-none">
      <div>
        <a href="/">
          <IconLogo className="h-5 w-5" />
          <span className="sr-only">Morphic</span>
        </a>
      </div>
      <div className="flex gap-0.5">
        <ModeToggle />
        <Suspense fallback={<div className="flex-1 overflow-auto" />}>
          <UserOrLogin />
        </Suspense>
        <HistoryContainer location="header" />
      </div>
    </header>
  );
};
