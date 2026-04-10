import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const snapshotTable =
  import.meta.env.VITE_SUPABASE_TABLE || "queueing_snapshots";
const snapshotId =
  import.meta.env.VITE_SUPABASE_SNAPSHOT_ID || "badminton-main";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function fetchRemoteSnapshot() {
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

export async function saveRemoteSnapshot(snapshot) {
  if (!supabase) {
    return { error: null };
  }

  const { error } = await supabase.from(snapshotTable).upsert(
    {
      id: snapshotId,
      payload: snapshot,
      updated_at: snapshot.updatedAt,
    },
    { onConflict: "id" },
  );

  return { error };
}

/**
 * Subscribe to real-time changes on the snapshot row.
 * Returns an unsubscribe function. Calls `onSnapshot(payload)` when
 * another device writes to the same snapshot row.
 */
export function subscribeToSnapshot(onSnapshot) {
  if (!supabase) {
    return () => {};
  }

  const channel = supabase
    .channel("snapshot-sync")
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
