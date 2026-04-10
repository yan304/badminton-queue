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

export const statusStyles = {
  "on-court": "bg-emerald-100 text-emerald-800",
  waiting: "bg-amber-100 text-amber-900",
  idle: "bg-stone-200 text-stone-700",
};
