import { db } from "@/db";
import { aiChatSession, aiChatMessage } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

// DTOs
export const CreateSessionDto = z.object({
  title: z.string().min(1).max(200).optional().default("New Chat"),
  provider: z.enum(["openai", "anthropic", "google"]).default("openai"),
  model: z.string().default("gpt-4o"),
  systemPrompt: z.string().optional(),
});

export const SendMessageDto = z.object({
  content: z.string().min(1).max(100000),
  images: z.array(z.string()).optional(),
  provider: z.enum(["openai", "anthropic", "google"]).optional(),
  model: z.string().optional(),
});

export type CreateSessionDto = z.infer<typeof CreateSessionDto>;
export type SendMessageDto = z.infer<typeof SendMessageDto>;

// Queries
export const createChatSession = async (userId: string, data: CreateSessionDto) => {
  const [session] = await db.insert(aiChatSession).values({
    id: nanoid(),
    userId,
    title: data.title ?? "New Chat",
    provider: data.provider,
    model: data.model,
    systemPrompt: data.systemPrompt,
  }).returning();
  return session;
};

export const getUserSessions = async (userId: string) => {
  return db.select().from(aiChatSession)
    .where(eq(aiChatSession.userId, userId))
    .orderBy(desc(aiChatSession.updatedAt));
};

export const getSessionById = async (id: string) => {
  const [session] = await db.select().from(aiChatSession)
    .where(eq(aiChatSession.id, id)).limit(1);
  return session ?? null;
};

export const getSessionMessages = async (sessionId: string) => {
  return db.select().from(aiChatMessage)
    .where(eq(aiChatMessage.sessionId, sessionId))
    .orderBy(aiChatMessage.createdAt);
};

export const saveMessage = async (
  sessionId: string,
  role: string,
  content: string,
  metadata?: Record<string, unknown>
) => {
  const [msg] = await db.insert(aiChatMessage).values({
    id: nanoid(),
    sessionId,
    role,
    content,
    metadata,
  }).returning();
  return msg;
};

export const updateSessionTitle = async (id: string, title: string) => {
  await db.update(aiChatSession)
    .set({ title, updatedAt: new Date() })
    .where(eq(aiChatSession.id, id));
};

export const deleteSession = async (id: string) => {
  await db.delete(aiChatSession).where(eq(aiChatSession.id, id));
};

export const deleteMessage = async (messageId: string) => {
  await db.delete(aiChatMessage).where(eq(aiChatMessage.id, messageId));
};

