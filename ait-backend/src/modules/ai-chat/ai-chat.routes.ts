import Elysia from "elysia";
import { authMacro } from "@/api/v1/middleware/auth";
import { aiChatService } from "./ai-chat.service";
import { CreateSessionDto, SendMessageDto } from "./ai-chat.model";

export const openAiChatRoutes = new Elysia({ prefix: "/chat" })
  .use(authMacro)
  .get(
    "/models",
    () => ({ success: true, data: aiChatService.getAvailableModels() }),
    { auth: true }
  )
  .get(
    "/sessions",
    async ({ user }) => {
      const userId = user.id;
      const sessions = await aiChatService.listSessions(userId);
      return { success: true, data: sessions };
    },
    { auth: true }
  )
  .post(
    "/sessions",
    async ({ body, user, set }) => {
      try {
        const userId = user.id;
        const dto = CreateSessionDto.parse(body);
        const session = await aiChatService.createSession(userId, dto);
        set.status = 201;
        return { success: true, data: session };
      } catch (e: any) {
        set.status = 400;
        return { success: false, error: "BadRequest", message: e.message };
      }
    },
    { auth: true }
  )
  .get(
    "/sessions/:id",
    async ({ params, user, set }) => {
      try {
        const userId = user.id;
        const data = await aiChatService.getSessionWithMessages(params.id, userId);
        return { success: true, data };
      } catch (e: any) {
        set.status = 404;
        return { success: false, error: "NotFound", message: e.message };
      }
    },
    { auth: true }
  )
  .patch(
    "/sessions/:id",
    async ({ params, body, user, set }) => {
      try {
        const userId = user.id;
        const { title } = body as { title: string };
        if (!title || !title.trim()) {
          set.status = 400;
          return { success: false, error: "BadRequest", message: "Title is required." };
        }
        const updated = await aiChatService.renameSession(params.id, userId, title);
        return { success: true, data: updated };
      } catch (e: any) {
        set.status = 404;
        return { success: false, error: "NotFound", message: e.message };
      }
    },
    { auth: true }
  )
  .delete(
    "/sessions/:id",
    async ({ params, user, set }) => {
      try {
        const userId = user.id;
        await aiChatService.deleteSession(params.id, userId);
        return { success: true, message: "Session deleted." };
      } catch (e: any) {
        set.status = 404;
        return { success: false, error: "NotFound", message: e.message };
      }
    },
    { auth: true }
  )
  .delete(
    "/sessions/:id/messages/:messageId",
    async ({ params, user, set }) => {
      try {
        const userId = user.id;
        await aiChatService.deleteMessage(params.id, userId, params.messageId);
        return { success: true, message: "Message deleted." };
      } catch (e: any) {
        set.status = 404;
        return { success: false, error: "NotFound", message: e.message };
      }
    },
    { auth: true }
  )
  .post(
    "/sessions/:id/messages",
    async ({ params, body, user, set }) => {
      try {
        const userId = user.id;
        const dto = SendMessageDto.parse(body);
        const result = await aiChatService.sendMessage(params.id, userId, dto);
        return { success: true, data: result };
      } catch (e: any) {
        set.status = 400;
        return { success: false, error: "BadRequest", message: e.message };
      }
    },
    { auth: true }
  )
  .post(
    "/sessions/:id/stream",
    async ({ params, body, user, set }) => {
      try {
        const userId = user.id;
        const dto = SendMessageDto.parse(body);
        const stream = await aiChatService.streamMessage(params.id, userId, dto);
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        });
      } catch (e: any) {
        set.status = 400;
        return { success: false, error: "BadRequest", message: e.message };
      }
    },
    { auth: true }
  );

export const adminAiChatRoutes = new Elysia({ prefix: "/admin/chat" })
  .use(authMacro)
  .get(
    "/stats",
    async () => {
      return { success: true, data: { message: "Chat stats coming soon." } };
    },
    { superAdminAuth: true }
  );
