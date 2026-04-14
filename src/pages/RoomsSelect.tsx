import { useEffect, useState } from "react";
import AvatarSelector from "@/components/AvatarSelector";
import { fetchMemories, fetchOwners } from "@/lib/api";
import { memoriesForAvatar } from "@/lib/avatars";

export default function RoomsSelectPage() {
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
      eyebrow="Rooms"
      title="Whose rooms would you like to open?"
      subtitle="Each avatar organises what they have learned into thematic rooms."
      hrefFor={(a) => `/wing/${a.slug}`}
      countFor={(a) => {
        const n = memoriesForAvatar(a.slug, memories, owners).length;
        return `7 Rooms · ${n} ${n === 1 ? "Memory" : "Memories"}`;
      }}
    />
  );
}
