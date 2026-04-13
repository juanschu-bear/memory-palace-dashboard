import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { searchPalace } from "@/lib/api";

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


<!-- Room atmosphere -->
<div class="room-bg"></div>
<div class="room-light"></div>
<div class="wall-texture-left"></div>
<div class="wall-texture-right"></div>
<div id="dust-container"></div>

<!-- Content -->
<div class="content">

  <!-- Breadcrumb -->
  <nav class="breadcrumb">
    <a onclick="history.go(-2)">Palace</a>
    <span class="sep">/</span>
    <a onclick="history.back()">Trace Flores</a>
    <span class="sep">/</span>
    <span class="current">Business</span>
  </nav>

  <!-- Room header -->
  <section class="room-header">
    <div class="room-context">Trace Flores &middot; Room</div>
    <h1>Business</h1>
    <p class="room-desc">Strategy, launches, pricing, revenue, scaling, market positioning, client acquisition, competitive landscape.</p>
    <div class="room-meta">
      <div class="room-meta-item"><strong>23</strong> memories</div>
      <div class="room-meta-item"><strong>4</strong> contacts</div>
      <div class="room-meta-item"><strong>2</strong> tunnels</div>
    </div>
  </section>

  <div class="room-divider"></div>

  <!-- Search -->
  <div class="search-bar">
    <input type="text" class="search-input" placeholder="Search within this room...">
  </div>

  <!-- Drawers (memories) -->
  <section class="drawers-section">

    <div class="drawer" onclick="this.querySelector('.drawer-detail').classList.toggle('open')">
      <div class="drawer-top">
        <div class="drawer-date">Apr 12, 2026</div>
        <div class="drawer-content">
          <div class="drawer-title">Maria raised her course price from 197 to 297 euros</div>
          <div class="drawer-summary">After three sessions of circling the topic, Maria finally committed to the higher price. The trigger was reframing it from "charging more" to "valuing her expertise".</div>
          <div class="drawer-tags">
            <span class="drawer-tag hall-decision">Decision</span>
            <span class="drawer-tag">pricing</span>
            <span class="drawer-tag">self-worth</span>
          </div>
        </div>
        <div class="drawer-right">
          <span class="drawer-contact">Maria</span>
          <span class="drawer-expand">&darr;</span>
        </div>
      </div>
      <div class="drawer-detail">
        <p class="detail-text">Full transcript excerpt: <em>"I set it to 297. It felt uncomfortable but... right? Like, I actually believe it now. You made me realize it was never about the number."</em> OPM noted a drop in vocal tremor compared to the first session where pricing was discussed, and a significant increase in speech stability.</p>
      </div>
    </div>

    <div class="drawer" onclick="this.querySelector('.drawer-detail').classList.toggle('open')">
      <div class="drawer-top">
        <div class="drawer-date">Apr 10, 2026</div>
        <div class="drawer-content">
          <div class="drawer-title">Pedro cannot decide whether to keep his current pricing</div>
          <div class="drawer-summary">Pedro has been going back and forth for two sessions. The core blocker is fear of losing existing clients if he raises prices.</div>
          <div class="drawer-tags">
            <span class="drawer-tag hall-problem">Problem</span>
            <span class="drawer-tag">pricing</span>
            <span class="drawer-tag">fear</span>
          </div>
        </div>
        <div class="drawer-right">
          <span class="drawer-contact">Pedro</span>
          <span class="drawer-expand">&darr;</span>
        </div>
      </div>
      <div class="drawer-detail">
        <p class="detail-text">Pedro asked <em>"What if my best clients leave?"</em> three times across two sessions. Each time the framing was slightly different, but the root fear is identical. This is a pattern: the question is not about pricing, it is about whether Pedro believes his clients stay for his value rather than his price.</p>
      </div>
    </div>

    <div class="drawer" onclick="this.querySelector('.drawer-detail').classList.toggle('open')">
      <div class="drawer-top">
        <div class="drawer-date">Apr 8, 2026</div>
        <div class="drawer-content">
          <div class="drawer-title">Pricing fear is always about self-worth</div>
          <div class="drawer-summary">Cross-contact pattern recognized: every person who struggled with pricing ultimately had a self-worth question underneath, not a market question.</div>
          <div class="drawer-tags">
            <span class="drawer-tag hall-discovery">Discovery</span>
            <span class="drawer-tag">pattern</span>
            <span class="drawer-tag">cross-contact</span>
          </div>
        </div>
        <div class="drawer-right">
          <span class="drawer-contact">Multiple</span>
          <span class="drawer-expand">&darr;</span>
        </div>
      </div>
      <div class="drawer-detail">
        <p class="detail-text">Observed across Maria, Pedro, and Lisa. All three framed pricing as a market question (<em>"What should I charge?"</em>). All three, when pressed, revealed the real question was <em>"Am I worth it?"</em> This pattern holds regardless of industry, experience level, or actual market conditions. Recommendation: always go to the self-worth question first.</p>
      </div>
    </div>

    <div class="drawer" onclick="this.querySelector('.drawer-detail').classList.toggle('open')">
      <div class="drawer-top">
        <div class="drawer-date">Apr 5, 2026</div>
        <div class="drawer-content">
          <div class="drawer-title">Maria prefers direct confrontation over gentle probing</div>
          <div class="drawer-summary">When asked gently, Maria deflects. When confronted directly, she engages honestly. This is a communication preference specific to her.</div>
          <div class="drawer-tags">
            <span class="drawer-tag hall-preference">Preference</span>
            <span class="drawer-tag">communication</span>
          </div>
        </div>
        <div class="drawer-right">
          <span class="drawer-contact">Maria</span>
          <span class="drawer-expand">&darr;</span>
        </div>
      </div>
      <div class="drawer-detail">
        <p class="detail-text">Session 3 vs Session 1 comparison. In Session 1, gentle probing (<em>"How do you feel about your pricing?"</em>) led to 4 minutes of deflection. In Session 3, direct confrontation (<em>"You do not believe your work is worth 297, do you?"</em>) led to immediate, honest engagement. OPM confirmed: authenticity markers spiked after direct confrontation.</p>
      </div>
    </div>

    <div class="drawer" onclick="this.querySelector('.drawer-detail').classList.toggle('open')">
      <div class="drawer-top">
        <div class="drawer-date">Apr 2, 2026</div>
        <div class="drawer-content">
          <div class="drawer-title">Maria launched her online course successfully</div>
          <div class="drawer-summary">12 signups in the first week at the new 297 price point. Revenue exceeded her monthly target within 7 days.</div>
          <div class="drawer-tags">
            <span class="drawer-tag hall-event">Event</span>
            <span class="drawer-tag">launch</span>
            <span class="drawer-tag">revenue</span>
          </div>
        </div>
        <div class="drawer-right">
          <span class="drawer-contact">Maria</span>
          <span class="drawer-expand">&darr;</span>
        </div>
      </div>
      <div class="drawer-detail">
        <p class="detail-text">Maria was emotional during this session. OPM detected elevated positive valence throughout, with brief voice breaks consistent with relief or joy. She said: <em>"I almost set it back to 197 the night before launch. I am glad I did not."</em></p>
      </div>
    </div>

  </section>

  <!-- Tunnels -->
  <section class="tunnels-section">
    <p class="tunnels-label">Tunnels from this room</p>
    
    <div class="tunnel-link">
      <span class="tunnel-icon">&#x2194;</span>
      <span class="tunnel-name">Adri Kastel &rarr; Business</span>
      <span class="tunnel-desc">Shared pricing patterns across 3 contacts</span>
    </div>

    <div class="tunnel-link">
      <span class="tunnel-icon">&#x2194;</span>
      <span class="tunnel-name">Juan Schubert &rarr; Business</span>
      <span class="tunnel-desc">ONIOKO strategy discussions</span>
    </div>
  </section>

