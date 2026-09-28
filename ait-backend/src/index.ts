import Elysia from "elysia";
import { swagger } from "@elysiajs/swagger";
import { corsMiddleware } from "@/middleware/cors-middleware";
import { errorHandler } from "@/middleware/error-handler";
import { authController } from "@/controllers/auth-controller";
import { v1Routes } from "@/api/v1";

const PORT = Number(process.env.PORT ?? 3000);

const app = new Elysia()
  // === MIDDLEWARE ===
  .use(corsMiddleware)
  .use(
    swagger({
      documentation: {
        info: {
          title: "AI Tools API",
          version: "1.0.0",
          description: "Internal AI Tools Platform — API Documentation",
        },
        tags: [
          { name: "Health", description: "Health check endpoints" },
          { name: "Auth", description: "Authentication (Better Auth)" },
          { name: "Users", description: "User management" },
          { name: "Chat", description: "AI Chat" },
          { name: "Image", description: "AI Image Generation" },
          { name: "Summarizer", description: "AI Text Summarizer & Document Q&A" },
          { name: "Code", description: "AI Code Assistant" },
          { name: "Writing", description: "AI Writing Generator" },
        ],
      },
      path: "/docs",
    })
  )

  // === CORE ROUTES ===
  .get("/", () => ({
    success: true,
    data: {
      name: "AIT API",
      version: "1.0.0",
      docs: "/docs",
    },
  }))
  .get("/health", () => ({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  }))

  // === AUTHENTICATION ===
  // /api/auth/* — Better Auth routes
  .use(authController)

  // === API ROUTES ===
  // /v1/* — Main API endpoints
  .use(v1Routes)

  // === ERROR HANDLING ===
  .use(errorHandler)

  .listen(PORT);

console.log(`🚀 AIT API running at http://localhost:${PORT}`);
console.log(`📚 API Docs available at http://localhost:${PORT}/docs`);

export type App = typeof app;
