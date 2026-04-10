export default function RulesSidebar() {
  return (
    <section className="rounded-[2rem] border border-emerald-900/10 bg-white/78 p-5 shadow-[0_20px_60px_rgba(22,51,41,0.08)] backdrop-blur sm:p-6">
      <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.28em] text-emerald-800/65">
        Rules and Persistence
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-emerald-950">
        What changed in this board
      </h2>
      <div className="mt-5 space-y-3 text-sm leading-7 text-emerald-900/70">
        <div className="rounded-[1.25rem] bg-[#f8f3e8] px-4 py-4">
          1. Queue snapshots are saved in local storage automatically.
        </div>
        <div className="rounded-[1.25rem] bg-[#f8f3e8] px-4 py-4">
          2. Suggested matches pick four players from the first eight in line
          for tighter skill balance.
        </div>
        <div className="rounded-[1.25rem] bg-[#f8f3e8] px-4 py-4">
          3. Live court scores become permanent history when a match finishes.
        </div>
        <div className="rounded-[1.25rem] bg-[#f8f3e8] px-4 py-4">
          4. If Supabase env vars exist, the same snapshot syncs to the backend
          with live real-time updates.
        </div>
      </div>
    </section>
  );
}
