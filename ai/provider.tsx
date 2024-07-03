import { auth } from "@/auth";
import { generateId } from "ai";
import { createAI, getAIState } from "ai/rsc";
import { saveChat } from "@/lib/actions/chat";
import type { Chat } from "@/lib/types";
import { submit } from "./actions";
import { getUIStateFromAIState } from "./get-ui-state";
import type { AIState, UIState } from "./types";

// AI is a provider you wrap your application with so you can access AI and UI state in your components.
export const AI = createAI<AIState, UIState>({
  actions: { submit },
  initialAIState: { chatId: generateId(), messages: [] },
  initialUIState: [],
  onGetUIState: async () => {
    "use server";

    const session = await auth();
    if (!session?.user?.id) {
      return;
    }

    const aiState = getAIState();
    if (aiState) {
      return getUIStateFromAIState(aiState as AIState);
    } else {
      return undefined;
    }
  },
  onSetAIState: async ({ state, done }) => {
    "use server";

    const session = await auth();
    if (!session?.user?.id) {
      return;
    }

    // Check if there is any message of type 'answer' in the state messages
    if (!state.messages.some((m) => m.type === "answer")) {
      return undefined;
    }

    const { chatId, messages } = state;
    const createdAt = new Date();
    const userId = session.user.id;
    const path = `/search/${chatId}`;
    const title =
      messages.length > 0
        ? JSON.parse(messages[0].content)?.input?.substring(0, 100) ||
          "Untitled"
        : "Untitled";

    const chat: Chat = {
      id: chatId,
      createdAt,
      userId,
      path,
      title,
      messages: [
        ...messages,
        // Add an 'end' message at the end to determine if the history needs to be reloaded
        {
          id: generateId(),
          role: "assistant",
          content: `end`,
          type: "end",
        },
      ],
    };
    await saveChat(chat);
  },
});
