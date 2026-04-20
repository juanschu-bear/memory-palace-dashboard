import { fetchMemories, fetchContacts, fetchConversations } from "@/lib/api";
import { AVATARS, memoryTopics } from "@/lib/avatars";

export type GraphNodeKind = "memory" | "avatar" | "contact";

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
  lastActiveAt?: string;
  conversationCount?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  kind: "memory-avatar" | "memory-contact" | "memory-memory";
  strength: number;
}

export interface GraphDataset {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    memoryCount: number;
    avatarCount: number;
    contactCount: number;
    edgeCount: number;
  };
}

function norm(s: unknown): string {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchAvatarSlug(personaName: unknown): string | null {
  const persona = norm(personaName);
  if (!persona) return null;
  for (const avatar of AVATARS) {
    const avatarNorm = norm(avatar.name);
    if (persona === avatarNorm) return avatar.slug;
  }
  for (const avatar of AVATARS) {
    const avatarNorm = norm(avatar.name);
    if (persona.includes(avatarNorm) || avatarNorm.includes(persona)) {
      return avatar.slug;
    }
  }
  return null;
}

function shortSummary(memory: any): string {
  const text =
    memory?.summary ??
    memory?.raw_text ??
    memory?.content ??
    memory?.text ??
    "";
  const str = String(text).trim();
  if (str.length <= 80) return str;
  return str.slice(0, 77) + "…";
}

export async function loadGraphData(): Promise<GraphDataset> {
  const [memoriesRaw, contactsRaw, conversationsRaw] = await Promise.all([
    fetchMemories(),
    fetchContacts(),
    fetchConversations(),
  ]);
  const memories = Array.isArray(memoriesRaw) ? memoriesRaw : [];
  const contacts = Array.isArray(contactsRaw) ? contactsRaw : [];
  const conversations = Array.isArray(conversationsRaw) ? conversationsRaw : [];

  const contactKeyById = new Map<string, string>();
  const contactNodes = new Map<string, GraphNode>();
  for (const row of contacts) {
    const displayName = String(row?.display_name || "").trim();
    if (!displayName) continue;
    const key = `contact:${displayName.toLowerCase()}`;
    if (row?.id) contactKeyById.set(String(row.id), key);
    const rawLast = String(row?.last_active_at || row?.joined_at || "");
    const existing = contactNodes.get(key);
    if (!existing) {
      contactNodes.set(key, {
        id: key,
        kind: "contact",
        label: displayName,
        avatarSlug: null,
        topics: [],
        summary: String(row?.email || row?.phone_number || ""),
        persona: null,
        raw: row,
        degree: 0,
        lastActiveAt: rawLast,
        conversationCount: 0,
      });
    } else if (rawLast > (existing.lastActiveAt ?? "")) {
      existing.lastActiveAt = rawLast;
      if (!existing.summary && (row?.email || row?.phone_number)) {
        existing.summary = String(row?.email || row?.phone_number);
      }
    }
  }

  for (const conv of conversations) {
    const cid = conv?.contact_id ? String(conv.contact_id) : "";
    const key = cid ? contactKeyById.get(cid) : undefined;
    if (!key) continue;
    const node = contactNodes.get(key);
    if (!node) continue;
    node.conversationCount = (node.conversationCount ?? 0) + 1;
  }

  const avatarNodes = new Map<string, GraphNode>();
  for (const avatar of AVATARS) {
    avatarNodes.set(`avatar:${avatar.slug}`, {
      id: `avatar:${avatar.slug}`,
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

  const memoryNodes: GraphNode[] = [];
  const topicBuckets = new Map<string, string[]>();

  for (const memory of memories) {
    const id = `memory:${String(memory?.id ?? memoryNodes.length)}`;
    const topics = memoryTopics(memory).map((t) => String(t).trim()).filter(Boolean);
    const slug = matchAvatarSlug(memory?.persona_name);
    const node: GraphNode = {
      id,
      kind: "memory",
      label: topics[0] || shortSummary(memory) || "Memory",
      avatarSlug: slug,
      topics,
      summary: shortSummary(memory),
      persona: memory?.persona_name ? String(memory.persona_name) : null,
      raw: memory,
      degree: 0,
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

  const edges: GraphEdge[] = [];
  const nodeById = new Map<string, GraphNode>();
  memoryNodes.forEach((n) => nodeById.set(n.id, n));
  avatarNodes.forEach((n) => nodeById.set(n.id, n));
  contactNodes.forEach((n) => nodeById.set(n.id, n));

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
    const contactId = memory.raw?.contact_id ? String(memory.raw.contact_id) : "";
    const contactKey = contactId ? contactKeyById.get(contactId) : undefined;
    if (contactKey) {
      pushEdge({
        source: memory.id,
        target: contactKey,
        kind: "memory-contact",
        strength: 1,
      });
    }
  }

  const sharedTopicPairs = new Map<string, number>();
  const topicKeys = Array.from(topicBuckets.keys());
  for (const key of topicKeys) {
    const ids = topicBuckets.get(key)!;
    if (ids.length < 2) continue;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i];
        const b = ids[j];
        if (a === b) continue;
        const pairKey = a < b ? `${a}|${b}` : `${b}|${a}`;
        sharedTopicPairs.set(pairKey, (sharedTopicPairs.get(pairKey) ?? 0) + 1);
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

  const keptContacts = Array.from(contactNodes.values()).filter((n) => n.degree > 0);
  const keptAvatars = Array.from(avatarNodes.values());

  const nodes: GraphNode[] = [...memoryNodes, ...keptAvatars, ...keptContacts];

  return {
    nodes,
    edges,
    stats: {
      memoryCount: memoryNodes.length,
      avatarCount: keptAvatars.length,
      contactCount: keptContacts.length,
      edgeCount: edges.length,
    },
  };
}

export const AVATAR_COLORS: Record<string, string> = {
  "trace-flores": "#FF4FD8",
  "juan-schubert": "#3FE0FF",
  "adri-kastel": "#7CFF6B",
  "prof-brian-cox": "#FFB84F",
  "clara-fontaine": "#C58BFF",
  "elena-navarro": "#FF6B6B",
};

export const KIND_COLORS = {
  avatar: "#F5F5FA",
  contact: "#56E0A0",
  memoryFallback: "#8A8AFF",
};

export function colorForNode(node: GraphNode): string {
  if (node.kind === "avatar" && node.avatarSlug) {
    return AVATAR_COLORS[node.avatarSlug] ?? KIND_COLORS.avatar;
  }
  if (node.kind === "contact") return KIND_COLORS.contact;
  if (node.avatarSlug && AVATAR_COLORS[node.avatarSlug]) {
    return AVATAR_COLORS[node.avatarSlug];
  }
  return KIND_COLORS.memoryFallback;
}
