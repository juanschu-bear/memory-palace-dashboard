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


<!-- Fixed corridor background -->
<div class="corridor-bg">
  <div class="ceiling"></div>
  <div class="floor"></div>
  <div class="wall-left"></div>
  <div class="wall-right"></div>
  <div class="vanishing-glow"></div>
</div>

<div class="light-ray ray-1"></div>
<div class="light-ray ray-2"></div>
<div class="light-ray ray-3"></div>
<div class="light-ray ray-4"></div>

<div class="torch torch-left-1"></div>
<div class="torch torch-left-2"></div>
<div class="torch torch-right-1"></div>
<div class="torch torch-right-2"></div>

<div id="dust-container"></div>

<!-- Scrollable content -->
<div class="content">

  <!-- Back -->
  <a class="back-btn" onclick="history.back()">
    <span class="arrow">&larr;</span>
    <span>Palace Entrance</span>
  </a>

  <!-- Wing header -->
  <section class="wing-header">
    <div class="wing-context">You are inside Wing I</div>
    <h1>Trace Flores</h1>
    <p class="role">Business Strategist &amp; Pattern Architect</p>
    <div class="wing-stats">
      <div class="wing-stat"><div class="num">49</div><div class="label">Memories</div></div>
      <div class="wing-stat"><div class="num">7</div><div class="label">Rooms</div></div>
      <div class="wing-stat"><div class="num">3</div><div class="label">Skills learned</div></div>
      <div class="wing-stat"><div class="num">12</div><div class="label">Sessions</div></div>
    </div>
  </section>

  <div class="wing-divider"></div>

  <!-- Rooms -->
  <section class="rooms-section">
    <p class="rooms-label">Open a Room</p>

    <div class="rooms-grid">

      <div class="room-door" onclick="window.location.href='/wing/trace-flores/room/business'">
        <div class="door-frame">
          <div class="door-interior"></div>
          <div class="door-handle"></div>
          <div class="door-glow"></div>
          <div class="door-peek">
            <p class="peek-line">"Pricing fear is always about self-worth, never about the number."</p>
          </div>
        </div>
        <div class="door-label">
          <div class="door-name">Business</div>
          <div class="door-count">23 memories</div>
        </div>
      </div>

      <div class="room-door" onclick="window.location.href='/wing/trace-flores/room/personal'">
        <div class="door-frame">
          <div class="door-interior"></div>
          <div class="door-handle"></div>
          <div class="door-glow"></div>
          <div class="door-peek">
            <p class="peek-line">"She talked about her son for the first time today."</p>
          </div>
        </div>
        <div class="door-label">
          <div class="door-name">Personal</div>
          <div class="door-count">8 memories</div>
        </div>
      </div>

      <div class="room-door" onclick="window.location.href='/wing/trace-flores/room/growth'">
        <div class="door-frame">
          <div class="door-interior"></div>
          <div class="door-handle"></div>
          <div class="door-glow"></div>
          <div class="door-peek">
            <p class="peek-line">"First time she set a boundary with a client."</p>
          </div>
        </div>
        <div class="door-label">
          <div class="door-name">Growth</div>
          <div class="door-count">6 memories</div>
        </div>
      </div>

      <div class="room-door" onclick="window.location.href='/wing/trace-flores/room/challenges'">
        <div class="door-frame">
          <div class="door-interior"></div>
          <div class="door-handle"></div>
          <div class="door-glow"></div>
          <div class="door-peek">
            <p class="peek-line">"Imposter syndrome hit hard when she got the big client."</p>
          </div>
        </div>
        <div class="door-label">
          <div class="door-name">Challenges</div>
          <div class="door-count">5 memories</div>
        </div>
      </div>

      <div class="room-door" onclick="window.location.href='/wing/trace-flores/room/wins'">
        <div class="door-frame">
          <div class="door-interior"></div>
          <div class="door-handle"></div>
          <div class="door-glow"></div>
          <div class="door-peek">
            <p class="peek-line">"12 signups in one week. She cried."</p>
          </div>
        </div>
        <div class="door-label">
          <div class="door-name">Wins</div>
          <div class="door-count">4 memories</div>
        </div>
      </div>

      <div class="room-door" onclick="window.location.href='/wing/trace-flores/room/behavioral'">
        <div class="door-frame">
          <div class="door-interior"></div>
          <div class="door-handle"></div>
          <div class="door-glow"></div>
          <div class="door-peek">
            <p class="peek-line">"Voice tremor spikes when discussing revenue."</p>
          </div>
        </div>
        <div class="door-label">
          <div class="door-name">Behavioral</div>
          <div class="door-count">3 memories</div>
        </div>
      </div>

      <div class="room-door diary-door" onclick="window.location.href='/wing/trace-flores/diary'">
        <div class="door-frame">
          <div class="door-interior"></div>
          <div class="door-handle"></div>
          <div class="door-glow"></div>
          <div class="door-peek">
            <p class="peek-line">"I learned to ask the self-worth question before the pricing question."</p>
          </div>
        </div>
        <div class="door-label">
          <div class="door-name">Avatar Diary</div>
          <div class="door-count">2 entries</div>
        </div>
      </div>

    </div>
  </section>

  <!-- Diary preview -->
  <section class="diary-section">
    <div class="diary-divider"></div>
    <p class="diary-label">Trace's latest reflection</p>
    <p class="diary-quote">"When someone switches topics fast, they are avoiding something. I now skip the surface and go straight to what they are protecting."</p>
    <p class="diary-date">April 13, 2026</p>
    <a class="diary-link" onclick="window.location.href='/wing/trace-flores/diary'">Read full diary</a>
  </section>

</div>

<script>
// Generate dust particles
const dustContainer = document.getElementById('dust-container');
for (let i = 0; i < 25; i++) {
  const dust = document.createElement('div');
  dust.className = 'dust';
  dust.style.left = (20 + Math.random() * 60) + '%';
  dust.style.top = (15 + Math.random() * 55) + '%';
  dust.style.animationDuration = (5 + Math.random() * 8) + 's';
  dust.style.animationDelay = (Math.random() * 10) + 's';
  dustContainer.appendChild(dust);
}
</script>`;

export default function WingPage(){
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
