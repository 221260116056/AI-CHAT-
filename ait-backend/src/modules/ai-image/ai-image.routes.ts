import Elysia from "elysia";
import { authMacro } from "@/api/v1/middleware/auth";
import { aiImageService } from "./ai-image.service";
import { GenerateImageDto } from "./ai-image.model";

export const openAiImageRoutes = new Elysia({ prefix: "/image" })
  .use(authMacro)
  .get(
    "/",
    async ({ user }) => {
      const images = await aiImageService.listImages(user.id);
      return { success: true, data: images };
    },
    { auth: true }
  )
  .post(
    "/generate",
    async ({ body, user, set }) => {
      try {
        const dto = GenerateImageDto.parse(body);
        const image = await aiImageService.generateImage(user.id, dto);
        return { success: true, data: image };
      } catch (e: any) {
        set.status = 400;
        return { success: false, error: "BadRequest", message: e.message };
      }
    },
    { auth: true }
  )
  .post(
    "/describe",
    async ({ body, set }) => {
      try {
        const { image } = body as { image: string };
        if (!image) {
          set.status = 400;
          return { success: false, error: "BadRequest", message: "Image base64 data is required." };
        }
        const prompt = await aiImageService.describePhoto(image);
        return { success: true, data: { prompt } };
      } catch (e: any) {
        set.status = 400;
        return { success: false, error: "BadRequest", message: e.message };
      }
    },
    { auth: true }
  )
  .delete(
    "/:id",
    async ({ params, user, set }) => {
      try {
        await aiImageService.deleteImage(params.id, user.id);
        return { success: true, message: "Image deleted." };
      } catch (e: any) {
        set.status = 404;
        return { success: false, error: "NotFound", message: e.message };
      }
    },
    { auth: true }
  );

export const adminAiImageRoutes = new Elysia({ prefix: "/admin/image" })
  .use(authMacro)
  .get("/stats", () => ({ success: true, data: { message: "Image stats coming soon." } }), { superAdminAuth: true });
