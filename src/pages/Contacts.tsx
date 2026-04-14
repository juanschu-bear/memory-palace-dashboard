import { useEffect, useRef } from "react";
import { fetchContacts, fetchOwners, fetchConversations, fetchMemories } from "@/lib/api";

const HTML = `<nav class="breadcrumb">
  <a>Palace</a>
  <span class="sep">/</span>
  <span class="current">Contacts</span>
</nav>

<div class="page-container">

  <section class="page-header">
    <h1>Contacts</h1>
    <p class="subtitle">Everyone who has stepped inside the palace.</p>
    <p class="meta"><span class="contacts-live-count">0</span> contacts &middot; <span class="sessions-live-count">0</span> total sessions &middot; 49 memories stored</p>
  </section>

  <div class="divider"></div>

  <div class="search-bar">
    <input type="text" class="search-input" placeholder="Search contacts...">
  </div>

  <section class="contacts-list">

    <div class="contact-card">
      <div class="contact-initial">M</div>
      <div class="contact-info">
        <div class="contact-name">Maria</div>
        <div class="contact-detail">Online course creator transitioning from in-person coaching. Core themes: pricing, self-worth, product launch.</div>
        <div class="contact-avatars">
          <span class="avatar-chip">Trace Flores</span>
        </div>
      </div>
      <div class="contact-stats">
        <div class="contact-stat-num">8</div>
        <div class="contact-stat-label">Sessions</div>
        <div class="contact-last-seen">Last seen: Apr 12</div>
      </div>
    </div>

    <div class="contact-card">
      <div class="contact-initial">P</div>
      <div class="contact-info">
        <div class="contact-name">Pedro</div>
        <div class="contact-detail">Freelance consultant stuck on pricing. Recurring theme: fear of losing existing clients.</div>
        <div class="contact-avatars">
          <span class="avatar-chip">Trace Flores</span>
        </div>
      </div>
      <div class="contact-stats">
        <div class="contact-stat-num">3</div>
        <div class="contact-stat-label">Sessions</div>
        <div class="contact-last-seen">Last seen: Apr 10</div>
      </div>
    </div>

    <div class="contact-card">
      <div class="contact-initial">L</div>
      <div class="contact-info">
        <div class="contact-name">Lisa</div>
        <div class="contact-detail">Early-stage founder navigating a business partnership. Core theme: imposter syndrome, delegation.</div>
        <div class="contact-avatars">
          <span class="avatar-chip">Trace Flores</span>
          <span class="avatar-chip">Clara Fontaine</span>
        </div>
      </div>
      <div class="contact-stats">
        <div class="contact-stat-num">1</div>
        <div class="contact-stat-label">Sessions</div>
        <div class="contact-last-seen">Last seen: Apr 5</div>
      </div>
    </div>

    <div class="contact-card">
      <div class="contact-initial">J</div>
      <div class="contact-info">
        <div class="contact-name">Juan Schubert</div>
        <div class="contact-detail">Founder of ONIOKO. Test sessions across multiple avatars. Strategy and product discussions.</div>
        <div class="contact-avatars">
          <span class="avatar-chip">Trace Flores</span>
          <span class="avatar-chip">Adri Kastel</span>
          <span class="avatar-chip">Prof. Brian Cox</span>
          <span class="avatar-chip">Clara Fontaine</span>
        </div>
      </div>
      <div class="contact-stats">
        <div class="contact-stat-num">0</div>
        <div class="contact-stat-label">Sessions</div>
        <div class="contact-last-seen">Last seen: Apr 13</div>
      </div>
    </div>

  </section>

</div>`;

