import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { readDiary } from "@/lib/api";
import { findAvatar } from "@/lib/avatars";
import { attachInternalLinkNav } from "@/lib/clientLinks";

const HTML = `<!-- Breadcrumb -->
<nav class="breadcrumb">
  <a href="/diary">Diary</a>
  <span class="sep">/</span>
  <span class="current diary-crumb-name">__WING_NAME__</span>
</nav>

<div class="diary-container">

  <!-- Cover -->
  <section class="diary-cover">
    <div class="diary-avatar-mark">__WING_INITIALS__</div>
    <h1>__WING_FIRST__'s Diary</h1>
    <p class="diary-subtitle">What I learned, what I noticed, what I would do differently.</p>
    <p class="diary-meta">0 entries</p>
  </section>

  <div class="diary-rule"></div>

  <!-- Tag filter (populated at runtime) -->
  <div class="tag-filter"></div>

  <!-- Entries (populated at runtime) -->
  <section class="entries">
    <div class="diary-loading">Opening the diary…</div>
  </section>

  <div class="diary-footer">
    <p>"The avatar that reflects becomes the avatar that learns."</p>
  </div>

</div>`;

function escapeHtml(s: string){
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

export default function DiaryPage(){
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const params = useParams();
  const slug = (params.slug as string) || "trace-flores";
  const profile = findAvatar(slug);
  const html = useMemo(
    () => HTML
      .replaceAll("__WING_NAME__", profile.name)
      .replaceAll("__WING_FIRST__", profile.name.split(" ")[0])
      .replaceAll("__WING_INITIALS__", profile.initials),
    [profile.name, profile.initials],
  );

  useEffect(()=>{
    document.body.classList.add("light-diary");
    const root=ref.current; if(!root) return;
    const entries = root.querySelector('.entries') as HTMLElement | null;
    const tagFilter = root.querySelector('.tag-filter') as HTMLElement | null;
    const meta = root.querySelector('.diary-meta');
    const detachLinks = attachInternalLinkNav(root, navigate);

    (async()=>{
      let d: any = null;
      try {
        // Agent slug uses hyphens (e.g. "trace-flores") per the MemPalace API.
        d = await readDiary(slug, 50);
      } catch (err) {
        console.error("Diary /diary/read failed:", err);
      }
      const rawEntries: any[] = Array.isArray(d?.entries) ? d.entries : [];
      if (meta) meta.textContent = `${Number(d?.total ?? rawEntries.length)} ${rawEntries.length === 1 ? "entry" : "entries"}`;

      if (!entries) return;
      entries.innerHTML = "";

      if (rawEntries.length === 0) {
        entries.innerHTML = `<div class="diary-empty"><p>${escapeHtml(profile.name)} hasn't written any entries yet.</p><p class="diary-empty-sub">Diary entries grow as the avatar reflects on conversations.</p></div>`;
        if (tagFilter) tagFilter.innerHTML = "";
        return;
      }

      // Build unique topic set for dynamic filter chips.
      const topics = new Set<string>();
      rawEntries.forEach((e) => {
        const t = String(e.topic || "general").trim();
        if (t) topics.add(t);
      });

      if (tagFilter) {
        tagFilter.innerHTML = "";
        const makeChip = (label: string, value: string, active: boolean) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "tag-chip" + (active ? " active" : "");
          btn.textContent = label;
          btn.dataset.filter = value;
          return btn;
        };
        tagFilter.appendChild(makeChip("All", "__all__", true));
        Array.from(topics).sort().forEach((t) => tagFilter.appendChild(makeChip(t, t, false)));
      }

      // Render entries (latest first).
      const sorted = [...rawEntries].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
      sorted.forEach((e) => {
        const content = String(e.content || "");
        const topic = String(e.topic || "general");
        const date = String(e.date || "");
        const node = document.createElement("article");
        node.className = "entry";
        node.dataset.topic = topic;
        node.innerHTML = `<div class="entry-date">${escapeHtml(date)}</div><div class="entry-body"></div><div class="entry-tags"><span class="entry-tag pattern">${escapeHtml(topic)}</span></div>`;
        const body = node.querySelector(".entry-body");
        content.split(/\n{2,}/).forEach((para) => {
          if (!para.trim()) return;
          const p = document.createElement("p");
          p.textContent = para;
          body?.appendChild(p);
        });
        if (body && !body.firstChild) {
          const p = document.createElement("p");
          p.textContent = content;
          body.appendChild(p);
        }
        entries.appendChild(node);
      });

      // Wire filter chips to actually filter entries.
      if (tagFilter) {
        tagFilter.addEventListener("click", (ev) => {
          const target = ev.target as HTMLElement;
          if (!target?.classList?.contains("tag-chip")) return;
          const filter = target.dataset.filter || "__all__";
          tagFilter.querySelectorAll(".tag-chip").forEach((c) => c.classList.remove("active"));
          target.classList.add("active");
          entries.querySelectorAll<HTMLElement>(".entry").forEach((node) => {
            const topic = node.dataset.topic || "";
            node.style.display = filter === "__all__" || topic === filter ? "" : "none";
          });
        });
      }
    })();
    return ()=>{
      document.body.classList.remove("light-diary");
      detachLinks();
    };
  },[slug, profile.name, profile.initials, navigate]);
  return <div ref={ref} dangerouslySetInnerHTML={{__html:html}} />;
}
