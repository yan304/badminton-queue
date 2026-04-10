import { getCurrentTimeLabel } from "../../lib/state";

export default function CourtCard({
  court,
  courtCount,
  liveMatch,
  playersById,
  suggestedMatch,
  startSuggestedMatch,
  finishMatch,
  cancelMatch,
  removeCourt,
  setCourtRate,
}) {
  return (
    <article className="rounded-[1.75rem] border border-emerald-950/10 bg-[linear-gradient(180deg,rgba(252,249,241,1),rgba(247,241,228,1))] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.28em] text-emerald-800/60">
            {court.id}
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-emerald-950">
            {court.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-medium text-white">
            {liveMatch
              ? `Started ${getCurrentTimeLabel(liveMatch.startedAt)}`
              : "Open now"}
          </span>
          {!liveMatch && courtCount > 1 && (
            <button
              type="button"
              onClick={() => removeCourt(court.id)}
              title="Remove court"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-700 transition hover:bg-rose-50"
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
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <label className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.18em] text-emerald-800/50">
          ₱/hr
        </label>
        <input
          type="number"
          min="0"
          step="any"
          value={court.hourlyRate || ""}
          placeholder="0"
          onChange={(e) => setCourtRate(court.id, "hourlyRate", e.target.value)}
          className="w-20 rounded-xl border border-emerald-950/10 bg-white px-3 py-1.5 text-center text-sm font-semibold outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
        />
        <span className="text-emerald-900/30">×</span>
        <input
          type="number"
          min="0"
          step="any"
          value={court.hoursUsed || ""}
          placeholder="0"
          onChange={(e) => setCourtRate(court.id, "hoursUsed", e.target.value)}
          className="w-16 rounded-xl border border-emerald-950/10 bg-white px-3 py-1.5 text-center text-sm font-semibold outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
        />
        <label className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.18em] text-emerald-800/50">
          hrs
        </label>
        {court.hourlyRate > 0 && court.hoursUsed > 0 && (
          <span className="ml-1 text-xs font-medium text-emerald-900/60">
            = ₱{(court.hourlyRate * court.hoursUsed).toFixed(2)}
          </span>
        )}
      </div>

      {liveMatch ? (
        <div className="mt-5 space-y-4">
          {liveMatch.teams.map((team, index) => (
            <div
              key={`court-${court.id}-team-${index + 1}`}
              className="rounded-2xl bg-white px-4 py-4 shadow-[0_8px_20px_rgba(22,51,41,0.06)]"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.22em] text-emerald-900/55">
                    Team {index === 0 ? "A" : "B"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {team.map((playerId) => (
                      <span
                        key={playerId}
                        className="rounded-full bg-[#f8f3e8] px-3 py-1.5 text-sm font-medium text-emerald-950"
                      >
                        {playersById[playerId]?.name}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => finishMatch(court.id, index)}
                  className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600"
                >
                  Won
                </button>
              </div>
            </div>
          ))}

          <p className="text-sm leading-6 text-emerald-900/65">
            {liveMatch.summary}
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-[1.25rem] border border-dashed border-emerald-900/20 px-4 py-10 text-center text-sm text-emerald-900/65">
          Court is empty. Start the recommended matchup when you are ready.
        </div>
      )}

      <div className="mt-5 flex justify-between">
        {" "}
        {!liveMatch && <div></div>}
        {!liveMatch ? (
          <button
            type="button"
            className="rounded-full bg-emerald-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-900/35"
            onClick={() => startSuggestedMatch(court.id)}
            disabled={Boolean(court.currentMatchId) || !suggestedMatch}
          >
            Start recommended match
          </button>
        ) : (
          <button
            type="button"
            className="rounded-full border border-emerald-950/12 px-4 py-2.5 text-sm font-medium text-emerald-900 transition hover:border-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-emerald-950/8 disabled:text-emerald-900/35"
            onClick={() => finishMatch(court.id)}
            disabled={!liveMatch}
          >
            Draw &amp; rotate
          </button>
        )}
        {liveMatch && (
          <button
            type="button"
            className="rounded-full border border-amber-200 px-4 py-2.5 text-sm font-medium text-amber-900 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:border-amber-100 disabled:text-amber-900/35"
            onClick={() => cancelMatch(court.id)}
            disabled={!liveMatch}
          >
            Cancel match
          </button>
        )}
      </div>
    </article>
  );
}