</div>

<script>
// Dust particles
const dustContainer = document.getElementById('dust-container');
for (let i = 0; i < 15; i++) {
  const dust = document.createElement('div');
  dust.className = 'dust';
  dust.style.left = (25 + Math.random() * 50) + '%';
  dust.style.top = (10 + Math.random() * 60) + '%';
  dust.style.animationDuration = (6 + Math.random() * 10) + 's';
  dust.style.animationDelay = (Math.random() * 12) + 's';
  dustContainer.appendChild(dust);
}
</script>`;

export default function RoomPage(){
  const ref = useRef<HTMLDivElement>(null);
  const params = useParams();
  useEffect(()=>{
    const root=ref.current; if(!root) return;
    (async()=>{
      try{
        const slug=(params.slug as string)||'trace-flores';
        const room=(params.room as string)||'business';
        const res=await searchPalace(room,slug,room);
        const section=root.querySelector('.drawers-section');
        const title=root.querySelector('.room-header h1');
        const crumb=root.querySelector('.breadcrumb .current');
        if(title) title.textContent=room.charAt(0).toUpperCase()+room.slice(1);
        if(crumb) crumb.textContent=room.charAt(0).toUpperCase()+room.slice(1);
        if(section && Array.isArray(res?.results)){
          section.innerHTML="";
          res.results.slice(0,20).forEach((r:any)=>{
            const text = String(r.text || r.summary || r.content || "");
            const title = text.length > 80 ? `${text.slice(0,80)}...` : (text || "Memory");
            const entry=document.createElement("div");
            entry.className="drawer";
            entry.innerHTML=`<div class="drawer-top"><div class="drawer-date">${r.date||r.source_file||""}</div><div class="drawer-content"><div class="drawer-title">${title}</div><div class="drawer-summary">${text}</div><div class="drawer-tags"><span class="drawer-tag">${r.wing||slug}</span><span class="drawer-tag">${r.room||room}</span></div></div><div class="drawer-right"><span class="drawer-contact">${typeof r.similarity==="number" ? r.similarity.toFixed(2) : ""}</span></div></div>`;
            section.appendChild(entry);
          });
        }
      }catch{}
    })();
  },[params.slug,params.room]);
  return <div ref={ref} dangerouslySetInnerHTML={{__html:HTML}} />;
}
