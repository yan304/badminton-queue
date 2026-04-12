import CheckInDesk from "./components/CheckInDesk";
import CourtControl from "./components/court-control";
import FairRotation from "./components/FairRotation";
import HeroStats from "./components/HeroStats";
import LiveSnapshot from "./components/LiveSnapshot";
import LoginPage from "./components/LoginPage";
import MatchHistory from "./components/MatchHistory";
import PairingEngine from "./components/PairingEngine";
import MatchRecords from "./components/MatchRecords";
import Notepad from "./components/Notepad";
import SignOut from "./components/SignOut";
import useAuth from "./hooks/useAuth";
import useQueueState from "./hooks/useQueueState";

function App() {
  const auth = useAuth();
  const {
    loading,
    appState,
    form,
    setForm,
    syncStatus,
    lastSyncedAt,
    playersById,
    liveMatchesById,
    waitingPlayers,
    suggestedMatch,
    allSuggestionsCount,
    shuffleSuggestion,
    swapSuggestionPlayer,
    activeCourtCount,
    totalMatchesPlayed,
    completedMatches,
    fairnessGap,
    leaderboard,
    allHistory,
    recentHistory,
    getPlayerStatus,
    startSuggestedMatch,
    finishMatch,
    cancelMatch,
    deleteMatch,
    movePlayerForward,
    removeFromQueue,
    deletePlayer,
    addToQueue,
    updatePlayerLevel,
    setMatchingMode,
    setCourtRate,
    setCourtName,
    updateShuttleCount,
    setShuttleCost,
    setNotes,
    addCourt,
    removeCourt,
    onCourtIds,
    handleSubmit,
  } = useQueueState(auth.user?.id);

  if (auth.loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
          <p className="font-['IBM_Plex_Mono'] text-sm text-emerald-800/60">
            Checking authentication...
          </p>
        </div>
      </main>
    );
  }

  if (!auth.user) {
    return (
      <LoginPage
        signIn={auth.signIn}
        signUp={auth.signUp}
        error={auth.error}
        setError={auth.setError}
      />
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
          <p className="font-['IBM_Plex_Mono'] text-sm text-emerald-800/60">
            Loading from Supabase...
          </p>
        </div>
      </main>
    );
  }

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
          deletePlayer={deletePlayer}
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
                  matchingMode={appState.matchingMode}
                  setMatchingMode={setMatchingMode}
                  allSuggestionsCount={allSuggestionsCount}
                  shuffleSuggestion={shuffleSuggestion}
                  swapSuggestionPlayer={swapSuggestionPlayer}
                  waitingPlayers={waitingPlayers}
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
              shuttleCount={appState.shuttleCount}
              shuttleCost={appState.shuttleCost}
              startSuggestedMatch={startSuggestedMatch}
              finishMatch={finishMatch}
              cancelMatch={cancelMatch}
              addCourt={addCourt}
              removeCourt={removeCourt}
              setCourtRate={setCourtRate}
              setCourtName={setCourtName}
              updateShuttleCount={updateShuttleCount}
              setShuttleCost={setShuttleCost}
            />
          </div>

          <aside className="rise-in space-y-6">
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

      <MatchRecords
        allHistory={allHistory}
        playersById={playersById}
        deleteMatch={deleteMatch}
      />
      <Notepad notes={appState.notes} setNotes={setNotes} />
      <SignOut signOut={auth.signOut} />
    </main>
  );
}

export default App;
