const MEMPALACE_URL = 'https://mempalace.onioko.com'
const MEMOS_URL = 'https://memos-local.onioko.com'
const SUPABASE_URL = 'https://wofklmwbokdjoqlstjmy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmtsbXdib2tkam9xbHN0am15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzMjkxMjUsImV4cCI6MjA1MzkwNTEyNX0.placeholder'

// ============================================
// MemPalace API
// ============================================

export async function fetchPalaceStatus() {
  try {
    const res = await fetch(`${MEMPALACE_URL}/status`)
    return await res.json()
  } catch {
    return null
  }
}

export async function searchPalace(query: string, wing?: string, room?: string) {
  try {
    const res = await fetch(`${MEMPALACE_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, wing, room }),
    })
    return await res.json()
  } catch {
    return { results: [] }
  }
}

export async function readDiary(agent: string, lastN: number = 10) {
  try {
    const res = await fetch(`${MEMPALACE_URL}/diary/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent, last_n: lastN }),
    })
    return await res.json()
  } catch {
    return { entries: [] }
  }
}

// ============================================
// MemOS Local API
// ============================================

export async function searchMemOS(userId: string, query: string) {
  try {
    const res = await fetch(`${MEMOS_URL}/product/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, query }),
    })
    return await res.json()
  } catch {
    return { results: [] }
  }
}

export async function getMemOSAll(userId: string) {
  try {
    const res = await fetch(`${MEMOS_URL}/product/get_all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, memory_type: 'text_mem' }),
    })
    return await res.json()
  } catch {
    return { results: [] }
  }
}

// ============================================
// Supabase REST API
// ============================================

async function supabaseGet(table: string, params?: string) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/${table}${params ? '?' + params : ''}`
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
    return await res.json()
  } catch {
    return []
  }
}

export async function fetchContacts(ownerId?: string) {
  const params = ownerId ? `owner_id=eq.${ownerId}&select=*` : 'select=*'
  return supabaseGet('wa_contacts', params)
}

export async function fetchMemories(contactId?: string) {
  const params = contactId
    ? `contact_id=eq.${contactId}&select=*&order=created_at.desc`
    : 'select=*&order=created_at.desc&limit=50'
  return supabaseGet('wa_memories', params)
}

export async function fetchConversationMemory(contactId?: string) {
  const params = contactId
    ? `contact_id=eq.${contactId}&select=*&order=updated_at.desc`
    : 'select=*&order=updated_at.desc&limit=50'
  return supabaseGet('wa_conversation_memory', params)
}

// ============================================
// Avatar definitions (static for now)
// ============================================

export interface Avatar {
  slug: string
  name: string
  role: string
  wingNumber: number
}

export const AVATARS: Avatar[] = [
  { slug: 'trace-flores', name: 'Trace Flores', role: 'Business strategist, pattern architect', wingNumber: 1 },
  { slug: 'juan-schubert', name: 'Juan Schubert', role: 'Extended human, digital twin', wingNumber: 2 },
  { slug: 'adri-kastel', name: 'Adri Kastel', role: 'Growth expert, scaling mentor', wingNumber: 3 },
  { slug: 'prof-brian-cox', name: 'Prof. Brian Cox', role: 'Science communicator, educator', wingNumber: 4 },
  { slug: 'clara-fontaine', name: 'Clara Fontaine', role: 'Executive communication coach', wingNumber: 5 },
  { slug: 'elena-navarro', name: 'Elena Navarro', role: 'Avatar in development', wingNumber: 6 },
]

export const ROOMS = [
  'business', 'personal', 'growth', 'challenges', 'wins', 'behavioral', 'avatar-diary'
] as const

export type RoomName = typeof ROOMS[number]

export const ROOM_DESCRIPTIONS: Record<RoomName, string> = {
  'business': 'Strategy, launches, pricing, revenue, scaling, market positioning, client acquisition, competitive landscape.',
  'personal': 'Identity, self-image, inner conflicts, values, beliefs, relationships, vulnerability, authenticity, boundaries.',
  'growth': 'Development, progress, skill acquisition, habit formation, mindset shifts, transformation, confidence building.',
  'challenges': 'Problems, mental blocks, fears, procrastination, self-sabotage, imposter syndrome, overwhelm, setbacks.',
  'wins': 'Achievements, celebrations, revenue milestones, goals reached, courage moments, overcoming fears, successful launches.',
  'behavioral': 'OPM perception observations, voice patterns, micro-expressions, emotional baselines, congruence, stress indicators.',
  'avatar-diary': 'The avatar own reflections, learnings, acquired skills, recognized patterns, evolved strategies, professional growth.',
}

export const HALLS = ['decision', 'discovery', 'event', 'problem', 'preference', 'pattern', 'shift', 'contradiction'] as const
