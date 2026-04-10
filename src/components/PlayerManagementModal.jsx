import { useEffect, useRef, useState } from "react";
import { levelStyles, statusStyles } from "../lib/constants";

export default function PlayerManagementModal({
  isOpen,
  onClose,
  players,
  getPlayerStatus,
  onCourtIds,
  removeFromQueue,
  addToQueue,
  updatePlayerLevel,
  form,
  setForm,
  handleSubmit,
}) {
  const dialogRef = useRef(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const onAddSubmit = (e) => {
    handleSubmit(e);
    // keep modal open after adding
  };

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-lg rounded-[2rem] border border-emerald-900/10 bg-[#f4eedf] p-0 shadow-[0_32px_100px_rgba(18,52,43,0.25)] backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between border-b border-emerald-950/10 px-6 pt-6 pb-4">
        <div>
          <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.28em] text-emerald-800/65">
            Player Management
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-emerald-950">
            {players.length} checked in
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-950/10 text-emerald-900 transition hover:bg-emerald-50"
        >
          ✕
        </button>
      </div>

      <div className="px-6 pt-4">
        <form
          className="grid gap-3 sm:grid-cols-[1fr_0.8fr_auto]"
          onSubmit={onAddSubmit}
        >
          <input
            className="min-w-0 rounded-2xl border border-emerald-950/10 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
            placeholder="New player name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <select
            className="rounded-2xl border border-emerald-950/10 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
            value={form.level}
            onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
          <button
            type="submit"
            className="rounded-2xl bg-emerald-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800"
          >
            Add
          </button>
        </form>
      </div>

      <div className="px-6 pt-4">
        <input
          className="w-full rounded-2xl border border-emerald-950/10 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="max-h-[50vh] overflow-y-auto px-6 pt-4 pb-6">
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-emerald-900/55">
              No players found.
            </p>
          ) : (
            filtered.map((player) => {
              const status = getPlayerStatus(player.id);
              const isOnCourt = onCourtIds.has(player.id);

              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-2xl border border-emerald-950/8 bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-emerald-950">
                          {player.name}
                        </span>
                        <select
                          value={player.level}
                          onChange={(e) =>
                            updatePlayerLevel(player.id, e.target.value)
                          }
                          className={`cursor-pointer appearance-none rounded-full px-2 py-0.5 pr-5 text-[11px] font-medium ring-1 outline-none ${levelStyles[player.level]} bg-[length:12px] bg-[right_4px_center] bg-no-repeat`}
                          style={{
                            backgroundImage:
                              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z' clip-rule='evenodd'/%3E%3C/svg%3E\")",
                          }}
                        >
                          <option>Beginner</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                        </select>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em] ${statusStyles[status]}`}
                        >
                          {status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-emerald-900/55">
                        {player.matchesPlayed} matches | {player.wins}W-
                        {player.losses}L
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {status === "idle" && (
                      <button
                        type="button"
                        onClick={() => addToQueue(player.id)}
                        className="rounded-full border border-emerald-700/20 px-3 py-1.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-50"
                      >
                        Re-queue
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFromQueue(player.id)}
                      disabled={isOnCourt}
                      title="Remove player"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.519.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </dialog>
  );
}
