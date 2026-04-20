import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchMemories, fetchOwners } from "@/lib/api";
import { findAvatar, memoriesForAvatar, memoryMatchesRoom, memoryTopics } from "@/lib/avatars";
import { attachInternalLinkNav } from "@/lib/clientLinks";

const HTML = `<!-- Room atmosphere -->
<div class="room-bg"></div>
<div class="room-light"></div>
<div class="wall-texture-left"></div>
<div class="wall-texture-right"></div>
<div id="dust-container"></div>

<!-- Content -->
<div class="content">

  <!-- Breadcrumb -->
  <nav class="breadcrumb">
    <a href="/wings">Wings</a>
    <span class="sep">/</span>
    <a class="room-wing-link" href="/wing/__SLUG__">__WING_NAME__</a>
    <span class="sep">/</span>
    <span class="current">__ROOM_LABEL__</span>
  </nav>

  <!-- Room header -->
  <section class="room-header">
    <div class="room-context">__WING_NAME__ &middot; Room</div>
    <h1>__ROOM_LABEL__</h1>
    <p class="room-desc">Memories this avatar has tagged with <em>__ROOM_SLUG__</em>.</p>
    <div class="room-meta">
      <div class="room-meta-item"><strong class="room-mem-count">0</strong> memories</div>
    </div>
  </section>

  <div class="room-divider"></div>

  <!-- Search -->
  <div class="search-bar">
    <input type="text" class="search-input" placeholder="Search within this room...">
  </div>

  <!-- Drawers (memories) — populated at runtime from wa_memories -->
  <section class="drawers-section"></section>

</div>`;

function escapeHtml(s: string){
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function labelize(s: string){
  return s.split("-").map((p)=>p.charAt(0).toUpperCase()+p.slice(1)).join(" ");
}

export default function RoomPage(){
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const params = useParams();
  const slug=(params.slug as string)||'trace-flores';
  const room=(params.room as string)||'business';
  const roomLabel=labelize(room);
  const profile = findAvatar(slug);

  const html = useMemo(
    () => HTML
      .replaceAll("__SLUG__", slug)
      .replaceAll("__ROOM_SLUG__", room)
      .replaceAll("__ROOM_LABEL__", roomLabel)
      .replaceAll("__WING_NAME__", profile.name),
    [slug, room, roomLabel, profile.name],
  );

  useEffect(()=>{
    const root=ref.current; if(!root) return;
    const section=root.querySelector('.drawers-section') as HTMLElement | null;
    if(section){ section.innerHTML='<div class="drawer-loading">Opening drawers…</div>'; }
    const detachLinks = attachInternalLinkNav(root, navigate);

    (async()=>{
      let memories: any[] = [], owners: any[] = [];
      try {
        [memories, owners] = await Promise.all([fetchMemories(), fetchOwners()]);
      } catch (err) {
        console.error("Room Supabase fetch failed:", err);
      }
      if (!section) return;

      // Narrow to this avatar's memories, then filter by room via topics.
      // Fallback: if no topic matches the room slug, show everything for the
      // avatar (per spec) so rooms aren't silently empty during early data.
      const avatarMems = memoriesForAvatar(slug, memories, owners);
      const roomMems = avatarMems.filter((m) => memoryMatchesRoom(room, m));
      const visible = roomMems.length > 0 ? roomMems : avatarMems;
      const ordered = [...visible].sort((a, b) =>
        String(b.created_at || "").localeCompare(String(a.created_at || "")),
      );

      const memCountEl = root.querySelector('.room-mem-count');
      if (memCountEl) memCountEl.textContent = String(ordered.length);

      if (ordered.length === 0) {
        section.innerHTML = `<div class="drawer-empty"><div class="drawer-empty-title">No memories in this room yet</div><div class="drawer-empty-sub">Once ${escapeHtml(profile.name)} stores memories tagged <em>${escapeHtml(room)}</em>, they'll show up here.</div></div>`;
        return;
      }
      section.innerHTML = "";
      ordered.slice(0, 50).forEach((m: any) => {
        const summary = String(m.summary || "");
        const rawText = String(m.raw_text || "");
        const title = (summary || rawText).slice(0, 80).trim();
        const body = summary && rawText && summary !== rawText ? rawText : (rawText || summary);
        const date = String(m.created_at || "").slice(0, 10);
        const topics = memoryTopics(m);
        const tagsHtml = topics.slice(0, 4).map((t) => `<span class="drawer-tag">${escapeHtml(t)}</span>`).join("");

        const entry = document.createElement("div");
        entry.className = "drawer";
        entry.innerHTML = `<div class="drawer-top"><div class="drawer-date">${escapeHtml(date)}</div><div class="drawer-content"><div class="drawer-title">${escapeHtml(title || "Memory")}</div><div class="drawer-summary">${escapeHtml(body)}</div><div class="drawer-tags">${tagsHtml}</div></div><div class="drawer-right"><span class="drawer-expand">&darr;</span></div></div>`;
        entry.addEventListener("click", () => entry.classList.toggle("drawer-open"));
        section.appendChild(entry);
      });
    })();
    return () => { detachLinks(); };
  },[slug, room, roomLabel, profile.name, navigate]);
  return <div ref={ref} dangerouslySetInnerHTML={{__html:html}} />;
}
