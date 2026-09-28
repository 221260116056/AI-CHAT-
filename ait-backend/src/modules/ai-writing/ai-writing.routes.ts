import Elysia from "elysia";
import { authMacro } from "@/api/v1/middleware/auth";
import { aiWritingService, WriteContentDto } from "./ai-writing.service";

export const openAiWritingRoutes = new Elysia({ prefix: "/writing" })
  .use(authMacro)
  .post(
    "/generate",
    async ({ body, user, set }) => {
      try {
        const dto = WriteContentDto.parse(body);
        const result = await aiWritingService.generate(user.id, dto);
        return { success: true, data: result };
      } catch (e: any) {
        set.status = 400;
        return { success: false, error: "BadRequest", message: e.message };
      }
    },
    { auth: true }
  );
