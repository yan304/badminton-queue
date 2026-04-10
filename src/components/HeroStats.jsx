import { useState } from "react";
import { getSnapshotLabel } from "../lib/state";
import PlayerManagementModal from "./PlayerManagementModal";

export default function HeroStats({
  appState,
  activeCourtCount,
  syncStatus,
  lastSyncedAt,
  getPlayerStatus,
  onCourtIds,
  removeFromQueue,
  addToQueue,
  updatePlayerLevel,
  form,
  setForm,
  handleSubmit,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <section className="rise-in overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(18,52,43,0.97),rgba(21,88,69,0.94)),radial-gradient(circle_at_top_right,rgba(255,188,87,0.48),transparent_32%)] p-6 text-white shadow-[0_24px_80px_rgba(18,52,43,0.18)] sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.32em] text-amber-100">
              Badminton Gameplay Queue
            </p>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
                Queue, pair, score, and sync the full game floor from one board.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-emerald-50/85 sm:text-base">
                Local snapshots survive refreshes, suggested matchups respect
                skill balance, and live court scores feed a running match
                history.
              </p>
            </div>
          </div>

          <div className="grid gap-3 rounded-[1.75rem] border border-white/10 bg-black/10 p-3 backdrop-blur sm:grid-cols-2 lg:w-[24rem]">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="cursor-pointer rounded-[1.25rem] bg-white/10 p-4 text-left transition hover:bg-white/20"
            >
              <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.28em] text-emerald-50/70">
                Checked In
              </p>
              <p className="mt-3 text-3xl font-bold">
                {appState.players.length}
              </p>
              <p className="mt-1 text-[10px] text-emerald-50/50">
                Tap to manage
              </p>
            </button>
            <div className="rounded-[1.25rem] bg-white/10 p-4">
              <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.28em] text-emerald-50/70">
                Waiting
              </p>
              <p className="mt-3 text-3xl font-bold">{appState.queue.length}</p>
            </div>
            <div className="rounded-[1.25rem] bg-white/10 p-4">
              <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.28em] text-emerald-50/70">
                Live Courts
              </p>
              <p className="mt-3 text-3xl font-bold">{activeCourtCount}</p>
            </div>
            <div className="rounded-[1.25rem] bg-white/10 p-4">
              <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.28em] text-emerald-50/70">
                Supabase Sync
              </p>
              <p className="mt-3 text-sm font-medium text-amber-100">
                {syncStatus}
              </p>
              <p className="mt-1 text-xs text-emerald-50/70">
                {getSnapshotLabel(lastSyncedAt)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <PlayerManagementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        players={appState.players}
        getPlayerStatus={getPlayerStatus}
        onCourtIds={onCourtIds}
        removeFromQueue={removeFromQueue}
        addToQueue={addToQueue}
        updatePlayerLevel={updatePlayerLevel}
        form={form}
        setForm={setForm}
        handleSubmit={handleSubmit}
      />
    </>
  );
}
