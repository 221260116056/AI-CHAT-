import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, type CoreMessage } from "ai";

const PORT = Number(process.env.PORT ?? 3001);
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

const corsHeaders = {
  "Access-Control-Allow-Origin": FRONTEND_URL,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Credentials": "true",
};

function getModel(provider: string, model: string) {
  switch (provider) {
    case "anthropic":
      return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })(model);
    case "google":
      return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })(model);
    default:
      return createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })(model);
  }
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Health check
    if (url.pathname === "/health" && req.method === "GET") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream chat endpoint
    if (url.pathname === "/stream" && req.method === "POST") {
      try {
        const body = await req.json() as {
          messages: CoreMessage[];
          provider?: string;
          model?: string;
          systemPrompt?: string;
        };

        const { messages, provider = "openai", model = "gpt-4o", systemPrompt } = body;
        const llm = getModel(provider, model);

        const allMessages: CoreMessage[] = [
          ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
          ...messages,
        ];

        const result = streamText({ model: llm, messages: allMessages });

        return result.toTextStreamResponse({
          headers: corsHeaders,
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Stream failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  },
});

console.log(`🚀 AI Chat API running at http://localhost:${PORT}`);
