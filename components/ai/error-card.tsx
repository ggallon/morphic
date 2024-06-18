"use client";

import { useActions, useAIState, useUIState } from "ai/rsc";
import { RefreshCcw } from "lucide-react";
import { AI } from "@/ai/provider";
import type { AIMessage } from "@/ai/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface ErrorCardProps {
  errorMessage: string;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({ errorMessage }) => {
  const [messages, setMessages] = useUIState<typeof AI>();
  const [aiState, setAIState] = useAIState<typeof AI>();
  const { submit } = useActions();

  const handleRetry = async () => {
    // Remove the last message from the UIState
    setMessages(messages.slice(0, -1));

    const aiMessages = aiState.messages;
    // Get the last message with role = user
    const lastUserMessage = [...aiMessages]
      .reverse()
      .find((m) => m.role === "user");

    let retryMessages: AIMessage[] = [];
    // Remove messages after lastUserMessage, cannot identify by id, so process by order
    if (lastUserMessage) {
      const lastUserMessageIndex = aiMessages.findIndex(
        (m) => m === lastUserMessage,
      );
      retryMessages = aiMessages.slice(0, lastUserMessageIndex + 1);
    }
    // Request retry from the server and add the response to the current messages
    const response = await submit(undefined, false, retryMessages);
    setMessages((currentMessages) => [...currentMessages, response]);
  };

  return (
    <Card className="p-4">
      <form
        className="flex flex-col items-center space-y-4"
        action={handleRetry}
      >
        <Label>{errorMessage}</Label>
        <Button size="sm" className="w-fit" type="submit">
          <RefreshCcw size={14} className="mr-1" />
          Retry
        </Button>
      </form>
    </Card>
  );
};
