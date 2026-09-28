import Elysia from "elysia";
import { openAiImageRoutes, adminAiImageRoutes } from "./ai-image.routes";

export const aiImageModule = new Elysia()
  .use(openAiImageRoutes)
  .use(adminAiImageRoutes);

export { aiImageService } from "./ai-image.service";
export * from "./ai-image.model";
