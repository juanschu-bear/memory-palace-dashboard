import { useEffect, useState } from "react";
import AvatarSelector from "@/components/AvatarSelector";
import { fetchPalaceStatus } from "@/lib/api";

function wingCount(status: any, slug: string) {
  const key = slug.replace(/-/g, "_");
  return Number(status?.wings?.[slug] ?? status?.wings?.[key] ?? status?.wings?.[`wing_${key}`] ?? 0);
}

export default function RoomsSelectPage() {
  const [status, setStatus] = useState<any>(null);
  useEffect(() => {
    fetchPalaceStatus().then(setStatus).catch(() => {});
  }, []);

  return (
    <AvatarSelector
      eyebrow="Rooms"
      title="Whose rooms would you like to open?"
      subtitle="Each avatar organises what they have learned into thematic rooms."
      hrefFor={(a) => `/wing/${a.slug}`}
      countFor={(a) => {
        const memories = wingCount(status, a.slug);
        return `7 Rooms · ${memories} Memories`;
      }}
    />
  );
}
