import { pgTable, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const aiProviderEnum = pgEnum("ai_provider", [
  "openai",
  "anthropic",
  "google",
]);

export const aiChatSession = pgTable("ai_chat_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("New Chat"),
  provider: aiProviderEnum("provider").notNull().default("openai"),
  model: text("model").notNull().default("gpt-4o"),
  systemPrompt: text("system_prompt"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const aiChatMessage = pgTable("ai_chat_messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => aiChatSession.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AiChatSession = typeof aiChatSession.$inferSelect;
export type NewAiChatSession = typeof aiChatSession.$inferInsert;
export type AiChatMessage = typeof aiChatMessage.$inferSelect;
export type NewAiChatMessage = typeof aiChatMessage.$inferInsert;
