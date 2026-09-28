import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, streamText, type CoreMessage } from "ai";
import {
  createChatSession,
  getUserSessions,
  getSessionById,
  getSessionMessages,
  saveMessage,
  updateSessionTitle,
  deleteSession,
  deleteMessage,
  type CreateSessionDto,
  type SendMessageDto,
} from "./ai-chat.model";
import { db } from "@/db";
import { aiUsage, aiChatSession } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const MODEL_CONFIGS = {
  openai: {
    models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
    defaultModel: "gpt-4o",
  },
  anthropic: {
    models: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
    defaultModel: "claude-3-5-sonnet-20241022",
  },
  google: {
    models: ["gemini-3.5-flash-lite", "gemini-3.8-flash"],
    defaultModel: "gemini-3.5-flash-lite",
  },
};

function getProvider(provider: string, model: string) {
  switch (provider) {
    case "openai": {
      const m = model && model.startsWith("gpt") ? model : "gpt-4o";
      return createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })(m);
    }
    case "anthropic": {
      const m = model && !model.startsWith("gpt") && !model.startsWith("gemini") ? model : "claude-3-5-sonnet-20241022";
      return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })(m);
    }
    case "google": {
      const m = model && model.startsWith("gemini") ? model : "gemini-3.5-flash-lite";
      return createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY!,
      })(m);
    }
    default: {
      const m = model && model.startsWith("gemini") ? model : "gemini-3.5-flash-lite";
      return createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY!,
      })(m);
    }
  }
}

function formatAiErrorMessage(err: any): string {
  const msg = err?.message || String(err);
  if (msg.includes("credits remaining") || msg.includes("quota") || msg.includes("billing")) {
    return "OpenAI API Error: You have 0 credits remaining on your OpenAI account. Please add billing credits at https://platform.openai.com/settings/organization/billing";
  }
  if (msg.includes("Incorrect API key") || msg.includes("invalid_api_key")) {
    return "OpenAI API Error: Invalid API key. Please check your OPENAI_API_KEY in .env.";
  }
  return `AI Error: ${msg}`;
}

async function logUsage(
  userId: string,
  tool: "chat",
  provider: string,
  model: string,
  usage: { promptTokens: number; completionTokens: number }
) {
  try {
    await db.insert(aiUsage).values({
      id: nanoid(),
      userId,
      tool,
      provider,
      model,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.promptTokens + usage.completionTokens,
    });
  } catch (e) {
    console.error("Failed to log usage:", e);
  }
}

function buildCoreMessages(
  systemPrompt: string | null | undefined,
  history: Array<{ role: string; content: string; metadata?: any }>,
  currentContent: string,
  currentImages?: string[]
): CoreMessage[] {
  const messages: CoreMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  for (const m of history) {
    const role = m.role as "user" | "assistant";
    const msgImgs: string[] = (m.metadata as any)?.images || [];

    if (role === "user" && msgImgs.length > 0) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: m.content || "Attached image" },
          ...msgImgs.map((img) => ({
            type: "image" as const,
            image: img,
          })),
        ],
      });
    } else {
      messages.push({
        role,
        content: m.content,
      });
    }
  }

  if (currentImages && currentImages.length > 0) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: currentContent || "Please describe and analyze this image." },
        ...currentImages.map((img) => ({
          type: "image" as const,
          image: img,
        })),
      ],
    });
  } else {
    messages.push({
      role: "user",
      content: currentContent,
    });
  }

  return messages;
}

