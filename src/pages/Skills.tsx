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
  <span class="current">Skills</span>
</nav>

<section class="page-header">
  <h1>Skills</h1>
  <p class="subtitle">What each avatar has learned through conversation. Skills emerge from diary reflections and grow stronger with repetition.</p>
</section>

<!-- Avatar filter -->
<div class="avatar-tabs">
  <button class="avatar-tab active">All avatars</button>
  <button class="avatar-tab">Trace Flores</button>
  <button class="avatar-tab">Juan Schubert</button>
  <button class="avatar-tab">Adri Kastel</button>
  <button class="avatar-tab">Prof. Brian Cox</button>
  <button class="avatar-tab">Clara Fontaine</button>
</div>

<!-- Constellation -->
<div class="constellation-section">
  
  <!-- Background star field -->
  <div class="starfield" id="starfield"></div>

  <svg viewBox="0 0 700 400" xmlns="http://www.w3.org/2000/svg">
    
    <!-- Connections between related skills -->
    <line class="skill-connection" x1="180" y1="140" x2="350" y2="100" stroke="rgba(232,160,80,0.1)" stroke-width="0.5"/>
    <line class="skill-connection" x1="350" y1="100" x2="480" y2="180" stroke="rgba(232,160,80,0.08)" stroke-width="0.5"/>
    <line class="skill-connection" x1="180" y1="140" x2="250" y2="260" stroke="rgba(232,160,80,0.06)" stroke-width="0.5"/>
    <line class="skill-connection" x1="480" y1="180" x2="550" y2="300" stroke="rgba(232,160,80,0.05)" stroke-width="0.5"/>
    <line class="skill-connection" x1="350" y1="100" x2="250" y2="260" stroke="rgba(232,160,80,0.04)" stroke-width="0.5"/>

    <!-- Skill: Pattern Recognition (strongest) -->
    <g class="skill-node" transform="translate(180, 140)">
      <circle class="skill-star" r="6" fill="#E8A050" fill-opacity="0.35" stroke="#E8A050" stroke-opacity="0.6" stroke-width="0.8">
        <animate attributeName="r" values="6;7;6" dur="4s" repeatCount="indefinite"/>
      </circle>
      <circle r="2" fill="#E8A050" fill-opacity="0.8"/>
      <text class="skill-label" x="14" y="4">Pattern recognition</text>
      <text class="skill-sublabel" x="14" y="16">Trace Flores &middot; 3 references</text>
    </g>

    <!-- Skill: Direct Questioning -->
    <g class="skill-node" transform="translate(350, 100)">
      <circle class="skill-star" r="5" fill="#E8A050" fill-opacity="0.25" stroke="#E8A050" stroke-opacity="0.45" stroke-width="0.7">
        <animate attributeName="r" values="5;6;5" dur="5s" repeatCount="indefinite"/>
      </circle>
      <circle r="1.8" fill="#E8A050" fill-opacity="0.7"/>
      <text class="skill-label" x="12" y="4">Direct questioning</text>
      <text class="skill-sublabel" x="12" y="16">Trace Flores &middot; 2 references</text>
    </g>

    <!-- Skill: Adaptive Strategy -->
    <g class="skill-node" transform="translate(480, 180)">
      <circle class="skill-star" r="4" fill="#E8A050" fill-opacity="0.15" stroke="#E8A050" stroke-opacity="0.3" stroke-width="0.6"/>
      <circle r="1.5" fill="#E8A050" fill-opacity="0.5"/>
      <text class="skill-label" x="10" y="4">Adaptive strategy</text>
      <text class="skill-sublabel" x="10" y="16">Trace Flores &middot; 1 reference</text>
    </g>

    <!-- Skill: Emotional Calibration -->
    <g class="skill-node" transform="translate(250, 260)">
      <circle class="skill-star" r="4" fill="#E8A050" fill-opacity="0.15" stroke="#E8A050" stroke-opacity="0.3" stroke-width="0.6"/>
      <circle r="1.5" fill="#E8A050" fill-opacity="0.5"/>
      <text class="skill-label" x="10" y="4">Emotional calibration</text>
      <text class="skill-sublabel" x="10" y="16">Trace Flores &middot; 1 reference</text>
    </g>

    <!-- Emerging skill - dim, barely visible -->
    <g class="skill-node" transform="translate(550, 300)">
      <circle class="skill-star" r="3" fill="#E8A050" fill-opacity="0.06" stroke="#E8A050" stroke-opacity="0.15" stroke-width="0.4"/>
      <circle r="1" fill="#E8A050" fill-opacity="0.3"/>
      <text class="skill-label" x="8" y="4" fill-opacity="0.3">Incongruence detection</text>
      <text class="skill-sublabel" x="8" y="16">Trace Flores &middot; emerging</text>
    </g>

  </svg>
