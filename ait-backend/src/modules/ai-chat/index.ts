import Elysia from "elysia";
import { openAiChatRoutes, adminAiChatRoutes } from "./ai-chat.routes";

export const aiChatModule = new Elysia()
  .use(openAiChatRoutes)
  .use(adminAiChatRoutes);

export { aiChatService } from "./ai-chat.service";
export * from "./ai-chat.model";
