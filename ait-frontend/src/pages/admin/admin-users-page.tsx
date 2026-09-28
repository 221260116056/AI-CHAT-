import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminListUsers, adminUpdateUser, adminDeleteUser } from "@/actions/admin/users-actions";
import { Users, Search, Trash2, Ban, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import type { User } from "@/types";

const ROLE_COLORS: Record<string, string> = {
  super_admin: "oklch(0.65 0.22 25)",
  admin: "oklch(0.65 0.25 265)",
  moderator: "oklch(0.70 0.18 145)",
  user: "var(--foreground-muted)",
};

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search],
    queryFn: () => adminListUsers({ page, limit: 20, search: search || undefined }),
  });

  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof adminUpdateUser>[1] }) =>
      adminUpdateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User updated");
    },
    onError: () => toast.error("Failed to update user"),
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => adminDeleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted");
    },
    onError: () => toast.error("Failed to delete user"),
  });

  const users: User[] = data?.data ?? [];
  const pagination = data?.pagination;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function handleRoleChange(user: User, role: string) {
    if (confirm(`Change ${user.name}'s role to ${role}?`)) {
      updateUser.mutate({ id: user.id, data: { role } });
    }
  }

  function handleBan(user: User) {
    const action = user.banned ? "unban" : "ban";
    if (confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${user.name}?`)) {
      updateUser.mutate({ id: user.id, data: { banned: !user.banned } });
    }
  }

  function handleDelete(user: User) {
    if (confirm(`Permanently delete ${user.name}? This cannot be undone.`)) {
      deleteUser.mutate(user.id);
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Users size={20} style={{ color: "var(--primary)" }} />
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Users</h1>
        </div>
        <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
          Manage platform users, roles, and access
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ background: "var(--input)", border: "1px solid var(--input-border)" }}>
          <Search size={16} style={{ color: "var(--foreground-muted)" }} />
          <input
            id="admin-user-search"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: "var(--foreground)" }}
          />
        </div>
        <button type="submit" className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          Search
        </button>
      </form>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--background-secondary)" }}>
                {["Name", "Email", "Role", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Loader2 size={24} className="animate-spin mx-auto" style={{ color: "var(--foreground-muted)" }} />
                  </td>
                </tr>
              )}
              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm" style={{ color: "var(--foreground-muted)" }}>
                    No users found
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium" style={{ color: "var(--foreground)" }}>{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--foreground-muted)" }}>{user.email}</td>
                  <td className="px-4 py-3">
                    <select
                      id={`user-role-${user.id}`}
                      value={user.role}
                      onChange={(e) => handleRoleChange(user, e.target.value)}
                      className="px-2 py-1 rounded-md text-xs font-medium outline-none"
                      style={{
                        background: `${ROLE_COLORS[user.role]}20`,
                        color: ROLE_COLORS[user.role],
                        border: `1px solid ${ROLE_COLORS[user.role]}40`,
                      }}
                    >
                      {["user", "moderator", "admin", "super_admin"].map((r) => (
                        <option key={r} value={r}>{r.replace("_", " ")}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: user.banned ? "oklch(0.65 0.22 25 / 0.15)" : "oklch(0.70 0.18 145 / 0.15)",
                        color: user.banned ? "oklch(0.65 0.22 25)" : "oklch(0.70 0.18 145)",
                      }}>
                      {user.banned ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--foreground-muted)" }}>
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        id={`ban-user-${user.id}`}
                        onClick={() => handleBan(user)}
                        className="p-1.5 rounded-md transition-all hover:opacity-80"
                        style={{ color: user.banned ? "oklch(0.70 0.18 145)" : "oklch(0.78 0.18 70)" }}
                        title={user.banned ? "Unban" : "Ban"}
                      >
                        <Ban size={14} />
                      </button>
                      <button
                        id={`delete-user-${user.id}`}
                        onClick={() => handleDelete(user)}
                        className="p-1.5 rounded-md transition-all hover:opacity-80"
                        style={{ color: "var(--error)" }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
            <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
              {pagination.total} total users
            </span>
            <div className="flex items-center gap-2">
              <button
                id="prev-page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md transition-all disabled:opacity-40"
                style={{ color: "var(--foreground-muted)" }}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs px-2" style={{ color: "var(--foreground)" }}>
                {page} / {pagination.totalPages}
              </span>
              <button
                id="next-page-btn"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="p-1.5 rounded-md transition-all disabled:opacity-40"
                style={{ color: "var(--foreground-muted)" }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
