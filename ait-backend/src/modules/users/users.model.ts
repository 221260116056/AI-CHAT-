import { db } from "@/db";
import { user, userProfile } from "@/db/schema";
import { eq, desc, count, ilike, or } from "drizzle-orm";
import { z } from "zod";

// DTOs
export const UpdateUserDto = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(["user", "admin", "moderator", "super_admin"]).optional(),
  banned: z.boolean().optional(),
  banReason: z.string().optional(),
});

export const ListUsersQueryDto = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserDto>;
export type ListUsersQueryDto = z.infer<typeof ListUsersQueryDto>;

// Queries
export const getAllUsers = async (page: number, limit: number, search?: string) => {
  const offset = (page - 1) * limit;

  const query = db.select().from(user);
  if (search) {
    query.where(or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`)));
  }

  const [users, totalResult] = await Promise.all([
    query.limit(limit).offset(offset).orderBy(desc(user.createdAt)),
    db.select({ count: count() }).from(user),
  ]);

  return { users, total: totalResult[0]?.count ?? 0 };
};

export const getUserById = async (id: string) => {
  const [found] = await db.select().from(user).where(eq(user.id, id)).limit(1);
  return found ?? null;
};

export const updateUser = async (id: string, data: UpdateUserDto) => {
  const [updated] = await db
    .update(user)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(user.id, id))
    .returning();
  return updated ?? null;
};

export const deleteUser = async (id: string) => {
  await db.delete(user).where(eq(user.id, id));
};
