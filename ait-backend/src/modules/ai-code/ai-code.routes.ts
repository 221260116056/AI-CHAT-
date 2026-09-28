import Elysia from "elysia";
import { authMacro } from "@/api/v1/middleware/auth";
import { aiCodeService, CodeAssistDto } from "./ai-code.service";

export const openAiCodeRoutes = new Elysia({ prefix: "/code" })
  .use(authMacro)
  .post(
    "/assist",
    async ({ body, user, set }) => {
      try {
        const dto = CodeAssistDto.parse(body);
        const result = await aiCodeService.assist(user.id, dto);
        return { success: true, data: result };
      } catch (e: any) {
        set.status = 400;
        return { success: false, error: "BadRequest", message: e.message };
      }
    },
    { auth: true }
  );
