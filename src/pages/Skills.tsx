import { useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { readDiary } from "@/lib/api";
import { findAvatar } from "@/lib/avatars";

const HTML = `<nav class="breadcrumb">
  <a href="/skills">Skills</a>
  <span class="sep">/</span>
  <span class="current skill-crumb-name">Skills</span>
</nav>

<section class="page-header">
  <p class="skill-eyebrow">__WING_LABEL__</p>
  <h1 class="skill-h1">__WING_NAME__'s Skills</h1>
  <p class="subtitle">What __WING_FIRST__ has learned through conversation. Skills emerge from diary reflections and grow stronger with repetition.</p>
</section>

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

function escapeHtml(s: string){
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function humanize(s: string){
  return s.replace("skill/", "").replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SkillsPage(){
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
    const crumb=root.querySelector('.skill-crumb-name');
    if(crumb) crumb.textContent=`${profile.name}'s Skills`;
    const cards = root.querySelector('.skills-detail') as HTMLElement | null;
    const constellation = root.querySelector('.constellation-section svg') as SVGSVGElement | null;
    // Clear placeholder skill cards immediately so stale Trace data never leaks.
    if (cards) cards.innerHTML = `<p class="skills-detail-title">Skill inventory</p><div class="skills-loading">Gathering reflections…</div>`;

    (async()=>{
      let d: any = null;
      try {
        d = await readDiary(slug, 50);
      } catch (err) {
        console.error("Skills /diary/read failed:", err);
      }
      const entries: any[] = Array.isArray(d?.entries) ? d.entries : [];
      // Count skill tags and remember which entries reference each skill.
      const stats = new Map<string, { count: number; dates: string[]; entries: any[] }>();
      entries.forEach((e) => {
        const text = JSON.stringify(e).toLowerCase();
        const matches = text.match(/skill\/[a-z0-9-]+/g) || [];
        const unique = new Set(matches);
        unique.forEach((tag) => {
          const prev = stats.get(tag) || { count: 0, dates: [], entries: [] };
          prev.count += 1;
          if (e.date) prev.dates.push(String(e.date));
          prev.entries.push(e);
          stats.set(tag, prev);
        });
      });
      const ranked = Array.from(stats.entries()).sort((a, b) => b[1].count - a[1].count);

      if (cards) {
        if (ranked.length === 0) {
          cards.innerHTML = `<p class="skills-detail-title">Skill inventory</p><div class="skills-empty"><div class="skills-empty-title">No skills detected yet</div><div class="skills-empty-sub">Skills emerge from diary reflections. Tag entries with <code>skill/…</code> and they'll show up here.</div></div>`;
        } else {
          cards.innerHTML = `<p class="skills-detail-title">Skill inventory</p>`;
          ranked.forEach(([tag, info]) => {
            const intensity = info.count > 2 ? "strong" : info.count > 1 ? "moderate" : "emerging";
            const firstDate = info.dates.slice().sort()[0] || "";
            const wrap = document.createElement("div");
            wrap.className = "skill-detail-card";
            wrap.tabIndex = 0;
            wrap.innerHTML = `<div class="skill-intensity intensity-${intensity}"></div>
<div class="skill-detail-info">
  <div class="skill-detail-name">${escapeHtml(humanize(tag))}</div>
  <div class="skill-detail-desc">${escapeHtml(info.entries[0]?.content?.slice(0, 180) || "")}</div>
  <div class="skill-detail-avatar">${escapeHtml(profile.name)}</div>
</div>
<div class="skill-detail-right">
  <div class="skill-detail-count">${info.count}</div>
  <div class="skill-detail-label">${info.count === 1 ? "Reference" : "References"}</div>
  <div class="skill-detail-first">${escapeHtml(firstDate ? `Since ${firstDate}` : "Emerging")}</div>
</div>`;
            const panel = document.createElement("div");
            panel.className = "skill-detail-panel";
            panel.innerHTML = info.entries
              .slice(0, 5)
              .map(
                (e) =>
                  `<div class="skill-ref"><div class="skill-ref-date">${escapeHtml(String(e.date || ""))}</div><div class="skill-ref-body">${escapeHtml(String(e.content || "").slice(0, 260))}</div></div>`,
              )
              .join("");
            wrap.appendChild(panel);
            wrap.addEventListener("click", () => wrap.classList.toggle("skill-detail-card-open"));
            cards.appendChild(wrap);
          });
        }
      }

      // Replace constellation stars with one star per skill, ranked by count.
      if (constellation) {
        const existing = constellation.querySelectorAll('.skill-node, .skill-connection');
        existing.forEach((n) => n.remove());
        const positions = [
          [180, 140], [360, 100], [500, 180], [250, 260], [540, 300], [120, 320], [420, 320],
        ];
        ranked.slice(0, positions.length).forEach(([tag, info], idx) => {
          const [x, y] = positions[idx];
          const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
          g.setAttribute("class", "skill-node");
          g.setAttribute("transform", `translate(${x}, ${y})`);
          const r = Math.min(8, 3 + info.count);
          g.innerHTML = `<circle class="skill-star" r="${r}" fill="#E8A050" fill-opacity="${Math.min(0.4, 0.1 + info.count * 0.08)}" stroke="#E8A050" stroke-opacity="${Math.min(0.7, 0.3 + info.count * 0.08)}" stroke-width="0.8"/><circle r="${r/3}" fill="#E8A050" fill-opacity="0.8"/><text class="skill-label" x="${r+6}" y="4">${humanize(tag)}</text><text class="skill-sublabel" x="${r+6}" y="16">${info.count} ${info.count === 1 ? "reference" : "references"}</text>`;
          constellation.appendChild(g);
        });
      }
    })();
  },[slug, profile.name]);
  return <div ref={ref} dangerouslySetInnerHTML={{__html:html}} />;
}
