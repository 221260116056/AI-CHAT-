import Elysia from "elysia";
import { cors } from "@elysiajs/cors";

const allowedOrigins = [
  process.env.FRONTEND_URL ?? "http://localhost:5173",
];

export const corsMiddleware = new Elysia({ name: "cors-middleware" }).use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    credentials: true,
    maxAge: 86400,
  })
);
