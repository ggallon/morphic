import { createStreamableValue } from "ai/rsc";
import { AnswerSection } from "@/components/ai/answer-section";
import { CopilotDisplay } from "@/components/ai/copilot-display";
import { FollowupPanel } from "@/components/ai/followup-panel";
import { RetrieveSection } from "@/components/ai/retrieve-section";
import { SearchRelated } from "@/components/ai/search-related";
import { SearchSection } from "@/components/ai/search-section";
import { Section } from "@/components/ai/section";
import { UserMessage } from "@/components/ai/user-message";
import { VideoSearchSection } from "@/components/ai/video-search-section";
import type { AIState } from "./types";

export const getUIStateFromAIState = (aiState: AIState) => {
  const chatId = aiState.chatId;
  const isSharePage = aiState.isSharePage;
  return aiState.messages.flatMap((message, index) => {
    const { role, content, id, type, name } = message;
    if (
      type === undefined ||
      type === "end" ||
      (isSharePage && type === "related") ||
      (isSharePage && type === "followup")
    ) {
      return [];
    }

    switch (role) {
      case "user":
        switch (type) {
          case "input":
          case "input_related":
            const json = JSON.parse(content);
            const value = type === "input" ? json.input : json.related_query;
            return {
              id,
              component: (
                <UserMessage
                  message={value}
                  chatId={chatId}
                  showShare={index === 0 && !isSharePage}
                />
              ),
            };
          case "inquiry":
            return {
              id,
              component: <CopilotDisplay content={content} />,
            };
        }
      case "assistant":
        const answer = createStreamableValue();
        answer.done(content);
        switch (type) {
          case "answer":
            return {
              id,
              component: <AnswerSection result={answer.value} />,
            };
          case "related":
            const relatedQueries = createStreamableValue();
            relatedQueries.done(JSON.parse(content));
            return {
              id,
              component: (
                <Section title="Related" separator={true}>
                  <SearchRelated relatedQueries={relatedQueries.value} />
                </Section>
              ),
            };
          case "followup":
            return {
              id,
              component: (
                <Section title="Follow-up" className="pb-8">
                  <FollowupPanel />
                </Section>
              ),
            };
        }
      case "tool":
        try {
          const toolOutput = JSON.parse(content);
          const isCollapsed = createStreamableValue();
          isCollapsed.done(true);
          const searchResults = createStreamableValue();
          searchResults.done(JSON.stringify(toolOutput));
          switch (name) {
            case "search":
              return {
                id,
                component: <SearchSection result={searchResults.value} />,
                isCollapsed: isCollapsed.value,
              };
            case "retrieve":
              return {
                id,
                component: <RetrieveSection data={toolOutput} />,
                isCollapsed: isCollapsed.value,
              };
            case "videoSearch":
              return {
                id,
                component: <VideoSearchSection result={searchResults.value} />,
                isCollapsed: isCollapsed.value,
              };
          }
        } catch (error) {
          return { id, component: null };
        }
      default:
        return { id, component: null };
    }
  });
};
