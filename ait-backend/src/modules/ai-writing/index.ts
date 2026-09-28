import Elysia from "elysia";
import { openAiWritingRoutes } from "./ai-writing.routes";

export const aiWritingModule = new Elysia().use(openAiWritingRoutes);
export { aiWritingService } from "./ai-writing.service";
