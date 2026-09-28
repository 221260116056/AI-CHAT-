import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { aiUsage } from "@/db/schema";
import { nanoid } from "nanoid";

export const SummarizeDto = z.object({
  text: z.string().min(50).max(100000),
  provider: z.enum(["openai", "anthropic", "google"]).default("openai"),
  model: z.string().default("gpt-4o"),
  style: z.enum(["concise", "detailed", "bullets", "eli5"]).default("concise"),
  language: z.string().default("English"),
});

export const DocumentQADto = z.object({
  document: z.string().min(50).max(100000),
  question: z.string().min(3).max(1000),
  provider: z.enum(["openai", "anthropic", "google"]).default("openai"),
  model: z.string().default("gpt-4o"),
});

export type SummarizeDto = z.infer<typeof SummarizeDto>;
export type DocumentQADto = z.infer<typeof DocumentQADto>;

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

const STYLE_PROMPTS: Record<string, string> = {
  concise: "Provide a concise summary in 2-3 sentences.",
  detailed: "Provide a detailed summary covering all key points.",
  bullets: "Provide a summary as bullet points highlighting the main ideas.",
  eli5: "Explain this text as if I were 5 years old.",
};

export const aiSummarizerService = {
  async summarize(userId: string, data: SummarizeDto) {
    const llm = getModel(data.provider, data.model);
    const stylePrompt = STYLE_PROMPTS[data.style] ?? STYLE_PROMPTS.concise;

    const result = await generateText({
      model: llm,
      messages: [
        {
          role: "system",
          content: `You are an expert summarizer. ${stylePrompt} Respond in ${data.language}.`,
        },
        {
          role: "user",
          content: `Please summarize the following text:\n\n${data.text}`,
        },
      ],
    });

    await db.insert(aiUsage).values({
      id: nanoid(),
      userId,
      tool: "summarizer",
      provider: data.provider,
      model: data.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      totalTokens: result.usage.promptTokens + result.usage.completionTokens,
    });

    return { summary: result.text, usage: result.usage };
  },

  async answerQuestion(userId: string, data: DocumentQADto) {
    const llm = getModel(data.provider, data.model);

    const result = await generateText({
      model: llm,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that answers questions based on provided documents. Only use information from the document to answer.",
        },
        {
          role: "user",
          content: `Document:\n\n${data.document}\n\nQuestion: ${data.question}`,
        },
      ],
    });

    await db.insert(aiUsage).values({
      id: nanoid(),
      userId,
      tool: "summarizer",
      provider: data.provider,
      model: data.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      totalTokens: result.usage.promptTokens + result.usage.completionTokens,
    });

    return { answer: result.text, usage: result.usage };
  },
};
