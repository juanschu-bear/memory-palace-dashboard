import { useEffect, useState } from "react";
import AvatarSelector from "@/components/AvatarSelector";
import { AVATARS } from "@/lib/avatars";
import { readDiary } from "@/lib/api";

export default function DiarySelectPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const entries = await Promise.all(
        AVATARS.map(async (a) => {
          try {
            const d = await readDiary(a.slug, 100);
            const total = Number(d?.total ?? d?.entries?.length ?? 0);
            return [a.slug, total] as const;
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
      eyebrow="Diary"
      title="Whose diary would you like to read?"
      subtitle="Avatars keep private reflections — lessons, patterns, and shifts in how they think."
      hrefFor={(a) => `/wing/${a.slug}/diary`}
      countFor={(a) => {
        const n = counts[a.slug] ?? 0;
        return `${n} ${n === 1 ? "Entry" : "Entries"}`;
      }}
    />
  );
}
