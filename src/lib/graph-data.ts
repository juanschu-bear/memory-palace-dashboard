// Data layer for the Memory Graph. Pulls wa_owners, wa_contacts, wa_memories,
// and wa_messages through the /api/supabase proxy (one call per table), then
// turns them into graph nodes/edges the way the palace actually thinks about
// them:
//
//  - Avatars are wa_owners rows. We key by owner_id (uuid) and match the
//    display_name against our seven canonical avatars (there is no
//    persona_name column on wa_owners — the old code that read one was
//    silently always null).
//  - People are NOT wa_contacts rows. A wa_contacts row is a person-avatar
//    relationship, so the same person can appear 5+ times (once per avatar
//    they've spoken with). We aggregate by email (case-insensitive, trimmed)
//    and hang every contact_id, memory, message, and session off the
//    aggregated person.
//  - Sessions are video calls via ANIMA Connect, counted by distinct
//    wa_memories.source values that match /^call-anima-api-[a-f0-9]+$/.
//    wa_conversations.count is a thread container, not a session count, so
//    we ignore it here.
//  - Memories show summary (clean) in detail panels, not raw_text (which is
//    full transcript + behavioral analysis).
import {
  fetchOwners,
  fetchMemoriesAll,
  fetchMessages,
  fetchContactsAll,
  fetchConversations,
} from "@/lib/api";
import { AVATARS, memoryTopics } from "@/lib/avatars";

export type GraphNodeKind = "memory" | "avatar" | "person";
export type MemorySourceType = "video-call" | "voice" | "text";

export interface GraphNode {
  id: string;
  kind: GraphNodeKind;
  label: string;
  avatarSlug: string | null;
  topics: string[];
  summary: string;
  persona: string | null;
  raw: any;
  degree: number;
  // Person-specific aggregates (undefined on avatar/memory nodes).
  lastActiveAt?: string;
  // Distinct video calls: unique `call-anima-api-<hex>` wa_memories.source.
  videoCallCount?: number;
  // Voice notes: wa_memories rows with source in voice-message* (polled
  // or summarized voice-note memories, not raw audio count).
  voiceNoteCount?: number;
  // User-typed chat: wa_messages where sender='contact' AND type='text'.
  chatMessageCount?: number;
  // All memory rows attributed to this person across aggregated contacts.
  memoryCount?: number;
  avatarSlugs?: string[];
  contactIds?: string[];
  email?: string;
  // Memory-specific.
  sourceType?: MemorySourceType;
  personId?: string | null;
  createdAt?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  kind: "memory-avatar" | "memory-person" | "memory-memory";
  strength: number;
}

export interface GraphDataset {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    memoryCount: number;
    avatarCount: number;
    personCount: number;
    edgeCount: number;
  };
}

// The graph renders all seven avatars, including the "Extended" Juan variant
// that the other dashboard pages omit. Defined here (not in avatars.ts) so we
// don't silently add a seventh tile to every AvatarSelector in the app.
export interface GraphAvatar {
  slug: string;
  name: string;
  role: string;
  color: string;
}

export const AVATAR_COLORS: Record<string, string> = {
  "trace-flores": "#FF4FD8",
  "juan-schubert": "#3FE0FF",
  "juan-schubert-extended": "#9CF2FF",
  "adri-kastel": "#7CFF6B",
  "prof-brian-cox": "#FFB84F",
  "clara-fontaine": "#C58BFF",
  "elena-navarro": "#FF6B6B",
};

export const GRAPH_AVATARS: GraphAvatar[] = [
  ...AVATARS.map((a) => ({
    slug: a.slug,
    name: a.name,
    role: a.role,
    color: AVATAR_COLORS[a.slug] ?? "#8A8AFF",
  })),
  {
    slug: "juan-schubert-extended",
    name: "Juan Schubert (Extended)",
    role: "Extended Digital Twin",
    color: AVATAR_COLORS["juan-schubert-extended"],
  },
];

export const KIND_COLORS = {
  avatar: "#F5F5FA",
  person: "#56E0A0",
  memoryFallback: "#8A8AFF",
};

