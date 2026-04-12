import { useCallback, useRef, useState } from "react";
import { getSnapshotLabel } from "../lib/state";

export default function MatchRecords({ allHistory, playersById, deleteMatch }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef(null);

  const openModal = useCallback(() => {
    setOpen(true);
    dialogRef.current?.showModal();
  }, []);

  const closeModal = useCallback(() => {
    dialogRef.current?.close();
    setOpen(false);
  }, []);

  return (
    <>
      {/* Sticky FAB — sits beside the notepad button */}
      <button
        type="button"
        onClick={openModal}
        title="Match records"
        className="fixed bottom-42 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-900 text-white shadow-[0_8px_30px_rgba(22,51,41,0.35)] transition hover:bg-emerald-800 active:scale-95"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path
            fillRule="evenodd"
            d="M1 2.75A.75.75 0 0 1 1.75 2h16.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75Zm0 5A.75.75 0 0 1 1.75 7h16.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75Zm0 5A.75.75 0 0 1 1.75 12h16.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1-.75-.75Zm0 5a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1-.75-.75Z"
            clipRule="evenodd"
          />
        </svg>
        {allHistory.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-emerald-950 ring-2 ring-white">
            {allHistory.length}
          </span>
        )}
      </button>

      {/* Modal */}
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="fixed inset-0 z-50 m-auto w-full max-w-lg rounded-[2rem] border border-emerald-900/10 bg-[#f4eedf] p-0 shadow-[0_30px_80px_rgba(22,51,41,0.25)] backdrop:bg-black/40"
      >
        {open && (
          <div className="flex max-h-[80vh] flex-col p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.28em] text-emerald-800/65">
                  Match Records
                </p>
                <p className="mt-1 text-sm text-emerald-900/55">
                  {allHistory.length} match
                  {allHistory.length !== 1 ? "es" : ""} recorded
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-8 w-8 items-center justify-center rounded-full text-emerald-900/50 transition hover:bg-emerald-900/8 hover:text-emerald-900"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            <div className="scrollbar-hide mt-4 -mx-6 flex-1 overflow-y-auto px-6">
              <div className="space-y-3 pb-2">
                {allHistory.length === 0 ? (
                  <div className="rounded-[1.25rem] bg-white/60 px-4 py-6 text-center text-sm text-emerald-900/65">
                    No completed matches yet.
                  </div>
                ) : (
                  allHistory.map((match) => {
                    const isCancelled = match.status === "cancelled";
                    const winLabel =
                      match.winnerTeam === null
                        ? "Draw / no result"
                        : `Team ${match.winnerTeam === 0 ? "A" : "B"} won`;

                    return (
                      <article
                        key={match.id}
                        className="rounded-[1.25rem] bg-white/60 px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.2em] text-emerald-800/60">
                              {match.courtName ?? match.courtId}
                            </p>
                            <h3 className="mt-1 text-base font-semibold text-emerald-950">
                              {isCancelled ? "Cancelled match" : winLabel}
                            </h3>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              isCancelled
                                ? "bg-stone-200 text-stone-700"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
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
                            .map((team, idx) => {
                              const names = team
                                .map((id) => playersById[id]?.name)
                                .join(" + ");
                              const tag =
                                match.winnerTeam !== null
                                  ? idx === match.winnerTeam
                                    ? "🏆 "
                                    : "💀 "
                                  : "";
                              return `${tag}Team ${idx === 0 ? "A" : "B"}: ${names}`;
                            })
                            .join(" | ")}
                        </p>
                        <p className="mt-2 text-xs text-emerald-900/50">
                          {getSnapshotLabel(match.endedAt ?? match.startedAt)}
                        </p>
                        <button
                          type="button"
                          onClick={() => deleteMatch(match.id)}
                          className="mt-2 rounded-full border border-rose-200 px-2.5 py-1 text-xs text-rose-600 transition hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
