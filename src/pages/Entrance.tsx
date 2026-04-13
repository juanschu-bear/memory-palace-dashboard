import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { fetchPalaceStatus, searchPalace, readDiary, fetchContacts, fetchMemories, fetchConversationMemory } from "@/lib/api";

const HTML = `<!-- Global Navigation -->


<!-- ========== SCENE 1: Palace Exterior ========== -->
<div class="scene">
  <div class="sky"></div>
  <div class="stars" id="stars"></div>
  <div class="mist"></div>
  <div class="mist-2"></div>

  <div class="palace-silhouette">
    <div class="pediment"></div>
    <div class="building-body"></div>
    <div class="columns">
      <div class="column"></div>
      <div class="column"></div>
      <div class="column"></div>
      <div class="column"></div>
      <div class="column"></div>
      <div class="column"></div>
    </div>
    <div class="entrance-arch"></div>
    <div class="light-spill"></div>
  </div>

  <div class="ground"><div class="path"></div></div>

  <div class="overlay-text">
    <h1>The <em>Memory</em> Palace</h1>
    <p class="subtitle">Where your avatars remember</p>
    <a href="#corridors" class="enter-btn">Enter</a>
  </div>

  <div class="scroll-hint">
    <div class="scroll-line"></div>
    <span>Scroll</span>
  </div>

  <div class="stats-bar">
    <div class="stat-item"><div class="val">6</div><div class="lbl">Wings</div></div>
    <div class="stat-item"><div class="val">49</div><div class="lbl">Memories</div></div>
    <div class="stat-item"><div class="val">0</div><div class="lbl">Diary Entries</div></div>
    <div class="stat-item"><div class="val">42</div><div class="lbl">Rooms</div></div>
  </div>
</div>

<!-- ========== SCENE 2: Corridors ========== -->
<section class="corridors" id="corridors">
  <p class="corridors-label">Choose a Wing</p>
  <p class="corridors-sublabel">Extended Avatars</p>

  <a class="wing-corridor" href="/wing/trace-flores">
    <span class="corridor-number">01</span>
    <span class="corridor-name">Trace Flores</span>
    <span class="corridor-role">Business Strategist & Pattern Architect</span>
    <div class="corridor-right">
      <span class="corridor-count">49 Memories</span>
      <span class="corridor-arrow">&rarr;</span>
    </div>
  </a>

  <a class="wing-corridor" href="/wing/trace-flores">
    <span class="corridor-number">02</span>
    <span class="corridor-name">Juan Schubert</span>
    <span class="corridor-role">System Architect & Digital Twin</span>
    <div class="corridor-right">
      <span class="corridor-count">0 Memories</span>
      <span class="corridor-arrow">&rarr;</span>
    </div>
  </a>

  <a class="wing-corridor" href="/wing/trace-flores">
    <span class="corridor-number">03</span>
    <span class="corridor-name">Adri Kastel</span>
    <span class="corridor-role">Growth Expert & Scaling Mentor</span>
    <div class="corridor-right">
      <span class="corridor-count">0 Memories</span>
      <span class="corridor-arrow">&rarr;</span>
    </div>
  </a>

  <a class="wing-corridor" href="/wing/trace-flores">
    <span class="corridor-number">04</span>
    <span class="corridor-name">Prof. Brian Cox</span>
    <span class="corridor-role">Science Communicator & Educator</span>
    <div class="corridor-right">
      <span class="corridor-count">0 Memories</span>
      <span class="corridor-arrow">&rarr;</span>
    </div>
  </a>

  <a class="wing-corridor" href="/wing/trace-flores">
    <span class="corridor-number">05</span>
    <span class="corridor-name">Clara Fontaine</span>
    <span class="corridor-role">Executive Communication Coach</span>
    <div class="corridor-right">
      <span class="corridor-count">0 Memories</span>
      <span class="corridor-arrow">&rarr;</span>
    </div>
  </a>

  <a class="wing-corridor" href="/wing/trace-flores">
    <span class="corridor-number">06</span>
    <span class="corridor-name">Elena Navarro</span>
    <span class="corridor-role">Sales Strategist & Business Growth Expert</span>
    <div class="corridor-right">
      <span class="corridor-count">0 Memories</span>
      <span class="corridor-arrow">&rarr;</span>
    </div>
  </a>

  <div class="bottom-nav">
    <a href="/tunnels">Tunnels</a>
    <a href="/contacts">Contacts</a>
    <a href="/skills">Skills</a>
  </div>
</section>

<div class="footer-whisper">
  <p>ONIOKO &middot; Memory Palace &middot; EXIDEUS LLC</p>
</div>

<script>
// Stars
const starsEl = document.getElementById('stars');
for (let i = 0; i < 120; i++) {
  const star = document.createElement('div');
  const size = Math.random() * 2 + 0.5;
  Object.assign(star.style, {
    position: 'absolute',
    width: size + 'px', height: size + 'px',
    background: '#fff', borderRadius: '50%',
    left: Math.random() * 100 + '%',
    top: Math.random() * 55 + '%',
    opacity: Math.random() * 0.6 + 0.1,
  });
  starsEl.appendChild(star);
}

// Smooth scroll
document.querySelector('.enter-btn').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('corridors').scrollIntoView({ behavior: 'smooth' });
});
</script>`;

export default function EntrancePage(){
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
