import { useEffect, useMemo, useRef } from "react";
import { fetchMemories, fetchOwners, readDiary } from "@/lib/api";
import { useNavigate, useParams } from "react-router-dom";
import { findAvatar, memoriesForAvatar, memoryMatchesRoom } from "@/lib/avatars";
import { attachInternalLinkNav } from "@/lib/clientLinks";

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
      <div class="wing-stat"><div class="num wing-memory-count">—</div><div class="label">Memories</div></div>
      <div class="wing-stat"><div class="num">7</div><div class="label">Rooms</div></div>
      <div class="wing-stat"><div class="num wing-skill-count">—</div><div class="label">Skills learned</div></div>
      <div class="wing-stat"><div class="num wing-diary-count">—</div><div class="label">Diary entries</div></div>
    </div>
  </section>
  <div class="wing-divider"></div>
  <section class="rooms-section">
    <p class="rooms-label">Open a Room</p>
    <div class="rooms-grid">
      <div class="room-door" data-route="/wing/__SLUG__/room/business" data-room="business"><div class="door-frame"><div class="door-interior"></div><div class="door-handle"></div><div class="door-glow"></div></div><div class="door-label"><div class="door-name">Business</div><div class="door-count">— memories</div></div></div>
      <div class="room-door" data-route="/wing/__SLUG__/room/personal" data-room="personal"><div class="door-frame"><div class="door-interior"></div><div class="door-handle"></div><div class="door-glow"></div></div><div class="door-label"><div class="door-name">Personal</div><div class="door-count">— memories</div></div></div>
      <div class="room-door" data-route="/wing/__SLUG__/room/growth" data-room="growth"><div class="door-frame"><div class="door-interior"></div><div class="door-handle"></div><div class="door-glow"></div></div><div class="door-label"><div class="door-name">Growth</div><div class="door-count">— memories</div></div></div>
      <div class="room-door" data-route="/wing/__SLUG__/room/challenges" data-room="challenges"><div class="door-frame"><div class="door-interior"></div><div class="door-handle"></div><div class="door-glow"></div></div><div class="door-label"><div class="door-name">Challenges</div><div class="door-count">— memories</div></div></div>
      <div class="room-door" data-route="/wing/__SLUG__/room/wins" data-room="wins"><div class="door-frame"><div class="door-interior"></div><div class="door-handle"></div><div class="door-glow"></div></div><div class="door-label"><div class="door-name">Wins</div><div class="door-count">— memories</div></div></div>
      <div class="room-door" data-route="/wing/__SLUG__/room/behavioral" data-room="behavioral"><div class="door-frame"><div class="door-interior"></div><div class="door-handle"></div><div class="door-glow"></div></div><div class="door-label"><div class="door-name">Behavioral</div><div class="door-count">— memories</div></div></div>
      <div class="room-door diary-door" data-route="/wing/__SLUG__/diary"><div class="door-frame"><div class="door-interior"></div><div class="door-handle"></div><div class="door-glow"></div></div><div class="door-label"><div class="door-name">Avatar Diary</div><div class="door-count wing-diary-count-inline">— entries</div></div></div>
    </div>
  </section>
  <section class="diary-section">
    <div class="diary-divider"></div>
    <p class="diary-label">__WING_FIRST__'s latest reflection</p>
    <p class="diary-quote wing-latest-entry">…</p>
    <p class="diary-date wing-latest-date"></p>
    <a class="diary-link" href="/wing/__SLUG__/diary">Read full diary</a>
  </section>
</div>`;

export default function WingPage() {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { slug = "trace-flores" } = useParams();
  const profile = findAvatar(slug);
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
    clickables.forEach((node) => {
      node.setAttribute("role", "link");
      node.setAttribute("tabindex", "0");
    });
    const handlers = clickables.map((node) => {
      const go = () => {
        const route = node.dataset.route;
        if (route) navigate(route);
      };
      const onClick = () => go();
      const onKey = (ev: KeyboardEvent) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          go();
        }
      };
      node.addEventListener("click", onClick);
      node.addEventListener("keydown", onKey);
      return { node, onClick, onKey };
    });
    const detachLinks = attachInternalLinkNav(root, navigate);

    (async () => {
      const [memories, owners, diary] = await Promise.all([
        fetchMemories().catch(() => []),
        fetchOwners().catch(() => []),
        readDiary(slug, 1).catch(() => ({ entries: [], total: 0 })),
      ]);

      const avatarMems = memoriesForAvatar(slug, Array.isArray(memories) ? memories : [], Array.isArray(owners) ? owners : []);

      // Header stats
      const memEl = root.querySelector(".wing-memory-count");
      if (memEl) memEl.textContent = String(avatarMems.length);

      // Skills = unique topics referenced in this avatar's memories.
      const topicSet = new Set<string>();
      avatarMems.forEach((m: any) => {
        const t = m.topics;
        (Array.isArray(t) ? t : []).forEach((x: any) => topicSet.add(String(x).toLowerCase()));
      });
      const skillEl = root.querySelector(".wing-skill-count");
      if (skillEl) skillEl.textContent = String(topicSet.size);

      const diaryTotal = Number(diary?.total ?? diary?.entries?.length ?? 0);
      root.querySelectorAll(".wing-diary-count, .wing-diary-count-inline").forEach((el) => {
        el.textContent = `${diaryTotal} ${diaryTotal === 1 ? "entry" : "entries"}`;
      });
      const latest = diary?.entries?.[0];
      if (latest) {
        const q = root.querySelector(".wing-latest-entry");
        const d = root.querySelector(".wing-latest-date");
        if (q) q.textContent = `“${String(latest.content || "").slice(0, 160)}”`;
        if (d) d.textContent = String(latest.date || "");
      }

      // Per-room door counts: filter the avatar's memories whose topics match
      // the room slug. Only rooms with zero matches fall through to 0 — in
      // that case the Room page will show its empty state.
      root.querySelectorAll<HTMLElement>(".room-door[data-room]").forEach((door) => {
        const roomSlug = door.dataset.room || "";
        const n = avatarMems.filter((m) => memoryMatchesRoom(roomSlug, m)).length;
        const label = door.querySelector(".door-count");
        if (label) label.textContent = `${n} ${n === 1 ? "memory" : "memories"}`;
      });
    })().catch((err) => console.error("Wing fetch failed:", err));

    return () => {
      document.body.classList.remove("wing-page");
      handlers.forEach(({ node, onClick, onKey }) => {
        node.removeEventListener("click", onClick);
        node.removeEventListener("keydown", onKey);
      });
      detachLinks();
    };
  }, [slug, navigate]);

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}
