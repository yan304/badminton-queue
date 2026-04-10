export default function FairRotation({ leaderboard }) {
  return (
    <article className="rounded-[1.75rem] border border-emerald-950/10 bg-white/75 p-5 shadow-[0_12px_30px_rgba(22,51,41,0.06)]">
      <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.28em] text-emerald-800/65">
        Fair Rotation
      </p>
      <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-emerald-950">
        Lowest match count first
      </h3>
      <div className="mt-4 space-y-3">
        {leaderboard.slice(0, 4).map((player) => (
          <div
            key={player.id}
            className="flex items-center justify-between rounded-2xl bg-[#f8f3e8] px-4 py-3"
          >
            <span className="font-medium text-emerald-950">{player.name}</span>
            <span className="text-sm text-emerald-900/60">
              {player.matchesPlayed} matches | {player.wins}-{player.losses}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}
