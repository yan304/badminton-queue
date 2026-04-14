import { useEffect, useMemo, useState } from "react";
import { createFreshSessionState, normalizeState } from "../lib/state";
import {
  fetchRemoteSnapshot,
  fetchRemoteSnapshotByCode,
  isSupabaseConfigured,
  saveRemoteSnapshot,
  subscribeToSnapshot,
} from "../lib/supabase";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

export default function SessionRegistrationPage({ sessionCode }) {
  const normalizedCode = String(sessionCode ?? "")
    .trim()
    .toUpperCase();
  const [sessionName, setSessionName] = useState("");
  const [snapshotId, setSnapshotId] = useState(null);
  const [appState, setAppState] = useState(() => createFreshSessionState());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", level: "Intermediate" });

  const redirectToHome = () => {
    if (typeof window === "undefined") {
      return;
    }

    window.location.replace("/");
  };

  useEffect(() => {
    if (!normalizedCode) {
      redirectToHome();
      return;
    }

    if (!isSupabaseConfigured) {
      setError(
        "Registration is unavailable because Supabase is not configured.",
      );
      setLoading(false);
      return;
    }

    let disposed = false;
    let unsubscribe = () => {};

    async function hydrate() {
      setLoading(true);
      setError("");

      const {
        snapshot: resolvedSnapshot,
        snapshotId: resolvedSnapshotId,
        name: resolvedName,
        error: codeError,
      } = await fetchRemoteSnapshotByCode(normalizedCode);

      if (disposed) return;

      if (codeError || !resolvedSnapshotId) {
        redirectToHome();
        return;
      }

      const snapshotIdValue = String(resolvedSnapshotId);
      const { snapshot: latestSnapshot, error: latestSnapshotError } =
        await fetchRemoteSnapshot(snapshotIdValue);

      if (disposed) return;

      if (latestSnapshotError) {
        redirectToHome();
        return;
      }

      setSnapshotId(snapshotIdValue);
      setSessionName(String(resolvedName ?? `Session ${normalizedCode}`));
      setAppState(
        normalizeState(
          latestSnapshot ?? resolvedSnapshot ?? createFreshSessionState(),
        ),
      );
      setLoading(false);

      unsubscribe = subscribeToSnapshot(snapshotIdValue, (remoteSnapshot) => {
        setAppState(normalizeState(remoteSnapshot));
      });
    }

    hydrate();

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [normalizedCode]);

  const livePlayerIds = useMemo(
    () =>
      new Set(
        (appState.matchHistory ?? [])
          .filter((match) => match.status === "live")
          .flatMap((match) => match.playerIds),
      ),
    [appState.matchHistory],
  );

  const players = useMemo(
    () => [...(appState.players ?? [])].sort((a, b) => a.id - b.id),
    [appState.players],
  );

  const handleRegister = async (event) => {
    event.preventDefault();
    const name = form.name.trim();

    if (!name || !snapshotId || saving) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { snapshot: latestSnapshot, error: latestError } =
        await fetchRemoteSnapshot(snapshotId);

      if (latestError) {
        setError("Could not load latest session state. Please try again.");
        return;
      }

      const base = normalizeState(latestSnapshot ?? appState);
      const nextId =
        base.players.reduce((maxId, player) => Math.max(maxId, player.id), 0) +
        1;

      const nextState = {
        ...base,
        players: [
          ...base.players,
          {
            id: nextId,
            name,
            level: form.level,
            matchesPlayed: 0,
            wins: 0,
            losses: 0,
          },
        ],
        updatedAt: new Date().toISOString(),
      };

      const { error: saveError } = await saveRemoteSnapshot(
        snapshotId,
        nextState,
        {
          code: normalizedCode,
          name: sessionName || undefined,
        },
      );

      if (saveError) {
        setError("Registration failed. Please try again.");
        return;
      }

      setAppState(nextState);
      setForm((current) => ({ ...current, name: "" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl space-y-4">
        <section className="rounded-[1.8rem] border border-emerald-900/12 bg-white/80 p-6 shadow-[0_20px_60px_rgba(22,51,41,0.08)] backdrop-blur sm:p-8">
          <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.24em] text-emerald-800/65">
            Session Registration
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-emerald-950">
            {sessionName || `Session ${normalizedCode}`}
          </h1>
          <p className="mt-1 text-sm text-emerald-900/65">
            Code: {normalizedCode}
          </p>

          {loading ? (
            <p className="mt-4 text-sm text-emerald-900/65">
              Loading session...
            </p>
          ) : (
            <form
              onSubmit={handleRegister}
              className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]"
            >
              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Your name"
                className="rounded-xl border border-emerald-900/15 bg-white px-3 py-2 text-sm text-emerald-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
              />
              <select
                value={form.level}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    level: event.target.value,
                  }))
                }
                className="rounded-xl border border-emerald-900/15 bg-white px-3 py-2 text-sm text-emerald-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
              >
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={saving || !form.name.trim() || Boolean(error)}
                className="rounded-xl bg-emerald-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-900/35"
              >
                {saving ? "Registering..." : "Register"}
              </button>
            </form>
          )}

          {error ? (
            <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
        </section>

        <section className="rounded-[1.8rem] border border-emerald-900/12 bg-white/80 p-6 shadow-[0_20px_60px_rgba(22,51,41,0.08)] backdrop-blur sm:p-8">
          <h2 className="text-xl font-bold tracking-[-0.02em] text-emerald-950">
            Current Players ({players.length})
          </h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {players.length === 0 ? (
              <p className="text-sm text-emerald-900/60">
                No players registered yet.
              </p>
            ) : (
              players.map((player) => {
                const onCourt = livePlayerIds.has(player.id);
                const waiting = appState.queue.includes(player.id);
                const status = onCourt
                  ? "On court"
                  : waiting
                    ? "Checked in"
                    : "Idle";

                return (
                  <div
                    key={player.id}
                    className="rounded-xl border border-emerald-900/10 bg-[#fcf9f1] px-3 py-2"
                  >
                    <p className="text-sm font-semibold text-emerald-950">
                      {player.name}
                    </p>
                    <p className="text-xs text-emerald-900/65">
                      {player.level} • {status}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
