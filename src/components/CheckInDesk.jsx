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
                      title="Move up"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-950/12 text-emerald-900 transition hover:border-emerald-700 hover:bg-emerald-50"
                      onClick={() => movePlayerForward(player.id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-rose-200 px-3 py-2 text-sm text-rose-700 transition hover:bg-rose-50"
                      onClick={() => removeFromQueue(player.id)}
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
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
