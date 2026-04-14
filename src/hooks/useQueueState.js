import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STORAGE_KEY } from "../lib/constants";
import {
  buildBalancedTeams,
  buildPlayersById,
  getSuggestedMatch,
  getTopSuggestions,
} from "../lib/pairing";
import { createMatchId, loadLocalSnapshot, normalizeState } from "../lib/state";
import {
  fetchRemoteSnapshot,
  isSupabaseConfigured,
  saveRemoteSnapshot,
  subscribeToSnapshot,
} from "../lib/supabase";

function getInitialForm() {
  return { name: "", level: "Intermediate" };
}

export default function useQueueState(userId) {
  const snapshotId = userId ? `user-${userId}` : "badminton-main";
  const storageKey = userId ? `${STORAGE_KEY}-${userId}` : STORAGE_KEY;

  const [appState, setAppState] = useState(() =>
    normalizeState(loadLocalSnapshot(storageKey)),
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [form, setForm] = useState(getInitialForm);
  const [syncStatus, setSyncStatus] = useState(
    isSupabaseConfigured
      ? "Checking Supabase snapshot..."
      : "Local persistence active",
  );
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const syncReadyRef = useRef(!isSupabaseConfigured);
  // Track the updatedAt we last wrote so we can ignore our own echoes from realtime
  const lastWrittenAtRef = useRef(null);

  const playersById = useMemo(
    () => buildPlayersById(appState.players),
    [appState.players],
  );

  const liveMatchesById = useMemo(
    () =>
      Object.fromEntries(
        appState.matchHistory
          .filter((match) => match.status === "live")
          .map((match) => [match.id, match]),
      ),
    [appState.matchHistory],
  );

  const onCourtIds = useMemo(
    () =>
      new Set(
        Object.values(liveMatchesById).flatMap((match) => match.playerIds),
      ),
    [liveMatchesById],
  );

  const waitingPlayers = useMemo(
    () =>
      appState.queue.map((playerId) => playersById[playerId]).filter(Boolean),
    [appState.queue, playersById],
  );

  const manualPairing = useMemo(() => {
    const queueSet = new Set(appState.queue);
    const teamA = (appState.manualPairing?.teamA ?? [])
      .filter((id) => queueSet.has(id))
      .slice(0, 2);
    const teamASet = new Set(teamA);
    const teamB = (appState.manualPairing?.teamB ?? [])
      .filter((id) => queueSet.has(id) && !teamASet.has(id))
      .slice(0, 2);
    return { teamA, teamB };
  }, [appState.manualPairing, appState.queue]);

  const manualSuggestedMatch = useMemo(() => {
    const teamA = manualPairing.teamA;
    const teamB = manualPairing.teamB;
    const selectedIds = [...teamA, ...teamB];

    if (selectedIds.length !== 4 || teamA.length !== 2 || teamB.length !== 2) {
      return null;
    }

    return {
      playerIds: selectedIds,
      teams: [teamA, teamB],
      metrics: {
        levelSpread: 0,
        fairnessSpread: 0,
        windowSize: appState.queue.length,
      },
      summary: "Manual pairing selected by host.",
    };
  }, [manualPairing, appState.queue.length]);

  const allSuggestions = useMemo(
    () =>
      getTopSuggestions(
        appState.queue,
        playersById,
        appState.matchingMode,
        appState.matchHistory,
        appState.strictLevelChoice,
      ),
    [
      appState.queue,
      playersById,
      appState.matchingMode,
      appState.matchHistory,
      appState.strictLevelChoice,
    ],
  );

  const suggestionKey = `${appState.queue.join(",")}-${appState.matchingMode}-${appState.strictLevelChoice}`;
  const [pairingTweaks, setPairingTweaks] = useState({
    key: "",
    index: 0,
    custom: null,
  });

  // Auto-reset: if the queue or mode changed, ignore stale tweaks
  const { index: suggestionIndex, custom: customSuggestion } =
    pairingTweaks.key === suggestionKey
      ? pairingTweaks
      : { index: 0, custom: null };

  const suggestedMatch =
    appState.matchingMode === "manual"
      ? manualSuggestedMatch
      : (customSuggestion ?? allSuggestions[suggestionIndex] ?? null);

  const activeCourtCount = appState.courts.filter((court) =>
    Boolean(court.currentMatchId),
  ).length;
  const totalMatchesPlayed = appState.players.reduce(
    (sum, player) => sum + player.matchesPlayed,
    0,
  );
  const completedMatches = appState.matchHistory.filter(
    (match) => match.status === "finished",
  );

  const fairnessGap = appState.players.length
    ? Math.max(...appState.players.map((player) => player.matchesPlayed)) -
      Math.min(...appState.players.map((player) => player.matchesPlayed))
    : 0;

  const leaderboard = useMemo(
    () =>
      [...appState.players].sort((left, right) => {
        if (left.matchesPlayed !== right.matchesPlayed) {
          return left.matchesPlayed - right.matchesPlayed;
        }
        return left.wins - right.wins;
      }),
    [appState.players],
  );

  const allHistory = useMemo(
    () =>
      [...appState.matchHistory]
        .filter((match) => match.status !== "live")
        .sort(
          (left, right) =>
            new Date(right.endedAt ?? right.startedAt) -
            new Date(left.endedAt ?? left.startedAt),
        ),
    [appState.matchHistory],
  );

  const recentHistory = useMemo(() => allHistory.slice(0, 6), [allHistory]);

  const updateAppState = useCallback((updater) => {
    setAppState((currentState) => {
      const nextState =
        typeof updater === "function" ? updater(currentState) : updater;
      return normalizeState({
        ...nextState,
        updatedAt: new Date().toISOString(),
      });
    });
  }, []);

  // --- Supabase hydration + real-time subscription ---
  useEffect(() => {
    let cancelled = false;

    async function hydrateRemoteState() {
      if (!isSupabaseConfigured) {
        return;
      }

      const { snapshot, error } = await fetchRemoteSnapshot(snapshotId);

      if (cancelled) {
        return;
      }

      if (error) {
        setSyncStatus("Supabase unavailable, local persistence still active");
        syncReadyRef.current = true;
        return;
      }

      if (snapshot) {
        setAppState(() => normalizeState(snapshot));
        setLastSyncedAt(snapshot.updatedAt ?? null);
      }

      setSyncStatus("Supabase connected");
      syncReadyRef.current = true;
      setLoading(false);
    }

    hydrateRemoteState().catch(() => {
      if (!cancelled) {
        setSyncStatus("Supabase unavailable, local persistence still active");
        syncReadyRef.current = true;
        setLoading(false);
      }
    });

    // Subscribe to real-time updates from other devices
    const unsubscribe = subscribeToSnapshot(snapshotId, (remoteSnapshot) => {
      if (cancelled) return;

      // Skip our own echoes
      if (
        lastWrittenAtRef.current &&
        remoteSnapshot.updatedAt === lastWrittenAtRef.current
      ) {
        return;
      }

      setAppState((currentState) => {
        const remoteTime = new Date(remoteSnapshot.updatedAt ?? 0).getTime();
        const localTime = new Date(currentState.updatedAt ?? 0).getTime();
        if (remoteTime > localTime) {
          setSyncStatus("Live update received");
          setLastSyncedAt(remoteSnapshot.updatedAt);
          return normalizeState(remoteSnapshot);
        }
        return currentState;
      });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [snapshotId]);

  // --- localStorage save + debounced Supabase push ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, JSON.stringify(appState));
    }

    if (
      !isSupabaseConfigured ||
      !syncReadyRef.current ||
      typeof window === "undefined"
    ) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      lastWrittenAtRef.current = appState.updatedAt;
      const { error } = await saveRemoteSnapshot(snapshotId, appState);

      if (error) {
        setSyncStatus("Supabase sync failed, local state kept");
        return;
      }

      setSyncStatus("Supabase snapshot saved");
      setLastSyncedAt(appState.updatedAt);
    }, 700);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [appState, snapshotId, storageKey]);

  // --- player status helper ---
  const getPlayerStatus = useCallback(
    (playerId) => {
      if (onCourtIds.has(playerId)) return "on-court";
      if (appState.queue.includes(playerId)) return "waiting";
      return "idle";
    },
    [onCourtIds, appState.queue],
  );

  // --- action handlers ---
  const shuffleSuggestion = useCallback(() => {
    if (appState.matchingMode === "manual") {
      return;
    }
    setPairingTweaks((prev) => ({
      key: suggestionKey,
      index:
        allSuggestions.length > 0
          ? ((prev.key === suggestionKey ? prev.index : 0) + 1) %
            allSuggestions.length
          : 0,
      custom: null,
    }));
  }, [appState.matchingMode, suggestionKey, allSuggestions.length]);

  const swapSuggestionPlayer = useCallback(
    (oldPlayerId, newPlayerId) => {
      if (appState.matchingMode === "manual") {
        return;
      }
      const current =
        customSuggestion ?? allSuggestions[suggestionIndex] ?? null;
      if (!current) return;
      const newPlayerIds = current.playerIds.map((id) =>
        id === oldPlayerId ? newPlayerId : id,
      );
      const teamPlan = buildBalancedTeams(
        newPlayerIds,
        playersById,
        appState.matchingMode,
        appState.strictLevelChoice,
      );
      setPairingTweaks({
        key: suggestionKey,
        index: suggestionIndex,
        custom: {
          playerIds: newPlayerIds,
          teams: teamPlan.teams,
          metrics: { ...current.metrics },
          summary: "Custom match (manually adjusted)",
        },
      });
    },
    [
      customSuggestion,
      allSuggestions,
      suggestionIndex,
      playersById,
      appState.matchingMode,
      appState.strictLevelChoice,
      suggestionKey,
    ],
  );

  const cycleManualPlayerTeam = useCallback(
    (playerId) => {
      updateAppState((currentState) => {
        if (!currentState.queue.includes(playerId)) {
          return currentState;
        }

        const currentA = currentState.manualPairing?.teamA ?? [];
        const currentB = currentState.manualPairing?.teamB ?? [];
        const inA = currentA.includes(playerId);
        const inB = currentB.includes(playerId);

        if (inA) {
          if (currentB.length >= 2) {
            return {
              ...currentState,
              manualPairing: {
                teamA: currentA.filter((id) => id !== playerId),
                teamB: currentB,
              },
            };
          }
          return {
            ...currentState,
            manualPairing: {
              teamA: currentA.filter((id) => id !== playerId),
              teamB: [...currentB, playerId],
            },
          };
        }

        if (inB) {
          return {
            ...currentState,
            manualPairing: {
              teamA: currentA,
              teamB: currentB.filter((id) => id !== playerId),
            },
          };
        }

        if (currentA.length < 2) {
          return {
            ...currentState,
            manualPairing: {
              teamA: [...currentA, playerId],
              teamB: currentB,
            },
          };
        }

        if (currentB.length < 2) {
          return {
            ...currentState,
            manualPairing: {
              teamA: currentA,
              teamB: [...currentB, playerId],
            },
          };
        }

        return currentState;
      });
    },
    [updateAppState],
  );

  const clearManualPairing = useCallback(() => {
    updateAppState((currentState) => ({
      ...currentState,
      manualPairing: { teamA: [], teamB: [] },
    }));
  }, [updateAppState]);

  const startSuggestedMatch = useCallback(
    (courtId, overrideSuggestion) => {
      updateAppState((currentState) => {
        const targetCourt = currentState.courts.find(
          (court) => court.id === courtId,
        );

        // Use the override (from shuffle/swap) when provided, otherwise
        // fall back to a fresh computation so the match always reflects
        // the latest queue state.
        const suggestion =
          overrideSuggestion ??
          getSuggestedMatch(
            currentState.queue,
            buildPlayersById(currentState.players),
            currentState.matchingMode,
            currentState.matchHistory,
            currentState.strictLevelChoice,
          );

        if (!targetCourt || targetCourt.currentMatchId || !suggestion) {
          return currentState;
        }

        const nextMatch = {
          id: createMatchId(),
          courtId,
          courtName: targetCourt.name,
          status: "live",
          startedAt: new Date().toISOString(),
          endedAt: null,
          playerIds: suggestion.playerIds,
          teams: suggestion.teams,
          score: { teamA: 0, teamB: 0 },
          winnerTeam: null,
          summary: suggestion.summary,
        };

        return {
          ...currentState,
          queue: currentState.queue.filter(
            (playerId) => !suggestion.playerIds.includes(playerId),
          ),
          courts: currentState.courts.map((court) =>
            court.id === courtId
              ? {
                  ...court,
                  currentMatchId: nextMatch.id,
                  startedAt: court.startedAt ?? new Date().toISOString(),
                }
              : court,
          ),
          players: currentState.players.map((player) =>
            suggestion.playerIds.includes(player.id)
              ? { ...player, matchesPlayed: player.matchesPlayed + 1 }
              : player,
          ),
          matchHistory: [...currentState.matchHistory, nextMatch],
        };
      });
    },
    [updateAppState],
  );

  const updateMatchScore = useCallback(
    (matchId, teamKey, value) => {
      updateAppState((currentState) => ({
        ...currentState,
        matchHistory: currentState.matchHistory.map((match) =>
          match.id === matchId
            ? {
                ...match,
                score: {
                  ...match.score,
                  [teamKey]: Math.max(0, Number(value) || 0),
                },
              }
            : match,
        ),
      }));
    },
    [updateAppState],
  );

  const finishMatch = useCallback(
    (courtId, winnerTeam = null) => {
      updateAppState((currentState) => {
        const court = currentState.courts.find((item) => item.id === courtId);
        const match = currentState.matchHistory.find(
          (item) => item.id === court?.currentMatchId && item.status === "live",
        );

        if (!court || !match) {
          return currentState;
        }

        return {
          ...currentState,
          queue: [...currentState.queue, ...match.playerIds],
          courts: currentState.courts.map((item) =>
            item.id === courtId ? { ...item, currentMatchId: null } : item,
          ),
          players: currentState.players.map((player) => {
            if (!match.playerIds.includes(player.id) || winnerTeam === null) {
              return player;
            }

            const isWinner = match.teams[winnerTeam]?.includes(player.id);

            return {
              ...player,
              wins: player.wins + (isWinner ? 1 : 0),
              losses: player.losses + (isWinner ? 0 : 1),
            };
          }),
          matchHistory: currentState.matchHistory.map((item) =>
            item.id === match.id
              ? {
                  ...item,
                  status: "finished",
                  endedAt: new Date().toISOString(),
                  winnerTeam,
                }
              : item,
          ),
        };
      });
    },
    [updateAppState],
  );

  const cancelMatch = useCallback(
    (courtId) => {
      updateAppState((currentState) => {
        const court = currentState.courts.find((item) => item.id === courtId);
        const match = currentState.matchHistory.find(
          (item) => item.id === court?.currentMatchId && item.status === "live",
        );

        if (!court || !match) {
          return currentState;
        }

        return {
          ...currentState,
          queue: [...currentState.queue, ...match.playerIds],
          courts: currentState.courts.map((item) =>
            item.id === courtId ? { ...item, currentMatchId: null } : item,
          ),
          matchHistory: currentState.matchHistory.map((item) =>
            item.id === match.id
              ? {
                  ...item,
                  status: "cancelled",
                  endedAt: new Date().toISOString(),
                  winnerTeam: null,
                }
              : item,
          ),
        };
      });
    },
    [updateAppState],
  );

  const deleteMatch = useCallback(
    (matchId) => {
      updateAppState((currentState) => ({
        ...currentState,
        matchHistory: currentState.matchHistory.filter(
          (match) => match.id !== matchId,
        ),
      }));
    },
    [updateAppState],
  );

  const setMatchingMode = useCallback(
    (mode) => {
      updateAppState((currentState) => ({
        ...currentState,
        matchingMode: mode,
      }));
      setPairingTweaks({ key: "", index: 0, custom: null });
    },
    [updateAppState],
  );

  const setStrictLevelChoice = useCallback(
    (choice) => {
      updateAppState((currentState) => ({
        ...currentState,
        strictLevelChoice: choice,
      }));
    },
    [updateAppState],
  );

  const setCourtRate = useCallback(
    (courtId, field, value) => {
      updateAppState((currentState) => ({
        ...currentState,
        courts: currentState.courts.map((c) =>
          c.id === courtId
            ? { ...c, [field]: Math.max(0, Number(value) || 0) }
            : c,
        ),
      }));
    },
    [updateAppState],
  );

  const setCourtName = useCallback(
    (courtId, name) => {
      updateAppState((currentState) => ({
        ...currentState,
        courts: currentState.courts.map((c) =>
          c.id === courtId ? { ...c, name } : c,
        ),
      }));
    },
    [updateAppState],
  );

  const updateShuttleCount = useCallback(
    (delta) => {
      updateAppState((currentState) => ({
        ...currentState,
        shuttleCount: Math.max(0, (currentState.shuttleCount ?? 0) + delta),
      }));
    },
    [updateAppState],
  );

  const setShuttleCost = useCallback(
    (cost) => {
      updateAppState((currentState) => ({
        ...currentState,
        shuttleCost: Math.max(0, Number(cost) || 0),
      }));
    },
    [updateAppState],
  );

  const setNotes = useCallback(
    (notes) => {
      updateAppState((currentState) => ({
        ...currentState,
        notes,
      }));
    },
    [updateAppState],
  );

  const addCourt = useCallback(() => {
    updateAppState((currentState) => {
      const nextNum =
        currentState.courts.reduce((max, c) => {
          const n = parseInt(c.id.replace("court-", ""), 10);
          return Number.isNaN(n) ? max : Math.max(max, n);
        }, 0) + 1;
      return {
        ...currentState,
        courts: [
          ...currentState.courts,
          {
            id: `court-${nextNum}`,
            name: `Court ${nextNum}`,
            currentMatchId: null,
            hourlyRate: 0,
          },
        ],
      };
    });
  }, [updateAppState]);

  const removeCourt = useCallback(
    (courtId) => {
      updateAppState((currentState) => {
        const court = currentState.courts.find((c) => c.id === courtId);
        if (!court || court.currentMatchId) return currentState;
        if (currentState.courts.length <= 1) return currentState;
        return {
          ...currentState,
          courts: currentState.courts.filter((c) => c.id !== courtId),
        };
      });
    },
    [updateAppState],
  );

  const movePlayerForward = useCallback(
    (playerId) => {
      updateAppState((currentState) => {
        const playerIndex = currentState.queue.indexOf(playerId);

        if (playerIndex <= 0) {
          return currentState;
        }

        const nextQueue = [...currentState.queue];
        [nextQueue[playerIndex - 1], nextQueue[playerIndex]] = [
          nextQueue[playerIndex],
          nextQueue[playerIndex - 1],
        ];

        return {
          ...currentState,
          queue: nextQueue,
        };
      });
    },
    [updateAppState],
  );

  const removeFromQueue = useCallback(
    (playerId) => {
      updateAppState((currentState) => ({
        ...currentState,
        queue: currentState.queue.filter((queuedId) => queuedId !== playerId),
      }));
    },
    [updateAppState],
  );

  const deletePlayer = useCallback(
    (playerId) => {
      updateAppState((currentState) => ({
        ...currentState,
        players: currentState.players.filter((p) => p.id !== playerId),
        queue: currentState.queue.filter((queuedId) => queuedId !== playerId),
      }));
    },
    [updateAppState],
  );

  const addToQueue = useCallback(
    (playerId) => {
      updateAppState((currentState) => {
        if (
          currentState.queue.includes(playerId) ||
          !currentState.players.some((p) => p.id === playerId)
        ) {
          return currentState;
        }
        return {
          ...currentState,
          queue: [...currentState.queue, playerId],
        };
      });
    },
    [updateAppState],
  );

  const updatePlayerLevel = useCallback(
    (playerId, newLevel) => {
      updateAppState((currentState) => ({
        ...currentState,
        players: currentState.players.map((p) =>
          p.id === playerId ? { ...p, level: newLevel } : p,
        ),
      }));
    },
    [updateAppState],
  );

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();

      const name = form.name.trim();

      if (!name) {
        return;
      }

      updateAppState((currentState) => {
        const nextId =
          currentState.players.reduce(
            (largestId, player) => Math.max(largestId, player.id),
            0,
          ) + 1;

        return {
          ...currentState,
          players: [
            ...currentState.players,
            {
              id: nextId,
              name,
              level: form.level,
              matchesPlayed: 0,
              wins: 0,
              losses: 0,
            },
          ],
          queue: [...currentState.queue, nextId],
        };
      });

      setForm(getInitialForm());
    },
    [form, updateAppState],
  );

  return {
    loading,
    appState,
    form,
    setForm,
    syncStatus,
    lastSyncedAt,
    playersById,
    liveMatchesById,
    onCourtIds,
    waitingPlayers,
    manualPairing,
    suggestedMatch,
    allSuggestionsCount:
      appState.matchingMode === "manual"
        ? manualSuggestedMatch
          ? 1
          : 0
        : allSuggestions.length,
    shuffleSuggestion,
    swapSuggestionPlayer,
    cycleManualPlayerTeam,
    clearManualPairing,
    activeCourtCount,
    totalMatchesPlayed,
    completedMatches,
    fairnessGap,
    leaderboard,
    allHistory,
    recentHistory,
    getPlayerStatus,
    startSuggestedMatch,
    updateMatchScore,
    finishMatch,
    cancelMatch,
    deleteMatch,
    movePlayerForward,
    removeFromQueue,
    deletePlayer,
    addToQueue,
    updatePlayerLevel,
    setMatchingMode,
    setStrictLevelChoice,
    setCourtRate,
    setCourtName,
    updateShuttleCount,
    setShuttleCost,
    setNotes,
    addCourt,
    removeCourt,
    handleSubmit,
  };
}
