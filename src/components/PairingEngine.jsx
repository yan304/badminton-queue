import { useState } from "react";
import { MATCHING_MODES } from "../lib/constants";

export default function PairingEngine({
  suggestedMatch,
  playersById,
  matchingMode,
  setMatchingMode,
  allSuggestionsCount,
  shuffleSuggestion,
  swapSuggestionPlayer,
  waitingPlayers,
}) {
  const activeMode =
    MATCHING_MODES.find((m) => m.id === matchingMode) ?? MATCHING_MODES[0];
  const [swappingId, setSwappingId] = useState(null);

  // Players available for swapping — in queue but not in the current suggestion
  const suggestionIds = new Set(suggestedMatch?.playerIds ?? []);
  const swapPool = (waitingPlayers ?? []).filter(
    (p) => !suggestionIds.has(p.id),
  );

  const handleSwap = (newPlayerId) => {
    swapSuggestionPlayer(swappingId, newPlayerId);
    setSwappingId(null);
  };

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

      <div className="mt-3 flex items-center justify-between gap-3">
        <h3 className="text-2xl font-bold tracking-[-0.03em]">
          {suggestedMatch
            ? "Recommended doubles matchup"
            : "Waiting for four checked-in players"}
        </h3>
        {suggestedMatch && allSuggestionsCount > 1 ? (
          <button
            type="button"
            onClick={() => {
              setSwappingId(null);
              shuffleSuggestion();
            }}
            title="Shuffle — try a different pairing"
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-medium text-emerald-50/90 transition hover:bg-white/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path
                fillRule="evenodd"
                d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.451a.75.75 0 0 0 0-1.5H4.5a.75.75 0 0 0-.75.75v3.75a.75.75 0 0 0 1.5 0v-2.136l.312.311a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39l-.013.048Zm-10.624-2.85a5.5 5.5 0 0 1 9.201-2.465l.312.311H12.75a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 .75-.75V3.42a.75.75 0 0 0-1.5 0v2.136l-.312-.311A7 7 0 0 0 3.726 8.383a.75.75 0 0 0 1.449.39l.013-.049Z"
                clipRule="evenodd"
              />
            </svg>
            Shuffle
          </button>
        ) : null}
      </div>
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
                  <button
                    key={playerId}
                    type="button"
                    onClick={() =>
                      setSwappingId((prev) =>
                        prev === playerId ? null : playerId,
                      )
                    }
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      swappingId === playerId
                        ? "bg-amber-100 text-emerald-950 ring-2 ring-amber-300"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    {playersById[playerId]?.name}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {swappingId && swapPool.length > 0 ? (
            <div className="rounded-2xl border border-amber-100/20 bg-amber-100/8 px-4 py-3">
              <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.24em] text-amber-100/75">
                Swap {playersById[swappingId]?.name} with&hellip;
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {swapPool.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => handleSwap(player.id)}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium transition hover:bg-amber-100 hover:text-emerald-950"
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