export const aiChatService = {
  getAvailableModels() {
    return MODEL_CONFIGS;
  },

  async createSession(userId: string, data: CreateSessionDto) {
    return createChatSession(userId, data);
  },

  async listSessions(userId: string) {
    return getUserSessions(userId);
  },

  async getSessionWithMessages(sessionId: string, userId: string) {
    const session = await getSessionById(sessionId);
    if (!session || session.userId !== userId) throw new Error("Session not found");
    const messages = await getSessionMessages(sessionId);
    return { session, messages };
  },

  async deleteSession(sessionId: string, userId: string) {
    const session = await getSessionById(sessionId);
    if (!session || session.userId !== userId) throw new Error("Session not found");
    await deleteSession(sessionId);
  },

  async deleteMessage(sessionId: string, userId: string, messageId: string) {
    const session = await getSessionById(sessionId);
    if (!session || session.userId !== userId) throw new Error("Session not found");
    await deleteMessage(messageId);
  },

  async renameSession(sessionId: string, userId: string, title: string) {
    const session = await getSessionById(sessionId);
    if (!session || session.userId !== userId) throw new Error("Session not found");
    const cleanTitle = title.trim().slice(0, 100);
    await updateSessionTitle(sessionId, cleanTitle);
    return { id: sessionId, title: cleanTitle };
  },

  async sendMessage(sessionId: string, userId: string, data: SendMessageDto) {
    const session = await getSessionById(sessionId);
    if (!session || session.userId !== userId) throw new Error("Session not found");

    const provider = data.provider ?? session.provider ?? "google";
    const model = data.model ?? (provider === "google" ? "gemini-3.5-flash-lite" : session.model);

    if (data.provider && data.provider !== session.provider) {
      await db.update(aiChatSession)
        .set({ provider, model, updatedAt: new Date() })
        .where(eq(aiChatSession.id, sessionId));
    }

    const history = await getSessionMessages(sessionId);

    // Save user message with optional images in metadata
    await saveMessage(
      sessionId,
      "user",
      data.content,
      data.images?.length ? { images: data.images } : undefined
    );

    // Build messages array
    const messages = buildCoreMessages(session.systemPrompt, history, data.content, data.images);

    try {
      const llm = getProvider(provider, model);
      const result = await generateText({ model: llm, messages });

      // Save assistant response
      await saveMessage(sessionId, "assistant", result.text);

      // Update session title if first exchange
      if (history.length === 0) {
        try {
          const titleResult = await generateText({
            model: llm,
            messages: [
              { role: "user", content: `Generate a short 3-5 word title for this conversation topic: "${data.content}". Reply with only the title, no quotes.` },
            ],
          });
          await updateSessionTitle(sessionId, titleResult.text.trim());
        } catch {
          // fallback title
          await updateSessionTitle(sessionId, data.content.slice(0, 30));
        }
      }

      // Log usage
      await logUsage(userId, "chat", provider, model, {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
      });

      return {
        content: result.text,
        usage: result.usage,
      };
    } catch (err: any) {
      const formatted = formatAiErrorMessage(err);
      await saveMessage(sessionId, "assistant", `⚠️ **Error generating response**\n\n${formatted}`);
      throw new Error(formatted);
    }
  },

  async streamMessage(sessionId: string, userId: string, data: SendMessageDto) {
    const session = await getSessionById(sessionId);
    if (!session || session.userId !== userId) throw new Error("Session not found");

    const history = await getSessionMessages(sessionId);
    const provider = data.provider ?? session.provider ?? "google";
    const model = data.model ?? (provider === "google" ? "gemini-3.5-flash-lite" : session.model);

    if (data.provider && data.provider !== session.provider) {
      await db.update(aiChatSession)
        .set({ provider, model, updatedAt: new Date() })
        .where(eq(aiChatSession.id, sessionId));
    }

    await saveMessage(
      sessionId,
      "user",
      data.content,
      data.images?.length ? { images: data.images } : undefined
    );

    const messages = buildCoreMessages(session.systemPrompt, history, data.content, data.images);

    const llm = getProvider(provider, model);

    // Collect full response to save
    let fullText = "";
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const { textStream, usage } = streamText({ model: llm, messages });

          for await (const chunk of textStream) {
            fullText += chunk;
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ chunk })}\n\n`));
          }
          controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
          controller.close();

          if (fullText) {
            // Save assistant message and log usage after stream
            await saveMessage(sessionId, "assistant", fullText);
            const usageResult = await usage;
            await logUsage(userId, "chat", provider, model, {
              promptTokens: usageResult.promptTokens,
              completionTokens: usageResult.completionTokens,
            });

            // Update title if default title or first message
            if (!session.title || session.title === "New Chat" || history.length <= 1) {
              try {
                const titleResult = await generateText({
                  model: llm,
                  messages: [
                    { role: "user", content: `Generate a concise 2-4 word title for this chat topic: "${data.content}". Reply with only the title text, no quotes or punctuation.` },
                  ],
                });
                const clean = titleResult.text.replace(/["'\n.]/g, "").trim().slice(0, 35);
                if (clean) await updateSessionTitle(sessionId, clean);
              } catch {
                await updateSessionTitle(sessionId, data.content.slice(0, 25));
              }
            }
          }
        } catch (err: any) {
          const errorMsg = formatAiErrorMessage(err);
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`));
          controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
          controller.close();

          // Save error as message so user sees it in chat history
          await saveMessage(sessionId, "assistant", `⚠️ **Error**\n\n${errorMsg}`);
        }
      },
    });

    return stream;
  },
};