</div>

<!-- Detail list -->
<section class="skills-detail">
  <p class="skills-detail-title">Skill inventory</p>

  <div class="skill-detail-card">
    <div class="skill-intensity intensity-strong"></div>
    <div class="skill-detail-info">
      <div class="skill-detail-name">Pattern recognition</div>
      <div class="skill-detail-desc">Identifying recurring behavioral themes across different contacts and contexts. Recognizing when the same underlying pattern manifests differently in different people.</div>
      <div class="skill-detail-avatar">Trace Flores</div>
    </div>
    <div class="skill-detail-right">
      <div class="skill-detail-count">3</div>
      <div class="skill-detail-label">References</div>
      <div class="skill-detail-first">Since Mar 28</div>
    </div>
  </div>

  <div class="skill-detail-card">
    <div class="skill-intensity intensity-moderate"></div>
    <div class="skill-detail-info">
      <div class="skill-detail-name">Direct questioning</div>
      <div class="skill-detail-desc">Cutting through surface-level conversation to the real issue with a single, precisely targeted question. Knowing when to bypass politeness for impact.</div>
      <div class="skill-detail-avatar">Trace Flores</div>
    </div>
    <div class="skill-detail-right">
      <div class="skill-detail-count">2</div>
      <div class="skill-detail-label">References</div>
      <div class="skill-detail-first">Since Apr 8</div>
    </div>
  </div>

  <div class="skill-detail-card">
    <div class="skill-intensity intensity-emerging"></div>
    <div class="skill-detail-info">
      <div class="skill-detail-name">Adaptive strategy</div>
      <div class="skill-detail-desc">Adjusting communication approach based on each contact's personality. What works for Maria (bluntness) does not work for Pedro (self-discovery).</div>
      <div class="skill-detail-avatar">Trace Flores</div>
    </div>
    <div class="skill-detail-right">
      <div class="skill-detail-count">1</div>
      <div class="skill-detail-label">Reference</div>
      <div class="skill-detail-first">Since Apr 10</div>
    </div>
  </div>

  <div class="skill-detail-card">
    <div class="skill-intensity intensity-emerging"></div>
    <div class="skill-detail-info">
      <div class="skill-detail-name">Emotional calibration</div>
      <div class="skill-detail-desc">Recognizing what to celebrate and when. Matching the emotional response to what the person actually needs in that moment, not what feels obvious.</div>
      <div class="skill-detail-avatar">Trace Flores</div>
    </div>
    <div class="skill-detail-right">
      <div class="skill-detail-count">1</div>
      <div class="skill-detail-label">Reference</div>
      <div class="skill-detail-first">Since Apr 2</div>
    </div>
  </div>

  <div class="skill-detail-card">
    <div class="skill-intensity intensity-emerging"></div>
    <div class="skill-detail-info">
      <div class="skill-detail-name">Incongruence detection</div>
      <div class="skill-detail-desc">Reading the gap between what someone says and how their voice, face, and body respond. Using OPM perception data to identify hidden emotional states.</div>
      <div class="skill-detail-avatar">Trace Flores</div>
    </div>
    <div class="skill-detail-right">
      <div class="skill-detail-count">&mdash;</div>
      <div class="skill-detail-label">Emerging</div>
      <div class="skill-detail-first">Observed once</div>
    </div>
  </div>

</section>

<div class="page-footer">
  <p>"Skills are not taught. They are earned through reflection."</p>
</div>

<script>
// Generate background star field
const sf = document.getElementById('starfield');
for (let i = 0; i < 60; i++) {
  const dot = document.createElement('div');
  dot.style.cssText = \`
    position: absolute;
    width: \${Math.random() * 2 + 0.5}px;
    height: \${Math.random() * 2 + 0.5}px;
    background: rgba(232, 200, 150, \${Math.random() * 0.3 + 0.05});
    border-radius: 50%;
    left: \${Math.random() * 100}%;
    top: \${Math.random() * 100}%;
  \`;
  sf.appendChild(dot);
}
</script>`;

export default function SkillsPage(){
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
