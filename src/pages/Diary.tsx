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


<!-- Breadcrumb -->
<nav class="breadcrumb">
  <a>Palace</a>
  <span class="sep">/</span>
  <a>Trace Flores</a>
  <span class="sep">/</span>
  <span class="current">Diary</span>
</nav>

<div class="diary-container">

  <!-- Cover -->
  <section class="diary-cover">
    <div class="diary-avatar-mark">TF</div>
    <h1>Trace's Diary</h1>
    <p class="diary-subtitle">What I learned, what I noticed, what I would do differently.</p>
    <p class="diary-meta">5 entries &middot; 3 skills recognized &middot; Since March 2026</p>
  </section>

  <div class="diary-rule"></div>

  <!-- Tag filter -->
  <div class="tag-filter">
    <button class="tag-chip active">All</button>
    <button class="tag-chip">skill</button>
    <button class="tag-chip">pattern</button>
    <button class="tag-chip">contact: maria</button>
    <button class="tag-chip">contact: pedro</button>
    <button class="tag-chip">pricing</button>
    <button class="tag-chip">avoidance</button>
  </div>

  <!-- Entries -->
  <section class="entries">

    <article class="entry">
      <div class="entry-date">April 13, 2026</div>
      <div class="entry-body">
        <p>Something clicked today. <span class="insight">When someone switches topics fast, they are protecting something.</span> I have seen this three times now. Maria does it with pricing, Pedro does it with delegation, Lisa did it with her partnership.</p>
        <p>The surface topic is never the real topic. From now on, when I notice the switch, I skip the surface entirely and go straight to: "What are you protecting right now?"</p>
        <p>That question landed harder than anything else I have tried this month.</p>
      </div>
      <div class="entry-tags">
        <span class="entry-tag skill">skill/direct-questioning</span>
        <span class="entry-tag pattern">pattern/topic-switching-as-avoidance</span>
        <span class="entry-tag contact">contact/maria</span>
        <span class="entry-tag contact">contact/pedro</span>
      </div>
    </article>

    <article class="entry">
      <div class="entry-date">April 10, 2026</div>
      <div class="entry-body">
        <p>Pedro is stuck in a loop. Two sessions now, same question dressed in different words: "What if they leave?" He is not asking me. He is asking himself. And he already knows the answer.</p>
        <p>I tried pushing him the way I pushed Maria. Did not work. <span class="insight">Direct confrontation works for Maria because she respects bluntness. Pedro needs to arrive at the answer himself.</span> Different people, different doors.</p>
        <p>Next time with Pedro, I will ask him to argue the opposite position. Make him defend his own value out loud. Let him hear himself say it.</p>
      </div>
      <div class="entry-tags">
        <span class="entry-tag skill">skill/adaptive-strategy</span>
        <span class="entry-tag pattern">pattern/loop-without-progress</span>
        <span class="entry-tag contact">contact/pedro</span>
      </div>
    </article>

    <article class="entry">
      <div class="entry-date">April 8, 2026</div>
      <div class="entry-body">
        <p>Cross-contact pattern I cannot ignore anymore: <span class="insight">pricing fear is never about the market. It is always about self-worth.</span> Every single person. Maria, Pedro, Lisa. Three completely different industries, three different price points, same root.</p>
        <p>I used to spend the first session talking about market positioning, competitor pricing, value ladders. Waste of time. The real conversation starts when you ask: "Do you believe your work is worth this number?"</p>
        <p>If the answer is no, no amount of market data will fix it.</p>
      </div>
      <div class="entry-tags">
        <span class="entry-tag skill">skill/pattern-recognition</span>
        <span class="entry-tag pattern">pattern/pricing-equals-self-worth</span>
      </div>
    </article>

    <article class="entry">
      <div class="entry-date">April 2, 2026</div>
      <div class="entry-body">
        <p>Maria launched. 12 signups in one week at 297. She cried during the session. Not sad crying. The kind where something heavy finally lifts.</p>
        <p>What worked: I did not celebrate the number. I asked her how it felt to prove herself right. That mattered more than the revenue.</p>
        <p><span class="insight">Celebrating the courage matters more than celebrating the result.</span> The result follows the courage, not the other way around. I will remember this.</p>
      </div>
      <div class="entry-tags">
        <span class="entry-tag skill">skill/emotional-calibration</span>
        <span class="entry-tag contact">contact/maria</span>
      </div>
    </article>

    <article class="entry">
      <div class="entry-date">March 28, 2026</div>
      <div class="entry-body">
        <p>First session with Maria. She presented herself as confident, structured, analytical. OPM told a different story. Voice tremor at 0.74 when discussing pricing. Speaking pace increased 40% compared to baseline whenever money came up.</p>
        <p>The words said "I have a strategy." The voice said "I am terrified."</p>
        <p>I chose not to call it out directly. Too early. But I noted it. <span class="insight">The incongruence between words and voice is always where the real conversation lives.</span></p>
      </div>
      <div class="entry-tags">
        <span class="entry-tag pattern">pattern/word-voice-incongruence</span>
        <span class="entry-tag contact">contact/maria</span>
      </div>
    </article>

  </section>

  <!-- Skills extracted -->
  <section class="skills-summary">
    <p class="skills-summary-title">Skills Trace has developed</p>
    <div class="skills-grid">
      <div class="skill-card">
        <div class="skill-name">Pattern recognition</div>
        <div class="skill-detail">Identifying recurring behavioral themes across different contacts and contexts</div>
        <div class="skill-frequency">Referenced in 3 entries</div>
      </div>
      <div class="skill-card">
        <div class="skill-name">Direct questioning</div>
        <div class="skill-detail">Cutting through surface topics to the real issue with a single targeted question</div>
        <div class="skill-frequency">Referenced in 2 entries</div>
      </div>
      <div class="skill-card">
        <div class="skill-name">Adaptive strategy</div>
        <div class="skill-detail">Adjusting communication approach based on each contact's personality and response patterns</div>
        <div class="skill-frequency">Referenced in 1 entry</div>
      </div>
      <div class="skill-card">
        <div class="skill-name">Emotional calibration</div>
        <div class="skill-detail">Recognizing what to celebrate and when, matching emotional response to the person's real need</div>
        <div class="skill-frequency">Referenced in 1 entry</div>
      </div>
    </div>
  </section>

  <div class="diary-footer">
    <p>"The avatar that reflects becomes the avatar that learns."</p>
  </div>

