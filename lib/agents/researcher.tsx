import {
  streamText,
  type CoreMessage,
  type ToolCallPart,
  type ToolResultPart,
} from "ai";
import { createStreamableUI, createStreamableValue } from "ai/rsc";
import { AnswerSection } from "@/components/ai/answer-section";
import { AnswerSectionGenerated } from "@/components/ai/answer-section-generated";
import { getModel } from "@/lib/utils/get-model";
import { getTools } from "./tools";

export async function researcher(
  uiStream: ReturnType<typeof createStreamableUI>,
  streamableText: ReturnType<typeof createStreamableValue<string>>,
  messages: CoreMessage[],
  useSpecificModel?: boolean,
) {
  let fullResponse = "";
  let hasError = false;
  const answerSection = <AnswerSection result={streamableText.value} />;
  const currentDate = new Date().toLocaleString();
  const result = await streamText({
    model: getModel(),
    maxTokens: 2500,
    system: `As a professional search expert, you possess the ability to search for any information on the web.
    or any information on the web.
    For each user query, utilize the search results to their fullest potential to provide additional information and assistance in your response.
    If there are any images relevant to your answer, be sure to include them as well.
    Aim to directly address the user's question, augmenting your response with insights gleaned from the search results.
    Whenever quoting or referencing information from a specific URL, always explicitly cite the source URL using the [[number]](url) format. Multiple citations can be included as needed, e.g., [[number]](url), [[number]](url).
    The number must always match the order of the search results.
    The retrieve tool can only be used with URLs provided by the user. URLs from search results cannot be used.
    If it is a domain instead of a URL, specify it in the include_domains of the search tool.
    Please match the language of the response to the user's language. Current date and time: ${currentDate}`,
    messages,
    tools: getTools({
      uiStream,
      fullResponse,
    }),
    onFinish: (event) => {
      // If the response is generated, update the generated answer section
      // There is a bug where a new instance of the answer section is displayed once when the next section is added
      if (event.text.length > 0) {
        uiStream.update(<AnswerSectionGenerated result={event.text} />);
      }
    },
  }).catch((err) => {
    hasError = true;
    fullResponse = "Error: " + err.message;
    streamableText.update(fullResponse);
  });

  // If the result is not available, return an error response
  if (!result) {
    return { result, fullResponse, hasError, toolResponses: [] };
  }

  // Remove the spinner
  uiStream.update(null);

  // Process the response
  const toolCalls: ToolCallPart[] = [];
  const toolResponses: ToolResultPart[] = [];
  for await (const delta of result.fullStream) {
    switch (delta.type) {
      case "text-delta":
        if (delta.textDelta) {
          // If the first text delta is available, add a UI section
          if (fullResponse.length === 0 && delta.textDelta.length > 0) {
            // Update the UI
            uiStream.update(answerSection);
          }

          fullResponse += delta.textDelta;
          streamableText.update(fullResponse);
        }
        break;
      case "tool-call":
        toolCalls.push(delta);
        break;
      case "tool-result":
        // Append the answer section if the specific model is not used
        if (!useSpecificModel && toolResponses.length === 0 && delta.result) {
          uiStream.append(answerSection);
        }
        if (!delta.result) {
          hasError = true;
        }
        toolResponses.push(delta);
        break;
      case "error":
        console.log("Error: " + delta.error);
        hasError = true;
        fullResponse += `\nError occurred while executing the tool`;
        break;
    }
  }
  messages.push({
    role: "assistant",
    content: [{ type: "text", text: fullResponse }, ...toolCalls],
  });

  if (toolResponses.length > 0) {
    // Add tool responses to the messages
    messages.push({ role: "tool", content: toolResponses });
  }

  return { result, fullResponse, hasError, toolResponses };
}
