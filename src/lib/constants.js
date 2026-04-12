export const STORAGE_KEY = "badminton-queue-state-v2";
export const PAIRING_WINDOW = 8;

export const LEVEL_VALUES = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
};

export const levelStyles = {
  Beginner: "bg-sky-100 text-sky-800 ring-sky-200",
  Intermediate: "bg-amber-100 text-amber-800 ring-amber-200",
  Advanced: "bg-emerald-100 text-emerald-800 ring-emerald-200",
};

export const MATCHING_MODES = [
  {
    id: "auto-balanced",
    label: "Auto-balanced",
    description: "Balances teams by skill level so every game is competitive.",
  },
  {
    id: "skill-separated",
    label: "Skill-separated",
    description:
      "Keeps similar skill tiers together instead of mixing wide gaps.",
  },
  {
    id: "winners-vs-losers",
    label: "Winners vs Losers",
    description:
      "Winners face winners and losers face losers — natural ladder sorting.",
  },
];

export const statusStyles = {
  "on-court": "bg-emerald-100 text-emerald-800",
  waiting: "bg-amber-100 text-amber-900",
  idle: "bg-stone-200 text-stone-700",
};

export const WIN_RATE_RANKS = [
  {
    min: 81,
    label: "Mythical Immortal",
    style: "bg-rose-400/20 text-rose-200",
    icon: "👑",
  },
  {
    min: 76,
    label: "Mythical Glory",
    style: "bg-fuchsia-400/20 text-fuchsia-200",
    icon: "🏆",
  },
  {
    min: 71,
    label: "Mythic",
    style: "bg-violet-400/20 text-violet-200",
    icon: "💎",
  },
  {
    min: 66,
    label: "Legend",
    style: "bg-amber-400/20 text-amber-200",
    icon: "🔱",
  },
  {
    min: 61,
    label: "Epic",
    style: "bg-pink-400/20 text-pink-200",
    icon: "⚜️",
  },
  {
    min: 56,
    label: "Grandmaster",
    style: "bg-orange-400/20 text-orange-200",
    icon: "🌟",
  },
  {
    min: 51,
    label: "Master",
    style: "bg-cyan-400/20 text-cyan-200",
    icon: "⚔️",
  },
  {
    min: 46,
    label: "Elite",
    style: "bg-emerald-400/20 text-emerald-200",
    icon: "🛡️",
  },
  {
    min: 40,
    label: "Warrior",
    style: "bg-sky-400/20 text-sky-200",
    icon: "🗡️",
  },
  {
    min: 0,
    label: "Novice",
    style: "bg-white/10 text-white/60",
    icon: "🌱",
  },
];

export function getWinRateRank(wins, losses) {
  const total = wins + losses;
  if (total === 0) return null;
  const pct = (wins / total) * 100;
  return WIN_RATE_RANKS.find((r) => pct >= r.min) ?? null;
}
