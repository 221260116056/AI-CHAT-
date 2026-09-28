import Elysia, { status } from "elysia";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["admin", "moderator", "super_admin"];
const SUPER_ADMIN_ROLES = ["super_admin"];

/**
 * Resolves session from request cookies/headers.
 * Returns null if no session exists.
 */
async function resolveSession(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    return session;
  } catch (err) {
    console.error("resolveSession error:", err);
    return null;
  }
}

/**
 * Auth macro plugin — provides 4 macros that resolve `user` and `session` directly into handler context:
 * - { auth: true }           Requires valid session (401 if missing)
 * - { optionalAuth: true }   Resolves session if present, null otherwise
 * - { adminAuth: true }      Requires admin/moderator/super_admin role
 * - { superAdminAuth: true } Requires super_admin role only
 */
export const authMacro = new Elysia({ name: "auth-macro" })
  .macro({
    auth: {
      async resolve({ request, set }) {
        const session = await resolveSession(request);
        if (!session?.user) {
          set.status = 401;
          throw status(401, { success: false, error: "Unauthorized", message: "Authentication required." });
        }
        return {
          user: session.user,
          session: session.session,
        };
      },
    },

    optionalAuth: {
      async resolve({ request }) {
        const session = await resolveSession(request);
        return {
          user: session?.user ?? null,
          session: session?.session ?? null,
        };
      },
    },

    adminAuth: {
      async resolve({ request, set }) {
        const session = await resolveSession(request);
        if (!session?.user) {
          set.status = 401;
          throw status(401, { success: false, error: "Unauthorized", message: "Authentication required." });
        }
        const role = (session.user as { role?: string }).role ?? "";
        if (!ADMIN_ROLES.includes(role)) {
          set.status = 403;
          throw status(403, { success: false, error: "Forbidden", message: "Admin access required." });
        }
        return {
          user: session.user,
          session: session.session,
        };
      },
    },

    superAdminAuth: {
      async resolve({ request, set }) {
        const session = await resolveSession(request);
        if (!session?.user) {
          set.status = 401;
          throw status(401, { success: false, error: "Unauthorized", message: "Authentication required." });
        }
        const role = (session.user as { role?: string }).role ?? "";
        if (!SUPER_ADMIN_ROLES.includes(role)) {
          set.status = 403;
          throw status(403, { success: false, error: "Forbidden", message: "Super admin access required." });
        }
        return {
          user: session.user,
          session: session.session,
        };
      },
    },
  });
