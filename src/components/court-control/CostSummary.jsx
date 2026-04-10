export default function CostSummary({
  courts,
  playersById,
  shuttleCount,
  shuttleCost,
  updateShuttleCount,
  setShuttleCost,
}) {
  const totalRate = courts.reduce(
    (s, c) => s + (c.hourlyRate || 0) * (c.hoursUsed || 0),
    0,
  );
  const totalShuttles = shuttleCount * (shuttleCost || 0);
  const grandTotal = totalRate + totalShuttles;
  const playerCount = Object.keys(playersById).length;
  const perPlayer = playerCount > 0 ? grandTotal / playerCount : 0;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl bg-[#fcf9f1] px-4 py-3 ring-1 ring-emerald-950/8">
      {grandTotal > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <p className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-900">
            Total: ₱{grandTotal.toFixed(2)}
          </p>
          {perPlayer > 0 && (
            <p className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
              ₱{perPlayer.toFixed(2)}/player ({playerCount})
            </p>
          )}
          {totalRate > 0 && totalShuttles > 0 && (
            <p className="text-[11px] text-emerald-900/50">
              (courts ₱{totalRate.toFixed(2)} + shuttles ₱
              {totalShuttles.toFixed(2)})
            </p>
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
  );
}
