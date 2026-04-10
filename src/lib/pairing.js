import { LEVEL_VALUES, PAIRING_WINDOW } from "./constants";

export function getLevelValue(level) {
  return LEVEL_VALUES[level] ?? LEVEL_VALUES.Intermediate;
}

function getWinRate(player) {
  const total = (player?.wins ?? 0) + (player?.losses ?? 0);
  return total === 0 ? 0.5 : player.wins / total;
}

export function uniqueIds(ids) {
  return [...new Set(ids)];
}

export function buildPlayersById(players) {
  return Object.fromEntries(players.map((player) => [player.id, player]));
}

export function buildBalancedTeams(playerIds, playersById, mode) {
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

    let score;
    if (mode === "winners-vs-losers") {
      // For W-v-L: balance teams by win-rate so each game is competitive
      const teamARate = teamA.reduce(
        (s, id) => s + getWinRate(playersById[id]),
        0,
      );
      const teamBRate = teamB.reduce(
        (s, id) => s + getWinRate(playersById[id]),
        0,
      );
      score =
        Math.abs(teamARate - teamBRate) * 20 +
        Math.abs(teamAMatches - teamBMatches);
    } else {
      score =
        Math.abs(teamAStrength - teamBStrength) * 10 +
        Math.abs(teamAMatches - teamBMatches);
    }

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

function describeSuggestedMatch(playerIds, playersById, metrics, mode) {
  const levels = uniqueIds(
    playerIds.map((playerId) => playersById[playerId]?.level),
  ).join(", ");

  if (mode === "winners-vs-losers") {
    const rates = playerIds.map((id) => getWinRate(playersById[id]));
    const avg = (
      (rates.reduce((s, r) => s + r, 0) / rates.length) *
      100
    ).toFixed(0);
    return `Winners-vs-losers match (avg win rate ${avg}%) from the first ${metrics.windowSize} queued. Levels: ${levels}.`;
  }
  if (mode === "skill-separated") {
    return `Skill-separated match keeping similar tiers together from the first ${metrics.windowSize} queued. Levels: ${levels}.`;
  }
  const rangeSummary =
    metrics.levelSpread === 0 ? "same-skill block" : "mixed-skill block";
  return `${rangeSummary} from the first ${metrics.windowSize} queued players, tuned for tighter level balance across both teams. Levels: ${levels}.`;
}

function scoreCombo(playerIds, players, queue, playersById, mode) {
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
  const teamPlan = buildBalancedTeams(playerIds, playersById, mode);

  // Equal-play is heavily weighted in all modes so everyone plays the same amount
  const equalPlayWeight = 40;

  let score;
  if (mode === "winners-vs-losers") {
    // Group by win rate — small spread in win-rate is best
    const rates = players.map((p) => getWinRate(p));
    const rateSpread = Math.max(...rates) - Math.min(...rates);
    score =
      rateSpread * 100 +
      fairnessSpread * equalPlayWeight +
      teamPlan.teamDelta * 4 +
      queuePenalty * 3;
  } else if (mode === "skill-separated") {
    // Minimize level spread so similar tiers play together
    score =
      levelSpread * 100 +
      fairnessSpread * equalPlayWeight +
      teamPlan.teamDelta * 4 +
      queuePenalty * 3 +
      beginnerProtected * 50;
  } else {
    // auto-balanced (default): balance teams by mixing skills
    score =
      levelSpread * 60 +
      fairnessSpread * equalPlayWeight +
      teamPlan.teamDelta * 4 +
      queuePenalty * 3 +
      beginnerProtected * 35;
  }

  return { score, teamPlan, levelSpread, fairnessSpread };
}

export function getSuggestedMatch(queue, playersById, mode = "auto-balanced") {
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

    const { score, teamPlan, levelSpread, fairnessSpread } = scoreCombo(
      playerIds,
      players,
      queue,
      playersById,
      mode,
    );

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
      mode,
    ),
  };
}
