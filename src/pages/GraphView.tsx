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
  type GraphDataset,
  type GraphNode,
  type GraphEdge,
} from "@/lib/graph-data";
import { AVATARS } from "@/lib/avatars";

type ForceNode = NodeObject<GraphNode>;
type ForceLink = LinkObject<GraphNode, GraphEdge>;

const NAV_HEIGHT = 56;

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

export default function GraphView() {
  const fgRef = useRef<ForceGraphMethods<GraphNode, GraphEdge> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dataset, setDataset] = useState<GraphDataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadGraphData()
      .then((d) => {
        if (!cancelled) setDataset(d);
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

  useEffect(() => {
    if (!dataset || !fgRef.current) return;
    const fg = fgRef.current;
    const charge = fg.d3Force("charge") as unknown as { strength?: (v: number) => unknown };
    charge?.strength?.(-190);
    const link = fg.d3Force("link") as unknown as { distance?: (v: number) => unknown };
    link?.distance?.(48);

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
      data.kind === "avatar" ? 10 : data.kind === "contact" ? 4 : 2 + Math.min(data.degree, 8) * 0.6;
    const radius = isHovered || isSelected ? baseRadius * 1.6 : baseRadius;

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
    }

    const labelVisible =
      data.kind === "avatar" ||
      (data.kind === "contact" && scale > 1.6) ||
      isHovered ||
      isSelected;
    if (labelVisible) {
      const fontSize = (data.kind === "avatar" ? 11 : 10) / scale;
      ctx.font = `${fontSize}px "DM Sans", sans-serif`;
      ctx.fillStyle =
        data.kind === "avatar" ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.8)";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(data.label, x, y + radius + 4 / scale);
    }
  };

  const drawPointerArea = (
    rawNode: ForceNode,
    paintColor: string,
    ctx: CanvasRenderingContext2D,
  ) => {
    const node = rawNode as ForceNode & { x?: number; y?: number };
    const data = nodeById.get(String(node.id)) ?? (node as unknown as GraphNode);
    const r =
      data.kind === "avatar" ? 14 : data.kind === "contact" ? 7 : 4 + Math.min(data.degree, 8) * 0.6;
    ctx.fillStyle = paintColor;
    ctx.beginPath();
    ctx.arc(node.x ?? 0, node.y ?? 0, r, 0, Math.PI * 2);
    ctx.fill();
  };

  const linkColor = (l: ForceLink) => {
    const src = typeof l.source === "object" ? (l.source as GraphNode).id : l.source;
    const tgt = typeof l.target === "object" ? (l.target as GraphNode).id : l.target;
    const highlight =
      (hoveredId && (hoveredId === src || hoveredId === tgt)) ||
      (selected?.id && (selected.id === src || selected.id === tgt));
    const kind = (l as ForceLink & { kind?: string }).kind;
    if (highlight) return "rgba(200, 235, 255, 0.95)";
    if (kind === "memory-avatar") return "rgba(255, 255, 255, 0.10)";
    if (kind === "memory-contact") return "rgba(86, 224, 160, 0.15)";
    return "rgba(120, 130, 200, 0.09)";
  };

  const selectedNeighbors = selected
    ? Array.from(neighborMap.get(selected.id) ?? []).map((id) => nodeById.get(id)).filter(Boolean) as GraphNode[]
    : [];

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
        }
        .graph-legend .leg-row {
          display: flex; align-items: center; gap: 8px;
          padding: 3px 0;
        }
        .graph-legend .swatch {
          width: 10px; height: 10px; border-radius: 50%;
          box-shadow: 0 0 10px currentColor;
        }
        .graph-panel {
          position: absolute;
          top: ${NAV_HEIGHT}px;
          right: 0;
          bottom: 0;
          width: min(420px, 90vw);
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
          padding: 20px 24px 12px;
          border-bottom: 1px solid rgba(120, 180, 220, 0.14);
        }
        .graph-panel header .kind-tag {
          font-size: 0.62rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(120, 180, 220, 0.8);
          margin-bottom: 6px;
        }
        .graph-panel header h2 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          font-size: 1.4rem;
          line-height: 1.3;
          color: rgba(232, 240, 255, 0.95);
        }
        .graph-panel .panel-body {
          flex: 1;
          overflow-y: auto;
          padding: 18px 24px 32px;
        }
        .graph-panel .panel-body section { margin-bottom: 18px; }
        .graph-panel .panel-body h3 {
          font-size: 0.62rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(120, 180, 220, 0.7);
          margin-bottom: 8px;
        }
        .graph-panel .panel-body p {
          font-size: 0.9rem;
          line-height: 1.55;
          color: rgba(232, 240, 255, 0.82);
        }
        .graph-panel .chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .graph-panel .chip {
          font-size: 0.7rem;
          letter-spacing: 0.08em;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(63, 224, 255, 0.08);
          border: 1px solid rgba(63, 224, 255, 0.25);
          color: rgba(200, 230, 255, 0.9);
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
      `}</style>

      <div className="graph-grid-bg" />
      <div className="graph-scanline" />

      <div className="graph-hud">
        <h1>Memory Graph</h1>
        <div className="hud-meta">
          {dataset
            ? `${dataset.stats.memoryCount} memories · ${dataset.stats.avatarCount} avatars · ${dataset.stats.contactCount} contacts · ${dataset.stats.edgeCount} edges`
            : "Mapping the palace…"}
        </div>
      </div>

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
            const src = typeof l.source === "object" ? (l.source as GraphNode).id : l.source;
            const tgt = typeof l.target === "object" ? (l.target as GraphNode).id : l.target;
            const active =
              (hoveredId && (hoveredId === src || hoveredId === tgt)) ||
              (selected?.id && (selected.id === src || selected.id === tgt));
            if (active) return 1.8;
            const kind = (l as ForceLink & { kind?: string }).kind;
            return kind === "memory-memory" ? 0.6 : 0.9;
          }}
          linkDirectionalParticles={(l) => {
            const src = typeof l.source === "object" ? (l.source as GraphNode).id : l.source;
            const tgt = typeof l.target === "object" ? (l.target as GraphNode).id : l.target;
            const active =
              (hoveredId && (hoveredId === src || hoveredId === tgt)) ||
              (selected?.id && (selected.id === src || selected.id === tgt));
            return active ? 3 : 0;
          }}
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
        {AVATARS.map((a) => (
          <div className="leg-row" key={a.slug}>
            <span
              className="swatch"
              style={{ background: AVATAR_COLORS[a.slug], color: AVATAR_COLORS[a.slug] }}
            />
            <span>{a.name}</span>
          </div>
        ))}
        <div className="leg-row" style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(120,180,220,0.1)" }}>
          <span className="swatch" style={{ background: "#56E0A0", color: "#56E0A0" }} />
          <span>Contact</span>
        </div>
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
                {selected.avatarSlug ? ` · ${selected.avatarSlug}` : ""}
              </div>
              <h2>{selected.label}</h2>
            </header>
            <div className="panel-body">
              {selected.summary && (
                <section>
                  <h3>{selected.kind === "memory" ? "Memory" : "Details"}</h3>
                  <p>{selected.summary}</p>
                </section>
              )}
              {selected.persona && selected.kind === "memory" && (
                <section>
                  <h3>Persona</h3>
                  <p>{selected.persona}</p>
                </section>
              )}
              {selected.topics.length > 0 && (
                <section>
                  <h3>Topics</h3>
                  <div className="chips">
                    {selected.topics.map((t, i) => (
                      <span key={`${t}-${i}`} className="chip">{t}</span>
                    ))}
                  </div>
                </section>
              )}
              {selectedNeighbors.length > 0 && (
                <section>
                  <h3>Connected · {selectedNeighbors.length}</h3>
                  <div className="related-list">
                    {selectedNeighbors.slice(0, 30).map((n) => (
                      <div
                        key={n.id}
                        className="related"
                        onClick={() => setSelected(n)}
                      >
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
    </div>
  );
}
