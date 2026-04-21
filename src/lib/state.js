import { STORAGE_KEY } from "./constants";
import { buildBalancedTeams, buildPlayersById, uniqueIds } from "./pairing";

const STRICT_LEVEL_CHOICES = new Set([
  "advanced-only",
  "intermediate-only",
  "beginner-only",
  "mixed-levels",
]);

export function createDefaultPlayers() {
  return [
    {
      id: 1,
      name: "Jorrel",
      level: "Advanced",
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
    },
    {
      id: 2,
      name: "Jeffrey",
      level: "Advanced",
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
    },
    {
      id: 3,
      name: "Xianney",
      level: "Advanced",
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
    },
    {
      id: 4,
      name: "Ericka",
      level: "Beginner",
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
    },
  ];
}

export function createDefaultState() {
  return {
    updatedAt: new Date().toISOString(),
    players: createDefaultPlayers(),
    queue: [5, 6, 7, 8, 9, 10],
    courts: [
      { id: "court-1", name: "Court 1", currentMatchId: "seed-match-1" },
      { id: "court-2", name: "Court 2", currentMatchId: null },
    ],
    notes: "",
    matchHistory: [
      {
        id: "seed-match-1",
        courtId: "court-1",
        status: "live",
        startedAt: "2026-04-10T18:10:00.000Z",
        endedAt: null,
        playerIds: [1, 2, 3, 4],
        teams: [
          [1, 2],
          [3, 4],
        ],
        score: { teamA: 9, teamB: 7 },
        winnerTeam: null,
        summary:
          "Balanced opener using mixed intermediate and advanced players.",
      },
    ],
  };
}

export function createFreshSessionState() {
  return {
    updatedAt: new Date().toISOString(),
    players: [],
    registrationsLocked: false,
    queue: [],
    courts: [{ id: "court-1", name: "Court 1", currentMatchId: null }],
    notes: "",
    matchHistory: [],
    matchingMode: "auto-balanced",
    strictLevelChoice: "mixed-levels",
    manualPairing: { teamA: [], teamB: [] },
    shuttleCount: 0,
    shuttleCost: 0,
  };
}

function normalizePlayer(player) {
  const parsedId = Number(player?.id);

  if (!Number.isFinite(parsedId)) {
    return null;
  }

  const level = ["Beginner", "Intermediate", "Advanced"].includes(player?.level)
    ? player.level
    : "Intermediate";

  return {
    id: parsedId,
    name: String(player?.name ?? `Player ${parsedId}`),
    level,
    matchesPlayed: Math.max(0, Number(player?.matchesPlayed ?? 0)),
    wins: Math.max(0, Number(player?.wins ?? 0)),
    losses: Math.max(0, Number(player?.losses ?? 0)),
  };
}

function recalculatePlayerStats(players, matchHistory) {
  const playerStatsById = Object.fromEntries(
    players.map((player) => [
      player.id,
      {
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
      },
    ]),
  );

  matchHistory.forEach((match) => {
    if (match.status !== "cancelled") {
      match.playerIds.forEach((playerId) => {
        if (playerStatsById[playerId]) {
          playerStatsById[playerId].matchesPlayed += 1;
        }
      });
    }

    if (match.status !== "finished" || match.winnerTeam === null) {
      return;
    }

    const winningTeam = match.teams[match.winnerTeam] ?? [];

    match.playerIds.forEach((playerId) => {
      if (!playerStatsById[playerId]) {
        return;
      }

      if (winningTeam.includes(playerId)) {
        playerStatsById[playerId].wins += 1;
        return;
      }

      playerStatsById[playerId].losses += 1;
    });
  });

  return players.map((player) => ({
    ...player,
    ...playerStatsById[player.id],
  }));
}

function normalizeMatch(match, playersById) {
  const playerIds = uniqueIds(
    Array.isArray(match?.playerIds)
      ? match.playerIds.map(Number).filter(Number.isFinite)
      : [],
  );

  if (playerIds.length !== 4) {
    return null;
  }

  const teamPlan =
    Array.isArray(match?.teams) && match.teams.length === 2
      ? match.teams.map((team) => team.map(Number).filter(Number.isFinite))
      : buildBalancedTeams(playerIds, playersById).teams;

  return {
    id: String(match?.id ?? `match-${playerIds.join("-")}`),
    courtId: String(match?.courtId ?? ""),
    status:
      match?.status === "cancelled" || match?.status === "finished"
        ? match.status
        : "live",
    startedAt: match?.startedAt ?? new Date().toISOString(),
    endedAt: match?.endedAt ?? null,
    playerIds,
    teams: teamPlan,
    score: {
      teamA: Math.max(0, Number(match?.score?.teamA ?? 0)),
      teamB: Math.max(0, Number(match?.score?.teamB ?? 0)),
    },
    winnerTeam: typeof match?.winnerTeam === "number" ? match.winnerTeam : null,
    summary: String(match?.summary ?? ""),
  };
}

