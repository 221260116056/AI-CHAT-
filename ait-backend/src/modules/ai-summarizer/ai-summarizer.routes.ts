import Elysia from "elysia";
import { authMacro } from "@/api/v1/middleware/auth";
import { aiSummarizerService } from "./ai-summarizer.service";
import { SummarizeDto, DocumentQADto } from "./ai-summarizer.service";

export const openAiSummarizerRoutes = new Elysia({ prefix: "/summarizer" })
  .use(authMacro)
  .post(
    "/summarize",
    async ({ body, user, set }) => {
      try {
        const dto = SummarizeDto.parse(body);
        const result = await aiSummarizerService.summarize(user.id, dto);
        return { success: true, data: result };
      } catch (e: any) {
        set.status = 400;
        return { success: false, error: "BadRequest", message: e.message };
      }
    },
    { auth: true }
  )
  .post(
    "/qa",
    async ({ body, user, set }) => {
      try {
        const dto = DocumentQADto.parse(body);
        const result = await aiSummarizerService.answerQuestion(user.id, dto);
        return { success: true, data: result };
      } catch (e: any) {
        set.status = 400;
        return { success: false, error: "BadRequest", message: e.message };
      }
    },
    { auth: true }
  );
