import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  type UpdateUserDto,
} from "./users.model";

export const usersService = {
  async listUsers(page: number, limit: number, search?: string) {
    const { users, total } = await getAllUsers(page, limit, search);
    const totalPages = Math.ceil(total / limit);
    return {
      users,
      pagination: { page, limit, total, totalPages },
    };
  },

  async getUser(id: string) {
    const user = await getUserById(id);
    if (!user) throw new Error("User not found");
    return user;
  },

  async updateUser(id: string, data: UpdateUserDto) {
    const user = await getUserById(id);
    if (!user) throw new Error("User not found");
    const updated = await updateUser(id, data);
    return updated;
  },

  async deleteUser(id: string) {
    const user = await getUserById(id);
    if (!user) throw new Error("User not found");
    await deleteUser(id);
  },
};
