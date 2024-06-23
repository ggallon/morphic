import { cache } from "react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { AI } from "@/ai/provider";
import { Chat } from "@/components/chat";
import { getChat } from "@/lib/actions/chat";

export const maxDuration = 60;

const getUserChat = cache(async (chatId: string) => {
  const session = await auth();
  const userId = session?.user?.id ?? "anonymous";
  return await getChat(chatId, userId);
});

interface SearchIdPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: SearchIdPageProps) {
  const chat = await getUserChat(params.id);
  return {
    title: chat?.title.toString().slice(0, 50) ?? "Search",
  };
}

export default async function SearchIdPage({ params }: SearchIdPageProps) {
  const chat = await getUserChat(params.id);

  if (!chat) {
    notFound();
  }

  return (
    <AI
      initialAIState={{
        chatId: chat.id,
        messages: chat.messages,
      }}
    >
      <Chat id={params.id} />
    </AI>
  );
}
