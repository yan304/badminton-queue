import { useMemo, useState } from "react";

function getMatchSignature(match) {
  if (!Array.isArray(match?.playerIds)) {
    return "";
  }

  return [...match.playerIds]
    .map((id) => Number(id))
    .filter(Number.isFinite)
    .sort((left, right) => left - right)
    .join(",");
}

export default function PendingMatchesDrawer({
  isOpen,
  onClose,
  pendingMatches,
  suggestedMatch,
  waitingPlayers,
  playersById,
  addPendingMatch,
  removePendingMatch,
  clearPendingMatches,
  selectPendingMatch,
}) {
  const [pendingDraftPlayerIds, setPendingDraftPlayerIds] = useState([]);

  const currentSignature = useMemo(
    () => getMatchSignature(suggestedMatch),
    [suggestedMatch],
  );

  if (!isOpen) {
    return null;
  }

  const togglePendingDraftPlayer = (playerId) => {
    setPendingDraftPlayerIds((current) => {
      if (current.includes(playerId)) {
        return current.filter((id) => id !== playerId);
      }

      if (current.length >= 4) {
        return current;
      }

      return [...current, playerId];
    });
  };

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        aria-label="Close pending pool"
        className="absolute inset-0 bg-emerald-950/40"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-emerald-950/15 bg-[#0f2b23] p-4 text-emerald-50 shadow-[-20px_0_60px_rgba(0,0,0,0.28)] sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.24em] text-amber-100/80">
            Pending Matches
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-50/90 transition hover:bg-white/20"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-2 overflow-y-auto pr-1">
          {(pendingMatches ?? []).length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-white/6 px-3 py-3 text-xs text-emerald-50/70">
              No pending matches yet. Add one using the controls below.
            </p>
          ) : (
            (pendingMatches ?? []).map((match, index) => {
              const matchSignature = getMatchSignature(match);
              const isActive = matchSignature === currentSignature;

              return (
                <div
                  key={`pending-modal-${matchSignature || index}`}
                  className={`rounded-xl border px-3 py-2 text-xs ${
                    isActive
                      ? "border-amber-200/60 bg-amber-100/15"
                      : "border-white/10 bg-white/6"
                  }`}
                >
                  <p className="font-semibold text-emerald-50">
                    {isActive ? "Now selected" : `Pending ${index + 1}`}
                  </p>
                  <p className="mt-1 leading-5 text-emerald-50/75">
                    {(match?.playerIds ?? [])
                      .map((id) => playersById[id]?.name)
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => selectPendingMatch(match)}
                      className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold transition hover:bg-white/20"
                    >
                      Use next
                    </button>
                    <button
                      type="button"
                      onClick={() => removePendingMatch(match)}
                      className="rounded-full border border-rose-200/50 px-3 py-1 text-[11px] font-semibold text-rose-200 transition hover:bg-rose-900/35"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/6 px-3 py-3">
          <p className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.2em] text-amber-100/80">
            Add Pending Match
          </p>
          <p className="mt-1 text-xs text-emerald-50/70">
            Pick exactly 4 waiting players.
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {(waitingPlayers ?? []).map((player) => {
              const selected = pendingDraftPlayerIds.includes(player.id);
              return (
                <button
                  key={`pending-draft-${player.id}`}
                  type="button"
                  onClick={() => togglePendingDraftPlayer(player.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    selected
                      ? "bg-amber-100 text-emerald-950"
                      : "bg-white/10 text-emerald-50/85 hover:bg-white/20"
                  }`}
                >
                  {player.name}
                </button>
              );
            })}
          </div>

          <p className="mt-2 text-xs text-emerald-50/70">
            Selected {pendingDraftPlayerIds.length}/4
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (suggestedMatch) {
                  addPendingMatch(suggestedMatch);
                }
              }}
              disabled={!suggestedMatch}
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/20 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-emerald-50/40"
            >
              Add current recommendation
            </button>
            <button
              type="button"
              onClick={() => {
                if (pendingDraftPlayerIds.length === 4) {
                  addPendingMatch(pendingDraftPlayerIds);
                  setPendingDraftPlayerIds([]);
                }
              }}
              disabled={pendingDraftPlayerIds.length !== 4}
              className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-emerald-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-amber-100/40 disabled:text-emerald-950/40"
            >
              Add selected players
            </button>
            <button
              type="button"
              onClick={() => setPendingDraftPlayerIds([])}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-emerald-50/80 transition hover:bg-white/10"
            >
              Reset selection
            </button>
            <button
              type="button"
              onClick={clearPendingMatches}
              disabled={(pendingMatches?.length ?? 0) === 0}
              className="rounded-full border border-rose-200/45 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-900/35 disabled:cursor-not-allowed disabled:border-rose-200/25 disabled:text-rose-200/45"
            >
              Clear all pending
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
