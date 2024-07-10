"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Redis } from "@upstash/redis";
import type { Chat } from "@/lib/types";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

export async function getChats(userId?: string | null) {
  if (!userId) {
    return [];
  }

  try {
    const pipeline = redis.pipeline();
    const chats = await redis.zrange<string[]>(`user:chat:${userId}`, 0, -1, {
      rev: true,
    });

    for (const chat of chats) {
      pipeline.hgetall<Chat>(chat);
    }

    return await pipeline.exec<Chat[]>();
  } catch (error) {
    return [];
  }
}

export async function getChat(id: string, userId: string) {
  const chat = await redis.hgetall<Chat>(`chat:${id}`);
  if (String(chat?.userId) !== userId) {
    return null;
  }

  return chat;
}

export async function clearChats(): Promise<void | { error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: "Unauthorized",
    };
  }

  const userId = session.user.id;
  const chats: string[] = await redis.zrange(`user:chat:${userId}`, 0, -1);
  if (!chats.length) {
    return { error: "No chats to clear" };
  }
  const pipeline = redis.pipeline();

  for (const chat of chats) {
    pipeline.del(chat);
    pipeline.zrem(`user:chat:${userId}`, chat);
  }

  await pipeline.exec();

  revalidatePath("/");
  redirect("/");
}

export async function saveChat(chat: Chat) {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: "Unauthorized",
    };
  }

  const pipeline = redis.pipeline();
  pipeline.hmset(`chat:${chat.id}`, chat);
  pipeline.zadd(`user:chat:${chat.userId}`, {
    score: Date.now(),
    member: `chat:${chat.id}`,
  });
  await pipeline.exec();
}

export async function getSharedChat(id: string) {
  const chat = await redis.hgetall<Chat>(`chat:${id}`);

  if (!chat || !chat.sharePath) {
    return null;
  }

  return chat;
}

export async function shareChat(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      data: null,
      error: "Unauthorized",
    };
  }

  const chat = await redis.hgetall<Chat>(`chat:${id}`);
  if (!chat || chat.userId !== session.user.id) {
    return {
      data: null,
      error: "Something went wrong",
    };
  }

  const data: Chat = {
    ...chat,
    sharePath: `/share/${chat.id}`,
  };

  await redis.hmset(`chat:${chat.id}`, data);

  return {
    data,
    error: null,
  };
}
