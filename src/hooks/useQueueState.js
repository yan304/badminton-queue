import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STORAGE_KEY } from "../lib/constants";
import { buildPlayersById, getSuggestedMatch } from "../lib/pairing";
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

export default function useQueueState() {
  const [appState, setAppState] = useState(() =>
    normalizeState(loadLocalSnapshot()),
  );
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

  const suggestedMatch = useMemo(
    () => getSuggestedMatch(appState.queue, playersById, appState.matchingMode),
    [appState.queue, playersById, appState.matchingMode],
  );

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

  const recentHistory = useMemo(
    () =>
      [...appState.matchHistory]
        .filter((match) => match.status !== "live")
        .sort(
          (left, right) =>
            new Date(right.endedAt ?? right.startedAt) -
            new Date(left.endedAt ?? left.startedAt),
        )
        .slice(0, 6),
    [appState.matchHistory],
  );

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

      const { snapshot, error } = await fetchRemoteSnapshot();

      if (cancelled) {
        return;
      }

      if (error) {
        setSyncStatus("Supabase unavailable, local persistence still active");
        syncReadyRef.current = true;
        return;
      }

      if (snapshot) {
        setAppState((currentState) => {
          const remoteTime = new Date(snapshot.updatedAt ?? 0).getTime();
          const localTime = new Date(currentState.updatedAt ?? 0).getTime();
          return remoteTime > localTime
            ? normalizeState(snapshot)
            : currentState;
        });
        setLastSyncedAt(snapshot.updatedAt ?? null);
      }

      setSyncStatus("Supabase connected");
      syncReadyRef.current = true;
    }

    hydrateRemoteState().catch(() => {
      if (!cancelled) {
        setSyncStatus("Supabase unavailable, local persistence still active");
        syncReadyRef.current = true;
      }
    });

    // Subscribe to real-time updates from other devices
    const unsubscribe = subscribeToSnapshot((remoteSnapshot) => {
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
  }, []);

  // --- localStorage save + debounced Supabase push ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
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
      const { error } = await saveRemoteSnapshot(appState);

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
  }, [appState]);

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
  const startSuggestedMatch = useCallback(
    (courtId) => {
      updateAppState((currentState) => {
        const targetCourt = currentState.courts.find(
          (court) => court.id === courtId,
        );
        const localPlayersById = buildPlayersById(currentState.players);
        const suggestion = getSuggestedMatch(
          currentState.queue,
          localPlayersById,
        );

        if (!targetCourt || targetCourt.currentMatchId || !suggestion) {
          return currentState;
        }

        const nextMatch = {
          id: createMatchId(),
          courtId,
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
    (courtId) => {
      updateAppState((currentState) => {
        const court = currentState.courts.find((item) => item.id === courtId);
        const match = currentState.matchHistory.find(
          (item) => item.id === court?.currentMatchId && item.status === "live",
        );

        if (!court || !match) {
          return currentState;
        }

        let winnerTeam = null;

        if (match.score.teamA !== match.score.teamB) {
          winnerTeam = match.score.teamA > match.score.teamB ? 0 : 1;
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

  const setMatchingMode = useCallback(
    (mode) => {
      updateAppState((currentState) => ({
        ...currentState,
        matchingMode: mode,
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
    appState,
    form,
    setForm,
    syncStatus,
    lastSyncedAt,
    playersById,
    liveMatchesById,
    onCourtIds,
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
    setMatchingMode,
    setCourtRate,
    updateShuttleCount,
    setShuttleCost,
    addCourt,
    removeCourt,
    handleSubmit,
  };
}
