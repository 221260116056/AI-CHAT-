import Elysia from "elysia";
import { adminUsersRoutes, openUsersRoutes } from "./users.routes";

export const usersModule = new Elysia()
  .use(adminUsersRoutes)
  .use(openUsersRoutes);

export { usersService } from "./users.service";
export * from "./users.model";
