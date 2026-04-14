import { useEffect, useMemo, useRef } from "react";
import { fetchPalaceStatus } from "@/lib/api";
import { useParams } from "react-router-dom";

const BASE_HTML = `<div class="corridor-bg"><div class="ceiling"></div><div class="floor"></div><div class="wall-left"></div><div class="wall-right"></div><div class="vanishing-glow"></div></div>
<div class="light-ray ray-1"></div><div class="light-ray ray-2"></div><div class="light-ray ray-3"></div><div class="light-ray ray-4"></div>
<div class="torch torch-left-1"></div><div class="torch torch-left-2"></div><div class="torch torch-right-1"></div><div class="torch torch-right-2"></div>
<div class="content">
  <a class="back-btn" href="/"><span class="arrow">&larr;</span><span>Palace Entrance</span></a>
  <section class="wing-header">
    <div class="wing-context">You are inside __WING_LABEL__</div>
    <h1>__WING_NAME__</h1>
    <p class="role">__WING_ROLE__</p>
    <div class="wing-stats">
      <div class="wing-stat"><div class="num wing-memory-count">0</div><div class="label">Memories</div></div>
      <div class="wing-stat"><div class="num">7</div><div class="label">Rooms</div></div>
      <div class="wing-stat"><div class="num">3</div><div class="label">Skills learned</div></div>
      <div class="wing-stat"><div class="num">12</div><div class="label">Sessions</div></div>
    </div>
  </section>
  <div class="wing-divider"></div>
  <section class="rooms-section">
    <p class="rooms-label">Open a Room</p>
    <div class="rooms-grid">
      <div class="room-door" data-route="/wing/__SLUG__/room/business"><div class="door-frame"><div class="door-interior"></div><div class="door-handle"></div><div class="door-glow"></div><div class="door-peek"><p class="peek-line">"Pricing fear is always about self-worth, never about the number."</p></div></div><div class="door-label"><div class="door-name">Business</div><div class="door-count">23 memories</div></div></div>
      <div class="room-door" data-route="/wing/__SLUG__/room/personal"><div class="door-frame"><div class="door-interior"></div><div class="door-handle"></div><div class="door-glow"></div><div class="door-peek"><p class="peek-line">"She talked about her son for the first time today."</p></div></div><div class="door-label"><div class="door-name">Personal</div><div class="door-count">8 memories</div></div></div>
      <div class="room-door" data-route="/wing/__SLUG__/room/growth"><div class="door-frame"><div class="door-interior"></div><div class="door-handle"></div><div class="door-glow"></div><div class="door-peek"><p class="peek-line">"First time she set a boundary with a client."</p></div></div><div class="door-label"><div class="door-name">Growth</div><div class="door-count">6 memories</div></div></div>
      <div class="room-door" data-route="/wing/__SLUG__/room/challenges"><div class="door-frame"><div class="door-interior"></div><div class="door-handle"></div><div class="door-glow"></div><div class="door-peek"><p class="peek-line">"Imposter syndrome hit hard when she got the big client."</p></div></div><div class="door-label"><div class="door-name">Challenges</div><div class="door-count">5 memories</div></div></div>
      <div class="room-door" data-route="/wing/__SLUG__/room/wins"><div class="door-frame"><div class="door-interior"></div><div class="door-handle"></div><div class="door-glow"></div><div class="door-peek"><p class="peek-line">"12 signups in one week. She cried."</p></div></div><div class="door-label"><div class="door-name">Wins</div><div class="door-count">4 memories</div></div></div>
      <div class="room-door" data-route="/wing/__SLUG__/room/behavioral"><div class="door-frame"><div class="door-interior"></div><div class="door-handle"></div><div class="door-glow"></div><div class="door-peek"><p class="peek-line">"Voice tremor spikes when discussing revenue."</p></div></div><div class="door-label"><div class="door-name">Behavioral</div><div class="door-count">3 memories</div></div></div>
      <div class="room-door diary-door" data-route="/wing/__SLUG__/diary"><div class="door-frame"><div class="door-interior"></div><div class="door-handle"></div><div class="door-glow"></div><div class="door-peek"><p class="peek-line">"I learned to ask the self-worth question before the pricing question."</p></div></div><div class="door-label"><div class="door-name">Avatar Diary</div><div class="door-count">2 entries</div></div></div>
    </div>
  </section>
  <section class="diary-section">
    <div class="diary-divider"></div>
    <p class="diary-label">__WING_FIRST__'s latest reflection</p>
    <p class="diary-quote">"When someone switches topics fast, they are avoiding something. I now skip the surface and go straight to what they are protecting."</p>
    <p class="diary-date">April 13, 2026</p>
    <a class="diary-link" href="/wing/__SLUG__/diary">Read full diary</a>
  </section>
</div>`;

const PROFILES: Record<string, { name: string; role: string; wing: string }> = {
  "trace-flores": { name: "Trace Flores", role: "Business Strategist & Pattern Architect", wing: "Wing I" },
  "juan-schubert": { name: "Juan Schubert", role: "System Architect & Digital Twin", wing: "Wing II" },
  "adri-kastel": { name: "Adri Kastel", role: "Growth Expert & Scaling Mentor", wing: "Wing III" },
  "prof-brian-cox": { name: "Prof. Brian Cox", role: "Science Communicator & Educator", wing: "Wing IV" },
  "clara-fontaine": { name: "Clara Fontaine", role: "Executive Communication Coach", wing: "Wing V" },
  "elena-navarro": { name: "Elena Navarro", role: "Sales Strategist & Business Growth Expert", wing: "Wing VI" },
};

function wingCount(status: any, slug: string) {
  const key = slug.replace(/-/g, "_");
  return status?.wings?.[slug] ?? status?.wings?.[key] ?? status?.wings?.[`wing_${key}`] ?? 0;
}

export default function WingPage() {
  const ref = useRef<HTMLDivElement>(null);
  const { slug = "trace-flores" } = useParams();
  const profile = PROFILES[slug] ?? PROFILES["trace-flores"];
  const html = useMemo(
    () =>
      BASE_HTML.replaceAll("__SLUG__", slug)
        .replaceAll("__WING_NAME__", profile.name)
        .replaceAll("__WING_ROLE__", profile.role)
        .replaceAll("__WING_LABEL__", profile.wing)
        .replaceAll("__WING_FIRST__", profile.name.split(" ")[0]),
    [profile.name, profile.role, profile.wing, slug],
  );

  useEffect(() => {
    document.body.classList.add("wing-page");
    const root = ref.current;
    if (!root) return;

    const clickables = Array.from(root.querySelectorAll<HTMLElement>(".room-door[data-route]"));
    const handlers = clickables.map((node) => {
      const handler = () => {
        const route = node.dataset.route;
        if (route) window.location.assign(route);
      };
      node.addEventListener("click", handler);
      return { node, handler };
    });

    fetchPalaceStatus().then((s) => {
      const el = root.querySelector(".wing-memory-count");
      if (el) el.textContent = String(wingCount(s, slug));
    }).catch(() => {});

    return () => {
      document.body.classList.remove("wing-page");
      handlers.forEach(({ node, handler }) => node.removeEventListener("click", handler));
    };
  }, [slug]);

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}
