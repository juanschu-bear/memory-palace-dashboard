import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchContacts,
  fetchConversations,
  fetchMemories,
  fetchOwners,
} from "@/lib/api";

interface Contact {
  id?: string | number;
  contact_id?: string | number;
  display_name?: string;
  name?: string;
  phone?: string;
  notes?: string;
  updated_at?: string;
}

function same(contactId: string, record: any) {
  const id = String(contactId);
  return (
    String(record?.contact_id ?? "") === id ||
    String(record?.wa_contact_id ?? "") === id
  );
}

export default function UserWingPage() {
  const { contactId = "" } = useParams();
  const [contact, setContact] = useState<Contact | null>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [cs, ms, convs, ows] = await Promise.all([
          fetchContacts(),
          fetchMemories(),
          fetchConversations(),
          fetchOwners(),
        ]);
        if (cancelled) return;
        const list = Array.isArray(cs) ? cs : [];
        const found =
          list.find((c: Contact) => String(c.id ?? c.contact_id) === String(contactId)) ?? null;
        setContact(found);
        setMemories(Array.isArray(ms) ? ms.filter((m: any) => same(contactId, m)) : []);
        setConversations(
          Array.isArray(convs) ? convs.filter((c: any) => same(contactId, c)) : [],
        );
        setOwners(Array.isArray(ows) ? ows : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [contactId]);

  // "Avatars met" pulls owner_ids from both conversations AND memories so an
  // avatar that left a memory but has no linked conversation still counts.
  const ownerIds = new Set<string>();
  conversations.forEach((c) => { if (c.owner_id) ownerIds.add(String(c.owner_id)); });
  memories.forEach((m) => { if (m.owner_id) ownerIds.add(String(m.owner_id)); });
  const relatedOwners = owners.filter((o) => ownerIds.has(String(o.id)));
  const displayName = contact?.display_name || contact?.name || "";
  const initial = (displayName.charAt(0) || "?").toUpperCase();

  if (loading) {
    return (
      <div className="user-wing-page">
        <div className="user-wing-inner">
          <Link to="/wings" className="back-link">&larr; Back to Wings</Link>
          <p className="user-wing-empty">Loading user wing…</p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="user-wing-page">
        <div className="user-wing-inner">
          <Link to="/wings" className="back-link">&larr; Back to Wings</Link>
          <section className="user-wing-header">
            <div>
              <p className="user-wing-eyebrow">User Wing</p>
              <h1 className="user-wing-name">Contact not found</h1>
              <p className="user-wing-detail">
                We couldn't find a contact with this id. They may have been removed.
              </p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="user-wing-page">
      <div className="user-wing-inner">
        <Link to="/wings" className="back-link">&larr; Back to Wings</Link>

        <section className="user-wing-header">
          <div className="user-wing-mark">{initial}</div>
          <div>
            <p className="user-wing-eyebrow">User Wing</p>
            <h1 className="user-wing-name">{displayName || "Unknown"}</h1>
            <p className="user-wing-detail">
              {contact.notes || contact.phone || "Memories stored across your avatars."}
            </p>
          </div>
        </section>

        <div className="user-wing-stats">
          <div className="user-wing-stat">
            <div className="num">{conversations.length}</div>
            <div className="label">Conversations</div>
          </div>
          <div className="user-wing-stat">
            <div className="num">{memories.length}</div>
            <div className="label">Memories</div>
          </div>
          <div className="user-wing-stat">
            <div className="num">{relatedOwners.length}</div>
            <div className="label">Avatars met</div>
          </div>
        </div>

        {relatedOwners.length > 0 && (
          <section className="user-wing-section">
            <h2 className="user-wing-section-title">Avatars who spoke with {displayName}</h2>
            <div className="user-wing-owner-list">
              {relatedOwners.map((o) => (
                <span key={o.id} className="owner-chip">
                  {o.display_name || o.name || "Avatar"}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="user-wing-section">
          <h2 className="user-wing-section-title">Memories</h2>
          {memories.length === 0 ? (
            <p className="user-wing-empty">
              No memories have been stored about this contact yet.
            </p>
          ) : (
            <div className="user-wing-memories">
              {memories.slice(0, 30).map((m, i) => (
                <div key={m.id ?? i} className="user-wing-memory">
                  <div className="memory-date">
                    {String(m.created_at || m.updated_at || "").slice(0, 10)}
                  </div>
                  <div className="memory-body">
                    <div className="memory-title">
                      {m.title || m.topic || "Memory"}
                    </div>
                    <div className="memory-text">
                      {m.summary || m.content || m.text || ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="user-wing-section">
          <h2 className="user-wing-section-title">Recent conversations</h2>
          {conversations.length === 0 ? (
            <p className="user-wing-empty">No conversations logged yet.</p>
          ) : (
            <div className="user-wing-conversations">
              {conversations.slice(0, 15).map((c, i) => (
                <div key={c.id ?? i} className="user-wing-conversation">
                  <span className="conversation-date">
                    {String(c.updated_at || c.created_at || "").slice(0, 10)}
                  </span>
                  <span className="conversation-summary">
                    {c.summary || c.last_message || c.title || "Conversation"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
