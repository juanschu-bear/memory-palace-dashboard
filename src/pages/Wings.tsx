import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AvatarSelector from "@/components/AvatarSelector";
import { fetchContacts, fetchMemories, fetchOwners } from "@/lib/api";
import { memoriesForAvatar } from "@/lib/avatars";

interface Contact {
  id?: string | number;
  display_name?: string;
  email?: string;
  phone_number?: string;
  last_active_at?: string;
}

export default function WingsPage() {
  const [rawContacts, setRawContacts] = useState<Contact[]>([]);
  const [memories, setMemories] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [cs, ms, os] = await Promise.all([fetchContacts(), fetchMemories(), fetchOwners()]);
      if (Array.isArray(cs)) setRawContacts(cs);
      if (Array.isArray(ms)) setMemories(ms);
      if (Array.isArray(os)) setOwners(os);
    })().catch(() => {});
  }, []);

  // Deduplicate contacts by display_name (global) to avoid listing the same
  // person multiple times across owners — mirrors the /contacts page.
  const contacts = useMemo(() => {
    const byName = new Map<string, Contact>();
    for (const c of rawContacts) {
      const name = String(c.display_name || "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const prev = byName.get(key);
      if (!prev) { byName.set(key, c); continue; }
      if (String(c.last_active_at || "") > String(prev.last_active_at || "")) byName.set(key, c);
    }
    return Array.from(byName.values()).sort((a, b) =>
      String(b.last_active_at || "").localeCompare(String(a.last_active_at || "")),
    );
  }, [rawContacts]);

  return (
    <AvatarSelector
      eyebrow="Extended Avatars"
      title="Choose a Wing"
      subtitle="Step into the wing of one of your avatars to see what they remember."
      hrefFor={(a) => `/wing/${a.slug}`}
      countFor={(a) => {
        const n = memoriesForAvatar(a.slug, memories, owners).length;
        return `${n} Memor${n === 1 ? "y" : "ies"}`;
      }}
    >
      <section className="users-section">
        <div className="selector-header">
          <p className="selector-eyebrow">Users</p>
          <h2 className="selector-title selector-title--small">Enter a user's wing</h2>
          <p className="selector-subtitle">
            Every contact has their own wing — the memories your avatars have stored about them.
          </p>
        </div>

        {contacts.length === 0 ? (
          <p className="users-empty">No contacts found yet.</p>
        ) : (
          <div className="users-grid">
            {contacts.slice(0, 60).map((c) => {
              const id = c.id ?? "";
              const name = c.display_name || "Unknown";
              const initial = String(name).charAt(0).toUpperCase();
              return (
                <Link key={String(id)} to={`/wing/user/${id}`} className="user-card">
                  <div className="user-card-initial">{initial}</div>
                  <div className="user-card-body">
                    <div className="user-card-name">{name}</div>
                    <div className="user-card-detail">
                      {c.email || c.phone_number || "Contact"}
                    </div>
                  </div>
                  <span className="user-card-arrow">&rarr;</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </AvatarSelector>
  );
}
