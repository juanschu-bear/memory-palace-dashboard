import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { fetchPalaceStatus, searchPalace, readDiary, fetchContacts, fetchMemories, fetchConversationMemory } from "@/lib/api";

const HTML = `<!-- Global Navigation -->
<nav style="position:fixed;top:0;left:0;width:100%;z-index:50;display:flex;align-items:center;justify-content:center;gap:0.5rem;padding:1rem 2rem;background:rgba(10,10,12,0.75);backdrop-filter:blur(12px);border-bottom:1px solid rgba(232,160,80,0.06)">
  <a href="/" style="font-family:'Cormorant Garamond',serif;font-size:0.85rem;letter-spacing:0.12em;color:rgba(232,160,80,0.6);text-decoration:none;margin-right:1.5rem;padding-right:1.5rem;border-right:1px solid rgba(232,160,80,0.1)">Memory Palace</a>
  <a href="/" style="font-family:'DM Sans',sans-serif;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(232,224,208,0.35);text-decoration:none;padding:0.5rem 1.2rem;border:1px solid transparent;border-radius:3px;transition:all 0.3s ease">Entrance</a>
  <a href="/wing/trace-flores" style="font-family:'DM Sans',sans-serif;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(232,224,208,0.35);text-decoration:none;padding:0.5rem 1.2rem;border:1px solid transparent;border-radius:3px;transition:all 0.3s ease">Wings</a>
  <a href="/wing/trace-flores/room/business" style="font-family:'DM Sans',sans-serif;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(232,224,208,0.35);text-decoration:none;padding:0.5rem 1.2rem;border:1px solid transparent;border-radius:3px;transition:all 0.3s ease">Rooms</a>
  <a href="/wing/trace-flores/diary" style="font-family:'DM Sans',sans-serif;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(232,224,208,0.35);text-decoration:none;padding:0.5rem 1.2rem;border:1px solid transparent;border-radius:3px;transition:all 0.3s ease">Diary</a>
  <a href="/tunnels" style="font-family:'DM Sans',sans-serif;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(232,224,208,0.35);text-decoration:none;padding:0.5rem 1.2rem;border:1px solid transparent;border-radius:3px;transition:all 0.3s ease">Tunnels</a>
  <a href="/contacts" style="font-family:'DM Sans',sans-serif;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(232,224,208,0.35);text-decoration:none;padding:0.5rem 1.2rem;border:1px solid transparent;border-radius:3px;transition:all 0.3s ease">Contacts</a>
  <a href="/skills" style="font-family:'DM Sans',sans-serif;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(232,224,208,0.35);text-decoration:none;padding:0.5rem 1.2rem;border:1px solid transparent;border-radius:3px;transition:all 0.3s ease">Skills</a>
</nav>


<nav class="breadcrumb">
  <a>Palace</a>
  <span class="sep">/</span>
  <span class="current">Tunnels</span>
</nav>

<section class="tunnel-header">
  <h1>Tunnels</h1>
  <p class="subtitle">Hidden corridors connecting wings. When two avatars encounter the same theme, a tunnel forms between them.</p>
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

    <!-- Wing nodes -->
    <!-- Trace Flores -->
    <g class="wing-node" transform="translate(200, 180)">
      <circle class="node-circle" r="38" fill="#E8A050" fill-opacity="0.08" stroke="#E8A050" stroke-opacity="0.4" stroke-width="1"/>
      <text class="node-label" text-anchor="middle" dy="-4">Trace</text>
      <text class="node-sublabel" text-anchor="middle" dy="12">49 memories</text>
    </g>

    <!-- Juan Schubert -->
    <g class="wing-node" transform="translate(350, 80)">
      <circle class="node-circle" r="30" fill="#E8A050" fill-opacity="0.05" stroke="#E8A050" stroke-opacity="0.25" stroke-width="0.8"/>
      <text class="node-label" text-anchor="middle" dy="-4">Juan</text>
      <text class="node-sublabel" text-anchor="middle" dy="12">0 memories</text>
    </g>

    <!-- Adri Kastel -->
    <g class="wing-node" transform="translate(500, 160)">
      <circle class="node-circle" r="32" fill="#E8A050" fill-opacity="0.06" stroke="#E8A050" stroke-opacity="0.3" stroke-width="0.8"/>
      <text class="node-label" text-anchor="middle" dy="-4">Adri</text>
      <text class="node-sublabel" text-anchor="middle" dy="12">0 memories</text>
    </g>

    <!-- Prof Brian Cox -->
    <g class="wing-node" transform="translate(550, 340)">
      <circle class="node-circle" r="28" fill="#E8A050" fill-opacity="0.04" stroke="#E8A050" stroke-opacity="0.2" stroke-width="0.6"/>
      <text class="node-label" text-anchor="middle" dy="-4">Brian</text>
      <text class="node-sublabel" text-anchor="middle" dy="12">0 memories</text>
    </g>

    <!-- Clara Fontaine -->
    <g class="wing-node" transform="translate(150, 350)">
      <circle class="node-circle" r="28" fill="#E8A050" fill-opacity="0.04" stroke="#E8A050" stroke-opacity="0.2" stroke-width="0.6"/>
      <text class="node-label" text-anchor="middle" dy="-4">Clara</text>
      <text class="node-sublabel" text-anchor="middle" dy="12">0 memories</text>
    </g>

    <!-- Elena Navarro -->
    <g class="wing-node" transform="translate(350, 400)">
      <circle class="node-circle" r="26" fill="#E8A050" fill-opacity="0.03" stroke="#E8A050" stroke-opacity="0.15" stroke-width="0.5"/>
      <text class="node-label" text-anchor="middle" dy="-4">Elena</text>
      <text class="node-sublabel" text-anchor="middle" dy="12">0 memories</text>
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
  useEffect(()=>{
    const root=ref.current; if(!root) return;
    (async()=>{
      try{const s=await fetchPalaceStatus();const vals=root.querySelectorAll('.stats-bar .text-xl'); if(vals[0]) vals[0].textContent=String(Object.keys(s?.wings||{}).length||0); if(vals[1]) vals[1].textContent=String(s?.total_drawers||0);}catch{}
      try{const slug=(params.slug as string)||'trace-flores'; const room=(params.room as string)||'business'; const res=await searchPalace('pricing',slug,room); const list=root.querySelector('.room-live-list'); if(list && Array.isArray(res?.results)){ list.innerHTML=''; res.results.slice(0,8).forEach((r:any)=>{const el=document.createElement('div'); el.className='drawer-item'; el.innerHTML=`<div class="flex justify-between items-start gap-8"><div class="text-[0.6rem] tracking-[0.1em] min-w-[90px] pt-1">${r.date||''}</div><div class="flex-1"><div class="drawer-title">${r.title||r.summary||'Memory'}</div><div class="text-sm font-light leading-relaxed">${r.summary||r.content||''}</div></div></div>`; list.appendChild(el);}); }}catch{}
      try{const d=await readDiary((params.slug as string)||'trace-flores',10); const n=root.querySelector('.diary-live-count'); if(n) n.textContent=String(Array.isArray(d?.entries)?d.entries.length:0);}catch{}
      try{const [c,m,v]=await Promise.all([fetchContacts(),fetchMemories(),fetchConversationMemory()]); const c1=root.querySelector('.contacts-live-count'); const c2=root.querySelector('.sessions-live-count'); if(c1) c1.textContent=String(Array.isArray(c)?c.length:0); if(c2) c2.textContent=String((Array.isArray(m)?m.length:0)+(Array.isArray(v)?v.length:0));}catch{}
    })();
  },[params.slug,params.room]);
  return <div ref={ref} dangerouslySetInnerHTML={{__html:HTML}} />;
}
