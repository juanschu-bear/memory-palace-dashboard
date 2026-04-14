import { useEffect, useState } from "react";
import AvatarSelector from "@/components/AvatarSelector";
import { AVATARS } from "@/lib/avatars";
import { readDiary } from "@/lib/api";

export default function SkillsSelectPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const entries = await Promise.all(
        AVATARS.map(async (a) => {
          try {
            const d = await readDiary(a.slug, 100);
            const texts: string[] = (d?.entries || []).map((e: any) => JSON.stringify(e));
            const skills = new Set<string>();
            texts.forEach((t) => {
              const matches = t.match(/skill\/[a-z0-9-]+/gi) || [];
              matches.forEach((m) => skills.add(m.toLowerCase()));
            });
            return [a.slug, skills.size] as const;
          } catch {
            return [a.slug, 0] as const;
          }
        }),
      );
      setCounts(Object.fromEntries(entries));
    })();
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
