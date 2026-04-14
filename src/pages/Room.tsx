import { useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { searchPalace } from "@/lib/api";
import { findAvatar } from "@/lib/avatars";

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

function escapeHtml(s: string){
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function labelize(s: string){
  return s.split("-").map((p)=>p.charAt(0).toUpperCase()+p.slice(1)).join(" ");
}

export default function RoomPage(){
  const ref = useRef<HTMLDivElement>(null);
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
    // Clear the hardcoded placeholder drawers immediately so stale data never shows.
    if(section){ section.innerHTML='<div class="drawer-loading">Loading memories…</div>'; }

    (async()=>{
      let res: any = null;
      try{
        // The /search endpoint does semantic search; room/wing filter server-side.
        // Passing the room label as the query gives us room-scoped results when no
        // user query is active.
        res = await searchPalace(roomLabel, slug, room);
      } catch (err) {
        console.error("Room /search failed:", err);
      }
      if(!section) return;
      const results: any[] = Array.isArray(res?.results) ? res.results : [];
      const memCountEl=root.querySelector('.room-mem-count');
      if(memCountEl) memCountEl.textContent=String(results.length);
      if(results.length === 0){
        section.innerHTML = `<div class="drawer-empty"><div class="drawer-empty-title">No memories in this room yet</div><div class="drawer-empty-sub">Once ${escapeHtml(profile.name)} stores memories tagged <em>${escapeHtml(room)}</em>, they'll show up here.</div></div>`;
        return;
      }
      section.innerHTML = "";
      results.slice(0,30).forEach((r:any)=>{
        const text = String(r.text || r.summary || r.content || "");
        const titleText = text.length > 80 ? `${text.slice(0,80).trim()}…` : (text || "Memory");
        const sim = typeof r.similarity === "number" ? r.similarity.toFixed(2) : "";
        const entry=document.createElement("div");
        entry.className="drawer";
        entry.innerHTML=`<div class="drawer-top"><div class="drawer-date">${escapeHtml(r.date||r.source_file||"")}</div><div class="drawer-content"><div class="drawer-title">${escapeHtml(titleText)}</div><div class="drawer-summary">${escapeHtml(text)}</div><div class="drawer-tags"><span class="drawer-tag">${escapeHtml(r.wing||slug)}</span><span class="drawer-tag">${escapeHtml(r.room||room)}</span></div></div><div class="drawer-right"><span class="drawer-contact">${sim}</span></div></div>`;
        section.appendChild(entry);
      });
    })();
  },[slug, room, roomLabel, profile.name]);
  return <div ref={ref} dangerouslySetInnerHTML={{__html:html}} />;
}
