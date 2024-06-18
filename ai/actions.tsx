"use server";

import { generateId, type CoreMessage, type ToolResultPart } from "ai";
import {
  createStreamableUI,
  createStreamableValue,
  getMutableAIState,
} from "ai/rsc";
import { ErrorCard } from "@/components/error-card";
import { FollowupPanel } from "@/components/followup-panel";
import { Section } from "@/components/section";
import { Spinner } from "@/components/ui/spinner";
import { inquire, querySuggestor, researcher, taskManager } from "@/lib/agents";
import { writer } from "@/lib/agents/writer";
import { transformToolMessages } from "@/lib/utils/get-model";
import type { AIMessage } from "./types";

export async function submit(
  formData?: FormData,
  skip?: boolean,
  retryMessages?: AIMessage[],
) {
  const aiState = getMutableAIState();
  const uiStream = createStreamableUI();
  const isGenerating = createStreamableValue(true);
  const isCollapsed = createStreamableValue(false);

  const aiMessages = [...(retryMessages ?? aiState.get().messages)];
  // Get the messages from the state, filter out the tool messages
  const messages: CoreMessage[] = aiMessages
    .filter(
      (message) =>
        message.role !== "tool" &&
        message.type !== "followup" &&
        message.type !== "related" &&
        message.type !== "end",
    )
    .map((message) => {
      const { role, content } = message;
      return { role, content };
    });

  // goupeiId is used to group the messages for collapse
  const groupeId = generateId();

  const useSpecificAPI = process.env.USE_SPECIFIC_API_FOR_WRITER === "true";
  const maxMessages = useSpecificAPI ? 5 : 10;
  // Limit the number of messages to the maximum
  messages.splice(0, Math.max(messages.length - maxMessages, 0));
  // Get the user input from the form data
  const userInput = skip
    ? `{"action": "skip"}`
    : (formData?.get("input") as string);

  const content = skip
    ? userInput
    : formData
      ? JSON.stringify(Object.fromEntries(formData))
      : null;
  const type = skip
    ? undefined
    : formData?.has("input")
      ? "input"
      : formData?.has("related_query")
        ? "input_related"
        : "inquiry";

  // Add the user message to the state
  if (content) {
    aiState.update({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: generateId(),
          role: "user",
          content,
          type,
        },
      ],
    });
    messages.push({ role: "user", content });
  }

  async function processEvents() {
    let action = { object: { next: "proceed" } };
    // If the user skips the task, we proceed to the search
    if (!skip) {
      action = (await taskManager(messages)) ?? action;
    }

    if (action.object.next === "inquire") {
      // Generate inquiry
      const inquiry = await inquire(uiStream, messages);
      uiStream.done();
      isGenerating.done();
      isCollapsed.done(false);
      aiState.done({
        ...aiState.get(),
        messages: [
          ...aiState.get().messages,
          {
            id: generateId(),
            role: "assistant",
            content: `inquiry: ${inquiry?.question}`,
            type: "inquiry",
          },
        ],
      });
      return;
    }

    // Set the collapsed state to true
    isCollapsed.done(true);

    //  Generate the answer
    let answer = "";
    let toolOutputs: ToolResultPart[] = [];
    let errorOccurred = false;
    const streamText = createStreamableValue<string>();
    uiStream.update(<Spinner />);

    // If useSpecificAPI is enabled, only function calls will be made
    // If not using a tool, this model generates the answer
    while (
      useSpecificAPI
        ? toolOutputs.length === 0 && answer.length === 0
        : answer.length === 0 && !errorOccurred
    ) {
      // Search the web and generate the answer
      const { fullResponse, hasError, toolResponses } = await researcher(
        uiStream,
        streamText,
        messages,
        useSpecificAPI,
      );
      answer = fullResponse;
      toolOutputs = toolResponses;
      errorOccurred = hasError;

      if (toolOutputs.length > 0) {
        toolOutputs.map((output) => {
          aiState.update({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: groupeId,
                role: "tool",
                content: JSON.stringify(output.result),
                name: output.toolName,
                type: "tool",
              },
            ],
          });
        });
      }
    }

    // If useSpecificAPI is enabled, generate the answer using the specific model
    if (useSpecificAPI && answer.length === 0 && !errorOccurred) {
      // modify the messages to be used by the specific model
      const modifiedMessages = transformToolMessages(messages);
      const latestMessages = modifiedMessages.slice(maxMessages * -1);
      const { response, hasError } = await writer(
        uiStream,
        streamText,
        latestMessages,
      );
      answer = response;
      errorOccurred = hasError;
    }

    if (!errorOccurred) {
      let processedMessages = messages;
      const useGoogleProvider = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      // If using Google provider, we need to modify the messages
      if (useGoogleProvider) {
        processedMessages = transformToolMessages(messages);
      }

      streamText.done();
      aiState.update({
        ...aiState.get(),
        messages: [
          ...aiState.get().messages,
          {
            id: groupeId,
            role: "assistant",
            content: answer,
            type: "answer",
          },
        ],
      });

      // Generate related queries
      const relatedQueries = await querySuggestor(uiStream, processedMessages);
      // Add follow-up panel
      uiStream.append(
        <Section title="Follow-up">
          <FollowupPanel />
        </Section>,
      );

      aiState.done({
        ...aiState.get(),
        messages: [
          ...aiState.get().messages,
          {
            id: groupeId,
            role: "assistant",
            content: JSON.stringify(relatedQueries),
            type: "related",
          },
          {
            id: groupeId,
            role: "assistant",
            content: "followup",
            type: "followup",
          },
        ],
      });
    } else {
      aiState.done(aiState.get());
      streamText.done();
      uiStream.append(
        <ErrorCard
          errorMessage={answer || "An error occurred. Please try again."}
        />,
      );
    }

    isGenerating.done(false);
    uiStream.done();
  }

  processEvents();

  return {
    id: generateId(),
    isGenerating: isGenerating.value,
    component: uiStream.value,
    isCollapsed: isCollapsed.value,
  };
}
