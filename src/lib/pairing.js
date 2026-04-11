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
  // Total matches played by this combo — lower means we're picking players
  // who have played less, ensuring nobody is left behind.
  const totalPlayed = matchesPlayed.reduce((s, n) => s + n, 0);
  const beginnerProtected =
    levels.includes(LEVEL_VALUES.Beginner) && levelSpread > 1 ? 1 : 0;
  const teamPlan = buildBalancedTeams(playerIds, playersById, mode);

  // Prefer combos that include under-played players
  const totalPlayedWeight = 50;
  // Queue position weight — prioritises players who have been waiting longer
  const queueWeight = 8;

  let score;
  if (mode === "winners-vs-losers") {
    // Group by win rate — small spread in win-rate is best
    const rates = players.map((p) => getWinRate(p));
    const rateSpread = Math.max(...rates) - Math.min(...rates);
    score =
      rateSpread * 100 +
      totalPlayed * totalPlayedWeight +
      teamPlan.teamDelta * 4 +
      queuePenalty * queueWeight;
  } else if (mode === "skill-separated") {
    // Minimize level spread so similar tiers play together
    score =
      levelSpread * 100 +
      totalPlayed * totalPlayedWeight +
      teamPlan.teamDelta * 4 +
      queuePenalty * queueWeight +
      beginnerProtected * 50;
  } else {
    // auto-balanced (default): balance teams by mixing skills
    score =
      levelSpread * 60 +
      totalPlayed * totalPlayedWeight +
      teamPlan.teamDelta * 4 +
      queuePenalty * queueWeight +
      beginnerProtected * 35;
  }

  return { score, teamPlan, levelSpread, fairnessSpread };
}

export function getSuggestedMatch(
  queue,
  playersById,
  mode = "auto-balanced",
  matchHistory = [],
) {
  if (queue.length < 4) {
    return null;
  }

  // Enforce 1-game rest: find player IDs from the most recently finished match.
  // Those players must sit out at least one game before being paired again.
  const finishedMatches = matchHistory
    .filter((m) => m.status === "finished" && m.endedAt)
    .sort((a, b) => b.endedAt.localeCompare(a.endedAt));
  const restingIds = new Set(
    finishedMatches.length > 0 ? finishedMatches[0].playerIds : [],
  );

  // Eligible = queue members not resting. Fall back to full queue if too few.
  const eligible = queue.filter((id) => !restingIds.has(id));
  const pool = eligible.length >= 4 ? eligible : queue;

  // Always include players who have played the fewest matches so nobody gets
  // stuck watching.  Start with the front of the pool (waiting longest), then
  // pull in anyone with the minimum match count who isn't already included.
  const windowIds = pool.slice(0, Math.min(pool.length, PAIRING_WINDOW));
  const windowSet = new Set(windowIds);
  const minPlayed = Math.min(
    ...pool.map((id) => playersById[id]?.matchesPlayed ?? 0),
  );
  for (const id of pool) {
    if (windowSet.size >= pool.length) break;
    if (
      !windowSet.has(id) &&
      (playersById[id]?.matchesPlayed ?? 0) <= minPlayed
    ) {
      windowSet.add(id);
    }
  }
  const candidateIds = [...windowSet];
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

export function getTopSuggestions(
  queue,
  playersById,
  mode = "auto-balanced",
  matchHistory = [],
  limit = 10,
) {
  if (queue.length < 4) return [];

  const finishedMatches = matchHistory
    .filter((m) => m.status === "finished" && m.endedAt)
    .sort((a, b) => b.endedAt.localeCompare(a.endedAt));
  const restingIds = new Set(
    finishedMatches.length > 0 ? finishedMatches[0].playerIds : [],
  );

  const eligible = queue.filter((id) => !restingIds.has(id));
  const pool = eligible.length >= 4 ? eligible : queue;

  const windowIds = pool.slice(0, Math.min(pool.length, PAIRING_WINDOW));
  const windowSet = new Set(windowIds);
  const minPlayed = Math.min(
    ...pool.map((id) => playersById[id]?.matchesPlayed ?? 0),
  );
  for (const id of pool) {
    if (windowSet.size >= pool.length) break;
    if (
      !windowSet.has(id) &&
      (playersById[id]?.matchesPlayed ?? 0) <= minPlayed
    ) {
      windowSet.add(id);
    }
  }
  const candidateIds = [...windowSet];
  const combinations = getCombinationChoices(candidateIds, 4);
  const scored = [];

  combinations.forEach((playerIds) => {
    const players = playerIds
      .map((playerId) => playersById[playerId])
      .filter(Boolean);
    if (players.length !== 4) return;

    const { score, teamPlan, levelSpread, fairnessSpread } = scoreCombo(
      playerIds,
      players,
      queue,
      playersById,
      mode,
    );

    scored.push({
      playerIds,
      teams: teamPlan.teams,
      metrics: { levelSpread, fairnessSpread, windowSize: candidateIds.length },
      score,
    });
  });

  scored.sort((a, b) => a.score - b.score);

  return scored.slice(0, limit).map((match) => ({
    ...match,
    summary: describeSuggestedMatch(
      match.playerIds,
      playersById,
      match.metrics,
      mode,
    ),
  }));
}
