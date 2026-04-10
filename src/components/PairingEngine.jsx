import { MATCHING_MODES } from "../lib/constants";

export default function PairingEngine({
  suggestedMatch,
  playersById,
  matchingMode,
  setMatchingMode,
}) {
  const activeMode = MATCHING_MODES.find((m) => m.id === matchingMode) ?? MATCHING_MODES[0];

  return (
    <article className="rounded-[1.75rem] bg-[#163329] p-5 text-white shadow-[0_20px_50px_rgba(22,51,41,0.18)]">
      <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.28em] text-amber-100/80">
        Pairing Engine
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {MATCHING_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => setMatchingMode(mode.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              mode.id === matchingMode
                ? "bg-amber-100 text-emerald-950"
                : "bg-white/10 text-emerald-50/80 hover:bg-white/20"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <p className="mt-2 text-xs leading-5 text-emerald-50/55">
        {activeMode.description}
      </p>

      <h3 className="mt-3 text-2xl font-bold tracking-[-0.03em]">
        {suggestedMatch
          ? "Recommended doubles matchup"
          : "Waiting for four checked-in players"}
      </h3>
      <p className="mt-2 text-sm leading-6 text-emerald-50/75">
        {suggestedMatch
          ? suggestedMatch.summary
          : "Once four or more players are in queue, the board suggests the best matched group from the first eight waiting players."}
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
