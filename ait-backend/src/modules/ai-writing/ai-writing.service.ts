import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { aiUsage } from "@/db/schema";
import { nanoid } from "nanoid";

export const WriteContentDto = z.object({
  prompt: z.string().min(10).max(5000),
  type: z.enum(["blog", "email", "social", "product", "essay", "copy", "outline"]).default("blog"),
  tone: z.enum(["professional", "casual", "persuasive", "informative", "funny", "formal"]).default("professional"),
  length: z.enum(["short", "medium", "long"]).default("medium"),
  provider: z.enum(["openai", "anthropic", "google"]).default("openai"),
  model: z.string().default("gpt-4o"),
  context: z.string().optional(),
});

export type WriteContentDto = z.infer<typeof WriteContentDto>;

function getModel(provider: string, model: string) {
  switch (provider) {
    case "anthropic": {
      const m = model && !model.startsWith("gpt") && !model.startsWith("gemini") ? model : "claude-3-5-sonnet-20241022";
      return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })(m);
    }
    case "google": {
      const m = model && model.startsWith("gemini") ? model : "gemini-3.5-flash-lite";
      return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY! })(m);
    }
    default: {
      const m = model && model.startsWith("gpt") ? model : "gpt-4o";
      return createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })(m);
    }
  }
}

const TYPE_PROMPTS: Record<string, string> = {
  blog: "Write a well-structured blog post",
  email: "Write a professional email",
  social: "Write engaging social media content",
  product: "Write compelling product description",
  essay: "Write a structured essay",
  copy: "Write persuasive marketing copy",
  outline: "Create a detailed content outline",
};

const LENGTH_WORDS: Record<string, string> = {
  short: "150-250 words",
  medium: "400-600 words",
  long: "800-1200 words",
};

export const aiWritingService = {
  async generate(userId: string, data: WriteContentDto) {
    const llm = getModel(data.provider, data.model);

    const systemPrompt = `You are an expert content writer. ${TYPE_PROMPTS[data.type]} with a ${data.tone} tone. Target length: ${LENGTH_WORDS[data.length]}.`;

    const userContent = data.context
      ? `Topic/Request: ${data.prompt}\n\nAdditional context: ${data.context}`
      : `Topic/Request: ${data.prompt}`;

    const result = await generateText({
      model: llm,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });

    await db.insert(aiUsage).values({
      id: nanoid(),
      userId,
      tool: "writing",
      provider: data.provider,
      model: data.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      totalTokens: result.usage.promptTokens + result.usage.completionTokens,
    });

    return { content: result.text, usage: result.usage };
  },
};
