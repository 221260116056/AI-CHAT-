import { db } from "@/db";
import { aiImage } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

export const GenerateImageDto = z.object({
  prompt: z.string().min(1).max(4000),
  model: z.string().default("flux"),
  size: z.string().default("1024x1024"),
  quality: z.enum(["standard", "hd"]).default("standard"),
  style: z.string().optional(),
  negativePrompt: z.string().optional(),
  seed: z.number().optional(),
  localEndpoint: z.string().optional(),
  initImage: z.string().optional(),
  denoisingStrength: z.number().min(0).max(1).optional(),
});

export type GenerateImageDto = z.infer<typeof GenerateImageDto>;

export const createImageRecord = async (userId: string, data: GenerateImageDto) => {
  const [record] = await db.insert(aiImage).values({
    id: nanoid(),
    userId,
    prompt: data.prompt,
    model: data.model,
    size: data.size,
    quality: data.quality,
    status: "pending",
  }).returning();
  return record;
};

export const updateImageRecord = async (
  id: string,
  updates: { imageUrl?: string; revisedPrompt?: string; status: "completed" | "failed" }
) => {
  const [record] = await db.update(aiImage).set(updates).where(eq(aiImage.id, id)).returning();
  return record;
};

export const getUserImages = async (userId: string) => {
  return db.select().from(aiImage)
    .where(eq(aiImage.userId, userId))
    .orderBy(desc(aiImage.createdAt));
};

export const deleteImage = async (id: string) => {
  await db.delete(aiImage).where(eq(aiImage.id, id));
};
