import Elysia, { t } from "elysia";
import { authMacro } from "@/api/v1/middleware/auth";
import { usersService } from "./users.service";
import { UpdateUserDto, ListUsersQueryDto } from "./users.model";

// Admin routes: /v1/admin/users
export const adminUsersRoutes = new Elysia({ prefix: "/admin/users" })
  .use(authMacro)
  .get(
    "/",
    async ({ query }) => {
      const { page, limit, search } = ListUsersQueryDto.parse(query);
      const result = await usersService.listUsers(page, limit, search);
      return { success: true, ...result };
    },
    { superAdminAuth: true, query: t.Object({ page: t.Optional(t.String()), limit: t.Optional(t.String()), search: t.Optional(t.String()) }) }
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      try {
        const user = await usersService.getUser(params.id);
        return { success: true, data: user };
      } catch (e: any) {
        set.status = 404;
        return { success: false, error: "NotFound", message: e.message };
      }
    },
    { superAdminAuth: true }
  )
  .patch(
    "/:id",
    async ({ params, body, set }) => {
      try {
        const updated = await usersService.updateUser(params.id, body as UpdateUserDto);
        return { success: true, data: updated };
      } catch (e: any) {
        set.status = 404;
        return { success: false, error: "NotFound", message: e.message };
      }
    },
    { superAdminAuth: true }
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      try {
        await usersService.deleteUser(params.id);
        return { success: true, message: "User deleted successfully." };
      } catch (e: any) {
        set.status = 404;
        return { success: false, error: "NotFound", message: e.message };
      }
    },
    { superAdminAuth: true }
  );

// Open routes: /v1/users
export const openUsersRoutes = new Elysia({ prefix: "/users" })
  .use(authMacro)
  .get(
    "/me",
    ({ user }) => {
      return { success: true, data: user };
    },
    { auth: true }
  );
