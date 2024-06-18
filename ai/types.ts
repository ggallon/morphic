import type { StreamableValue } from "ai/rsc";

export interface AIMessage {
  role: "user" | "assistant" | "system" | "function" | "data" | "tool";
  content: string;
  id: string;
  name?: string;
  type?:
    | "answer"
    | "related"
    | "skip"
    | "inquiry"
    | "input"
    | "input_related"
    | "tool"
    | "followup"
    | "end";
}

export interface AIState {
  messages: AIMessage[];
  chatId: string;
  isSharePage?: boolean;
}

export type UIState = {
  id: string;
  component: React.ReactNode;
  isGenerating?: StreamableValue<boolean>;
  isCollapsed?: StreamableValue<boolean>;
}[];
