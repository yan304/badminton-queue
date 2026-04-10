import { LEVEL_VALUES, PAIRING_WINDOW } from "./constants";

export function getLevelValue(level) {
  return LEVEL_VALUES[level] ?? LEVEL_VALUES.Intermediate;
}

export function uniqueIds(ids) {
  return [...new Set(ids)];
}

export function buildPlayersById(players) {
  return Object.fromEntries(players.map((player) => [player.id, player]));
}

export function buildBalancedTeams(playerIds, playersById) {
  if (playerIds.length !== 4) {
    return {
      teams: [playerIds.slice(0, 2), playerIds.slice(2)],
      teamDelta: 0,
    };
  }

  const pairings = [
    [
      [playerIds[0], playerIds[1]],
      [playerIds[2], playerIds[3]],
    ],
    [
      [playerIds[0], playerIds[2]],
      [playerIds[1], playerIds[3]],
    ],
    [
      [playerIds[0], playerIds[3]],
      [playerIds[1], playerIds[2]],
    ],
  ];

  let bestPairing = pairings[0];
  let bestScore = Number.POSITIVE_INFINITY;

  pairings.forEach((pairing) => {
    const [teamA, teamB] = pairing;
    const teamAStrength = teamA.reduce(
      (sum, playerId) => sum + getLevelValue(playersById[playerId]?.level),
      0,
    );
    const teamBStrength = teamB.reduce(
      (sum, playerId) => sum + getLevelValue(playersById[playerId]?.level),
      0,
    );
    const teamAMatches = teamA.reduce(
      (sum, playerId) => sum + (playersById[playerId]?.matchesPlayed ?? 0),
      0,
    );
    const teamBMatches = teamB.reduce(
      (sum, playerId) => sum + (playersById[playerId]?.matchesPlayed ?? 0),
      0,
    );
    const score =
      Math.abs(teamAStrength - teamBStrength) * 10 +
      Math.abs(teamAMatches - teamBMatches);

    if (score < bestScore) {
      bestPairing = pairing;
      bestScore = score;
    }
  });

  return {
    teams: bestPairing,
    teamDelta: bestScore,
  };
}

function getCombinationChoices(items, size) {
  const combinations = [];

  function walk(startIndex, current) {
    if (current.length === size) {
      combinations.push(current);
      return;
    }

    for (let index = startIndex; index < items.length; index += 1) {
      walk(index + 1, [...current, items[index]]);
    }
  }

  walk(0, []);
  return combinations;
}

function describeSuggestedMatch(playerIds, playersById, metrics) {
  const levels = uniqueIds(
    playerIds.map((playerId) => playersById[playerId]?.level),
  ).join(", ");
  const rangeSummary =
    metrics.levelSpread === 0 ? "same-skill block" : "mixed-skill block";

  return `${rangeSummary} from the first ${metrics.windowSize} queued players, tuned for tighter level balance across both teams. Levels: ${levels}.`;
}

export function getSuggestedMatch(queue, playersById) {
  if (queue.length < 4) {
    return null;
  }

  const candidateIds = queue.slice(0, Math.min(queue.length, PAIRING_WINDOW));
  const combinations = getCombinationChoices(candidateIds, 4);
  let bestMatch = null;
  let bestScore = Number.POSITIVE_INFINITY;

  combinations.forEach((playerIds) => {
    const players = playerIds
      .map((playerId) => playersById[playerId])
      .filter(Boolean);

    if (players.length !== 4) {
      return;
    }

    const queuePenalty = playerIds.reduce(
      (sum, playerId) => sum + queue.indexOf(playerId),
      0,
    );
    const levels = players.map((player) => getLevelValue(player.level));
    const matchesPlayed = players.map((player) => player.matchesPlayed);
    const levelSpread = Math.max(...levels) - Math.min(...levels);
    const fairnessSpread =
      Math.max(...matchesPlayed) - Math.min(...matchesPlayed);
    const beginnerProtected =
      levels.includes(LEVEL_VALUES.Beginner) && levelSpread > 1 ? 1 : 0;
    const teamPlan = buildBalancedTeams(playerIds, playersById);
    const score =
      levelSpread * 60 +
      fairnessSpread * 10 +
      teamPlan.teamDelta * 4 +
      queuePenalty * 3 +
      beginnerProtected * 35;

    if (score < bestScore) {
      bestScore = score;
      bestMatch = {
        playerIds,
        teams: teamPlan.teams,
        metrics: {
          levelSpread,
          fairnessSpread,
          windowSize: candidateIds.length,
        },
      };
    }
  });

  if (!bestMatch) {
    return null;
  }

  return {
    ...bestMatch,
    summary: describeSuggestedMatch(
      bestMatch.playerIds,
      playersById,
      bestMatch.metrics,
    ),
  };
}
