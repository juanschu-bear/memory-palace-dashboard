import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { fetchPalaceStatus, searchPalace, readDiary, fetchContacts, fetchMemories, fetchConversationMemory } from "@/lib/api";

const HTML = `<!-- Global Navigation -->
<nav style="position:fixed;top:0;left:0;width:100%;z-index:50;display:flex;align-items:center;justify-content:center;gap:0.5rem;padding:1rem 2rem;background:rgba(10,10,12,0.75);backdrop-filter:blur(12px);border-bottom:1px solid rgba(232,160,80,0.06)">
  <a href="/" style="font-family:'Cormorant Garamond',serif;font-size:0.85rem;letter-spacing:0.12em;color:rgba(232,160,80,0.6);text-decoration:none;margin-right:1.5rem;padding-right:1.5rem;border-right:1px solid rgba(232,160,80,0.1)">Memory Palace</a>
  <a href="/" style="font-family:'DM Sans',sans-serif;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(232,224,208,0.35);text-decoration:none;padding:0.5rem 1.2rem;border:1px solid transparent;border-radius:3px;transition:all 0.3s ease">Entrance</a>
  <a href="02-wing.html" style="font-family:'DM Sans',sans-serif;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(232,224,208,0.35);text-decoration:none;padding:0.5rem 1.2rem;border:1px solid transparent;border-radius:3px;transition:all 0.3s ease">Wings</a>
  <a href="03-room.html" style="font-family:'DM Sans',sans-serif;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(232,224,208,0.35);text-decoration:none;padding:0.5rem 1.2rem;border:1px solid transparent;border-radius:3px;transition:all 0.3s ease">Rooms</a>
  <a href="04-diary.html" style="font-family:'DM Sans',sans-serif;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(232,224,208,0.35);text-decoration:none;padding:0.5rem 1.2rem;border:1px solid transparent;border-radius:3px;transition:all 0.3s ease">Diary</a>
  <a href="/tunnels" style="font-family:'DM Sans',sans-serif;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(232,224,208,0.35);text-decoration:none;padding:0.5rem 1.2rem;border:1px solid transparent;border-radius:3px;transition:all 0.3s ease">Tunnels</a>
  <a href="/contacts" style="font-family:'DM Sans',sans-serif;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(232,224,208,0.35);text-decoration:none;padding:0.5rem 1.2rem;border:1px solid transparent;border-radius:3px;transition:all 0.3s ease">Contacts</a>
  <a href="/skills" style="font-family:'DM Sans',sans-serif;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(232,224,208,0.35);text-decoration:none;padding:0.5rem 1.2rem;border:1px solid transparent;border-radius:3px;transition:all 0.3s ease">Skills</a>
</nav>


<nav class="breadcrumb">
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

export default function ContactsPage(){
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
