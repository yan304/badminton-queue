import { statusStyles, getWinRateRank } from "../lib/constants";

export default function LiveSnapshot({ players, getPlayerStatus }) {
  return (
    <section className="rounded-[2rem] border border-emerald-900/10 bg-[#163329] p-5 text-white shadow-[0_20px_60px_rgba(22,51,41,0.16)] sm:p-6">
      <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.28em] text-amber-100/80">
        Live Snapshot
      </p>
      <div className="mt-5 grid gap-3">
        {players.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-4 py-10 text-center text-sm text-emerald-50/50">
            No players checked in yet.
          </div>
        ) : (
          players.map((player) => {
            const playerStatus = getPlayerStatus(player.id);

            return (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{player.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em] ${statusStyles[playerStatus]}`}
                    >
                      {playerStatus}
                    </span>
                    <span className="text-sm text-emerald-50/65">
                      {player.level}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-right">
                  {(() => {
                    const rank = getWinRateRank(
                      player.wins ?? 0,
                      player.losses ?? 0,
                    );
                    return rank ? (
                      <span
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${rank.style}`}
                      >
                        <span className="text-sm leading-none">
                          {rank.icon}
                        </span>
                        {rank.label}
                      </span>
                    ) : null;
                  })()}
                  <span className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.24em] text-amber-100/75">
                    {player.wins}-{player.losses}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