function norm(s: unknown): string {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeEmail(raw: unknown): string {
  return String(raw ?? "").trim().toLowerCase();
}

// Avatar lookup by display_name. We do an exact normalized match first so
// "Juan Schubert" stays on juan-schubert and "Juan Schubert (Extended)"
// stays on juan-schubert-extended — substring matching alone is ambiguous
// between the two.
const AVATAR_NORM_INDEX: { slug: string; norm: string }[] = GRAPH_AVATARS.map((a) => ({
  slug: a.slug,
  norm: norm(a.name),
})).sort((a, b) => b.norm.length - a.norm.length);

function matchAvatarByDisplayName(raw: unknown): string | null {
  const n = norm(raw);
  if (!n) return null;
  for (const a of AVATAR_NORM_INDEX) {
    if (a.norm === n) return a.slug;
  }
  // Substring fallback, longest first so "juan schubert extended" is
  // preferred over "juan schubert" when both would match.
  for (const a of AVATAR_NORM_INDEX) {
    if (n.includes(a.norm) || a.norm.includes(n)) return a.slug;
  }
  return null;
}

// Sources we exclude from session counting because they're test fixtures.
// The call-anima-api-* pattern wouldn't match these anyway, but we also
// skip them when building memory nodes so they don't clutter the graph.
const TEST_SOURCE_MATCHERS: Array<(s: string) => boolean> = [
  (s) => s === "session-test",
  (s) => s === "step2-test",
  (s) => s.startsWith("maria-session"),
];

function isTestSource(source: string): boolean {
  return TEST_SOURCE_MATCHERS.some((m) => m(source));
}

const SESSION_PATTERN = /^call-anima-api-[a-f0-9]+$/;
const VOICE_SOURCES = new Set(["voice-message", "voice-message-poll"]);

function classifyMemorySource(source: string): MemorySourceType {
  if (SESSION_PATTERN.test(source)) return "video-call";
  if (VOICE_SOURCES.has(source)) return "voice";
  return "text";
}

// Memory detail panel shows summary (concise, model-written). raw_text is a
// dump of full transcript + behavioral analysis and is too noisy for the
// card. Fall back to a truncated raw_text only when summary is missing.
export function memorySummaryText(memory: any): string {
  const summary = String(memory?.summary ?? "").trim();
  if (summary) return summary;
  const raw = String(memory?.raw_text ?? "").trim();
  if (!raw) return "";
  return raw.length > 400 ? raw.slice(0, 397) + "…" : raw;
}

function memoryLabel(memory: any, topics: string[]): string {
  if (topics[0]) return topics[0];
  const summary = String(memory?.summary ?? "").trim();
  if (summary) {
    return summary.length <= 64 ? summary : summary.slice(0, 61) + "…";
  }
  return "Memory";
}

// ------- Person aggregation -------
interface PersonAgg {
  id: string;
  key: string; // email-lowercased, or fallback for rows with no email
  email: string;
  phone: string;
  contactIds: Set<string>;
  displayNameCounts: Map<string, number>;
  lastActiveAt: string;
  memoryIds: Set<string>;
  sessionSources: Set<string>;
  // Voice notes logged as memory records (source in voice-message*).
  // Not the same as the raw count of voice messages in wa_messages —
  // a single voice note can produce multiple poll/summary memories.
  voiceNoteCount: number;
  // User-typed chat messages: wa_messages where sender='contact' AND
  // type='text'. Excludes voice-note audio messages (those live under
  // voiceNoteCount) and avatar-side [Call summary] / [TTS ERROR]
  // system events (we never count those toward the person).
  chatMessageCount: number;
  avatarSlugs: Set<string>;
  topics: Map<string, number>;
  topicCasing: Map<string, string>;
}

function newPersonAgg(key: string, email: string): PersonAgg {
  return {
    id: `person:${key}`,
    key,
    email,
    phone: "",
    contactIds: new Set(),
    displayNameCounts: new Map(),
    lastActiveAt: "",
    memoryIds: new Set(),
    sessionSources: new Set(),
    voiceNoteCount: 0,
    chatMessageCount: 0,
    avatarSlugs: new Set(),
    topics: new Map(),
    topicCasing: new Map(),
  };
}

function personDisplayName(agg: PersonAgg): string {
  let best = "";
  let bestCount = -1;
  for (const [name, count] of agg.displayNameCounts) {
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  if (best) return best;
  if (agg.email) return agg.email;
  if (agg.phone) return agg.phone;
  return "Unknown person";
}

export async function loadGraphData(): Promise<GraphDataset> {
  const [ownersRaw, contactsRaw, memoriesRaw, messagesRaw, conversationsRaw] =
    await Promise.all([
      fetchOwners(),
      fetchContactsAll(),
      fetchMemoriesAll(),
      fetchMessages(),
      fetchConversations(),
    ]);
  const owners = Array.isArray(ownersRaw) ? ownersRaw : [];
  const contacts = Array.isArray(contactsRaw) ? contactsRaw : [];
  const memories = Array.isArray(memoriesRaw) ? memoriesRaw : [];
  const messages = Array.isArray(messagesRaw) ? messagesRaw : [];
  const conversations = Array.isArray(conversationsRaw) ? conversationsRaw : [];

  // wa_messages does not carry contact_id directly — it has
  // conversation_id, and wa_conversations.contact_id is the join path.
  // Build the map once so the message loop is O(n).
  const contactIdByConversationId = new Map<string, string>();
  for (const conv of conversations) {
    const convId = conv?.id ? String(conv.id) : "";
    const cid = conv?.contact_id ? String(conv.contact_id) : "";
    if (convId && cid) contactIdByConversationId.set(convId, cid);
  }

  // owner_id → avatar slug, derived from wa_owners.display_name.
  const slugByOwnerId = new Map<string, string>();
  for (const owner of owners) {
    const id = owner?.id ? String(owner.id) : "";
    if (!id) continue;
    const slug = matchAvatarByDisplayName(owner?.display_name);
    if (slug) slugByOwnerId.set(id, slug);
  }

  // Memory → avatar slug resolver. Prefer wa_memories.persona_name (cheap
  // string match) and fall back to wa_memories.owner_id → slugByOwnerId
  // (canonical) when persona_name is null.
  const avatarSlugForMemory = (memory: any): string | null => {
    const slug = matchAvatarByDisplayName(memory?.persona_name);
    if (slug) return slug;
    const ownerId = memory?.owner_id ? String(memory.owner_id) : "";
    if (ownerId && slugByOwnerId.has(ownerId)) return slugByOwnerId.get(ownerId)!;
    return null;
  };

  // Aggregate wa_contacts rows into people. Keying rules:
  //   1. Normalized email if present — all rows sharing that email are
  //      one person, even if display_name varies (e.g. a shared test
  //      mailbox reused under several names).
  //   2. Else normalized display_name (trimmed, lowercased). Different
  //      rows with the same dn and no email collapse to the same person.
  //      Rows with the same dn but DIFFERENT emails stay separate —
  //      rule #1 wins, we trust explicit email mismatches.
  //   3. Else the raw contact id (truly anonymous row, don't merge).
  const personByKey = new Map<string, PersonAgg>();
  const keyByContactId = new Map<string, string>();
  for (const contact of contacts) {
    const contactId = contact?.id ? String(contact.id) : "";
    if (!contactId) continue;
    const email = normalizeEmail(contact?.email);
    const dn = String(contact?.display_name ?? "").trim();
    const dnKey = dn.toLowerCase();
    const phone = String(contact?.phone_number ?? "").trim();
    let key: string;
    if (email) key = `email:${email}`;
    else if (dnKey) key = `name:${dnKey}`;
    else key = `contact:${contactId}`;
    let agg = personByKey.get(key);
    if (!agg) {
      agg = newPersonAgg(key, email);
      agg.phone = phone;
      personByKey.set(key, agg);
    }
    agg.contactIds.add(contactId);
    keyByContactId.set(contactId, key);
    if (dn) agg.displayNameCounts.set(dn, (agg.displayNameCounts.get(dn) ?? 0) + 1);
    const la = String(contact?.last_active_at ?? "");
    if (la && la > agg.lastActiveAt) agg.lastActiveAt = la;
  }

  // Thread memories onto their person, tracking session sources, voice
  // count, avatars spoken with, topics, and most-recent activity. We also
  // filter out test-data sources so they don't pollute the graph.
  const memoryById = new Map<string, any>();
  for (const memory of memories) {
    const memId = memory?.id ? String(memory.id) : "";
    if (!memId) continue;
    memoryById.set(memId, memory);
    const rawSource = String(memory?.source ?? "");
    if (isTestSource(rawSource)) continue;
    const contactId = memory?.contact_id ? String(memory.contact_id) : "";
    const key = contactId ? keyByContactId.get(contactId) : undefined;
    if (!key) continue;
    const agg = personByKey.get(key)!;
    agg.memoryIds.add(memId);
    if (SESSION_PATTERN.test(rawSource)) agg.sessionSources.add(rawSource);
    if (VOICE_SOURCES.has(rawSource)) agg.voiceNoteCount += 1;
    const slug = avatarSlugForMemory(memory);
    if (slug) agg.avatarSlugs.add(slug);
    for (const topic of memoryTopics(memory)) {
      const clean = String(topic).trim();
      if (!clean) continue;
      const k = clean.toLowerCase();
      agg.topics.set(k, (agg.topics.get(k) ?? 0) + 1);
      if (!agg.topicCasing.has(k)) agg.topicCasing.set(k, clean);
    }
    const created = String(memory?.created_at ?? "");
    if (created && created > agg.lastActiveAt) agg.lastActiveAt = created;
  }

  // wa_messages → per-person user-typed chat count. We only count rows
  // the CONTACT actually typed: sender='contact' AND type='text'.
  //   - Voice notes (type='voice') belong under voiceNoteCount.
  //   - Avatar-side rows include [Call summary] / [TTS ERROR] system
  //     events and TTS replies, none of which are the person's typed
  //     messages, so we skip them entirely here.
  // contact_id comes from wa_conversations; wa_messages itself does
  // not carry a contact_id column, so without the join this loop was
  // a no-op before.
  for (const msg of messages) {
    const convId = msg?.conversation_id ? String(msg.conversation_id) : "";
    const contactId = convId ? contactIdByConversationId.get(convId) : undefined;
    const key = contactId ? keyByContactId.get(contactId) : undefined;
    if (!key) continue;
    const agg = personByKey.get(key)!;
    const created = String(msg?.created_at ?? msg?.sent_at ?? "");
    if (created && created > agg.lastActiveAt) agg.lastActiveAt = created;
    if (msg?.sender === "contact" && msg?.type === "text") {
      agg.chatMessageCount += 1;
    }
  }

  // Avatar nodes (all 7).
  const avatarNodes = new Map<string, GraphNode>();
  for (const avatar of GRAPH_AVATARS) {
    const id = `avatar:${avatar.slug}`;
    avatarNodes.set(id, {
      id,
      kind: "avatar",
      label: avatar.name,
      avatarSlug: avatar.slug,
      topics: [],
      summary: avatar.role,
      persona: avatar.name,
      raw: avatar,
      degree: 0,
    });
  }

  // Person nodes.
  const personNodes = new Map<string, GraphNode>();
  for (const agg of personByKey.values()) {
    const label = personDisplayName(agg);
    const subLine = agg.email || agg.phone || "";
    personNodes.set(agg.id, {
      id: agg.id,
      kind: "person",
      label,
      avatarSlug: null,
      topics: Array.from(agg.topics.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([k]) => agg.topicCasing.get(k) ?? k),
      summary: subLine,
      persona: null,
      raw: {
        email: agg.email,
        phone: agg.phone,
        contactIds: Array.from(agg.contactIds),
      },
      degree: 0,
      lastActiveAt: agg.lastActiveAt,
      videoCallCount: agg.sessionSources.size,
      voiceNoteCount: agg.voiceNoteCount,
      chatMessageCount: agg.chatMessageCount,
      memoryCount: agg.memoryIds.size,
      avatarSlugs: Array.from(agg.avatarSlugs),
      contactIds: Array.from(agg.contactIds),
      email: agg.email,
    });
  }

  // Memory nodes.
  const memoryNodes: GraphNode[] = [];
  const topicBuckets = new Map<string, string[]>();
  for (const memory of memories) {
    const memId = memory?.id ? String(memory.id) : "";
    if (!memId) continue;
    const rawSource = String(memory?.source ?? "");
    if (isTestSource(rawSource)) continue;
    const id = `memory:${memId}`;
    const topics = memoryTopics(memory)
      .map((t) => String(t).trim())
      .filter(Boolean);
    const slug = avatarSlugForMemory(memory);
    const contactId = memory?.contact_id ? String(memory.contact_id) : "";
    const personKey = contactId ? keyByContactId.get(contactId) : undefined;
    const personId = personKey ? `person:${personKey}` : null;
    const summary = memorySummaryText(memory);
    const node: GraphNode = {
      id,
      kind: "memory",
      label: memoryLabel(memory, topics),
      avatarSlug: slug,
      topics,
      summary,
      persona: memory?.persona_name ? String(memory.persona_name) : null,
      raw: memory,
      degree: 0,
      sourceType: classifyMemorySource(rawSource),
      personId,
      createdAt: String(memory?.created_at ?? ""),
    };
    memoryNodes.push(node);
    for (const topic of topics) {
      const key = norm(topic);
      if (!key) continue;
      const bucket = topicBuckets.get(key) ?? [];
      bucket.push(id);
      topicBuckets.set(key, bucket);
    }
  }

  // Build edges.
  const edges: GraphEdge[] = [];
  const nodeById = new Map<string, GraphNode>();
  memoryNodes.forEach((n) => nodeById.set(n.id, n));
  avatarNodes.forEach((n) => nodeById.set(n.id, n));
  personNodes.forEach((n) => nodeById.set(n.id, n));

  const pushEdge = (edge: GraphEdge) => {
    const src = nodeById.get(edge.source);
    const dst = nodeById.get(edge.target);
    if (!src || !dst) return;
    edges.push(edge);
    src.degree += 1;
    dst.degree += 1;
  };

  for (const memory of memoryNodes) {
    if (memory.avatarSlug) {
      pushEdge({
        source: memory.id,
        target: `avatar:${memory.avatarSlug}`,
        kind: "memory-avatar",
        strength: 1,
      });
    }
    if (memory.personId && personNodes.has(memory.personId)) {
      pushEdge({
        source: memory.id,
        target: memory.personId,
        kind: "memory-person",
        strength: 1,
      });
    }
  }

  // Memory-memory edges: two memories sharing 2+ topics. Guard against the
  // O(n²) explosion when a single topic has a huge bucket by capping the
  // pairs we materialize per topic.
  const sharedTopicPairs = new Map<string, number>();
  const MAX_PAIRS_PER_TOPIC = 400;
  for (const ids of topicBuckets.values()) {
    if (ids.length < 2) continue;
    let pairCount = 0;
    outer: for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i];
        const b = ids[j];
        if (a === b) continue;
        const pairKey = a < b ? `${a}|${b}` : `${b}|${a}`;
        sharedTopicPairs.set(pairKey, (sharedTopicPairs.get(pairKey) ?? 0) + 1);
        pairCount += 1;
        if (pairCount >= MAX_PAIRS_PER_TOPIC) break outer;
      }
    }
  }
  for (const [pairKey, shared] of sharedTopicPairs) {
    if (shared < 2) continue;
    const [source, target] = pairKey.split("|");
    pushEdge({
      source,
      target,
      kind: "memory-memory",
      strength: shared,
    });
  }

  // Drop person nodes that ended up isolated (no memory edges). Keep avatars
  // even at degree 0 so all seven always show in the constellation.
  const keptPersons = Array.from(personNodes.values()).filter((n) => n.degree > 0);
  const keptAvatars = Array.from(avatarNodes.values());

  const nodes: GraphNode[] = [...memoryNodes, ...keptAvatars, ...keptPersons];

  return {
    nodes,
    edges,
    stats: {
      memoryCount: memoryNodes.length,
      avatarCount: keptAvatars.length,
      personCount: keptPersons.length,
      edgeCount: edges.length,
    },
  };
}

export function colorForNode(node: GraphNode): string {
  if (node.kind === "avatar" && node.avatarSlug) {
    return AVATAR_COLORS[node.avatarSlug] ?? KIND_COLORS.avatar;
  }
  if (node.kind === "person") return KIND_COLORS.person;
  if (node.avatarSlug && AVATAR_COLORS[node.avatarSlug]) {
    return AVATAR_COLORS[node.avatarSlug];
  }
  return KIND_COLORS.memoryFallback;
}

export function sourceTypeLabel(t: MemorySourceType | undefined): string {
  if (t === "video-call") return "Video Call";
  if (t === "voice") return "Voice Message";
  return "Text";
}
