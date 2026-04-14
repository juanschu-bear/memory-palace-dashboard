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

function matchesContact(id: string | number | undefined, record: any){
  if (id === undefined || id === null) return false;
  const target = String(id);
  return String(record?.contact_id ?? "") === target || String(record?.wa_contact_id ?? "") === target;
}

export default function ContactsPage(){
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    document.body.classList.add("light-contacts");
    const root=ref.current; if(!root) return;
    (async()=>{
      let contacts: any[] = [], owners: any[] = [], conversations: any[] = [], memories: any[] = [];
      try {
        [contacts, owners, conversations, memories] = await Promise.all([
          fetchContacts(), fetchOwners(), fetchConversations(), fetchMemories(),
        ]);
      } catch (err) {
        console.error("Contacts fetch failed:", err);
      }
      const list = root.querySelector('.contacts-list');
      const cCount = root.querySelector('.contacts-live-count');
      const sCount = root.querySelector('.sessions-live-count');
      if (cCount) cCount.textContent = String(Array.isArray(contacts) ? contacts.length : 0);
      if (sCount) sCount.textContent = String(Array.isArray(conversations) ? conversations.length : 0);
      if (!list) return;
      list.innerHTML = "";
      if (!Array.isArray(contacts) || contacts.length === 0) {
        list.innerHTML = `<div class="contacts-empty">No contacts yet. Once users talk to your avatars, they'll appear here.</div>`;
        return;
      }
      contacts.slice(0, 100).forEach((c: any) => {
        const id = c.id ?? c.contact_id;
        const conv = conversations.filter((x) => matchesContact(id, x));
        const mems = memories
          .filter((m) => matchesContact(id, m))
          .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
        const ownerIds = new Set(conv.map((x) => x.owner_id).filter(Boolean));
        const ownerNames = owners
          .filter((o) => ownerIds.has(o.id))
          .map((o) => o.display_name || o.name)
          .filter(Boolean);
        const name = c.display_name || c.name || "Unknown";
        const initial = name.charAt(0).toUpperCase() || "?";
        const node = document.createElement("div");
        node.className = "contact-card";
        node.innerHTML = `<div class="contact-initial">${escapeHtml(initial)}</div>
<div class="contact-info"><div class="contact-name">${escapeHtml(name)}</div><div class="contact-detail">${escapeHtml(c.notes || c.phone || "")}</div><div class="contact-avatars">${ownerNames.map((n: string) => `<span class="avatar-chip">${escapeHtml(n)}</span>`).join("")}</div></div>
<div class="contact-stats"><div class="contact-stat-num">${conv.length}</div><div class="contact-stat-label">Sessions</div><div class="contact-last-seen">Last seen: ${escapeHtml(String(c.updated_at || "").slice(0, 10))}</div></div>`;
        node.addEventListener("click", (ev) => {
          // Avoid toggling when clicking inside an already-open panel.
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
                  const summary = x.summary || x.last_message || x.title || "Conversation";
                  return `<li><span class="conv-date">${escapeHtml(date)}</span><span class="conv-summary">${escapeHtml(String(summary))}</span></li>`;
                })
                .join("")}</ul>`
            : `<p class="contact-panel-empty">No conversations logged.</p>`;
          const memHtml = mems.length
            ? `<div class="contact-mem-grid">${mems
                .slice(0, 12)
                .map((m) => {
                  const title = m.title || m.topic || "Memory";
                  const body = m.summary || m.content || m.text || "";
                  const date = String(m.created_at || m.updated_at || "").slice(0, 10);
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
