import { useEffect, useState } from "react";
import AvatarSelector from "@/components/AvatarSelector";
import { AVATARS, memoriesForAvatar, memoryTopics } from "@/lib/avatars";
import { fetchMemories, fetchOwners } from "@/lib/api";

// Skills are unique topic tags on an avatar's wa_memories rows. The
// detail page (/skills/:slug) uses the same definition, so the list and
// detail counts stay consistent.
export default function SkillsSelectPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [memories, owners] = await Promise.all([fetchMemories(), fetchOwners()]);
      if (cancelled) return;
      const mems = Array.isArray(memories) ? memories : [];
      const ows = Array.isArray(owners) ? owners : [];
      const entries = AVATARS.map((a) => {
        const avatarMems = memoriesForAvatar(a.slug, mems, ows);
        const topics = new Set<string>();
        avatarMems.forEach((m) => {
          memoryTopics(m).forEach((t) => {
            const tag = String(t).trim().toLowerCase();
            if (tag) topics.add(tag);
          });
        });
        return [a.slug, topics.size] as const;
      });
      setCounts(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <AvatarSelector
      eyebrow="Skills"
      title="Whose skills would you like to see?"
      subtitle="Each avatar develops their own skill constellation through reflection."
      hrefFor={(a) => `/skills/${a.slug}`}
      countFor={(a) => {
        const n = counts[a.slug] ?? 0;
        return `${n} ${n === 1 ? "Skill" : "Skills"}`;
      }}
    />
  );
}
