"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUIState } from "ai/rsc";
import { ChatMessages } from "./ai/chat-messages";
import { ChatPanel } from "./chat-panel";

interface ChatProps {
  id?: string;
  query?: string;
}

export function Chat({ id, query }: ChatProps) {
  const path = usePathname();
  const [messages] = useUIState();

  useEffect(() => {
    if (
      (!path.includes("search") && messages.length === 1) ||
      (path.includes("/search") && query && messages.length === 1)
    ) {
      window.history.replaceState({}, "", `/search/${id}`);
    }
  }, [id, path, messages, query]);

  return (
    <>
      <ChatMessages messages={messages} />
      <ChatPanel messages={messages} query={query} />
    </>
  );
}
