import { useCallback, useEffect, useMemo, useState } from "react";
import { STORAGE_KEY } from "../lib/constants";
import { createFreshSessionState } from "../lib/state";
import {
  ACTIVE_SESSION_KEY_PREFIX,
  DEFAULT_SESSION_ENTRY,
  SESSION_LIST_KEY_PREFIX,
  generateSessionCode,
  getSessionSnapshotId,
  normalizeSessionEntry,
} from "../lib/session";
import {
  fetchRemoteSnapshot,
  fetchRemoteSessionsByUser,
  fetchRemoteSnapshotByCode,
  isSupabaseConfigured,
  saveRemoteSnapshot,
} from "../lib/supabase";

export default function useSessionWorkspace(user) {
  const [sessions, setSessions] = useState([DEFAULT_SESSION_ENTRY]);
  const [activeSessionId, setActiveSessionId] = useState("main");
  const [newSessionName, setNewSessionName] = useState("");

  const sessionsStorageKey = user
    ? `${SESSION_LIST_KEY_PREFIX}-${user.id}`
    : null;
  const activeSessionStorageKey = user
    ? `${ACTIVE_SESSION_KEY_PREFIX}-${user.id}`
    : null;

  useEffect(() => {
    if (!user || typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    async function loadSessions() {
      let loadedSessions = [DEFAULT_SESSION_ENTRY];
      try {
        const saved = window.localStorage.getItem(sessionsStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedSessions = parsed
              .map(normalizeSessionEntry)
              .filter((session) => session.id.length > 0);
          }
        }
      } catch {
        loadedSessions = [DEFAULT_SESSION_ENTRY];
      }

      if (!loadedSessions.some((session) => session.id === "main")) {
        loadedSessions = [DEFAULT_SESSION_ENTRY, ...loadedSessions];
      }

      if (isSupabaseConfigured) {
        const { sessions: remoteSessions } = await fetchRemoteSessionsByUser(
          user.id,
        );

        loadedSessions = remoteSessions;

        if (loadedSessions.length === 0) {
          const mainName = "Main";
          const mainId = getSessionSnapshotId(user.id, mainName);
          const code = generateSessionCode(new Set());
          const freshState = createFreshSessionState();

          await saveRemoteSnapshot(
            mainId,
            {
              ...freshState,
              updatedAt: freshState.updatedAt ?? new Date().toISOString(),
            },
            { code, name: mainName },
          );

          loadedSessions = [
            {
              id: mainId,
              name: mainName,
              code,
              remoteSnapshotId: mainId,
            },
          ];
        }
      }

      if (cancelled) return;

      setSessions(loadedSessions);
      const savedActive = window.localStorage.getItem(activeSessionStorageKey);
      setActiveSessionId(
        loadedSessions.some((session) => session.id === savedActive)
          ? String(savedActive)
          : loadedSessions[0].id,
      );
    }

    loadSessions();

    return () => {
      cancelled = true;
    };
  }, [user, sessionsStorageKey, activeSessionStorageKey]);

  useEffect(() => {
    if (!user || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(sessionsStorageKey, JSON.stringify(sessions));
  }, [user, sessionsStorageKey, sessions]);

  useEffect(() => {
    if (!user || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(activeSessionStorageKey, activeSessionId);
  }, [user, activeSessionStorageKey, activeSessionId]);

  useEffect(() => {
    if (!user || sessions.length === 0) {
      return;
    }

    const existingCodes = new Set(
      sessions
        .map((session) => String(session.code || "").toUpperCase())
        .filter(Boolean),
    );

    let changed = false;
    const generatedSessions = sessions.map((session) => {
      if (String(session.code || "").trim()) {
        return session;
      }

      const code = generateSessionCode(existingCodes);
      existingCodes.add(code);
      changed = true;

      return {
        ...session,
        code,
      };
    });

    if (!changed) {
      return;
    }

    setSessions(generatedSessions);

    if (!isSupabaseConfigured) {
      return;
    }

    generatedSessions.forEach((session, index) => {
      const previous = sessions[index];
      const hadCodeBefore = Boolean(String(previous?.code || "").trim());
      if (hadCodeBefore || !session.code || !session.remoteSnapshotId) {
        return;
      }

      void (async () => {
        const { snapshot } = await fetchRemoteSnapshot(
          session.remoteSnapshotId,
        );
        if (!snapshot) {
          return;
        }

        await saveRemoteSnapshot(
          session.remoteSnapshotId,
          {
            ...snapshot,
            updatedAt: new Date().toISOString(),
          },
          {
            code: session.code,
            name: session.name,
          },
        );
      })();
    });
  }, [user, sessions]);

  const activeSession = useMemo(
    () =>
      sessions.find((session) => session.id === activeSessionId) ?? sessions[0],
    [sessions, activeSessionId],
  );

  const activeSessionRegistrationLink = useMemo(() => {
    if (!activeSession?.code || typeof window === "undefined") {
      return null;
    }
    return `${window.location.origin}/register?sessionCode=${activeSession.code}`;
  }, [activeSession]);

  useEffect(() => {
    if (!user || typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    const sessionCode = String(url.searchParams.get("sessionCode") ?? "")
      .trim()
      .toUpperCase();

    if (!sessionCode || sessionCode.length !== 6 || !isSupabaseConfigured) {
      return;
    }

    let cancelled = false;

    async function resolveSessionCode() {
      const existing = sessions.find((session) => session.code === sessionCode);
      if (existing) {
        if (!cancelled) {
          setActiveSessionId(existing.id);
        }
        url.searchParams.delete("sessionCode");
        window.history.replaceState({}, "", url.toString());
        return;
      }

      const {
        error,
        snapshotId,
        name: resolvedName,
      } = await fetchRemoteSnapshotByCode(sessionCode);

      if (cancelled || error || !snapshotId) {
        return;
      }

      const joinedId = `join-${sessionCode.toLowerCase()}`;
      const joinedName = resolvedName
        ? `${resolvedName} (Joined)`
        : `Session ${sessionCode}`;

      setSessions((current) => {
        if (current.some((session) => session.id === joinedId)) {
          return current;
        }
        return [
          ...current,
          {
            id: joinedId,
            name: joinedName,
            code: sessionCode,
            remoteSnapshotId: snapshotId,
          },
        ];
      });
      setActiveSessionId(joinedId);

      url.searchParams.delete("sessionCode");
      window.history.replaceState({}, "", url.toString());
    }

    resolveSessionCode();

    return () => {
      cancelled = true;
    };
  }, [user, sessions]);

  const createSession = useCallback(() => {
    const trimmedName = newSessionName.trim();
    const name = trimmedName || `Session ${sessions.length + 1}`;
    const id = user ? getSessionSnapshotId(user.id, name) : name;
    const existingCodes = new Set(
      sessions.map((session) => String(session.code || "").toUpperCase()),
    );
    const code = generateSessionCode(existingCodes);

    if (typeof window !== "undefined") {
      const sessionStorageKey = user
        ? `${STORAGE_KEY}-${user.id}-${id}`
        : `${STORAGE_KEY}-${id}`;
      const freshState = createFreshSessionState();
      window.localStorage.setItem(
        sessionStorageKey,
        JSON.stringify(freshState),
      );

      if (user && isSupabaseConfigured) {
        const sessionSnapshotId = getSessionSnapshotId(user.id, name);
        void saveRemoteSnapshot(
          sessionSnapshotId,
          {
            ...freshState,
            updatedAt: freshState.updatedAt ?? new Date().toISOString(),
          },
          {
            code,
            name,
          },
        );
      }
    }

    const nextSessions = [
      ...sessions,
      {
        id,
        name,
        code,
        remoteSnapshotId: id,
      },
    ];
    setSessions(nextSessions);
    setActiveSessionId(id);
    setNewSessionName("");
  }, [newSessionName, sessions, user]);

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    newSessionName,
    setNewSessionName,
    activeSession,
    activeSessionRegistrationLink,
    createSession,
  };
}
