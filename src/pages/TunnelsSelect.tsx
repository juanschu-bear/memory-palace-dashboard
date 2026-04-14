import { useEffect, useState } from "react";
import AvatarSelector from "@/components/AvatarSelector";
import { fetchMemories, fetchOwners } from "@/lib/api";
import { memoriesForAvatar } from "@/lib/avatars";

export default function TunnelsSelectPage() {
  const [memories, setMemories] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const [m, o] = await Promise.all([fetchMemories(), fetchOwners()]);
      setMemories(Array.isArray(m) ? m : []);
      setOwners(Array.isArray(o) ? o : []);
    })().catch(() => {});
  }, []);

  return (
    <AvatarSelector
      eyebrow="Tunnels"
      title="Whose tunnels would you like to trace?"
      subtitle="When two avatars encounter the same theme, a tunnel forms between them. Choose an avatar to see theirs."
      hrefFor={(a) => `/tunnels/${a.slug}`}
      countFor={(a) => {
        const n = memoriesForAvatar(a.slug, memories, owners).length;
        return `${n} Memor${n === 1 ? "y" : "ies"}`;
      }}
    />
  );
}
