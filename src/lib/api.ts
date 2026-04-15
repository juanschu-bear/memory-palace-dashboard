// MemPalace and MemOS are reached through same-origin /api/* proxies.
// Production: Vercel rewrites in vercel.json.
// Development: Vite server.proxy in vite.config.ts.
// This keeps the browser same-origin (no CORS preflights) and lets us lock
// the upstream servers behind an IP allowlist if we want.
const MEMPALACE_URL = "/api/palace";
const MEMOS_URL = "/api/memos";

// Supabase calls go through /api/supabase/ serverless proxy.
// The service_role key lives ONLY in Vercel env vars, never in the browser.
const SUPABASE_PROXY = "/api/supabase";

export async function fetchPalaceStatus() {
  try {
    const r = await fetch(`${MEMPALACE_URL}/status`);
    return await r.json();
  } catch {
    return null;
  }
}

export async function searchPalace(query: string, wing?: string, room?: string) {
  try {
    const r = await fetch(`${MEMPALACE_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, wing, room }),
    });
    return await r.json();
  } catch {
    return { results: [] };
  }
}

export async function readDiary(agent: string, last_n: number = 10) {
  try {
    const r = await fetch(`${MEMPALACE_URL}/diary/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent, last_n }),
    });
    return await r.json();
  } catch {
    return { entries: [] };
  }
}

export async function searchMemOS(user_id: string, query: string) {
  try {
    const r = await fetch(`${MEMOS_URL}/product/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, query }),
    });
    return await r.json();
  } catch {
    return { results: [] };
  }
}

export async function getMemOSAll(user_id: string) {
  try {
    const r = await fetch(`${MEMOS_URL}/product/get_all`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, memory_type: "text_mem" }),
    });
    return await r.json();
  } catch {
    return { results: [] };
  }
}

async function supabase(table: string, params: string) {
  const r = await fetch(`${SUPABASE_PROXY}/${table}?${params}`);
  return await r.json();
}

export async function fetchContacts() {
  // wa_contacts has no updated_at column — last_active_at is the canonical
  // "when did we last see them" timestamp. Ordering by updated_at returns 400.
  try { return await supabase("wa_contacts", "select=*&order=last_active_at.desc&limit=200"); } catch { return []; }
}
export async function fetchOwners() {
  try { return await supabase("wa_owners", "select=*&order=updated_at.desc&limit=200"); } catch { return []; }
}
export async function fetchConversations() {
  try { return await supabase("wa_conversations", "select=*&order=updated_at.desc&limit=500"); } catch { return []; }
}
export async function fetchMemories() {
  try { return await supabase("wa_memories", "select=*&order=created_at.desc&limit=200"); } catch { return []; }
}
export async function fetchConversationMemory() {
  try { return await supabase("wa_conversation_memory", "select=*&order=updated_at.desc&limit=200"); } catch { return []; }
}
