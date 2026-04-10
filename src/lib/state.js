import { STORAGE_KEY } from "./constants";
import { buildBalancedTeams, buildPlayersById, uniqueIds } from "./pairing";

export function createDefaultPlayers() {
  return [
    {
      id: 1,
      name: "Aiden",
      level: "Advanced",
      matchesPlayed: 3,
      wins: 2,
      losses: 1,
    },
    {
      id: 2,
      name: "Bianca",
      level: "Intermediate",
      matchesPlayed: 2,
      wins: 1,
      losses: 1,
    },
    {
      id: 3,
      name: "Carlos",
      level: "Advanced",
      matchesPlayed: 2,
      wins: 1,
      losses: 1,
    },
    {
      id: 4,
      name: "Dina",
      level: "Intermediate",
      matchesPlayed: 2,
      wins: 1,
      losses: 1,
    },
    {
      id: 5,
      name: "Ethan",
      level: "Beginner",
      matchesPlayed: 1,
      wins: 0,
      losses: 1,
    },
    {
      id: 6,
      name: "Farah",
      level: "Intermediate",
      matchesPlayed: 1,
      wins: 1,
      losses: 0,
    },
    {
      id: 7,
      name: "Gio",
      level: "Advanced",
      matchesPlayed: 1,
      wins: 0,
      losses: 1,
    },
    {
      id: 8,
      name: "Hana",
      level: "Intermediate",
      matchesPlayed: 1,
      wins: 1,
      losses: 0,
    },
    {
      id: 9,
      name: "Ivan",
      level: "Beginner",
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
    },
    {
      id: 10,
      name: "Jules",
      level: "Intermediate",
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

  return {
    updatedAt:
      typeof baseState.updatedAt === "string"
        ? baseState.updatedAt
        : new Date().toISOString(),
    players,
    queue,
    courts,
    matchHistory,
  };
}

export function loadLocalSnapshot() {
  if (typeof window === "undefined") {
    return createDefaultState();
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

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
