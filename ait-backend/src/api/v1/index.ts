import Elysia from "elysia";
import { usersModule } from "@/modules/users";
import { aiChatModule } from "@/modules/ai-chat";
import { aiImageModule } from "@/modules/ai-image";
import { aiSummarizerModule } from "@/modules/ai-summarizer";
import { aiCodeModule } from "@/modules/ai-code";
import { aiWritingModule } from "@/modules/ai-writing";

export const v1Routes = new Elysia({ prefix: "/v1" })
  .use(usersModule)
  .use(aiChatModule)
  .use(aiImageModule)
  .use(aiSummarizerModule)
  .use(aiCodeModule)
  .use(aiWritingModule);
