import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AvatarSelector from "@/components/AvatarSelector";
import { fetchContacts, fetchPalaceStatus } from "@/lib/api";

interface Contact {
  id?: string | number;
  contact_id?: string | number;
  display_name?: string;
  name?: string;
  phone?: string;
  notes?: string;
  updated_at?: string;
}

function wingCount(status: any, slug: string) {
  const key = slug.replace(/-/g, "_");
  return Number(status?.wings?.[slug] ?? status?.wings?.[key] ?? status?.wings?.[`wing_${key}`] ?? 0);
}

export default function WingsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetchContacts().then((c) => {
      if (Array.isArray(c)) setContacts(c);
    }).catch(() => {});
    fetchPalaceStatus().then(setStatus).catch(() => {});
  }, []);

  return (
    <AvatarSelector
      eyebrow="Extended Avatars"
      title="Choose a Wing"
      subtitle="Step into the wing of one of your avatars to see what they remember."
      hrefFor={(a) => `/wing/${a.slug}`}
      countFor={(a) => {
        const count = wingCount(status, a.slug);
        return `${count} Memor${count === 1 ? "y" : "ies"}`;
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
            {contacts.slice(0, 48).map((c) => {
              const id = c.id ?? c.contact_id ?? "";
              const name = c.display_name || c.name || "Unknown";
              const initial = String(name).charAt(0).toUpperCase();
              return (
                <Link key={String(id)} to={`/wing/user/${id}`} className="user-card">
                  <div className="user-card-initial">{initial}</div>
                  <div className="user-card-body">
                    <div className="user-card-name">{name}</div>
                    <div className="user-card-detail">
                      {c.notes || c.phone || "Contact"}
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
