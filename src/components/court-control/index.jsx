import CostSummary from "./CostSummary";
import CourtCard from "./CourtCard";

export default function CourtControl({
  courts,
  liveMatchesById,
  playersById,
  suggestedMatch,
  totalMatchesPlayed,
  shuttleCount,
  shuttleCost,
  startSuggestedMatch,
  finishMatch,
  cancelMatch,
  addCourt,
  removeCourt,
  setCourtRate,
  updateShuttleCount,
  setShuttleCost,
}) {
  return (
    <section className="rise-in rounded-[2rem] border border-emerald-900/10 bg-white/80 p-5 shadow-[0_20px_60px_rgba(22,51,41,0.08)] backdrop-blur sm:p-6">
      <div className="flex items-end justify-between gap-4 border-b border-emerald-950/10 pb-5">
        <div>
          <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.28em] text-emerald-800/65">
            Court Control
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-emerald-950">
            Start matches, track scores, and close them into history
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="hidden rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 sm:block">
            Total player turns: {totalMatchesPlayed}
          </p>
          <button
            type="button"
            onClick={addCourt}
            title="Add court"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-950/12 text-emerald-900 transition hover:border-emerald-700 hover:bg-emerald-50"
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
        </div>
      </div>

      <CostSummary
        courts={courts}
        playersById={playersById}
        shuttleCount={shuttleCount}
        shuttleCost={shuttleCost}
        updateShuttleCount={updateShuttleCount}
        setShuttleCost={setShuttleCost}
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {courts.map((court) => (
          <CourtCard
            key={court.id}
            court={court}
            courtCount={courts.length}
            liveMatch={
              court.currentMatchId
                ? liveMatchesById[court.currentMatchId]
                : null
            }
            playersById={playersById}
            suggestedMatch={suggestedMatch}
            startSuggestedMatch={startSuggestedMatch}
            finishMatch={finishMatch}
            cancelMatch={cancelMatch}
            removeCourt={removeCourt}
            setCourtRate={setCourtRate}
          />
        ))}
      </div>
    </section>
  );
}
