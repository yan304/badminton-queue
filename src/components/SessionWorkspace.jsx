import { useState } from "react";

export default function SessionWorkspace({
  sessions,
  activeSessionId,
  setActiveSessionId,
  newSessionName,
  setNewSessionName,
  createSession,
  activeSession,
  activeSessionRegistrationLink,
  registrationsLocked,
  setRegistrationsLocked,
  canManageRegistrationLock,
}) {
  const [copyState, setCopyState] = useState("idle");

  const copyRegistrationLink = async () => {
    if (!activeSessionRegistrationLink || !navigator?.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(activeSessionRegistrationLink);
      setCopyState("copied");
      window.setTimeout(() => {
        setCopyState("idle");
      }, 1600);
    } catch {
      setCopyState("failed");
      window.setTimeout(() => {
        setCopyState("idle");
      }, 1600);
    }
  };

  return (
    <section className="rise-in rounded-[1.6rem] border border-emerald-900/10 bg-white/80 p-4 shadow-[0_10px_30px_rgba(22,51,41,0.06)] backdrop-blur sm:p-5">
      <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.24em] text-emerald-800/65">
        Session Workspace
      </p>
      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-emerald-900/70">
            Active session
          </label>
          <select
            value={activeSessionId}
            onChange={(event) => setActiveSessionId(event.target.value)}
            className="min-w-52 rounded-xl border border-emerald-900/15 bg-white px-3 py-2 text-sm font-medium text-emerald-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
          >
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-1 flex-col gap-1 lg:max-w-md">
          <label className="text-xs font-medium text-emerald-900/70">
            Create new session
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSessionName}
              onChange={(event) => setNewSessionName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  createSession();
                }
              }}
              placeholder="Example: Friday Night Ladder"
              className="w-full rounded-xl border border-emerald-900/15 bg-white px-3 py-2 text-sm text-emerald-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
            />
            <button
              type="button"
              onClick={createSession}
              className="rounded-xl bg-emerald-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
            >
              New
            </button>
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-emerald-900/55">
        Session "{activeSession?.name ?? "Main"}" has isolated queue, courts,
        pairing mode, and notes from your other sessions.
      </p>
      <p className="mt-1 text-xs text-emerald-900/45">
        Every new session starts with a fresh player/check-in set.
      </p>
      {activeSession?.code ? (
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-emerald-900/60">
          <span>
            Registration link:{" "}
            <a
              href={activeSessionRegistrationLink ?? "#"}
              className="font-semibold text-emerald-800 underline decoration-emerald-700/40 underline-offset-2"
            >
              {activeSessionRegistrationLink}
            </a>{" "}
            (Code: {activeSession.code})
          </span>
          <button
            type="button"
            onClick={copyRegistrationLink}
            className="rounded-full border border-emerald-900/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-900 transition hover:bg-emerald-50"
          >
            {copyState === "copied"
              ? "Copied!"
              : copyState === "failed"
                ? "Try again"
                : "Copy"}
          </button>
          {canManageRegistrationLock ? (
            <button
              type="button"
              onClick={() => setRegistrationsLocked(!registrationsLocked)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                registrationsLocked
                  ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                  : "border-emerald-900/15 bg-white text-emerald-900 hover:bg-emerald-50"
              }`}
            >
              {registrationsLocked
                ? "Unlock registrations"
                : "Lock registrations"}
            </button>
          ) : null}
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              registrationsLocked
                ? "bg-amber-100 text-amber-900"
                : "bg-emerald-100 text-emerald-900"
            }`}
          >
            {registrationsLocked ? "Registration closed" : "Registration open"}
          </span>
        </div>
      ) : null}
    </section>
  );
}
