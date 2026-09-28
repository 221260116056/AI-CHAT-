import Elysia from "elysia";
import { auth } from "@/lib/auth";

export const authController = new Elysia({ name: "auth-controller" })
  .all("/api/auth/*", async ({ request }) => {
    return auth.handler(request);
  });
