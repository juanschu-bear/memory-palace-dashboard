import { useEffect, useRef } from "react";
import { fetchContacts, fetchOwners, fetchConversations, fetchConversationMemory, fetchMemories } from "@/lib/api";
import { memoryTopics } from "@/lib/avatars";

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

  <section class="contacts-list"></section>

</div>`;

function escapeHtml(s: string){
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// Collapse contact rows globally by display_name. Multiple owners talking to
// the same person produce multiple wa_contacts rows — we want one card that
// aggregates all of that person's conversations and memories.
interface MergedContact {
  id: string;
  displayName: string;
  contactIds: string[];
  ownerIds: Set<string>;
  lastActive: string;
  detail: string;
}

function mergeContacts(rows: any[]): MergedContact[] {
  const byName = new Map<string, MergedContact>();
  rows.forEach((row) => {
    const displayName = String(row.display_name || "").trim();
    if (!displayName) return;
    const key = displayName.toLowerCase();
    const last = String(row.last_active_at || row.joined_at || "");
    const prev = byName.get(key);
    if (!prev) {
      byName.set(key, {
        id: key,
        displayName,
        contactIds: [String(row.id)],
        ownerIds: new Set(row.owner_id ? [String(row.owner_id)] : []),
        lastActive: last,
        detail: row.email || row.phone_number || "",
      });
      return;
    }
    prev.contactIds.push(String(row.id));
    if (row.owner_id) prev.ownerIds.add(String(row.owner_id));
    if (last > prev.lastActive) prev.lastActive = last;
    if (!prev.detail && (row.email || row.phone_number)) prev.detail = row.email || row.phone_number;
  });
  return Array.from(byName.values()).sort((a, b) => b.lastActive.localeCompare(a.lastActive));
}

export default function ContactsPage(){
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    document.body.classList.add("light-contacts");
    const root=ref.current; if(!root) return;
    (async()=>{
      let rawContacts: any[] = [], owners: any[] = [], conversations: any[] = [], convMemos: any[] = [], memories: any[] = [];
      try {
        [rawContacts, owners, conversations, convMemos, memories] = await Promise.all([
          fetchContacts(), fetchOwners(), fetchConversations(), fetchConversationMemory(), fetchMemories(),
        ]);
      } catch (err) {
        console.error("Contacts fetch failed:", err);
      }
      const contacts = mergeContacts(Array.isArray(rawContacts) ? rawContacts : []);
      const convMemoByConvId = new Map<string, any>();
      (convMemos || []).forEach((cm: any) => {
        if (cm?.conversation_id) convMemoByConvId.set(String(cm.conversation_id), cm);
      });

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

      contacts.forEach((c) => {
        const ids = new Set(c.contactIds);
        const inSet = (x: any) => ids.has(String(x?.contact_id ?? ""));
        const conv = conversations
          .filter(inSet)
          .sort((a, b) => String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || "")));
        const mems = memories
          .filter(inSet)
          .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
        conv.forEach((x) => { if (x.owner_id) c.ownerIds.add(String(x.owner_id)); });
        mems.forEach((m) => { if (m.owner_id) c.ownerIds.add(String(m.owner_id)); });

        const ownerNames = owners
          .filter((o) => c.ownerIds.has(String(o.id)))
          .map((o) => o.display_name)
          .filter(Boolean);
        const initial = (c.displayName.charAt(0) || "?").toUpperCase();
        const node = document.createElement("div");
        node.className = "contact-card";
        node.innerHTML = `<div class="contact-initial">${escapeHtml(initial)}</div>
<div class="contact-info"><div class="contact-name">${escapeHtml(c.displayName)}</div><div class="contact-detail">${escapeHtml(c.detail)}</div><div class="contact-avatars">${ownerNames.map((n: string) => `<span class="avatar-chip">${escapeHtml(n)}</span>`).join("")}</div></div>
<div class="contact-stats"><div class="contact-stat-num">${conv.length}</div><div class="contact-stat-label">Sessions</div><div class="contact-last-seen">Last seen: ${escapeHtml(c.lastActive.slice(0, 10))}</div></div>`;
        node.addEventListener("click", (ev) => {
          if ((ev.target as HTMLElement)?.closest(".contact-detail-panel")) return;
          const existing = node.querySelector(".contact-detail-panel") as HTMLElement | null;
          if (existing) { existing.remove(); node.classList.remove("contact-card-open"); return; }
          node.classList.add("contact-card-open");
          const panel = document.createElement("div");
          panel.className = "contact-detail-panel";

          // Build conversation list backed by wa_conversation_memory.summary
          // (the actual session recap text) instead of a generic label.
          const convHtml = conv.length
            ? `<ul class="contact-conv-list">${conv.slice(0, 20).map((x) => {
                const date = String(x.updated_at || x.created_at || "").slice(0, 10);
                const cm = convMemoByConvId.get(String(x.id));
                const ownerName = owners.find((o) => String(o.id) === String(x.owner_id))?.display_name || "";
                const summary = cm?.summary || (ownerName ? `Session with ${ownerName}` : "Conversation");
                return `<li><span class="conv-date">${escapeHtml(date)}</span><span class="conv-summary">${escapeHtml(String(summary))}</span></li>`;
              }).join("")}</ul>`
            : `<p class="contact-panel-empty">No conversations logged.</p>`;

          const memHtml = mems.length
            ? `<div class="contact-mem-grid">${mems.slice(0, 12).map((m) => {
                const topics = memoryTopics(m);
                const title = topics[0] || m.persona_name || "Memory";
                const body = m.summary || m.raw_text || "";
                const date = String(m.created_at || "").slice(0, 10);
                return `<div class="contact-mem-card"><div class="mem-meta">${escapeHtml(date)}</div><div class="mem-title">${escapeHtml(String(title))}</div><div class="mem-body">${escapeHtml(String(body))}</div></div>`;
              }).join("")}</div>`
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
