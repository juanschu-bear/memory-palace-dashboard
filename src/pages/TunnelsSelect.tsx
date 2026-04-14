import { useEffect, useState } from "react";
import AvatarSelector from "@/components/AvatarSelector";
import { fetchPalaceStatus } from "@/lib/api";

function wingCount(status: any, slug: string) {
  const key = slug.replace(/-/g, "_");
  return Number(status?.wings?.[slug] ?? status?.wings?.[key] ?? status?.wings?.[`wing_${key}`] ?? 0);
}

export default function TunnelsSelectPage() {
  const [status, setStatus] = useState<any>(null);
  useEffect(() => {
    fetchPalaceStatus().then(setStatus).catch(() => {});
  }, []);

  return (
    <AvatarSelector
      eyebrow="Tunnels"
      title="Whose tunnels would you like to trace?"
      subtitle="When two avatars encounter the same theme, a tunnel forms between them. Choose an avatar to see theirs."
      hrefFor={(a) => `/tunnels/${a.slug}`}
      countFor={(a) => {
        const memories = wingCount(status, a.slug);
        return `${memories} Memor${memories === 1 ? "y" : "ies"}`;
      }}
    />
  );
}
