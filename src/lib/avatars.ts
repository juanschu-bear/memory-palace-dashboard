export interface AvatarProfile {
  slug: string;
  name: string;
  role: string;
  wing: string;
  initials: string;
}

export const AVATARS: AvatarProfile[] = [
  { slug: "trace-flores", name: "Trace Flores", role: "Business Strategist & Pattern Architect", wing: "Wing I", initials: "TF" },
  { slug: "juan-schubert", name: "Juan Schubert", role: "System Architect & Digital Twin", wing: "Wing II", initials: "JS" },
  { slug: "adri-kastel", name: "Adri Kastel", role: "Growth Expert & Scaling Mentor", wing: "Wing III", initials: "AK" },
  { slug: "prof-brian-cox", name: "Prof. Brian Cox", role: "Science Communicator & Educator", wing: "Wing IV", initials: "BC" },
  { slug: "clara-fontaine", name: "Clara Fontaine", role: "Executive Communication Coach", wing: "Wing V", initials: "CF" },
  { slug: "elena-navarro", name: "Elena Navarro", role: "Sales Strategist & Business Growth Expert", wing: "Wing VI", initials: "EN" },
];

export const AVATAR_SLUGS = AVATARS.map((a) => a.slug);

export const STANDARD_ROOMS = [
  "business",
  "personal",
  "growth",
  "challenges",
  "wins",
  "behavioral",
  "avatar-diary",
];

export function findAvatar(slug?: string): AvatarProfile {
  return AVATARS.find((a) => a.slug === slug) ?? AVATARS[0];
}

function norm(s: unknown) {
  return String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Match a wa_owners row to an avatar slug by display_name. */
export function ownerForAvatar(slug: string, owners: any[]): any | null {
  const target = norm(findAvatar(slug).name);
  return (
    owners.find((o) => norm(o?.display_name) === target) ??
    owners.find((o) => norm(o?.display_name).includes(target)) ??
    null
  );
}

/** Does this wa_memories row belong to the given avatar? */
export function memoryBelongsToAvatar(slug: string, memory: any, ownerId?: string | null): boolean {
  const avatarName = norm(findAvatar(slug).name);
  const persona = norm(memory?.persona_name);
  if (persona && (persona === avatarName || persona.includes(avatarName))) return true;
  if (ownerId && String(memory?.owner_id ?? "") === String(ownerId)) return true;
  return false;
}

/** Return memories owned by a given avatar. */
export function memoriesForAvatar(slug: string, memories: any[], owners: any[]): any[] {
  const owner = ownerForAvatar(slug, owners);
  const ownerId = owner?.id ?? null;
  return memories.filter((m) => memoryBelongsToAvatar(slug, m, ownerId));
}

/** Topics on a memory are an array of strings (per wa_memories.topics). */
export function memoryTopics(memory: any): string[] {
  const raw = memory?.topics;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((t) => String(t));
  if (typeof raw === "string") {
    // Handle the Postgres text[] literal form too: "{pricing,wins}"
    const trimmed = raw.trim().replace(/^\{|\}$/g, "");
    return trimmed ? trimmed.split(",").map((t) => t.replace(/^"|"$/g, "")) : [];
  }
  return [];
}

/** A memory belongs to a room if any topic matches the room slug/label. */
export function memoryMatchesRoom(roomSlug: string, memory: any): boolean {
  const room = norm(roomSlug);
  return memoryTopics(memory).some((t) => {
    const n = norm(t);
    return n === room || n.includes(room) || room.includes(n);
  });
}
