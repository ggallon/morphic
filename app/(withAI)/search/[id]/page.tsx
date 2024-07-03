import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { AI } from "@/ai/provider";
import { Chat } from "@/components/chat";
import { getChat } from "@/lib/actions/chat";

export const maxDuration = 60;

interface SearchIdPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: SearchIdPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    return {};
  }

  const chat = await getChat(params.id, session.user.id);
  return {
    title: chat?.title.toString().slice(0, 50) ?? "Search",
  };
}

export default async function SearchIdPage({ params }: SearchIdPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/chat/${params.id}`);
  }

  const chat = await getChat(params.id, session.user.id);
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
