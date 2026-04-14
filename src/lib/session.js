export const SESSION_LIST_KEY_PREFIX = "queueing-session-list-v1";
export const ACTIVE_SESSION_KEY_PREFIX = "queueing-active-session-v1";

export const DEFAULT_SESSION_ENTRY = {
  id: "main",
  name: "Main",
  code: "",
  remoteSnapshotId: null,
};

export function getSessionIndexSnapshotId(userId) {
  return `user-${userId}-sessions-index`;
}

export function getSessionSnapshotId(userId, sessionName) {
  const slug = String(sessionName ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

  return `user-${userId}-sessions-${slug || "session"}`;
}

export function getSessionCodeSnapshotId(code) {
  return `session-code-${code}`;
}

export function generateSessionCode(existingCodes = new Set()) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 50; attempt += 1) {
    let code = "";
    for (let index = 0; index < 6; index += 1) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    if (!existingCodes.has(code)) {
      return code;
    }
  }

  return Math.random()
    .toString(36)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6)
    .padEnd(6, "X");
}

export function createSessionIdentifier(name) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

  return `${slug || "session"}-${Date.now().toString(36)}`;
}

export function normalizeSessionEntry(session) {
  return {
    id: String(session?.id ?? ""),
    name: String(session?.name ?? "Untitled"),
    code: String(session?.code ?? "").toUpperCase(),
    remoteSnapshotId:
      typeof session?.remoteSnapshotId === "string"
        ? session.remoteSnapshotId
        : null,
  };
}
