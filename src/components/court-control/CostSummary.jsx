import { useRef, useState } from "react";

export default function CostSummary({
  courts,
  playersById,
  completedMatches,
  shuttleCount,
  shuttleCost,
  updateShuttleCount,
  setShuttleCost,
}) {
  const dialogRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [splitMode, setSplitMode] = useState("per-player");

  const totalRate = courts.reduce(
    (s, c) => s + (c.hourlyRate || 0) * (c.hoursUsed || 0),
    0,
  );
  const totalShuttles = shuttleCount * (shuttleCost || 0);
  const grandTotal = totalRate + totalShuttles;

  const players = Object.values(playersById);
  const playerCount = players.length;
  const perPlayer = playerCount > 0 ? grandTotal / playerCount : 0;

  const finishedGames = (completedMatches ?? []).filter(
    (m) => m.status === "finished",
  ).length;
  const costPerGame = finishedGames > 0 ? grandTotal / finishedGames : 0;

  const payables = players
    .map((p) => ({
      id: p.id,
      name: p.name,
      gamesPlayed: p.matchesPlayed ?? 0,
      amount:
        splitMode === "per-game"
          ? costPerGame * (p.matchesPlayed ?? 0)
          : perPlayer,
    }))
    .sort(
      (a, b) =>
        b.amount - a.amount || String(a.name).localeCompare(String(b.name)),
    );

  const openModal = () => {
    setOpen(true);
    dialogRef.current?.showModal();
  };

  const closeModal = () => {
    setOpen(false);
    dialogRef.current?.close();
  };

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl bg-[#fcf9f1] px-4 py-3 ring-1 ring-emerald-950/8">
        {grandTotal > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <p className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-900">
              Total: ₱{grandTotal.toFixed(2)}
            </p>
            {splitMode === "per-player" && perPlayer > 0 && (
              <p className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
                ₱{perPlayer.toFixed(2)}/player ({playerCount})
              </p>
            )}
            {splitMode === "per-game" && costPerGame > 0 && (
              <p className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
                ₱{costPerGame.toFixed(2)}/game × games played
              </p>
            )}
            {totalRate > 0 && totalShuttles > 0 && (
              <p className="text-[11px] text-emerald-900/50">
                (courts ₱{totalRate.toFixed(2)} + shuttles ₱
                {totalShuttles.toFixed(2)})
              </p>
            )}
            <div className="flex items-center gap-0.5 rounded-full border border-emerald-900/12 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setSplitMode("per-player")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  splitMode === "per-player"
                    ? "bg-emerald-900 text-white"
                    : "text-emerald-900 hover:bg-emerald-50"
                }`}
              >
                Equal split
              </button>
              <button
                type="button"
                onClick={() => setSplitMode("per-game")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  splitMode === "per-game"
                    ? "bg-emerald-900 text-white"
                    : "text-emerald-900 hover:bg-emerald-50"
                }`}
              >
                Per game
              </button>
            </div>
            {playerCount > 0 && (
              <button
                type="button"
                onClick={openModal}
                className="rounded-full border border-emerald-900/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-900 transition hover:bg-emerald-50"
              >
                View breakdown
              </button>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <label className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.2em] text-emerald-900/55">
            Shuttles
          </label>
          <button
            type="button"
            onClick={() => updateShuttleCount(-1)}
            disabled={shuttleCount <= 0}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-950/12 text-emerald-900 transition hover:bg-emerald-50 disabled:opacity-35"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <span className="min-w-[2rem] text-center text-lg font-bold text-emerald-950">
            {shuttleCount}
          </span>
          <button
            type="button"
            onClick={() => updateShuttleCount(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-950/12 text-emerald-900 transition hover:bg-emerald-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
          </button>
          <span className="mx-1 text-emerald-900/30">×</span>
          <label className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.18em] text-emerald-900/55">
            ₱
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={shuttleCost || ""}
            placeholder="0"
            onChange={(e) => setShuttleCost(e.target.value)}
            className="w-20 rounded-xl border border-emerald-950/10 bg-white px-3 py-1.5 text-center text-sm font-semibold outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
          />
        </div>
      </div>

      {/* Payables breakdown modal */}
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="fixed inset-0 z-50 m-auto w-full max-w-md rounded-[2rem] border border-emerald-900/10 bg-[#f4eedf] p-0 shadow-[0_30px_80px_rgba(22,51,41,0.25)] backdrop:bg-black/40"
      >
        {open && (
          <div className="flex max-h-[80vh] flex-col p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.28em] text-emerald-800/65">
                  Cost Breakdown
                </p>
                <p className="mt-1 text-sm text-emerald-900/55">
                  Total ₱{grandTotal.toFixed(2)} ·{" "}
                  {splitMode === "per-game"
                    ? `₱${costPerGame.toFixed(2)}/game × games played`
                    : `₱${perPlayer.toFixed(2)} each (${playerCount} players)`}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-emerald-900/50 transition hover:bg-emerald-900/8 hover:text-emerald-900"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            <div className="mt-3 flex items-center gap-0.5 self-start rounded-full border border-emerald-900/12 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setSplitMode("per-player")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  splitMode === "per-player"
                    ? "bg-emerald-900 text-white"
                    : "text-emerald-900 hover:bg-emerald-50"
                }`}
              >
                Equal split
              </button>
              <button
                type="button"
                onClick={() => setSplitMode("per-game")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  splitMode === "per-game"
                    ? "bg-emerald-900 text-white"
                    : "text-emerald-900 hover:bg-emerald-50"
                }`}
              >
                Per game
              </button>
            </div>

            {splitMode === "per-game" && finishedGames === 0 && (
              <p className="mt-4 text-sm text-emerald-900/50">
                No finished games yet — finish some matches to calculate
                per-game cost.
              </p>
            )}

            <div className="scrollbar-hide -mx-6 mt-4 flex-1 overflow-y-auto px-6">
              {payables.length === 0 ? (
                <p className="text-sm text-emerald-900/50">No players yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* Header row */}
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-900/45">
                    <span>Player</span>
                    {splitMode === "per-game" && (
                      <span className="text-right">Games</span>
                    )}
                    <span className="text-right">Owes</span>
                  </div>
                  {payables.map((entry) => (
                    <div
                      key={entry.id}
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 rounded-xl bg-white/70 px-3 py-2.5"
                    >
                      <span className="truncate text-sm font-medium text-emerald-950">
                        {entry.name}
                      </span>
                      {splitMode === "per-game" && (
                        <span className="text-right text-xs text-emerald-900/55">
                          {entry.gamesPlayed}×
                        </span>
                      )}
                      <span className="text-right text-sm font-bold text-emerald-900">
                        ₱{entry.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="mt-1 flex items-center justify-between rounded-xl bg-emerald-100 px-3 py-2.5">
                    <span className="text-xs font-semibold text-emerald-900">
                      Grand total
                    </span>
                    <span className="text-sm font-bold text-emerald-900">
                      ₱{grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
