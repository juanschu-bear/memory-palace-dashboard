// Using react-force-graph-2d: a thin React wrapper over force-graph (canvas-based,
// d3-force simulation). For ~200 nodes it holds 60fps easily, gives us pan/zoom/
// pinch out of the box, and exposes a custom nodeCanvasObject so we can paint the
// neon glow look ourselves. Cosmograph is overkill at this node count, Sigma.js
// needs more plumbing for custom renderers.
import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type { ForceGraphMethods, NodeObject, LinkObject } from "react-force-graph-2d";
import {
  loadGraphData,
  colorForNode,
  AVATAR_COLORS,
  GRAPH_AVATARS,
  sourceTypeLabel,
  type GraphDataset,
  type GraphNode,
  type GraphEdge,
} from "@/lib/graph-data";

type ForceNode = NodeObject<GraphNode>;
type ForceLink = LinkObject<GraphNode, GraphEdge>;

const NAV_HEIGHT = 56;
const ONBOARD_KEY = "graph-onboarded-v1";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const n = parseInt(
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean,
    16,
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shortDate(s: string | undefined | null): string {
  if (!s) return "";
  const d = String(s).slice(0, 10);
  return d;
}

function personLabelOf(node: GraphNode | undefined): string {
  return node?.label ?? "";
}

function avatarMeta(slug: string | null | undefined) {
  if (!slug) return null;
  return GRAPH_AVATARS.find((a) => a.slug === slug) ?? null;
}

export default function GraphView() {
  const fgRef = useRef<ForceGraphMethods<GraphNode, GraphEdge> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dataset, setDataset] = useState<GraphDataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);

  const [filterAvatar, setFilterAvatar] = useState<string>("");
  const [filterPerson, setFilterPerson] = useState<string>("");
  const [filterTopic, setFilterTopic] = useState<string>("");

  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    if (typeof localStorage === "undefined") return true;
    return !localStorage.getItem(ONBOARD_KEY);
  });
  const [onboardStep, setOnboardStep] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadGraphData()
      .then((d) => {
        if (!cancelled) {
          setDataset(d);
          // Expose the dataset on window in dev builds so puppeteer smoke
          // tests can verify aggregation (memory/session counts) without
          // having to poke the canvas. Stripped from prod bundles.
          if (import.meta.env.DEV && typeof window !== "undefined") {
            (window as unknown as { __graphDataset__?: GraphDataset }).__graphDataset__ = d;
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Failed to load graph data");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      setSize({ w: el.clientWidth, h: el.clientHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const graphData = useMemo(() => {
    if (!dataset) return { nodes: [], links: [] };
    return {
      nodes: dataset.nodes as ForceNode[],
      links: dataset.edges.map((e) => ({
        source: e.source,
        target: e.target,
        kind: e.kind,
        strength: e.strength,
      })) as ForceLink[],
    };
  }, [dataset]);

  const neighborMap = useMemo(() => {
    const m = new Map<string, Set<string>>();
    if (!dataset) return m;
    for (const edge of dataset.edges) {
      if (!m.has(edge.source)) m.set(edge.source, new Set());
      if (!m.has(edge.target)) m.set(edge.target, new Set());
      m.get(edge.source)!.add(edge.target);
      m.get(edge.target)!.add(edge.source);
    }
    return m;
  }, [dataset]);

  const nodeById = useMemo(() => {
    const m = new Map<string, GraphNode>();
    if (!dataset) return m;
    for (const n of dataset.nodes) m.set(n.id, n);
    return m;
  }, [dataset]);

  const personList = useMemo(() => {
    if (!dataset) return [] as GraphNode[];
    return dataset.nodes
      .filter((n) => n.kind === "person")
      .sort((a, b) => b.degree - a.degree);
  }, [dataset]);

  const topTopics = useMemo(() => {
    if (!dataset) return [] as { topic: string; count: number }[];
    const counts = new Map<string, number>();
    const firstCasing = new Map<string, string>();
    for (const n of dataset.nodes) {
      if (n.kind !== "memory") continue;
      for (const t of n.topics) {
        const clean = t.trim();
        if (!clean) continue;
        const key = clean.toLowerCase();
        counts.set(key, (counts.get(key) ?? 0) + 1);
        if (!firstCasing.has(key)) firstCasing.set(key, clean);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([key, count]) => ({ topic: firstCasing.get(key) ?? key, count }));
  }, [dataset]);

  const hasFilter = !!(filterAvatar || filterPerson || filterTopic);

  const activeIds = useMemo(() => {
    if (!dataset || !hasFilter) return null;
    const inc = new Set<string>();
    const topicN = filterTopic.toLowerCase();
    for (const n of dataset.nodes) {
      let ok = true;
      if (filterAvatar) {
        const avatarId = `avatar:${filterAvatar}`;
        if (n.id === avatarId) {
          /* keep */
        } else if (n.kind === "memory" && n.avatarSlug === filterAvatar) {
          /* keep */
        } else if (n.kind === "person" && (n.avatarSlugs ?? []).includes(filterAvatar)) {
          /* keep */
        } else if (neighborMap.get(n.id)?.has(avatarId)) {
          /* keep */
        } else {
          ok = false;
        }
      }
      if (ok && filterPerson) {
        if (n.id === filterPerson) {
          /* keep */
        } else if (neighborMap.get(n.id)?.has(filterPerson)) {
          /* keep */
        } else {
          ok = false;
        }
      }
      if (ok && filterTopic) {
        if (n.kind === "memory") {
          ok = n.topics.some((t) => t.toLowerCase() === topicN);
        } else {
          let any = false;
          const nbs = neighborMap.get(n.id);
          if (nbs) {
            for (const nbId of nbs) {
              const nb = nodeById.get(nbId);
              if (nb?.kind === "memory" && nb.topics.some((t) => t.toLowerCase() === topicN)) {
                any = true;
                break;
              }
            }
          }
          ok = any;
        }
      }
      if (ok) inc.add(n.id);
    }
    return inc;
  }, [dataset, filterAvatar, filterPerson, filterTopic, neighborMap, nodeById, hasFilter]);

  useEffect(() => {
    if (!dataset || !fgRef.current) return;
    const fg = fgRef.current;
    // Spread clusters further so the bottom-right clump flattens out and
    // the top-left of the viewport gets some density.
    const charge = fg.d3Force("charge") as unknown as { strength?: (v: number) => unknown };
    charge?.strength?.(-260);
    const link = fg.d3Force("link") as unknown as { distance?: (v: number) => unknown };
    link?.distance?.(60);
    const center = fg.d3Force("center") as unknown as { strength?: (v: number) => unknown };
    center?.strength?.(0.05);

    // Gentle breathing: wander force adds tiny velocity noise each tick so
    // the simulation never fully settles. Avatars drift slightly more to
    // feel alive. Paired with cooldownTicks=Infinity and a high velocity
    // decay, this produces Obsidian-style floating.
    const wander = ((): { (_alpha: number): void; initialize?: (n: any[]) => void } => {
      let simNodes: any[] = [];
      const force = (_alpha: number) => {
        for (const n of simNodes) {
          if (n.fx != null || n.fy != null) continue;
          const amp = n.kind === "avatar" ? 0.12 : 0.06;
          n.vx = (n.vx ?? 0) + (Math.random() - 0.5) * amp;
          n.vy = (n.vy ?? 0) + (Math.random() - 0.5) * amp;
        }
      };
      force.initialize = (nodes: any[]) => {
        simNodes = nodes;
      };
      return force;
    })();
    (fg.d3Force as unknown as (name: string, fn: unknown) => unknown)("wander", wander);

    const t = setTimeout(() => {
      try {
        fg.zoomToFit(600, 80);
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [dataset]);

  const dim = (id: string): number => {
    if (!activeIds) return 1;
    return activeIds.has(id) ? 1 : 0.1;
  };

  const drawNode = (rawNode: ForceNode, ctx: CanvasRenderingContext2D, scale: number) => {
    const node = rawNode as ForceNode & { x?: number; y?: number };
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    const data = nodeById.get(String(node.id)) ?? (node as unknown as GraphNode);
    const color = colorForNode(data);
    const isSelected = selected?.id === data.id;
    const isHovered = hoveredId === data.id;
    const isNeighbor =
      (hoveredId && neighborMap.get(hoveredId)?.has(data.id)) ||
      (selected?.id && neighborMap.get(selected.id)?.has(data.id));

    const baseRadius =
      data.kind === "avatar"
        ? 13
        : data.kind === "person"
          ? 4.5
          : 2 + Math.min(data.degree, 8) * 0.55;
    const radius = isHovered || isSelected ? baseRadius * 1.6 : baseRadius;

    const alpha = dim(data.id);
    const prevAlpha = ctx.globalAlpha;
    ctx.globalAlpha = prevAlpha * alpha;

    const glow = isHovered || isSelected ? 0.9 : isNeighbor ? 0.55 : 0.35;
    const haloRadius = radius + (isHovered || isSelected ? 14 : 6) / Math.max(scale, 0.4);
    const gradient = ctx.createRadialGradient(x, y, radius * 0.2, x, y, haloRadius);
    gradient.addColorStop(0, rgba(color, glow));
    gradient.addColorStop(0.4, rgba(color, glow * 0.35));
    gradient.addColorStop(1, rgba(color, 0));
    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(x, y, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (data.kind === "avatar") {
      const t = performance.now() / 1000;
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.5);
      const ringRadius = radius + 3 / scale + pulse * (6 / scale);
      ctx.beginPath();
      ctx.strokeStyle = rgba(color, 0.25 + pulse * 0.55);
      ctx.lineWidth = 1.4 / scale;
      ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 1.2 / scale;
      ctx.arc(x, y, radius + 3 / scale, 0, Math.PI * 2);
      ctx.stroke();
    } else if (data.kind === "person") {
      ctx.beginPath();
      ctx.strokeStyle = rgba(color, 0.45);
      ctx.lineWidth = 1 / scale;
      ctx.arc(x, y, radius + 2 / scale, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Label rules: avatars always visible; people and memories only on hover/select.
    const labelVisible =
      data.kind === "avatar" ||
      ((data.kind === "person" || data.kind === "memory") && (isHovered || isSelected));
    if (labelVisible) {
      const fontSize = (data.kind === "avatar" ? 11 : 10) / scale;
      ctx.font = `${fontSize}px "DM Sans", sans-serif`;
      ctx.fillStyle =
        data.kind === "avatar" ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.85)";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(data.label, x, y + radius + 4 / scale);
    }

    ctx.globalAlpha = prevAlpha;
  };

  const drawPointerArea = (
    rawNode: ForceNode,
    paintColor: string,
    ctx: CanvasRenderingContext2D,
  ) => {
    const node = rawNode as ForceNode & { x?: number; y?: number };
    const data = nodeById.get(String(node.id)) ?? (node as unknown as GraphNode);
    const r =
      data.kind === "avatar" ? 16 : data.kind === "person" ? 8 : 4 + Math.min(data.degree, 8) * 0.6;
    ctx.fillStyle = paintColor;
    ctx.beginPath();
    ctx.arc(node.x ?? 0, node.y ?? 0, r, 0, Math.PI * 2);
    ctx.fill();
  };

  const linkActive = (l: ForceLink) => {
    const src = typeof l.source === "object" ? (l.source as GraphNode).id : l.source;
    const tgt = typeof l.target === "object" ? (l.target as GraphNode).id : l.target;
    return (
      (hoveredId && (hoveredId === src || hoveredId === tgt)) ||
      (selected?.id && (selected.id === src || selected.id === tgt))
    );
  };

  const linkDimmed = (l: ForceLink): number => {
    if (!activeIds) return 1;
    const src = typeof l.source === "object" ? (l.source as GraphNode).id : l.source;
    const tgt = typeof l.target === "object" ? (l.target as GraphNode).id : l.target;
    const ok = activeIds.has(String(src)) && activeIds.has(String(tgt));
    return ok ? 1 : 0.1;
  };

  const linkColor = (l: ForceLink) => {
    const highlight = linkActive(l);
    const kind = (l as ForceLink & { kind?: string }).kind;
    const dimFactor = linkDimmed(l);
    const base =
      highlight
        ? [200, 235, 255, 0.95]
        : kind === "memory-avatar"
          ? [255, 255, 255, 0.1]
          : kind === "memory-person"
            ? [86, 224, 160, 0.15]
            : [120, 130, 200, 0.09];
    return `rgba(${base[0]}, ${base[1]}, ${base[2]}, ${(base[3] as number) * dimFactor})`;
  };

  const selectedNeighbors = selected
    ? (Array.from(neighborMap.get(selected.id) ?? [])
        .map((id) => nodeById.get(id))
        .filter(Boolean) as GraphNode[])
    : [];

  // Avatar panel aggregates: memory count, unique people spoken with,
  // topic distribution, and top 5 people by memory count.
  const avatarPanel = useMemo(() => {
    if (!selected || selected.kind !== "avatar") return null;
    const avatarSlug = selected.avatarSlug;
    if (!avatarSlug) return null;
    const memories = selectedNeighbors.filter((n) => n.kind === "memory");
    const topicCounts = new Map<string, number>();
    const topicCasing = new Map<string, string>();
    const personMemoryCounts = new Map<string, number>();
    const personSet = new Set<string>();
    for (const mem of memories) {
      for (const t of mem.topics) {
        const clean = t.trim();
        if (!clean) continue;
        const key = clean.toLowerCase();
        topicCounts.set(key, (topicCounts.get(key) ?? 0) + 1);
        if (!topicCasing.has(key)) topicCasing.set(key, clean);
      }
      if (mem.personId) {
        personSet.add(mem.personId);
        personMemoryCounts.set(mem.personId, (personMemoryCounts.get(mem.personId) ?? 0) + 1);
      }
    }
    const topTopicsLocal = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, c]) => ({ topic: topicCasing.get(k) ?? k, count: c }));
    const topPersonsLocal = Array.from(personMemoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ node: nodeById.get(id)!, count }))
      .filter((x) => !!x.node);
    return {
      memoryCount: memories.length,
      personCount: personSet.size,
      topTopics: topTopicsLocal,
      topPersons: topPersonsLocal,
    };
  }, [selected, selectedNeighbors, nodeById]);

  // Person panel pulls from the pre-computed aggregates on the node itself,
  // so sessions/voice/text counts stay consistent with the data layer.
  const personPanel = useMemo(() => {
    if (!selected || selected.kind !== "person") return null;
    const avatars = (selected.avatarSlugs ?? [])
      .map((s) => avatarMeta(s))
      .filter(Boolean) as NonNullable<ReturnType<typeof avatarMeta>>[];
    const topicCounts = new Map<string, number>();
    const topicCasing = new Map<string, string>();
    for (const nb of selectedNeighbors) {
      if (nb.kind !== "memory") continue;
      for (const t of nb.topics) {
        const clean = t.trim();
        if (!clean) continue;
        const key = clean.toLowerCase();
        topicCounts.set(key, (topicCounts.get(key) ?? 0) + 1);
        if (!topicCasing.has(key)) topicCasing.set(key, clean);
      }
    }
    const topTopicsLocal = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k, c]) => ({ topic: topicCasing.get(k) ?? k, count: c }));
    return {
      sessionCount: selected.sessionCount ?? 0,
      voiceMessageCount: selected.voiceMessageCount ?? 0,
      textMessageCount: selected.textMessageCount ?? 0,
      memoryCount: selected.memoryCount ?? 0,
      lastActiveAt: selected.lastActiveAt ?? "",
      avatars,
      topTopics: topTopicsLocal,
      email: selected.email ?? "",
    };
  }, [selected, selectedNeighbors]);

  const memoryPanel = useMemo(() => {
    if (!selected || selected.kind !== "memory") return null;
    const avatar = avatarMeta(selected.avatarSlug);
    const personNb = selectedNeighbors.find((n) => n.kind === "person");
    const body = selected.summary;
    const created = shortDate(selected.createdAt);
    return {
      avatar,
      person: personNb,
      body,
      created,
      sourceLabel: sourceTypeLabel(selected.sourceType),
    };
  }, [selected, selectedNeighbors]);

  const dismissOnboarding = () => {
    try {
      localStorage.setItem(ONBOARD_KEY, "1");
    } catch {
      /* ignore */
    }
    setShowOnboarding(false);
  };

  const onboardingSteps = [
    {
      title: "Welcome to the Memory Graph",
      body: "Each node is a memory, avatar, or person. Click any node to explore what it knows.",
    },
    {
      title: "Use the filters above to focus",
      body: "Narrow the view by avatar, person, or topic — unmatched nodes fade away without disappearing.",
    },
    {
      title: "Connections show shared topics",
      body: "Lines between memories mean they share two or more topics. Follow them to find clusters of meaning.",
    },
  ];

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        top: 0,
        background: "radial-gradient(ellipse at center, #0a0f1e 0%, #05060b 70%, #000 100%)",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes graph-grid-drift {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-60px, -60px, 0); }
        }
        @keyframes graph-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes graph-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .graph-grid-bg {
          position: absolute;
          inset: -120px;
          background-image:
            linear-gradient(rgba(63, 224, 255, 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(63, 224, 255, 0.07) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: graph-grid-drift 24s linear infinite;
          pointer-events: none;
          mask-image: radial-gradient(ellipse at center, #000 20%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse at center, #000 20%, transparent 75%);
        }
        .graph-scanline {
          position: absolute; inset: 0;
          background: repeating-linear-gradient(
            0deg,
            rgba(255, 255, 255, 0.015) 0px,
            rgba(255, 255, 255, 0.015) 1px,
            transparent 1px,
            transparent 3px
          );
          pointer-events: none;
          mix-blend-mode: overlay;
        }
        .graph-hud {
          position: absolute;
          top: ${NAV_HEIGHT + 16}px;
          left: 24px;
          z-index: 5;
          font-family: 'DM Sans', sans-serif;
          color: rgba(232, 240, 255, 0.85);
          pointer-events: none;
          letter-spacing: 0.05em;
        }
        .graph-hud h1 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          font-size: 1.6rem;
          letter-spacing: 0.08em;
          color: rgba(232, 240, 255, 0.9);
          margin-bottom: 4px;
        }
        .graph-hud .hud-meta {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          color: rgba(120, 180, 220, 0.6);
        }
        .graph-filters {
          position: absolute;
          top: ${NAV_HEIGHT + 20}px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 6;
          display: flex;
          gap: 10px;
          padding: 8px 12px;
          background: rgba(8, 12, 24, 0.7);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(63, 224, 255, 0.18);
          border-radius: 999px;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 6px 30px rgba(0, 0, 0, 0.45);
        }
        .graph-filters .filter-field {
          position: relative;
          display: flex; align-items: center;
        }
        .graph-filters label {
          font-size: 0.58rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(120, 180, 220, 0.7);
          margin-right: 8px;
        }
        .graph-filters select {
          appearance: none;
          background: rgba(5, 8, 18, 0.7);
          border: 1px solid rgba(63, 224, 255, 0.22);
          color: rgba(232, 240, 255, 0.9);
          padding: 6px 28px 6px 12px;
          border-radius: 999px;
          font-size: 0.75rem;
          letter-spacing: 0.04em;
          cursor: pointer;
          font-family: inherit;
          min-width: 120px;
          transition: border-color 160ms ease, background 160ms ease;
        }
        .graph-filters select:hover,
        .graph-filters select:focus {
          border-color: rgba(63, 224, 255, 0.5);
          background: rgba(10, 20, 40, 0.75);
          outline: none;
        }
        .graph-filters .caret {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: rgba(120, 180, 220, 0.6);
          font-size: 0.6rem;
        }
        .graph-filters .reset-btn {
          background: transparent;
          border: 1px solid rgba(255, 120, 180, 0.3);
          color: rgba(255, 180, 210, 0.85);
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 0.65rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: pointer;
          font-family: inherit;
          transition: background 160ms ease, border-color 160ms ease;
        }
        .graph-filters .reset-btn:hover {
          background: rgba(255, 120, 180, 0.1);
          border-color: rgba(255, 120, 180, 0.55);
        }
        .graph-legend {
          position: absolute;
          bottom: 24px;
          left: 24px;
          z-index: 5;
          background: rgba(8, 12, 24, 0.55);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(120, 180, 220, 0.15);
          border-radius: 6px;
          padding: 12px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.7rem;
          letter-spacing: 0.08em;
          color: rgba(232, 240, 255, 0.75);
          max-width: 260px;
        }
        .graph-legend h4 {
          font-size: 0.58rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(120, 180, 220, 0.7);
          margin-bottom: 8px;
          font-weight: 500;
        }
        .graph-legend .leg-row {
          display: flex; align-items: center; gap: 8px;
          padding: 3px 0;
        }
        .graph-legend .swatch {
          width: 10px; height: 10px; border-radius: 50%;
          box-shadow: 0 0 10px currentColor;
        }
        .graph-legend .kind-swatch {
          display: inline-flex; align-items: center; justify-content: center;
          width: 18px; height: 18px;
          border-radius: 50%;
        }
        .graph-legend .kind-swatch.avatar {
          border: 1.5px solid rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.12);
          box-shadow: 0 0 10px rgba(255,255,255,0.35);
        }
        .graph-legend .kind-swatch.person {
          background: #56E0A0;
          box-shadow: 0 0 10px #56E0A0;
          width: 10px; height: 10px;
        }
        .graph-legend .kind-swatch.memory {
          background: #8A8AFF;
          width: 5px; height: 5px;
          box-shadow: 0 0 6px #8A8AFF;
        }
        .graph-legend .kind-row {
          display: flex; align-items: center; gap: 10px;
          padding: 4px 0;
        }
        .graph-legend .edge-line {
          display: inline-block;
          width: 20px; height: 1px;
          background: rgba(180, 220, 255, 0.6);
          box-shadow: 0 0 4px rgba(180, 220, 255, 0.7);
        }
        .graph-legend .section-divider {
          border-top: 1px solid rgba(120, 180, 220, 0.12);
          margin: 8px 0;
        }
        .graph-panel {
          position: absolute;
          top: ${NAV_HEIGHT}px;
          right: 0;
          bottom: 0;
          width: min(440px, 92vw);
          background: linear-gradient(180deg, rgba(8, 12, 24, 0.9), rgba(4, 6, 14, 0.95));
          backdrop-filter: blur(14px);
          border-left: 1px solid rgba(63, 224, 255, 0.18);
          box-shadow: -20px 0 60px rgba(0,0,0,0.6);
          transform: translateX(100%);
          transition: transform 320ms cubic-bezier(.22,.9,.3,1);
          z-index: 6;
          color: #e8f0ff;
          font-family: 'DM Sans', sans-serif;
          display: flex; flex-direction: column;
        }
        .graph-panel.open { transform: translateX(0); }
        .graph-panel header {
          padding: 20px 24px 14px;
          border-bottom: 1px solid rgba(120, 180, 220, 0.14);
          position: relative;
        }
        .graph-panel header .kind-tag {
          font-size: 0.62rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .graph-panel header h2 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          font-size: 1.4rem;
          line-height: 1.3;
          color: rgba(232, 240, 255, 0.95);
        }
        .graph-panel header .sub {
          margin-top: 4px;
          font-size: 0.72rem;
          color: rgba(120, 180, 220, 0.8);
          letter-spacing: 0.08em;
        }
        .graph-panel .panel-body {
          flex: 1;
          overflow-y: auto;
          padding: 18px 24px 32px;
        }
        .graph-panel .panel-body section { margin-bottom: 20px; }
        .graph-panel .panel-body h3 {
          font-size: 0.62rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(120, 180, 220, 0.7);
          margin-bottom: 8px;
        }
        .graph-panel .panel-body p {
          font-size: 0.92rem;
          line-height: 1.6;
          color: rgba(232, 240, 255, 0.86);
          white-space: pre-wrap;
        }
        .graph-panel .chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .graph-panel .chip {
          font-size: 0.72rem;
          letter-spacing: 0.06em;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(63, 224, 255, 0.08);
          border: 1px solid rgba(63, 224, 255, 0.25);
          color: rgba(200, 230, 255, 0.9);
          cursor: pointer;
          transition: background 140ms ease, border-color 140ms ease, transform 140ms ease;
        }
        .graph-panel .chip:hover {
          background: rgba(63, 224, 255, 0.18);
          border-color: rgba(63, 224, 255, 0.5);
          transform: translateY(-1px);
        }
        .graph-panel .chip.active {
          background: rgba(63, 224, 255, 0.25);
          border-color: rgba(63, 224, 255, 0.7);
          color: #fff;
        }
        .graph-panel .entity-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px 6px 8px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.04);
          cursor: pointer;
          font-size: 0.8rem;
          color: rgba(232, 240, 255, 0.92);
          transition: background 160ms ease, border-color 160ms ease;
        }
        .graph-panel .entity-chip:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .graph-panel .entity-chip .dot {
          width: 10px; height: 10px; border-radius: 50%;
          box-shadow: 0 0 8px currentColor;
          flex-shrink: 0;
        }
        .graph-panel .topic-row {
          display: flex; align-items: center; gap: 10px;
          padding: 6px 0;
          font-size: 0.84rem;
          color: rgba(232, 240, 255, 0.82);
        }
        .graph-panel .topic-row .count {
          color: rgba(120, 180, 220, 0.7);
          font-size: 0.72rem;
          margin-left: auto;
          letter-spacing: 0.06em;
        }
        .graph-panel .stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .graph-panel .stat-grid.cols-4 {
          grid-template-columns: repeat(4, 1fr);
        }
        .graph-panel .stat {
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid rgba(120, 180, 220, 0.15);
          background: rgba(63, 224, 255, 0.04);
        }
        .graph-panel .stat .num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          color: #e8f0ff;
          line-height: 1;
        }
        .graph-panel .stat .lbl {
          font-size: 0.58rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: rgba(120, 180, 220, 0.75);
          margin-top: 6px;
        }
        .graph-panel .related-list {
          display: flex; flex-direction: column; gap: 6px;
        }
        .graph-panel .related {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px;
          border-radius: 4px;
          border: 1px solid rgba(120, 180, 220, 0.10);
          cursor: pointer;
          transition: background 160ms ease, border-color 160ms ease;
        }
        .graph-panel .related:hover {
          background: rgba(63, 224, 255, 0.06);
          border-color: rgba(63, 224, 255, 0.25);
        }
        .graph-panel .related .dot {
          width: 8px; height: 8px; border-radius: 50%;
          box-shadow: 0 0 8px currentColor;
          flex-shrink: 0;
        }
        .graph-panel .related .label {
          flex: 1;
          font-size: 0.82rem;
          color: rgba(232, 240, 255, 0.82);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .graph-panel .related .count {
          font-size: 0.7rem;
          color: rgba(120, 180, 220, 0.7);
          letter-spacing: 0.06em;
        }
        .graph-panel .close {
          position: absolute; top: 14px; right: 14px;
          background: transparent; border: none;
          color: rgba(232, 240, 255, 0.5);
          font-size: 1.2rem; cursor: pointer;
          width: 28px; height: 28px;
          display: grid; place-items: center;
          border-radius: 50%;
          transition: background 160ms ease, color 160ms ease;
        }
        .graph-panel .close:hover {
          background: rgba(63, 224, 255, 0.12);
          color: #fff;
        }
        .graph-loading {
          position: absolute; inset: 0;
          display: grid; place-items: center;
          color: rgba(120, 180, 220, 0.8);
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          font-size: 0.72rem;
          animation: graph-pulse 1.8s ease-in-out infinite;
          pointer-events: none;
        }
        .graph-onboard {
          position: absolute; inset: 0;
          z-index: 20;
          display: grid; place-items: center;
          background: rgba(4, 6, 14, 0.55);
          backdrop-filter: blur(6px);
          animation: graph-fade-in 260ms ease both;
          font-family: 'DM Sans', sans-serif;
        }
        .graph-onboard .onboard-card {
          position: relative;
          width: min(460px, 90vw);
          padding: 30px 32px 26px;
          border-radius: 12px;
          background: linear-gradient(180deg, rgba(10, 16, 30, 0.95), rgba(4, 8, 18, 0.98));
          border: 1px solid rgba(63, 224, 255, 0.3);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7), 0 0 60px rgba(63, 224, 255, 0.08);
          color: rgba(232, 240, 255, 0.9);
        }
        .graph-onboard .step-ticker {
          display: flex; gap: 6px; margin-bottom: 18px;
        }
        .graph-onboard .step-ticker span {
          flex: 1;
          height: 2px;
          background: rgba(120, 180, 220, 0.18);
          border-radius: 2px;
          transition: background 200ms ease;
        }
        .graph-onboard .step-ticker span.active {
          background: rgba(63, 224, 255, 0.85);
          box-shadow: 0 0 8px rgba(63, 224, 255, 0.8);
        }
        .graph-onboard h2 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          font-size: 1.6rem;
          margin-bottom: 10px;
          color: #fff;
        }
        .graph-onboard p {
          font-size: 0.92rem;
          line-height: 1.6;
          color: rgba(232, 240, 255, 0.78);
        }
        .graph-onboard .onboard-actions {
          margin-top: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .graph-onboard button {
          font-family: inherit;
          cursor: pointer;
          border-radius: 999px;
          border: 1px solid rgba(63, 224, 255, 0.3);
          padding: 8px 18px;
          font-size: 0.72rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          background: transparent;
          color: rgba(232, 240, 255, 0.85);
          transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
        }
        .graph-onboard button.primary {
          background: rgba(63, 224, 255, 0.18);
          border-color: rgba(63, 224, 255, 0.55);
          color: #fff;
        }
        .graph-onboard button.primary:hover {
          background: rgba(63, 224, 255, 0.3);
        }
        .graph-onboard button.ghost:hover {
          color: #fff;
          border-color: rgba(63, 224, 255, 0.5);
        }
      `}</style>

      <div className="graph-grid-bg" />
      <div className="graph-scanline" />

      <div className="graph-hud">
        <h1>Memory Graph</h1>
        <div className="hud-meta">
          {dataset
            ? `${dataset.stats.memoryCount} memories · ${dataset.stats.avatarCount} avatars · ${dataset.stats.personCount} people · ${dataset.stats.edgeCount} edges`
            : "Mapping the palace…"}
        </div>
      </div>

      {dataset && (
        <div className="graph-filters" role="toolbar" aria-label="Graph filters">
          <div className="filter-field">
            <label>Avatar</label>
            <select
              value={filterAvatar}
              onChange={(e) => setFilterAvatar(e.target.value)}
              aria-label="Filter by avatar"
            >
              <option value="">All</option>
              {GRAPH_AVATARS.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name}
                </option>
              ))}
            </select>
            <span className="caret">▾</span>
          </div>
          <div className="filter-field">
            <label>Person</label>
            <select
              value={filterPerson}
              onChange={(e) => setFilterPerson(e.target.value)}
              aria-label="Filter by person"
            >
              <option value="">All</option>
              {personList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <span className="caret">▾</span>
          </div>
          <div className="filter-field">
            <label>Topic</label>
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              aria-label="Filter by topic"
            >
              <option value="">All</option>
              {topTopics.map((t) => (
                <option key={t.topic} value={t.topic}>
                  {t.topic} · {t.count}
                </option>
              ))}
            </select>
            <span className="caret">▾</span>
          </div>
          {hasFilter && (
            <button
              className="reset-btn"
              onClick={() => {
                setFilterAvatar("");
                setFilterPerson("");
                setFilterTopic("");
              }}
            >
              Reset
            </button>
          )}
        </div>
      )}

      {!dataset && !error && <div className="graph-loading">Initializing constellation…</div>}
      {error && (
        <div className="graph-loading" style={{ color: "#ff7a7a" }}>
          {error}
        </div>
      )}

      {dataset && size.w > 0 && size.h > 0 && (
        <ForceGraph2D<GraphNode, GraphEdge>
          ref={fgRef}
          graphData={graphData}
          width={size.w}
          height={size.h}
          backgroundColor="rgba(0,0,0,0)"
          cooldownTicks={Infinity}
          d3AlphaDecay={0.028}
          d3VelocityDecay={0.55}
          autoPauseRedraw={false}
          enableNodeDrag
          minZoom={0.3}
          maxZoom={8}
          linkColor={linkColor as any}
          linkWidth={(l) => {
            const active = linkActive(l);
            if (active) return 1.8;
            const kind = (l as ForceLink & { kind?: string }).kind;
            return kind === "memory-memory" ? 0.6 : 0.9;
          }}
          linkDirectionalParticles={(l) => (linkActive(l) ? 3 : 0)}
          linkDirectionalParticleSpeed={0.006}
          linkDirectionalParticleWidth={1.6}
          linkDirectionalParticleColor={() => "rgba(180, 220, 255, 0.9)"}
          nodeCanvasObject={drawNode}
          nodePointerAreaPaint={drawPointerArea}
          onNodeHover={(n) => setHoveredId(n ? String(n.id) : null)}
          onNodeClick={(n) => {
            const data = nodeById.get(String(n.id));
            if (data) setSelected(data);
          }}
          onBackgroundClick={() => setSelected(null)}
        />
      )}

      <div className="graph-legend">
        <h4>Node types</h4>
        <div className="kind-row">
          <span className="kind-swatch avatar" />
          <span>Avatar — always labeled</span>
        </div>
        <div className="kind-row">
          <span className="kind-swatch person" />
          <span>Person — label on hover</span>
        </div>
        <div className="kind-row">
          <span className="kind-swatch memory" />
          <span>Memory — label on hover</span>
        </div>
        <div className="section-divider" />
        <h4>Edges</h4>
        <div className="kind-row">
          <span className="edge-line" />
          <span>Shared topics / connections</span>
        </div>
        <div className="section-divider" />
        <h4>Avatars</h4>
        {GRAPH_AVATARS.map((a) => (
          <div className="leg-row" key={a.slug}>
            <span
              className="swatch"
              style={{ background: AVATAR_COLORS[a.slug], color: AVATAR_COLORS[a.slug] }}
            />
            <span>{a.name}</span>
          </div>
        ))}
      </div>

      <aside className={`graph-panel ${selected ? "open" : ""}`} aria-hidden={!selected}>
        {selected && (
          <>
            <button className="close" onClick={() => setSelected(null)} aria-label="Close">
              ×
            </button>
            <header>
              <div className="kind-tag" style={{ color: rgba(colorForNode(selected), 0.95) }}>
                {selected.kind}
                {selected.avatarSlug && selected.kind !== "avatar" ? ` · ${selected.avatarSlug}` : ""}
              </div>
              <h2>{selected.label}</h2>
              {selected.kind === "memory" && memoryPanel && (
                <div className="sub">
                  {memoryPanel.sourceLabel}
                  {memoryPanel.created ? ` · ${memoryPanel.created}` : ""}
                </div>
              )}
              {selected.kind === "avatar" && selected.summary && (
                <div className="sub">{selected.summary}</div>
              )}
              {selected.kind === "person" && personPanel && (
                <div className="sub">
                  {personPanel.email || "—"}
                  {personPanel.lastActiveAt ? ` · Last active ${shortDate(personPanel.lastActiveAt)}` : ""}
                </div>
              )}
            </header>
            <div className="panel-body">
              {selected.kind === "memory" && memoryPanel && (
                <>
                  {memoryPanel.body && (
                    <section>
                      <h3>Summary</h3>
                      <p>{memoryPanel.body}</p>
                    </section>
                  )}
                  {(memoryPanel.avatar || memoryPanel.person) && (
                    <section>
                      <h3>Linked</h3>
                      <div className="chips">
                        {memoryPanel.avatar && (
                          <span
                            className="entity-chip"
                            onClick={() =>
                              setSelected(nodeById.get(`avatar:${memoryPanel.avatar!.slug}`) ?? null)
                            }
                          >
                            <span
                              className="dot"
                              style={{
                                background: AVATAR_COLORS[memoryPanel.avatar.slug],
                                color: AVATAR_COLORS[memoryPanel.avatar.slug],
                              }}
                            />
                            {memoryPanel.avatar.name}
                          </span>
                        )}
                        {memoryPanel.person && (
                          <span
                            className="entity-chip"
                            onClick={() => setSelected(memoryPanel.person ?? null)}
                          >
                            <span
                              className="dot"
                              style={{
                                background: colorForNode(memoryPanel.person),
                                color: colorForNode(memoryPanel.person),
                              }}
                            />
                            {personLabelOf(memoryPanel.person)}
                          </span>
                        )}
                      </div>
                    </section>
                  )}
                  {selected.topics.length > 0 && (
                    <section>
                      <h3>Topics</h3>
                      <div className="chips">
                        {selected.topics.map((t, i) => (
                          <span
                            key={`${t}-${i}`}
                            className={`chip ${filterTopic.toLowerCase() === t.toLowerCase() ? "active" : ""}`}
                            onClick={() => setFilterTopic(t)}
                            title={`Filter graph by ${t}`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}

              {selected.kind === "avatar" && avatarPanel && (
                <>
                  <section>
                    <div className="stat-grid">
                      <div className="stat">
                        <div className="num">{avatarPanel.memoryCount}</div>
                        <div className="lbl">Memories</div>
                      </div>
                      <div className="stat">
                        <div className="num">{avatarPanel.personCount}</div>
                        <div className="lbl">People</div>
                      </div>
                      <div className="stat">
                        <div className="num">{avatarPanel.topTopics.length}</div>
                        <div className="lbl">Topics</div>
                      </div>
                    </div>
                  </section>
                  {avatarPanel.topTopics.length > 0 && (
                    <section>
                      <h3>Top 5 topics</h3>
                      <div className="chips">
                        {avatarPanel.topTopics.map((t) => (
                          <span
                            key={t.topic}
                            className={`chip ${filterTopic.toLowerCase() === t.topic.toLowerCase() ? "active" : ""}`}
                            onClick={() => setFilterTopic(t.topic)}
                          >
                            {t.topic} · {t.count}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}
                  {avatarPanel.topPersons.length > 0 && (
                    <section>
                      <h3>Top 5 people</h3>
                      <div className="related-list">
                        {avatarPanel.topPersons.map((c) => (
                          <div
                            key={c.node.id}
                            className="related"
                            onClick={() => setSelected(c.node)}
                          >
                            <span
                              className="dot"
                              style={{ background: colorForNode(c.node), color: colorForNode(c.node) }}
                            />
                            <span className="label">{c.node.label}</span>
                            <span className="count">{c.count} mem</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}

              {selected.kind === "person" && personPanel && (
                <>
                  <section>
                    <div className="stat-grid cols-4">
                      <div className="stat">
                        <div className="num">{personPanel.sessionCount}</div>
                        <div className="lbl">Sessions</div>
                      </div>
                      <div className="stat">
                        <div className="num">{personPanel.voiceMessageCount}</div>
                        <div className="lbl">Voice</div>
                      </div>
                      <div className="stat">
                        <div className="num">{personPanel.textMessageCount}</div>
                        <div className="lbl">Text</div>
                      </div>
                      <div className="stat">
                        <div className="num">{personPanel.memoryCount}</div>
                        <div className="lbl">Memories</div>
                      </div>
                    </div>
                  </section>
                  {personPanel.avatars.length > 0 && (
                    <section>
                      <h3>Spoke with</h3>
                      <div className="chips">
                        {personPanel.avatars.map((a) => (
                          <span
                            key={a.slug}
                            className="entity-chip"
                            onClick={() => setSelected(nodeById.get(`avatar:${a.slug}`) ?? null)}
                          >
                            <span
                              className="dot"
                              style={{
                                background: AVATAR_COLORS[a.slug],
                                color: AVATAR_COLORS[a.slug],
                              }}
                            />
                            {a.name}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}
                  {personPanel.topTopics.length > 0 && (
                    <section>
                      <h3>Top topics</h3>
                      <div className="chips">
                        {personPanel.topTopics.map((t) => (
                          <span
                            key={t.topic}
                            className={`chip ${filterTopic.toLowerCase() === t.topic.toLowerCase() ? "active" : ""}`}
                            onClick={() => setFilterTopic(t.topic)}
                          >
                            {t.topic} · {t.count}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}

              {selectedNeighbors.length > 0 && selected.kind === "memory" && (
                <section>
                  <h3>Connected · {selectedNeighbors.length}</h3>
                  <div className="related-list">
                    {selectedNeighbors.slice(0, 30).map((n) => (
                      <div key={n.id} className="related" onClick={() => setSelected(n)}>
                        <span
                          className="dot"
                          style={{ background: colorForNode(n), color: colorForNode(n) }}
                        />
                        <span className="label">{n.label}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </aside>

      {showOnboarding && dataset && (
        <div className="graph-onboard" role="dialog" aria-modal="true">
          <div className="onboard-card">
            <div className="step-ticker">
              {onboardingSteps.map((_, i) => (
                <span key={i} className={i === onboardStep ? "active" : ""} />
              ))}
            </div>
            <h2>{onboardingSteps[onboardStep].title}</h2>
            <p>{onboardingSteps[onboardStep].body}</p>
            <div className="onboard-actions">
              <button className="ghost" onClick={dismissOnboarding}>
                Skip
              </button>
              <button
                className="primary"
                onClick={() => {
                  if (onboardStep < onboardingSteps.length - 1) {
                    setOnboardStep(onboardStep + 1);
                  } else {
                    dismissOnboarding();
                  }
                }}
              >
                {onboardStep < onboardingSteps.length - 1 ? "Next" : "Got it"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
