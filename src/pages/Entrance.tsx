import { useEffect, useRef } from "react";
import { fetchPalaceStatus, readDiary } from "@/lib/api";

const AVATAR_SLUGS = ["trace-flores","juan-schubert","adri-kastel","prof-brian-cox","clara-fontaine","elena-navarro"];
const STANDARD_ROOMS = ["business","personal","growth","challenges","wins","behavioral","avatar-diary"];

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

  <a class="wing-corridor" href="/wing/juan-schubert">
    <span class="corridor-number">02</span>
    <span class="corridor-name">Juan Schubert</span>
    <span class="corridor-role">System Architect & Digital Twin</span>
    <div class="corridor-right">
      <span class="corridor-count">0 Memories</span>
      <span class="corridor-arrow">&rarr;</span>
    </div>
  </a>

  <a class="wing-corridor" href="/wing/adri-kastel">
    <span class="corridor-number">03</span>
    <span class="corridor-name">Adri Kastel</span>
    <span class="corridor-role">Growth Expert & Scaling Mentor</span>
    <div class="corridor-right">
      <span class="corridor-count">0 Memories</span>
      <span class="corridor-arrow">&rarr;</span>
    </div>
  </a>

  <a class="wing-corridor" href="/wing/prof-brian-cox">
    <span class="corridor-number">04</span>
    <span class="corridor-name">Prof. Brian Cox</span>
    <span class="corridor-role">Science Communicator & Educator</span>
    <div class="corridor-right">
      <span class="corridor-count">0 Memories</span>
      <span class="corridor-arrow">&rarr;</span>
    </div>
  </a>

  <a class="wing-corridor" href="/wing/clara-fontaine">
    <span class="corridor-number">05</span>
    <span class="corridor-name">Clara Fontaine</span>
    <span class="corridor-role">Executive Communication Coach</span>
    <div class="corridor-right">
      <span class="corridor-count">0 Memories</span>
      <span class="corridor-arrow">&rarr;</span>
    </div>
  </a>

  <a class="wing-corridor" href="/wing/elena-navarro">
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

`;

export default function EntrancePage(){
  const ref = useRef<HTMLDivElement>(null);

  // React does not execute <script> tags inside dangerouslySetInnerHTML,
  // so we create stars and wire the Enter button imperatively here.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const starsEl = root.querySelector<HTMLDivElement>('#stars');
    if (starsEl && starsEl.childElementCount === 0) {
      for (let i = 0; i < 120; i++) {
        const star = document.createElement('div');
        const size = Math.random() * 2 + 0.5;
        Object.assign(star.style, {
          position: 'absolute',
          width: size + 'px',
          height: size + 'px',
          background: '#fff',
          borderRadius: '50%',
          left: Math.random() * 100 + '%',
          top: Math.random() * 55 + '%',
          opacity: String(Math.random() * 0.6 + 0.1),
        });
        starsEl.appendChild(star);
      }
    }
    const enterBtn = root.querySelector<HTMLAnchorElement>('.enter-btn');
    const handleEnter = (e: Event) => {
      e.preventDefault();
      root.querySelector('#corridors')?.scrollIntoView({ behavior: 'smooth' });
    };
    enterBtn?.addEventListener('click', handleEnter);
    return () => enterBtn?.removeEventListener('click', handleEnter);
  }, []);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    (async () => {
      try {
        const s = await fetchPalaceStatus();
        const vals = root.querySelectorAll('.stats-bar .val');
        const diaryTotals = await Promise.all(
          AVATAR_SLUGS.map(async (slug) => {
            try {
              const d = await readDiary(slug, 100);
              return Number(d?.total ?? d?.entries?.length ?? 0);
            } catch {
              return 0;
            }
          }),
        );
        const diaryCount = diaryTotals.reduce((a, b) => a + b, 0);
        // Wings and Rooms are a fixed structural count, not derived from /status.
        if (vals[0]) vals[0].textContent = String(AVATAR_SLUGS.length);
        if (vals[1]) vals[1].textContent = String(s?.total_drawers ?? 0);
        if (vals[2]) vals[2].textContent = String(diaryCount);
        if (vals[3]) vals[3].textContent = String(STANDARD_ROOMS.length);

        const corridors = Array.from(root.querySelectorAll('.wing-corridor'));
        corridors.forEach((c) => {
          const href = (c as HTMLAnchorElement).getAttribute('href') || '';
          const slug = href.split('/wing/')[1] || '';
          // Only the hyphenated slug is legitimate; wing_* keys are legacy
          // duplicates that we explicitly ignore.
          const count = Number(s?.wings?.[slug] ?? 0);
          const label = c.querySelector('.corridor-count');
          if (label) label.textContent = `${count} Memor${count === 1 ? 'y' : 'ies'}`;
        });
      } catch (err) {
        console.error('Entrance status fetch failed:', err);
      }
    })();
  }, []);

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: HTML }} />;
}
