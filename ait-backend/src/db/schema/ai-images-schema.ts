import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const imageStatusEnum = pgEnum("image_status", [
  "pending",
  "completed",
  "failed",
]);

export const aiImage = pgTable("ai_images", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  revisedPrompt: text("revised_prompt"),
  imageUrl: text("image_url"),
  model: text("model").notNull().default("dall-e-3"),
  size: text("size").notNull().default("1024x1024"),
  quality: text("quality").notNull().default("standard"),
  status: imageStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AiImage = typeof aiImage.$inferSelect;
export type NewAiImage = typeof aiImage.$inferInsert;
