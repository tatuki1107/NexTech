"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { ApiError, apiRequest, getAll, errorMessage } from "../_lib/api";
import type { User } from "../_lib/types";
type LoadedSession = {
  user: User;
  savedIds: string[];
  unreadCount: number;
} | null;
type Session = {
  user: User | null;
  loading: boolean;
  error: string;
  savedIds: string[];
  unreadCount: number;
  reload: () => Promise<void>;
  toggleSaved: (id: string) => Promise<void>;
};
const SessionContext = createContext<Session | null>(null);
async function loadSession(): Promise<LoadedSession> {
  try {
    const result = await apiRequest<{ data: User }>("/me");
    const [saved, notifications] = await Promise.all([
      getAll<{ id: string }>("/me/saved-events"),
      apiRequest<{ unreadCount: number }>("/me/notifications?perPage=1"),
    ]);
    return {
      user: result.data,
      savedIds: saved.map((event) => event.id),
      unreadCount: notifications.unreadCount,
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}
export function ParticipantProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const generation = useRef(0);
  const applySession = useCallback((session: LoadedSession) => {
    setUser(session?.user ?? null);
    setSavedIds(session?.savedIds ?? []);
    setUnreadCount(session?.unreadCount ?? 0);
    setError("");
  }, []);
  const reload = useCallback(() => {
    const current = ++generation.current;
    return loadSession()
      .then((session) => {
        if (current === generation.current) applySession(session);
      })
      .catch((error) => {
        if (current === generation.current) setError(errorMessage(error));
      });
  }, [applySession]);
  useEffect(() => {
    let active = true;
    const current = ++generation.current;
    void loadSession()
      .then((session) => {
        if (active && current === generation.current) applySession(session);
      })
      .catch((error) => {
        if (active && current === generation.current)
          setError(errorMessage(error));
      })
      .finally(() => {
        if (active && current === generation.current) setLoading(false);
      });
    const clear = () => {
      generation.current++;
      applySession(null);
      setLoading(false);
    };
    const channel =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel("nextech-session");
    if (channel)
      channel.onmessage = () => {
        applySession(null);
        setLoading(true);
        const current = ++generation.current;
        void loadSession()
          .then((session) => {
            if (active && current === generation.current) applySession(session);
          })
          .catch((error) => {
            if (active && current === generation.current)
              setError(errorMessage(error));
          })
          .finally(() => {
            if (active && current === generation.current) setLoading(false);
          });
      };
    window.addEventListener("nextech-session-expired", clear);
    return () => {
      active = false;
      channel?.close();
      window.removeEventListener("nextech-session-expired", clear);
    };
  }, [applySession]);
  const toggleSaved = async (id: string) => {
    const saved = savedIds.includes(id);
    await apiRequest(`/me/saved-events/${id}`, {
      method: saved ? "DELETE" : "PUT",
    });
    setSavedIds((current) =>
      saved
        ? current.filter((item) => item !== id)
        : [...new Set([...current, id])],
    );
  };
  return (
    <SessionContext.Provider
      value={{
        user,
        loading,
        error,
        savedIds,
        unreadCount,
        reload,
        toggleSaved,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
export function useParticipant() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("ParticipantProvider is required");
  return session;
}