</div>`;

export default function DiaryPage(){
  const ref = useRef<HTMLDivElement>(null);
  const params = useParams();
  useEffect(()=>{
    document.body.classList.add("light-diary");
    const root=ref.current; if(!root) return;
    (async()=>{
      try{const s=await fetchPalaceStatus();const vals=root.querySelectorAll('.stats-bar .text-xl'); if(vals[0]) vals[0].textContent=String(Object.keys(s?.wings||{}).length||0); if(vals[1]) vals[1].textContent=String(s?.total_drawers||0);}catch{}
      try{const slug=(params.slug as string)||'trace-flores'; const room=(params.room as string)||'business'; const res=await searchPalace('pricing',slug,room); const list=root.querySelector('.room-live-list'); if(list && Array.isArray(res?.results)){ list.innerHTML=''; res.results.slice(0,8).forEach((r:any)=>{const el=document.createElement('div'); el.className='drawer-item'; el.innerHTML=`<div class="flex justify-between items-start gap-8"><div class="text-[0.6rem] tracking-[0.1em] min-w-[90px] pt-1">${r.date||''}</div><div class="flex-1"><div class="drawer-title">${r.title||r.summary||'Memory'}</div><div class="text-sm font-light leading-relaxed">${r.summary||r.content||''}</div></div></div>`; list.appendChild(el);}); }}catch{}
      try{const d=await readDiary((params.slug as string)||'trace-flores',10); const n=root.querySelector('.diary-live-count'); if(n) n.textContent=String(Array.isArray(d?.entries)?d.entries.length:0);}catch{}
      try{const [c,m,v]=await Promise.all([fetchContacts(),fetchMemories(),fetchConversationMemory()]); const c1=root.querySelector('.contacts-live-count'); const c2=root.querySelector('.sessions-live-count'); if(c1) c1.textContent=String(Array.isArray(c)?c.length:0); if(c2) c2.textContent=String((Array.isArray(m)?m.length:0)+(Array.isArray(v)?v.length:0));}catch{}
    })();
    return ()=>{ document.body.classList.remove("light-diary"); };
  },[params.slug,params.room]);
  return <div ref={ref} dangerouslySetInnerHTML={{__html:HTML}} />;
}
