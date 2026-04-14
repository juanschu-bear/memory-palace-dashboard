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
