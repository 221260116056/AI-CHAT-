import { useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import type { User } from "@/types";

const CACHE_KEY = "ait_session_cache";
const CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes

interface CachedSession {
  user: User;
  timestamp: number;
}

function readCache(): CachedSession | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedSession;
    if (Date.now() - parsed.timestamp > CACHE_MAX_AGE) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(user: User) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ user, timestamp: Date.now() }));
}

function clearCache() {
  localStorage.removeItem(CACHE_KEY);
}

export function useAuthWithCache() {
  const { data: session, isPending } = useSession();
  const [cachedUser, setCachedUser] = useState<User | null>(() => readCache()?.user ?? null);
  const [isRevalidating, setIsRevalidating] = useState(true);

  useEffect(() => {
    if (!isPending) {
      setIsRevalidating(false);
      if (session?.user) {
        writeCache(session.user as unknown as User);
        setCachedUser(session.user as unknown as User);
      } else {
        clearCache();
        setCachedUser(null);
      }
    }
  }, [session, isPending]);

  const user = (session?.user as unknown as User | undefined) ?? cachedUser ?? undefined;
  const isAuthenticated = !!user;
  const isLoading = isPending && !cachedUser;

  return { user, isAuthenticated, isLoading, isRevalidating, session };
}
