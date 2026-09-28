import Elysia from "elysia";
import { openAiSummarizerRoutes } from "./ai-summarizer.routes";

export const aiSummarizerModule = new Elysia().use(openAiSummarizerRoutes);
export { aiSummarizerService } from "./ai-summarizer.service";
