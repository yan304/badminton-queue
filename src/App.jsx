import CheckInDesk from "./components/CheckInDesk";
import CourtControl from "./components/CourtControl";
import FairRotation from "./components/FairRotation";
import HeroStats from "./components/HeroStats";
import LiveSnapshot from "./components/LiveSnapshot";
import MatchHistory from "./components/MatchHistory";
import PairingEngine from "./components/PairingEngine";
import RulesSidebar from "./components/RulesSidebar";
import useQueueState from "./hooks/useQueueState";

function App() {
  const {
    appState,
    form,
    setForm,
    syncStatus,
    lastSyncedAt,
    playersById,
    liveMatchesById,
    waitingPlayers,
    suggestedMatch,
    activeCourtCount,
    totalMatchesPlayed,
    completedMatches,
    fairnessGap,
    leaderboard,
    recentHistory,
    getPlayerStatus,
    startSuggestedMatch,
    updateMatchScore,
    finishMatch,
    cancelMatch,
    movePlayerForward,
    removeFromQueue,
    addToQueue,
    updatePlayerLevel,
    addCourt,
    removeCourt,
    onCourtIds,
    handleSubmit,
  } = useQueueState();

  return (
    <main className="min-h-screen px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <HeroStats
          appState={appState}
          activeCourtCount={activeCourtCount}
          syncStatus={syncStatus}
          lastSyncedAt={lastSyncedAt}
          getPlayerStatus={getPlayerStatus}
          onCourtIds={onCourtIds}
          removeFromQueue={removeFromQueue}
          addToQueue={addToQueue}
          updatePlayerLevel={updatePlayerLevel}
          form={form}
          setForm={setForm}
          handleSubmit={handleSubmit}
        />

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <CheckInDesk
              form={form}
              setForm={setForm}
              handleSubmit={handleSubmit}
              waitingPlayers={waitingPlayers}
              suggestedMatch={suggestedMatch}
              queue={appState.queue}
              movePlayerForward={movePlayerForward}
              removeFromQueue={removeFromQueue}
            />

            <div className="rise-in rounded-[2rem] border border-emerald-900/10 bg-white/80 p-5 shadow-[0_20px_60px_rgba(22,51,41,0.08)] backdrop-blur sm:p-6">
              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <PairingEngine
                  suggestedMatch={suggestedMatch}
                  playersById={playersById}
                />
                <FairRotation leaderboard={leaderboard} />
              </div>
            </div>

            <CourtControl
              courts={appState.courts}
              liveMatchesById={liveMatchesById}
              playersById={playersById}
              suggestedMatch={suggestedMatch}
              totalMatchesPlayed={totalMatchesPlayed}
              startSuggestedMatch={startSuggestedMatch}
              updateMatchScore={updateMatchScore}
              finishMatch={finishMatch}
              cancelMatch={cancelMatch}
              addCourt={addCourt}
              removeCourt={removeCourt}
            />
          </div>

          <aside className="rise-in space-y-6">
            <RulesSidebar />
            <MatchHistory
              recentHistory={recentHistory}
              completedMatches={completedMatches}
              fairnessGap={fairnessGap}
              playersById={playersById}
            />
            <LiveSnapshot
              players={appState.players}
              getPlayerStatus={getPlayerStatus}
            />
          </aside>
        </section>
      </div>
    </main>
  );
}

export default App;
