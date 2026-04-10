import { getSnapshotLabel } from "../lib/state";

export default function MatchHistory({
  recentHistory,
  completedMatches,
  fairnessGap,
  playersById,
}) {
  return (
    <section className="rounded-[2rem] border border-emerald-900/10 bg-white/78 p-5 shadow-[0_20px_60px_rgba(22,51,41,0.08)] backdrop-blur sm:p-6">
      <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.28em] text-emerald-800/65">
        Match History
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-emerald-950">
        Completed and cancelled matches
      </h2>
      <div className="mt-4 flex items-center gap-3 text-sm text-emerald-900/60">
        <span className="rounded-full bg-amber-100 px-3 py-1">
          {completedMatches.length} finished
        </span>
        <span className="rounded-full bg-stone-200 px-3 py-1">
          {fairnessGap} fairness gap
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {recentHistory.length === 0 ? (
          <div className="rounded-[1.25rem] bg-[#f8f3e8] px-4 py-6 text-sm text-emerald-900/65">
            No completed matches yet.
          </div>
        ) : (
          recentHistory.map((match) => {
            const isCancelled = match.status === "cancelled";
            const winningTeamLabel =
              match.winnerTeam === null
                ? "Draw / no result"
                : `Team ${match.winnerTeam === 0 ? "A" : "B"} won`;

            return (
              <article
                key={match.id}
                className="rounded-[1.25rem] bg-[#f8f3e8] px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.2em] text-emerald-800/60">
                      {match.courtId}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-emerald-950">
                      {isCancelled ? "Cancelled match" : winningTeamLabel}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${isCancelled ? "bg-stone-200 text-stone-700" : "bg-emerald-100 text-emerald-800"}`}
                  >
                    {isCancelled
                      ? "Cancelled"
                      : match.winnerTeam !== null
                        ? "Won"
                        : "Draw"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-emerald-900/65">
                  {match.teams
                    .map(
                      (team, index) =>
                        `Team ${index === 0 ? "A" : "B"}: ${team
                          .map((playerId) => playersById[playerId]?.name)
                          .join(" + ")}`,
                    )
                    .join(" | ")}
                </p>
                <p className="mt-2 text-xs text-emerald-900/50">
                  {getSnapshotLabel(match.endedAt ?? match.startedAt)}
                </p>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
