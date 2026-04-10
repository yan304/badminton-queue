export default function PairingEngine({ suggestedMatch, playersById }) {
  return (
    <article className="rounded-[1.75rem] bg-[#163329] p-5 text-white shadow-[0_20px_50px_rgba(22,51,41,0.18)]">
      <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.28em] text-amber-100/80">
        Pairing Engine
      </p>
      <h3 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
        {suggestedMatch
          ? "Recommended doubles matchup"
          : "Waiting for four checked-in players"}
      </h3>
      <p className="mt-2 text-sm leading-6 text-emerald-50/75">
        {suggestedMatch
          ? suggestedMatch.summary
          : "Once four or more players are in queue, the board suggests the best balanced matchup from the first eight waiting players."}
      </p>
      {suggestedMatch ? (
        <div className="mt-5 grid gap-3">
          {suggestedMatch.teams.map((team, index) => (
            <div
              key={`team-${index + 1}`}
              className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4"
            >
              <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.24em] text-amber-100/75">
                Team {index === 0 ? "A" : "B"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {team.map((playerId) => (
                  <span
                    key={playerId}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium"
                  >
                    {playersById[playerId]?.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
