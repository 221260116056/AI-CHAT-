import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { aiUsage } from "@/db/schema";
import { nanoid } from "nanoid";

export const CodeAssistDto = z.object({
  code: z.string().max(50000).optional(),
  prompt: z.string().min(3).max(5000),
  language: z.string().default(""),
  task: z.enum(["generate", "explain", "debug", "refactor", "review", "test"]).default("generate"),
  provider: z.enum(["openai", "anthropic", "google"]).default("openai"),
  model: z.string().default("gpt-4o"),
});

export type CodeAssistDto = z.infer<typeof CodeAssistDto>;

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

const TASK_SYSTEM_PROMPTS: Record<string, string> = {
  generate: "You are an expert programmer. Generate clean, well-commented code based on the user's request. Include only the code and brief explanations.",
  explain: "You are an expert programmer. Explain the provided code clearly, step by step.",
  debug: "You are an expert debugger. Identify bugs in the provided code and provide fixed versions with explanations.",
  refactor: "You are an expert programmer. Refactor the provided code to be cleaner, more efficient, and follow best practices.",
  review: "You are a senior code reviewer. Review the provided code for issues, bugs, performance, security, and style.",
  test: "You are a testing expert. Write comprehensive unit tests for the provided code.",
};

export const aiCodeService = {
  async assist(userId: string, data: CodeAssistDto) {
    const llm = getModel(data.provider, data.model);
    const systemPrompt = TASK_SYSTEM_PROMPTS[data.task];

    const userContent = data.code
      ? `Task: ${data.prompt}\n\nLanguage: ${data.language || "auto-detect"}\n\nCode:\n\`\`\`\n${data.code}\n\`\`\``
      : `Task: ${data.prompt}\n\nLanguage: ${data.language || "auto-detect"}`;

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
      tool: "code",
      provider: data.provider,
      model: data.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      totalTokens: result.usage.promptTokens + result.usage.completionTokens,
    });

    return { result: result.text, usage: result.usage };
  },
};