function escapeHtml(s: string){
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// wa_conversations.contact_id and wa_memories.contact_id are the only FKs
// we can trust against the real schema — no wa_contact_id fallback.
function matchesContact(id: string | undefined, record: any){
  if (!id) return false;
  return String(record?.contact_id ?? "") === String(id);
}

// wa_contacts carries duplicates (same display_name + same owner_id exist
// multiple times). Keep the freshest row per (owner_id, display_name).
function dedupContacts(rows: any[]): any[] {
  const byKey = new Map<string, any>();
  for (const row of rows) {
    const name = String(row.display_name || "").trim().toLowerCase();
    const key = `${row.owner_id || ""}::${name || row.id}`;
    const prev = byKey.get(key);
    if (!prev) { byKey.set(key, row); continue; }
    const a = String(prev.last_active_at || prev.joined_at || "");
    const b = String(row.last_active_at || row.joined_at || "");
    if (b > a) byKey.set(key, row);
  }
  return Array.from(byKey.values());
}

export default function ContactsPage(){
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    document.body.classList.add("light-contacts");
    const root=ref.current; if(!root) return;
    (async()=>{
      let rawContacts: any[] = [], owners: any[] = [], conversations: any[] = [], memories: any[] = [];
      try {
        [rawContacts, owners, conversations, memories] = await Promise.all([
          fetchContacts(), fetchOwners(), fetchConversations(), fetchMemories(),
        ]);
      } catch (err) {
        console.error("Contacts fetch failed:", err);
      }
      const contacts = dedupContacts(Array.isArray(rawContacts) ? rawContacts : []);
      const list = root.querySelector('.contacts-list');
      const cCount = root.querySelector('.contacts-live-count');
      const sCount = root.querySelector('.sessions-live-count');
      if (cCount) cCount.textContent = String(contacts.length);
      if (sCount) sCount.textContent = String(Array.isArray(conversations) ? conversations.length : 0);
      if (!list) return;
      list.innerHTML = "";
      if (contacts.length === 0) {
        list.innerHTML = `<div class="contacts-empty">No contacts yet. Once users talk to your avatars, they'll appear here.</div>`;
        return;
      }
      contacts.forEach((c: any) => {
        const id = c.id;
        const conv = conversations
          .filter((x) => matchesContact(id, x))
          .sort((a, b) => String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || "")));
        const mems = memories
          .filter((m) => matchesContact(id, m))
          .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
        // Avatars the contact met: via conversations (preferred — confirmed contact)
        // or via memories (contact was mentioned in that avatar's wing).
        const ownerIds = new Set<string>();
        conv.forEach((x) => { if (x.owner_id) ownerIds.add(String(x.owner_id)); });
        mems.forEach((m) => { if (m.owner_id) ownerIds.add(String(m.owner_id)); });
        if (c.owner_id) ownerIds.add(String(c.owner_id));
        const ownerNames = owners
          .filter((o) => ownerIds.has(String(o.id)))
          .map((o) => o.display_name)
          .filter(Boolean);
        const name = c.display_name || "Unknown";
        const initial = (name.charAt(0) || "?").toUpperCase();
        const lastSeen = String(c.last_active_at || c.joined_at || "").slice(0, 10);
        const detail = c.email || c.phone_number || "";
        const node = document.createElement("div");
        node.className = "contact-card";
        node.innerHTML = `<div class="contact-initial">${escapeHtml(initial)}</div>
<div class="contact-info"><div class="contact-name">${escapeHtml(name)}</div><div class="contact-detail">${escapeHtml(detail)}</div><div class="contact-avatars">${ownerNames.map((n: string) => `<span class="avatar-chip">${escapeHtml(n)}</span>`).join("")}</div></div>
<div class="contact-stats"><div class="contact-stat-num">${conv.length}</div><div class="contact-stat-label">Sessions</div><div class="contact-last-seen">Last seen: ${escapeHtml(lastSeen)}</div></div>`;
        node.addEventListener("click", (ev) => {
          if ((ev.target as HTMLElement)?.closest(".contact-detail-panel")) return;
          const existing = node.querySelector(".contact-detail-panel") as HTMLElement | null;
          if (existing) { existing.remove(); node.classList.remove("contact-card-open"); return; }
          node.classList.add("contact-card-open");
          const panel = document.createElement("div");
          panel.className = "contact-detail-panel";
          const convHtml = conv.length
            ? `<ul class="contact-conv-list">${conv
                .slice(0, 20)
                .map((x) => {
                  const date = String(x.updated_at || x.created_at || "").slice(0, 10);
                  const ownerName = owners.find((o) => String(o.id) === String(x.owner_id))?.display_name || "—";
                  return `<li><span class="conv-date">${escapeHtml(date)}</span><span class="conv-summary">Conversation with ${escapeHtml(ownerName)}</span></li>`;
                })
                .join("")}</ul>`
            : `<p class="contact-panel-empty">No conversations logged.</p>`;
          const memHtml = mems.length
            ? `<div class="contact-mem-grid">${mems
                .slice(0, 12)
                .map((m) => {
                  // wa_memories real columns: summary, raw_text, topics (array),
                  // entities, importance, persona_name, created_at.
                  const topics = Array.isArray(m.topics) ? m.topics : [];
                  const title = topics[0] || m.persona_name || "Memory";
                  const body = m.summary || m.raw_text || "";
                  const date = String(m.created_at || "").slice(0, 10);
                  return `<div class="contact-mem-card"><div class="mem-meta">${escapeHtml(date)}</div><div class="mem-title">${escapeHtml(String(title))}</div><div class="mem-body">${escapeHtml(String(body))}</div></div>`;
                })
                .join("")}</div>`
            : `<p class="contact-panel-empty">No memories stored for this contact.</p>`;
          panel.innerHTML = `
            <div class="contact-panel-section"><h3>Conversations <span class="count">${conv.length}</span></h3>${convHtml}</div>
            <div class="contact-panel-section"><h3>Memories <span class="count">${mems.length}</span></h3>${memHtml}</div>`;
          node.appendChild(panel);
        });
        list.appendChild(node);
      });
    })();
    return ()=>{ document.body.classList.remove("light-contacts"); };
  },[]);
  return <div ref={ref} dangerouslySetInnerHTML={{__html:HTML}} />;
}
