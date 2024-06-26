import { notFound } from "next/navigation";
import { AI } from "@/ai/provider";
import { Chat } from "@/components/chat";
import { getSharedChat } from "@/lib/actions/chat";

interface SharePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: SharePageProps) {
  const chat = await getSharedChat(params.id);
  return {
    title: chat?.title.toString().slice(0, 50) ?? "Search",
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const chat = await getSharedChat(params.id);

  if (!chat || !chat.sharePath) {
    notFound();
  }

  return (
    <AI
      initialAIState={{
        chatId: chat.id,
        messages: chat.messages,
        isSharePage: true,
      }}
    >
      <Chat id={params.id} />
    </AI>
  );
}
