import { levelStyles } from "../lib/constants";

export default function CheckInDesk({
  waitingPlayers,
  suggestedMatch,
  queue,
  movePlayerForward,
  removeFromQueue,
}) {
  return (
    <section className="rise-in rounded-[2rem] border border-emerald-900/10 bg-white/80 p-5 shadow-[0_20px_60px_rgba(22,51,41,0.08)] backdrop-blur sm:p-6">
      <div className="flex flex-col gap-4 border-emerald-950/10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.28em] text-emerald-800/65">
            Check In Desk
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-[1.75rem] bg-[#fcf9f1] p-4 ring-1 ring-emerald-950/8">
        <div className="flex items-center justify-between gap-3 border-b border-emerald-950/8 pb-3">
          <div>
            <h3 className="text-lg font-semibold text-emerald-950">
              Waiting list
            </h3>
            <p className="text-sm text-emerald-900/60">
              Queue order still matters, but the pairing engine can look ahead
              for a safer skill mix.
            </p>
          </div>
          <span className="rounded-full bg-emerald-950 px-3 py-1 font-['IBM_Plex_Mono'] text-xs text-white">
            {queue.length} queued
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {waitingPlayers.length === 0 ? (
            <div className="rounded-[1.25rem] border border-dashed border-emerald-900/20 px-4 py-10 text-center text-sm text-emerald-900/65">
              No one is in line. Add a player to build the next rotation.
            </div>
          ) : (
            waitingPlayers.map((player, index) => {
              const isSuggested = suggestedMatch?.playerIds.includes(player.id);

              return (
                <article
                  key={player.id}
                  className={`flex flex-col gap-3 rounded-[1.25rem] border px-4 py-4 shadow-[0_8px_24px_rgba(22,51,41,0.06)] sm:flex-row sm:items-center sm:justify-between ${isSuggested ? "border-emerald-700/25 bg-emerald-50" : "border-emerald-950/8 bg-white"}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-950 text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-semibold text-emerald-950">
                          {player.name}
                        </h4>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${levelStyles[player.level]}`}
                        >
                          {player.level}
                        </span>
                        {isSuggested ? (
                          <span className="rounded-full bg-emerald-950 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white">
                            Suggested
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-emerald-900/60">
                        Matches played: {player.matchesPlayed}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      title="Set idle"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-950/12 text-emerald-900 transition hover:border-amber-500 hover:bg-amber-50 hover:text-amber-700"
                      onClick={() => removeFromQueue(player.id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path d="M4 3.5A1.5 1.5 0 0 1 5.5 2h9A1.5 1.5 0 0 1 16 3.5V5H4V3.5ZM5 5h1.5v3H5V5ZM13.5 5H15v3h-1.5V5ZM2.5 9.5A1.5 1.5 0 0 1 4 8h12a1.5 1.5 0 0 1 1.5 1.5V11h-15V9.5ZM5 11h1.5v4.5H5V11ZM13.5 11H15v4.5h-1.5V11Z" />
                      </svg>
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
