import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMemories, fetchOwners, readDiary } from "@/lib/api";
import { AVATARS, STANDARD_ROOMS, memoriesForAvatar } from "@/lib/avatars";
import { attachInternalLinkNav } from "@/lib/clientLinks";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const CORRIDORS_HTML = AVATARS.map((a, idx) => `
  <a class="wing-corridor" href="/wing/${escapeHtml(a.slug)}" data-slug="${escapeHtml(a.slug)}">
    <span class="corridor-number">${String(idx + 1).padStart(2, "0")}</span>
    <span class="corridor-name">${escapeHtml(a.name)}</span>
    <span class="corridor-role">${escapeHtml(a.role)}</span>
    <div class="corridor-right">
      <span class="corridor-count">— Memories</span>
      <span class="corridor-arrow">&rarr;</span>
    </div>
  </a>`).join("");

const HTML = `<!-- ========== SCENE 1: Palace Exterior ========== -->
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
    <div class="stat-item"><div class="val">${AVATARS.length}</div><div class="lbl">Wings</div></div>
    <div class="stat-item"><div class="val">—</div><div class="lbl">Memories</div></div>
    <div class="stat-item"><div class="val">—</div><div class="lbl">Diary Entries</div></div>
    <div class="stat-item"><div class="val">${STANDARD_ROOMS.length}</div><div class="lbl">Rooms</div></div>
  </div>
</div>

<!-- ========== SCENE 2: Corridors ========== -->
<section class="corridors" id="corridors">
  <p class="corridors-label">Choose a Wing</p>
  <p class="corridors-sublabel">Extended Avatars</p>
${CORRIDORS_HTML}
  <div class="bottom-nav">
    <a href="/wings">Wings</a>
    <a href="/rooms">Rooms</a>
    <a href="/diary">Diary</a>
    <a href="/tunnels">Tunnels</a>
    <a href="/contacts">Contacts</a>
    <a href="/skills">Skills</a>
  </div>
</section>

<div class="footer-whisper">
  <p>ONIOKO &middot; Memory Palace &middot; EXIDEUS LLC</p>
</div>

`;

export default function EntrancePage() {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // React does not execute <script> tags inside dangerouslySetInnerHTML,
  // so we create stars and wire the Enter button imperatively here.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const starsEl = root.querySelector<HTMLDivElement>("#stars");
    if (starsEl && starsEl.childElementCount === 0) {
      for (let i = 0; i < 120; i++) {
        const star = document.createElement("div");
        const size = Math.random() * 2 + 0.5;
        Object.assign(star.style, {
          position: "absolute",
          width: size + "px",
          height: size + "px",
          background: "#fff",
          borderRadius: "50%",
          left: Math.random() * 100 + "%",
          top: Math.random() * 55 + "%",
          opacity: String(Math.random() * 0.6 + 0.1),
        });
        starsEl.appendChild(star);
      }
    }
    const enterBtn = root.querySelector<HTMLAnchorElement>(".enter-btn");
    const handleEnter = (e: Event) => {
      e.preventDefault();
      root.querySelector("#corridors")?.scrollIntoView({ behavior: "smooth" });
    };
    enterBtn?.addEventListener("click", handleEnter);
    const detachLinks = attachInternalLinkNav(root, navigate);
    return () => {
      enterBtn?.removeEventListener("click", handleEnter);
      detachLinks();
    };
  }, [navigate]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let cancelled = false;
    (async () => {
      // Supabase is the source of truth for memories. MemPalace /status has
      // only 49 seed drawers; the real dataset is ~196 wa_memories rows.
      const [memories, owners] = await Promise.all([fetchMemories(), fetchOwners()]);

      const diaryTotals = await Promise.all(
        AVATARS.map(async (a) => {
          try {
            const d = await readDiary(a.slug, 100);
            return Number(d?.total ?? d?.entries?.length ?? 0);
          } catch {
            return 0;
          }
        }),
      );
      if (cancelled) return;
      const diaryCount = diaryTotals.reduce((x, y) => x + y, 0);

      const mems = Array.isArray(memories) ? memories : [];
      const ows = Array.isArray(owners) ? owners : [];

      const vals = root.querySelectorAll(".stats-bar .val");
      if (vals[1]) vals[1].textContent = String(mems.length);
      if (vals[2]) vals[2].textContent = String(diaryCount);

      root.querySelectorAll<HTMLAnchorElement>(".wing-corridor[data-slug]").forEach((c) => {
        const slug = c.dataset.slug || "";
        const count = memoriesForAvatar(slug, mems, ows).length;
        const label = c.querySelector(".corridor-count");
        if (label) label.textContent = `${count} Memor${count === 1 ? "y" : "ies"}`;
      });
    })().catch((err) => console.error("Entrance fetch failed:", err));
    return () => { cancelled = true; };
  }, []);

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: HTML }} />;
}
