import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON;
const snapshotTable =
  import.meta.env.VITE_SUPABASE_TABLE || "queueing_snapshots";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function fetchRemoteSnapshot(snapshotId) {
  if (!supabase) {
    return { snapshot: null, error: null };
  }

  const { data, error } = await supabase
    .from(snapshotTable)
    .select("payload, updated_at")
    .eq("id", snapshotId)
    .maybeSingle();

  if (error) {
    return { snapshot: null, error };
  }

  return {
    snapshot: data?.payload
      ? {
          ...data.payload,
          updatedAt: data.payload.updatedAt ?? data.updated_at,
        }
      : null,
    error: null,
  };
}

export async function fetchRemoteSnapshotByCode(code) {
  if (!supabase) {
    return {
      snapshot: null,
      snapshotId: null,
      name: null,
      code: null,
      error: null,
    };
  }

  const normalizedCode = String(code ?? "")
    .trim()
    .toUpperCase();
  const { data, error } = await supabase
    .from(snapshotTable)
    .select("id, payload, updated_at, name, code")
    .eq("code", normalizedCode)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    return {
      snapshot: null,
      snapshotId: null,
      name: null,
      code: null,
      error,
    };
  }

  const row = data?.[0] ?? null;
  return {
    snapshot: row?.payload
      ? {
          ...row.payload,
          updatedAt: row.payload.updatedAt ?? row.updated_at,
        }
      : null,
    snapshotId: row?.id ?? null,
    name: row?.name ?? null,
    code: row?.code ?? null,
    scheduledDate: String(row?.payload?.sessionSchedule?.date ?? ""),
    scheduledTime: String(row?.payload?.sessionSchedule?.time ?? ""),
    error: null,
  };
}

export async function fetchRemoteSessionsByUser(userId) {
  if (!supabase) {
    return { sessions: [], error: null };
  }

  const idPrefix = `user-${userId}-sessions-`;
  const { data, error } = await supabase
    .from(snapshotTable)
    .select("id, name, code, updated_at, payload")
    .like("id", `${idPrefix}%`)
    .order("updated_at", { ascending: false });

  if (error) {
    return { sessions: [], error };
  }

  const sessions = (data ?? [])
    .map((row) => {
      const fallbackName = String(row.id ?? "")
        .replace(idPrefix, "")
        .replace(/-/g, " ")
        .trim();

      return {
        id: String(row.id ?? ""),
        name: String(row.name ?? fallbackName ?? "Session"),
        code: String(row.code ?? "").toUpperCase(),
        scheduledDate: String(row.payload?.sessionSchedule?.date ?? ""),
        scheduledTime: String(row.payload?.sessionSchedule?.time ?? ""),
        remoteSnapshotId: String(row.id ?? ""),
      };
    })
    .filter((session) => !session.id.endsWith("-sessions-index"));

  return { sessions, error: null };
}

export async function saveRemoteSnapshot(snapshotId, snapshot, metadata = {}) {
  if (!supabase) {
    return { error: null };
  }

  const row = {
    id: snapshotId,
    payload: snapshot,
    updated_at: snapshot.updatedAt,
  };

  if (typeof metadata.code === "string") {
    row.code = metadata.code;
  }

  if (typeof metadata.name === "string") {
    row.name = metadata.name;
  }

  const { error } = await supabase
    .from(snapshotTable)
    .upsert(row, { onConflict: "id" });

  return { error };
}

/**
 * Subscribe to real-time changes on the snapshot row.
 * Returns an unsubscribe function. Calls `onSnapshot(payload)` when
 * another device writes to the same snapshot row.
 */
export function subscribeToSnapshot(snapshotId, onSnapshot) {
  if (!supabase) {
    return () => {};
  }

  const uniqueSuffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const channelName = `snapshot-sync-${snapshotId}-${uniqueSuffix}`;

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: snapshotTable,
        filter: `id=eq.${snapshotId}`,
      },
      (payload) => {
        const row = payload.new;
        if (row?.payload) {
          onSnapshot({
            ...row.payload,
            updatedAt: row.payload.updatedAt ?? row.updated_at,
          });
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
