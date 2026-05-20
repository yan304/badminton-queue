import { useState } from "react";

export default function SessionWorkspace({
  sessions,
  activeSessionId,
  setActiveSessionId,
  newSessionName,
  setNewSessionName,
  newSessionDate,
  setNewSessionDate,
  newSessionTime,
  setNewSessionTime,
  createSession,
  renameActiveSession,
  rescheduleActiveSession,
  deleteActiveSession,
  activeSession,
  activeSessionRegistrationLink,
  registrationsLocked,
  setRegistrationsLocked,
  canManageRegistrationLock,
}) {
  const [copyState, setCopyState] = useState("idle");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduleInput, setScheduleInput] = useState({ date: "", time: "" });

  const handleScheduleEditStart = () => {
    setScheduleInput({
      date: activeSession?.scheduledDate ?? "",
      time: activeSession?.scheduledTime ?? "",
    });
    setEditingSchedule(true);
  };

  const handleScheduleConfirm = () => {
    rescheduleActiveSession(
      scheduleInput.date.trim(),
      scheduleInput.time.trim(),
    );
    setEditingSchedule(false);
  };

  const handleRenameStart = () => {
    setNameInput(activeSession?.name ?? "");
    setEditingName(true);
  };

  const handleRenameConfirm = () => {
    if (nameInput.trim()) {
      renameActiveSession(nameInput.trim());
    }
    setEditingName(false);
  };

  const formatSessionDateTime = (session) => {
    const date = String(session?.scheduledDate ?? "").trim();
    const time = String(session?.scheduledTime ?? "").trim();

    if (!date && !time) {
      return "";
    }

    if (date && time) {
      return `${date} ${time}`;
    }

    return date || time;
  };

  const activeSessionDateTime = formatSessionDateTime(activeSession);

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
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleRenameConfirm();
                  if (event.key === "Escape") setEditingName(false);
                }}
                autoFocus
                className="min-w-52 rounded-xl border border-emerald-900/15 bg-white px-3 py-2 text-sm font-medium text-emerald-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
              />
              <button
                type="button"
                onClick={handleRenameConfirm}
                className="rounded-xl bg-emerald-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingName(false)}
                className="rounded-xl border border-emerald-900/15 bg-white px-3 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-50"
              >
                Cancel
              </button>
            </div>
          ) : confirmingDelete ? (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-red-700">
                Delete &ldquo;{activeSession?.name}&rdquo;?
              </p>
              <button
                type="button"
                onClick={() => {
                  deleteActiveSession();
                  setConfirmingDelete(false);
                }}
                className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="rounded-xl border border-emerald-900/15 bg-white px-3 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
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
              <button
                type="button"
                onClick={handleRenameStart}
                title="Rename session"
                className="rounded-xl border border-emerald-900/15 bg-white px-2.5 py-2 text-sm text-emerald-700 transition hover:bg-emerald-50"
              >
                ✎
              </button>
              {sessions.length > 1 && (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  title="Delete session"
                  className="rounded-xl border border-red-200 bg-white px-2.5 py-2 text-sm text-red-500 transition hover:bg-red-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
          {editingSchedule ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={scheduleInput.date}
                onChange={(event) =>
                  setScheduleInput((prev) => ({
                    ...prev,
                    date: event.target.value,
                  }))
                }
                className="rounded-xl border border-emerald-900/15 bg-white px-3 py-1.5 text-xs text-emerald-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
              />
              <input
                type="time"
                value={scheduleInput.time}
                onChange={(event) =>
                  setScheduleInput((prev) => ({
                    ...prev,
                    time: event.target.value,
                  }))
                }
                className="rounded-xl border border-emerald-900/15 bg-white px-3 py-1.5 text-xs text-emerald-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
              />
              <button
                type="button"
                onClick={handleScheduleConfirm}
                className="rounded-xl bg-emerald-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-800"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingSchedule(false)}
                className="rounded-xl border border-emerald-900/15 bg-white px-3 py-1.5 text-xs font-medium text-emerald-900 transition hover:bg-emerald-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] text-emerald-900/45">
                {activeSessionDateTime
                  ? `Scheduled: ${activeSessionDateTime}`
                  : "No schedule set"}
              </p>
              <button
                type="button"
                onClick={handleScheduleEditStart}
                title="Edit schedule"
                className="text-[11px] text-emerald-700/60 transition hover:text-emerald-700"
              >
                ✎
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 lg:max-w-md">
          <label className="text-xs font-medium text-emerald-900/70">
            Create new session
          </label>
          <div className="flex flex-col gap-2">
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
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                type="date"
                value={newSessionDate}
                onChange={(event) => setNewSessionDate(event.target.value)}
                className="w-full rounded-xl border border-emerald-900/15 bg-white px-3 py-2 text-sm text-emerald-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
              />
              <input
                type="time"
                value={newSessionTime}
                onChange={(event) => setNewSessionTime(event.target.value)}
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
