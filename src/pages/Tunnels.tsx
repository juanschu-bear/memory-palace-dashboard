import { useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { fetchPalaceStatus, searchPalace, readDiary, fetchContacts, fetchMemories, fetchConversationMemory } from "@/lib/api";
import { findAvatar } from "@/lib/avatars";

const HTML = `<nav class="breadcrumb">
  <a href="/tunnels">Tunnels</a>
  <span class="sep">/</span>
  <span class="current">__WING_NAME__</span>
</nav>

<section class="tunnel-header">
  <p class="tunnel-eyebrow">__WING_LABEL__</p>
  <h1>__WING_NAME__'s Tunnels</h1>
  <p class="subtitle">Hidden corridors from __WING_FIRST__'s wing to the other avatars and contacts. When two wings share a theme, a tunnel forms.</p>
</section>

<!-- Network graph -->
<div class="tunnel-map">
  <svg viewBox="0 0 700 500" xmlns="http://www.w3.org/2000/svg">

    <!-- Tunnel connections (behind nodes) -->
    <!-- Trace <-> Adri: Business/Pricing -->
    <line class="tunnel-line" x1="200" y1="180" x2="500" y2="160" stroke="#E8A050" stroke-width="2" stroke-opacity="0.3"/>
    <line class="tunnel-pulse" x1="200" y1="180" x2="500" y2="160" stroke="#E8A050" stroke-width="1" stroke-opacity="0.15" fill="none"/>

    <!-- Trace <-> Juan: Business/Strategy -->
    <line class="tunnel-line" x1="200" y1="180" x2="350" y2="80" stroke="#E8A050" stroke-width="1.5" stroke-opacity="0.15"/>

    <!-- Trace <-> Clara: Challenges/Communication -->
    <line class="tunnel-line" x1="200" y1="180" x2="150" y2="350" stroke="#E8A050" stroke-width="1" stroke-opacity="0.08"/>

    <!-- Adri <-> Juan: Growth -->
    <line class="tunnel-line" x1="500" y1="160" x2="350" y2="80" stroke="#E8A050" stroke-width="1" stroke-opacity="0.1"/>

    <!-- Brian <-> Elena: Personal/Growth -->
    <line class="tunnel-line" x1="550" y1="340" x2="350" y2="400" stroke="#E8A050" stroke-width="1" stroke-opacity="0.06"/>

    <!-- Wing nodes (sublabels populated at runtime from /status.wings) -->
    <g class="wing-node" data-slug="trace-flores" transform="translate(200, 180)">
      <circle class="node-circle" r="34" fill="#E8A050" fill-opacity="0.06" stroke="#E8A050" stroke-opacity="0.3" stroke-width="0.8"/>
      <text class="node-label" text-anchor="middle" dy="-4">Trace</text>
      <text class="node-sublabel" text-anchor="middle" dy="12">— memories</text>
    </g>

    <g class="wing-node" data-slug="juan-schubert" transform="translate(350, 80)">
      <circle class="node-circle" r="30" fill="#E8A050" fill-opacity="0.05" stroke="#E8A050" stroke-opacity="0.25" stroke-width="0.8"/>
      <text class="node-label" text-anchor="middle" dy="-4">Juan</text>
      <text class="node-sublabel" text-anchor="middle" dy="12">— memories</text>
    </g>

    <g class="wing-node" data-slug="adri-kastel" transform="translate(500, 160)">
      <circle class="node-circle" r="30" fill="#E8A050" fill-opacity="0.05" stroke="#E8A050" stroke-opacity="0.25" stroke-width="0.8"/>
      <text class="node-label" text-anchor="middle" dy="-4">Adri</text>
      <text class="node-sublabel" text-anchor="middle" dy="12">— memories</text>
    </g>

    <g class="wing-node" data-slug="prof-brian-cox" transform="translate(550, 340)">
      <circle class="node-circle" r="30" fill="#E8A050" fill-opacity="0.05" stroke="#E8A050" stroke-opacity="0.25" stroke-width="0.8"/>
      <text class="node-label" text-anchor="middle" dy="-4">Brian</text>
      <text class="node-sublabel" text-anchor="middle" dy="12">— memories</text>
    </g>

    <g class="wing-node" data-slug="clara-fontaine" transform="translate(150, 350)">
      <circle class="node-circle" r="30" fill="#E8A050" fill-opacity="0.05" stroke="#E8A050" stroke-opacity="0.25" stroke-width="0.8"/>
      <text class="node-label" text-anchor="middle" dy="-4">Clara</text>
      <text class="node-sublabel" text-anchor="middle" dy="12">— memories</text>
    </g>

    <g class="wing-node" data-slug="elena-navarro" transform="translate(350, 400)">
      <circle class="node-circle" r="30" fill="#E8A050" fill-opacity="0.05" stroke="#E8A050" stroke-opacity="0.25" stroke-width="0.8"/>
      <text class="node-label" text-anchor="middle" dy="-4">Elena</text>
      <text class="node-sublabel" text-anchor="middle" dy="12">— memories</text>
    </g>

    <!-- Room labels on strong tunnels -->
    <text font-family="'DM Sans', sans-serif" font-size="9" fill="rgba(232,160,80,0.35)" text-anchor="middle" x="350" y="158">pricing</text>
    <text font-family="'DM Sans', sans-serif" font-size="9" fill="rgba(232,160,80,0.2)" text-anchor="middle" x="268" y="118">strategy</text>

  </svg>
</div>

<!-- Legend -->
<div class="tunnel-legend">
  <div class="legend-item"><div class="legend-line legend-strong"></div> Strong connection</div>
  <div class="legend-item"><div class="legend-line legend-medium"></div> Moderate</div>
  <div class="legend-item"><div class="legend-line legend-weak"></div> Emerging</div>
</div>

<!-- Detailed list -->
<section class="tunnel-list">
  <p class="tunnel-list-title">Active tunnels</p>

  <div class="tunnel-item">
    <span class="tunnel-wing">Trace Flores</span>
    <div class="tunnel-connector">
      <div class="tunnel-connector-line"></div>
      <div class="tunnel-connector-dot"></div>
      <div class="tunnel-connector-line"></div>
    </div>
    <span class="tunnel-wing">Adri Kastel</span>
    <div>
      <div class="tunnel-room">Business / Pricing</div>
      <div class="tunnel-strength">3 shared patterns</div>
    </div>
  </div>

  <div class="tunnel-item">
    <span class="tunnel-wing">Trace Flores</span>
    <div class="tunnel-connector">
      <div class="tunnel-connector-line"></div>
      <div class="tunnel-connector-dot"></div>
      <div class="tunnel-connector-line"></div>
    </div>
    <span class="tunnel-wing">Juan Schubert</span>
    <div>
      <div class="tunnel-room">Business / Strategy</div>
      <div class="tunnel-strength">1 shared pattern</div>
    </div>
  </div>

  <div class="tunnel-item">
    <span class="tunnel-wing">Trace Flores</span>
    <div class="tunnel-connector">
      <div class="tunnel-connector-line"></div>
      <div class="tunnel-connector-dot"></div>
      <div class="tunnel-connector-line"></div>
    </div>
    <span class="tunnel-wing">Clara Fontaine</span>
    <div>
      <div class="tunnel-room">Challenges / Communication</div>
      <div class="tunnel-strength">Emerging</div>
    </div>
  </div>

</section>`;

export default function TunnelsPage(){
  const ref = useRef<HTMLDivElement>(null);
  const params = useParams();
  const slug = (params.slug as string) || "trace-flores";
  const profile = findAvatar(slug);
  const html = useMemo(
    () =>
      HTML
        .replaceAll("__WING_NAME__", profile.name)
        .replaceAll("__WING_FIRST__", profile.name.split(" ")[0])
        .replaceAll("__WING_LABEL__", profile.wing),
    [profile.name, profile.wing],
  );
  useEffect(()=>{
    const root=ref.current; if(!root) return;
    (async()=>{
      let status: any = null;
      try { status = await fetchPalaceStatus(); } catch (err) { console.error("Tunnels /status failed:", err); }

      // Populate each wing node with its actual memory count from /status.wings.
      const wings = (status?.wings || {}) as Record<string, number>;
      const countFor = (wingSlug: string) => {
        const key = wingSlug.replace(/-/g, "_");
        return Number(wings?.[wingSlug] ?? wings?.[key] ?? wings?.[`wing_${key}`] ?? 0);
      };
      root.querySelectorAll<SVGGElement>('.wing-node[data-slug]').forEach((node) => {
        const wingSlug = node.dataset.slug || "";
        const count = countFor(wingSlug);
        const sublabel = node.querySelector('.node-sublabel');
        if (sublabel) sublabel.textContent = `${count} memor${count === 1 ? "y" : "ies"}`;
        // Emphasise the currently selected avatar so it stands out in the graph.
        const isActive = wingSlug === slug;
        node.classList.toggle("wing-node-active", isActive);
        const circle = node.querySelector('.node-circle') as SVGCircleElement | null;
        if (circle) {
          circle.setAttribute("r", isActive ? "40" : "30");
          circle.setAttribute("fill-opacity", isActive ? "0.14" : "0.05");
          circle.setAttribute("stroke-opacity", isActive ? "0.55" : "0.25");
          circle.setAttribute("stroke-width", isActive ? "1.2" : "0.8");
        }
      });

      // Diary preview for this avatar (if the layout exposes those counters).
      try {
        const d = await readDiary(slug, 10);
        const n = root.querySelector('.diary-live-count');
        if (n) n.textContent = String(Array.isArray(d?.entries) ? d.entries.length : 0);
      } catch (err) {
        console.error("Tunnels /diary/read failed:", err);
      }

      // Optional room-level semantic highlights for this avatar.
      try {
        const room = (params.room as string) || 'business';
        const res = await searchPalace(profile.name, slug, room);
        const list = root.querySelector('.room-live-list');
        if (list && Array.isArray(res?.results)) {
          list.innerHTML = '';
          res.results.slice(0, 8).forEach((r: any) => {
            const el = document.createElement('div');
            el.className = 'drawer-item';
            el.innerHTML = `<div class="drawer-title">${String(r.title || r.summary || 'Memory')}</div><div class="drawer-summary">${String(r.summary || r.content || '')}</div>`;
            list.appendChild(el);
          });
        }
      } catch (err) {
        console.error("Tunnels /search failed:", err);
      }

      // Supabase globals for the small stats bar if present.
      try {
        const [c, m, v] = await Promise.all([fetchContacts(), fetchMemories(), fetchConversationMemory()]);
        const c1 = root.querySelector('.contacts-live-count');
        const c2 = root.querySelector('.sessions-live-count');
        if (c1) c1.textContent = String(Array.isArray(c) ? c.length : 0);
        if (c2) c2.textContent = String((Array.isArray(m) ? m.length : 0) + (Array.isArray(v) ? v.length : 0));
      } catch (err) {
        console.error("Tunnels Supabase fetch failed:", err);
      }
    })();
  },[slug, profile.name, params.room]);
  return <div ref={ref} dangerouslySetInnerHTML={{__html:html}} />;
}