export function normalizeState(rawState) {
  const fallback = createDefaultState();
  const baseState =
    rawState && typeof rawState === "object" ? rawState : fallback;
  const players = (
    Array.isArray(baseState.players) ? baseState.players : fallback.players
  )
    .map(normalizePlayer)
    .filter(Boolean);
  const playersById = buildPlayersById(players);

  let matchHistory = Array.isArray(baseState.matchHistory)
    ? baseState.matchHistory
        .map((match) => normalizeMatch(match, playersById))
        .filter(Boolean)
    : [];

  if (matchHistory.length === 0 && Array.isArray(baseState.courts)) {
    matchHistory = baseState.courts
      .filter(
        (court) => Array.isArray(court?.players) && court.players.length === 4,
      )
      .map((court) => {
        const playerIds = court.players.map(Number).filter(Number.isFinite);

        return normalizeMatch(
          {
            id: `legacy-${court.id}`,
            courtId: court.id,
            status: "live",
            startedAt: new Date().toISOString(),
            playerIds,
            teams: buildBalancedTeams(playerIds, playersById).teams,
            score: { teamA: 0, teamB: 0 },
          },
          playersById,
        );
      })
      .filter(Boolean);
  }

  const playersWithStats = recalculatePlayerStats(players, matchHistory);

  const liveMatchIdsByCourt = Object.fromEntries(
    matchHistory
      .filter((match) => match.status === "live")
      .map((match) => [match.courtId, match.id]),
  );

  const courts = (
    Array.isArray(baseState.courts) ? baseState.courts : fallback.courts
  ).map((court) => ({
    id: String(court?.id ?? ""),
    name: String(court?.name ?? "Court"),
    currentMatchId:
      court?.currentMatchId ?? liveMatchIdsByCourt[court?.id] ?? null,
    startedAt: court?.startedAt ?? null,
    hourlyRate: Math.max(0, Number(court?.hourlyRate) || 0),
    hoursUsed: Math.max(0, Number(court?.hoursUsed) || 0),
  }));

  const onCourtIds = new Set(
    courts
      .map((court) =>
        matchHistory.find(
          (match) =>
            match.id === court.currentMatchId && match.status === "live",
        ),
      )
      .filter(Boolean)
      .flatMap((match) => match.playerIds),
  );

  const queue = uniqueIds(
    (Array.isArray(baseState.queue) ? baseState.queue : fallback.queue)
      .map(Number)
      .filter((playerId) => playersById[playerId] && !onCourtIds.has(playerId)),
  );

  const queueSet = new Set(queue);
  const manualTeamA = uniqueIds(
    Array.isArray(baseState.manualPairing?.teamA)
      ? baseState.manualPairing.teamA
          .map(Number)
          .filter((id) => Number.isFinite(id) && queueSet.has(id))
      : [],
  ).slice(0, 2);
  const teamASet = new Set(manualTeamA);
  const manualTeamB = uniqueIds(
    Array.isArray(baseState.manualPairing?.teamB)
      ? baseState.manualPairing.teamB
          .map(Number)
          .filter(
            (id) =>
              Number.isFinite(id) && queueSet.has(id) && !teamASet.has(id),
          )
      : [],
  ).slice(0, 2);

  return {
    updatedAt:
      typeof baseState.updatedAt === "string"
        ? baseState.updatedAt
        : new Date().toISOString(),
    players: playersWithStats,
    registrationsLocked: Boolean(baseState.registrationsLocked),
    queue,
    courts,
    matchHistory,
    matchingMode:
      typeof baseState.matchingMode === "string"
        ? baseState.matchingMode
        : "auto-balanced",
    strictLevelChoice: STRICT_LEVEL_CHOICES.has(baseState.strictLevelChoice)
      ? baseState.strictLevelChoice
      : "mixed-levels",
    manualPairing: {
      teamA: manualTeamA,
      teamB: manualTeamB,
    },
    shuttleCount: Math.max(0, Math.floor(Number(baseState.shuttleCount) || 0)),
    shuttleCost: Math.max(0, Number(baseState.shuttleCost) || 0),
    notes: typeof baseState.notes === "string" ? baseState.notes : "",
  };
}

export function loadLocalSnapshot(storageKey = STORAGE_KEY) {
  if (typeof window === "undefined") {
    return createDefaultState();
  }

  try {
    const storedValue = window.localStorage.getItem(storageKey);

    if (!storedValue) {
      return createDefaultState();
    }

    return normalizeState(JSON.parse(storedValue));
  } catch {
    return createDefaultState();
  }
}

export function createMatchId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `match-${Date.now()}`;
}

export function getCurrentTimeLabel(value = new Date().toISOString()) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function getElapsedTimeLabel(startedAt, nowMs = Date.now()) {
  const startedMs = new Date(startedAt).getTime();
  if (!Number.isFinite(startedMs)) {
    return "0m";
  }

  const elapsedMs = Math.max(0, nowMs - startedMs);
  const totalMinutes = Math.floor(elapsedMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export function getSnapshotLabel(timestamp) {
  if (!timestamp) {
    return "Not synced yet";
  }

  return `${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp))}`;
}
