import Elysia from "elysia";
import { openAiCodeRoutes } from "./ai-code.routes";

export const aiCodeModule = new Elysia().use(openAiCodeRoutes);
export { aiCodeService } from "./ai-code.service";
