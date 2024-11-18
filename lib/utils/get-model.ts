import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { CoreMessage } from "ai";

export function getModel() {
  const openaiApiBase = process.env.OPENAI_API_BASE;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const openaiApiModel = process.env.OPENAI_API_MODEL || "gpt-4o";
  const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!openaiApiKey && !googleApiKey) {
    throw new Error("Missing environment variables for OpenAI, or Google");
  }

  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return google("models/gemini-1.5-pro-latest");
  }

  // Fallback to OpenAI instead
  const openai = createOpenAI({
    baseURL: openaiApiBase, // optional base URL for proxies etc.
    apiKey: openaiApiKey, // optional API key, default to env property OPENAI_API_KEY
    organization: "", // optional organization
  });

  return openai.chat(openaiApiModel);
}

/**
 * Takes an array of AIMessage and modifies each message where the role is 'tool'.
 * Changes the role to 'assistant' and converts the content to a JSON string.
 * Returns the modified messages as an array of CoreMessage.
 *
 * @param aiMessages - Array of AIMessage
 * @returns modifiedMessages - Array of modified messages
 */
export function transformToolMessages(messages: CoreMessage[]): CoreMessage[] {
  return messages.map((message) =>
    message.role === "tool"
      ? {
          ...message,
          role: "assistant",
          content: JSON.stringify(message.content),
          type: "tool",
        }
      : message,
  ) as CoreMessage[];
}
