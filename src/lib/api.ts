// MemPalace and MemOS are reached through same-origin /api/* proxies.
// Production: Vercel rewrites in vercel.json.
// Development: Vite server.proxy in vite.config.ts.
// This keeps the browser same-origin (no CORS preflights) and lets us lock
// the upstream servers behind an IP allowlist if we want.
const MEMPALACE_URL = "/api/palace";
const MEMOS_URL = "/api/memos";

const SUPABASE_URL = "https://wofklmwbokdjoqlstjmy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmtsbXdib2tkam9xbHN0am15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4Njg5MywiZXhwIjoyMDg4NTYyODkzfQ.KP7WfK31eJwUCa_-vTjFsCDO400OMFKhN_m8FtCvqL4";

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
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  return await r.json();
}

export async function fetchContacts() {
  try { return await supabase("wa_contacts", "select=*&order=updated_at.desc&limit=100"); } catch { return []; }
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
