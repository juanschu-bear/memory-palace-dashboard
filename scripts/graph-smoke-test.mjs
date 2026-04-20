// Puppeteer smoke test for /graph. Spins up `vite dev`, intercepts the
// /api/supabase proxy calls in the browser, and feeds a small fixture that
// exercises the bits we care about:
//   - Seven avatars (incl. Juan Schubert Extended) all render.
//   - Maria Schubert appears as ONE person node aggregated across 5
//     wa_contacts rows, with a memory count that sums across them and a
//     session count derived from distinct call-anima-api-* sources.
//   - The memory detail panel shows the clean `summary`, not the raw
//     transcript dump.
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import puppeteer from "puppeteer";

const MARIA_MEMORY_COUNT = 5; // non-test rows in MEMORIES below
const MARIA_VIDEO_CALL_COUNT = 3; // distinct call-anima-api-* sources
const MARIA_VOICE_NOTE_COUNT = 1; // wa_memories.source in voice-message*
const MARIA_CHAT_MSG_COUNT = 2; // wa_messages, sender=contact, type=text

const OWNERS = [
  { id: "o1", display_name: "Juan Schubert" },
  { id: "o2", display_name: "Adri Kastel" },
  { id: "o3", display_name: "Juan Schubert (Extended)" },
  { id: "o4", display_name: "Elena Navarro" },
  { id: "o5", display_name: "Clara Fontaine" },
  { id: "o6", display_name: "Trace Flores" },
  { id: "o7", display_name: "Prof. Brian Cox" },
];

// Maria Schubert appears five times — once per avatar she's spoken with —
// mimicking the production schema. She should aggregate to one person node.
const CONTACTS = [
  { id: "c1", display_name: "Maria Schubert", email: "maria@example.com", last_active_at: "2026-04-01T00:00:00Z" },
  { id: "c2", display_name: "Maria Schubert", email: "Maria@Example.com", last_active_at: "2026-04-10T00:00:00Z" },
  { id: "c3", display_name: "Maria Schubert", email: "maria@example.com ", last_active_at: "2026-04-15T00:00:00Z" },
  { id: "c4", display_name: "Maria S.", email: "maria@example.com", last_active_at: "2026-04-18T00:00:00Z" },
  { id: "c5", display_name: "Maria Schubert", email: "maria@example.com", last_active_at: "2026-04-19T00:00:00Z" },
  { id: "c6", display_name: "Alex Other", email: "alex@example.com", last_active_at: "2026-04-02T00:00:00Z" },
];

// Maria has memories spanning three avatars, three distinct video-call
// sessions, one voice message, and one text-typed memory. The fixture
// also includes a test-source row that MUST be filtered out.
//
// `connections` exercises the Step 3 semantic edge layer:
// - m1 → m2 same-person (Maria), different-avatar (Juan vs Adri) →
//   semantic + crossContext (cross-avatar)
// - m2 → m6 different-person (Maria vs Alex), different-avatar →
//   semantic + crossContext (cross-person AND cross-avatar)
// - m3 → m5 same person (Maria), same avatar (Juan / Juan-Extended
//   are different slugs but both Maria-side) — picks up cross-avatar
// - m4 → m_test points at a row that's filtered out → broken ref
// - "Behavioral Analysis" + "OPM" appear in two memories so we can
//   verify the generic-topic blocklist actually filters them out of
//   thematic edges (the audit shows these dominate prod data).
const MEMORIES = [
  {
    id: "m1",
    contact_id: "c1",
    owner_id: "o1",
    persona_name: "Juan Schubert",
    source: "call-anima-api-aaa111",
    summary: "Maria and Juan talked about pricing.",
    raw_text: "FULL TRANSCRIPT + BEHAVIORAL ANALYSIS — noisy data should NOT be shown in the detail panel.",
    topics: ["pricing", "Behavioral Analysis"],
    connections: [
      { linked_to: "m2", relationship: "follow-up about growth pricing" },
    ],
    created_at: "2026-04-01T00:00:00Z",
  },
  {
    id: "m2",
    contact_id: "c2",
    owner_id: "o2",
    persona_name: "Adri Kastel",
    source: "call-anima-api-bbb222",
    summary: "Maria asked Adri about growth channels.",
    raw_text: "noisy raw_text",
    topics: ["growth", "OPM"],
    connections: [
      { linked_to: "m6", relationship: "echoes the sales objection raised by Alex" },
    ],
    created_at: "2026-04-05T00:00:00Z",
  },
  {
    id: "m3",
    contact_id: "c3",
    owner_id: "o3",
    persona_name: "Juan Schubert (Extended)",
    source: "call-anima-api-ccc333",
    summary: "Deep dive session with Extended Juan.",
    raw_text: "noisy raw_text",
    topics: ["architecture", "growth"],
    connections: [
      { linked_to: "m5", relationship: "shared scheduling thread" },
    ],
    created_at: "2026-04-10T00:00:00Z",
  },
  {
    id: "m4",
    contact_id: "c4",
    owner_id: "o1",
    persona_name: "Juan Schubert",
    source: "voice-message",
    summary: "Maria left Juan a voice memo about the deal.",
    raw_text: "noisy raw_text",
    topics: ["deal"],
    connections: [
      { linked_to: "m_test", relationship: "broken ref must not crash" },
    ],
    created_at: "2026-04-15T00:00:00Z",
  },
  {
    id: "m5",
    contact_id: "c5",
    owner_id: "o1",
    persona_name: "Juan Schubert",
    source: "inbound-text",
    summary: "Short text exchange about scheduling.",
    raw_text: "noisy raw_text",
    topics: ["scheduling"],
    created_at: "2026-04-18T00:00:00Z",
  },
  {
    id: "m_test",
    contact_id: "c1",
    owner_id: "o1",
    persona_name: "Juan Schubert",
    source: "session-test",
    summary: "Test data — should be excluded.",
    raw_text: "noisy raw_text",
    topics: ["test"],
    created_at: "2026-04-20T00:00:00Z",
  },
  // A memory without a summary to exercise the raw_text fallback.
  {
    id: "m6",
    contact_id: "c6",
    owner_id: "o4",
    persona_name: "Elena Navarro",
    source: "call-anima-api-ddd444",
    summary: null,
    raw_text: "Some unusually long raw transcript body used as fallback when summary is missing.",
    topics: ["sales"],
    created_at: "2026-04-02T00:00:00Z",
  },
];

// wa_messages carries conversation_id, not contact_id directly. The
// join runs through wa_conversations. Only (sender='contact', type='text')
// rows count toward the person's chatMessageCount — the other rows
// exercise the filter (voice notes, avatar replies, avatar system
// events like [Call summary]).
const CONVERSATIONS = [
  { id: "cv1", contact_id: "c1", owner_id: "o1" },
  { id: "cv5", contact_id: "c5", owner_id: "o1" },
  { id: "cv6", contact_id: "c6", owner_id: "o4" },
];

const MESSAGES = [
  // Two user-typed messages from Maria — these are the only rows that
  // should increment chatMessageCount.
  { id: "msg1", conversation_id: "cv1", sender: "contact", type: "text", content: "hey", created_at: "2026-04-01T00:00:00Z" },
  { id: "msg2", conversation_id: "cv5", sender: "contact", type: "text", content: "hola", created_at: "2026-04-18T00:00:00Z" },
  // Filter exercise: voice note from contact — must NOT count as chat.
  { id: "msg3", conversation_id: "cv5", sender: "contact", type: "voice", content: "[audio]", created_at: "2026-04-17T00:00:00Z" },
  // Filter exercise: avatar typed reply — must NOT count.
  { id: "msg4", conversation_id: "cv1", sender: "avatar", type: "text", content: "hi there", created_at: "2026-04-01T00:01:00Z" },
  // Filter exercise: avatar-side [Call summary] — must NOT count.
  { id: "msg5", conversation_id: "cv1", sender: "avatar", type: "text", content: "[Call summary] {...}", created_at: "2026-04-02T00:00:00Z" },
  // Different person's message.
  { id: "msg6", conversation_id: "cv6", sender: "contact", type: "text", content: "sup", created_at: "2026-04-03T00:00:00Z" },
];

function fixtureFor(table) {
  switch (table) {
    case "wa_owners":
      return OWNERS;
    case "wa_contacts":
      return CONTACTS;
    case "wa_memories":
      return MEMORIES;
    case "wa_messages":
      return MESSAGES;
    case "wa_conversations":
      return CONVERSATIONS;
    default:
      return [];
  }
}

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* retry */
    }
    await delay(250);
  }
  throw new Error(`Server did not come up at ${url}`);
}

function startVite() {
  const proc = spawn("npx", ["vite", "--port", "5179", "--strictPort"], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, BROWSER: "none" },
  });
  proc.stdout.on("data", (d) => process.stdout.write(`[vite] ${d}`));
  proc.stderr.on("data", (d) => process.stderr.write(`[vite!] ${d}`));
  return proc;
}

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
  console.log(`  ✓ ${msg}`);
}

async function main() {
  const vite = startVite();
  let browser;
  try {
    await waitForServer("http://localhost:5179/");
    browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    // Skip the onboarding overlay before the app boots so request
    // interception isn't racing against a click.
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem("graph-onboarded-v1", "1");
    });

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/api/supabase")) {
        const u = new URL(url);
        const table = u.searchParams.get("table") ?? "";
        const body = JSON.stringify(fixtureFor(table));
        req.respond({
          status: 200,
          contentType: "application/json",
          body,
        });
        return;
      }
      req.continue();
    });

    const consoleErrors = [];
    page.on("pageerror", (err) => consoleErrors.push(String(err)));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("http://localhost:5179/graph", { waitUntil: "networkidle0", timeout: 20000 });

    // HUD should populate once the dataset resolves.
    await page.waitForFunction(
      () => {
        const el = document.querySelector(".graph-hud .hud-meta");
        return el && /\d+\s+memories/.test(el.textContent || "");
      },
      { timeout: 10000 },
    );

    const hudText = await page.$eval(".graph-hud .hud-meta", (el) => el.textContent || "");
    console.log("  HUD:", hudText);

    const legendAvatars = await page.$$eval(".graph-legend .leg-row span:last-child", (els) =>
      els.map((e) => e.textContent?.trim()).filter(Boolean),
    );
    console.log("  Legend avatars:", legendAvatars);
    assert(legendAvatars.length === 7, "Legend renders exactly 7 avatars");
    assert(
      legendAvatars.includes("Juan Schubert (Extended)"),
      "Legend includes Juan Schubert (Extended)",
    );

    const filterAvatars = await page.$$eval(
      'select[aria-label="Filter by avatar"] option',
      (els) => els.map((e) => e.textContent?.trim()).filter(Boolean),
    );
    console.log("  Avatar filter options:", filterAvatars);
    assert(filterAvatars.length === 8, "Avatar filter has 'All' + 7 avatars");

    // We pick Maria's node via the Person select (forced via pre-nav
    // localStorage, the onboarding overlay never appears in this run).
    const mariaPersonId = await page.evaluate(() => {
      const opts = Array.from(
        document.querySelectorAll('select[aria-label="Filter by person"] option'),
      );
      const maria = opts.find((o) => /maria/i.test(o.textContent || ""));
      return maria ? maria.getAttribute("value") : null;
    });
    assert(!!mariaPersonId, "Person filter contains Maria");

    // Sanity: there should be exactly ONE Maria option, not five.
    const mariaOptionCount = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll('select[aria-label="Filter by person"] option'),
      ).filter((o) => /maria/i.test(o.textContent || "")).length;
    });
    assert(
      mariaOptionCount === 1,
      `Maria appears exactly once in Person filter (actual: ${mariaOptionCount})`,
    );

    // ForceGraph2D paints to canvas, so there's no stable DOM target we
    // can click on for a node. We assert the dataset shape via a
    // dev-only debug global (window.__graphDataset__) that GraphView
    // writes when the data resolves — stripped from prod bundles.
    const debugDataset = await page.evaluate(() => window.__graphDataset__ ?? null);

    if (debugDataset) {
      const maria = debugDataset.nodes.find((n) => n.id === mariaPersonId);
      assert(!!maria, "Maria node exists in dataset");
      assert(
        maria.memoryCount === MARIA_MEMORY_COUNT,
        `Maria memoryCount === ${MARIA_MEMORY_COUNT} (got ${maria?.memoryCount})`,
      );
      assert(
        maria.videoCallCount === MARIA_VIDEO_CALL_COUNT,
        `Maria videoCallCount === ${MARIA_VIDEO_CALL_COUNT} (got ${maria?.videoCallCount})`,
      );
      assert(
        maria.voiceNoteCount === MARIA_VOICE_NOTE_COUNT,
        `Maria voiceNoteCount === ${MARIA_VOICE_NOTE_COUNT} (got ${maria?.voiceNoteCount})`,
      );
      assert(
        maria.chatMessageCount === MARIA_CHAT_MSG_COUNT,
        `Maria chatMessageCount === ${MARIA_CHAT_MSG_COUNT} (got ${maria?.chatMessageCount}; only sender=contact+type=text should count)`,
      );
      assert(
        maria.contactIds?.length === 5,
        `Maria aggregated across 5 contact rows (got ${maria?.contactIds?.length})`,
      );
      assert(
        (maria.avatarSlugs ?? []).includes("juan-schubert-extended"),
        "Maria's avatar list includes Juan Schubert (Extended)",
      );

      // Memory summary cleanliness.
      const m1 = debugDataset.nodes.find((n) => n.id === "memory:m1");
      assert(
        m1 && m1.summary && !m1.summary.includes("BEHAVIORAL ANALYSIS"),
        "Memory summary uses `summary` field, not raw_text",
      );
      const m6 = debugDataset.nodes.find((n) => n.id === "memory:m6");
      assert(
        m6 && m6.summary.length > 0,
        "Memory with null summary falls back to raw_text text",
      );

      // Test source filtered out.
      const testMem = debugDataset.nodes.find((n) => n.id === "memory:m_test");
      assert(!testMem, "Test-source memory (session-test) is excluded from graph");

      // All 7 avatars present.
      const avatarSlugs = debugDataset.nodes
        .filter((n) => n.kind === "avatar")
        .map((n) => n.avatarSlug);
      assert(avatarSlugs.length === 7, "All 7 avatar nodes rendered");
      assert(
        avatarSlugs.includes("juan-schubert-extended"),
        "Extended Juan avatar present",
      );

      // Step 1 keying: persons aggregate by (email → display_name →
      // contact-id). Maria's 5 contact rows collapse to one person;
      // Alex (c6) is a separate email → separate person; both have
      // memories so both survive the degree>0 filter. Expect 2.
      const personNodes = debugDataset.nodes.filter((n) => n.kind === "person");
      assert(
        personNodes.length === 2,
        `Person count from email+display_name keying === 2 (got ${personNodes.length})`,
      );

      // Step 3 semantic edges: at least one edge sourced from
      // wa_memories.connections, carrying a relationship label.
      const semanticEdges = debugDataset.edges.filter(
        (e) => e.kind === "memory-memory-semantic",
      );
      assert(
        semanticEdges.length >= 1 &&
          semanticEdges.some((e) => typeof e.relationship === "string" && e.relationship.length > 0),
        `at least one memory-memory-semantic edge with a relationship label (got ${semanticEdges.length})`,
      );

      // Step 3 cross-context: at least one of those semantic edges
      // crosses people or avatars (m2→m6 in the fixture does both).
      const crossContextEdges = semanticEdges.filter((e) => e.crossContext === true);
      assert(
        crossContextEdges.length >= 1,
        `at least one cross-context semantic edge (got ${crossContextEdges.length})`,
      );

      // Step 3 broken-ref guard: m4→m_test points at a filtered-out
      // memory and must not surface as an edge.
      const m4Edges = debugDataset.edges.filter(
        (e) =>
          (e.source === "memory:m4" || e.target === "memory:m4") &&
          (e.source === "memory:m_test" || e.target === "memory:m_test"),
      );
      assert(
        m4Edges.length === 0,
        `m4→m_test broken ref must be dropped (got ${m4Edges.length})`,
      );

      // Step 3 generic-topic blocklist: "Behavioral Analysis" and
      // "OPM" appear in the fixture; they must NOT show up in any
      // thematic edge's sharedTopics list.
      const thematicEdges = debugDataset.edges.filter(
        (e) => e.kind === "memory-memory-thematic",
      );
      const leakedGenerics = thematicEdges.flatMap((e) => e.sharedTopics ?? [])
        .filter((t) => /behavioral|opm|conversation|voice message|session summary/i.test(t));
      assert(
        leakedGenerics.length === 0,
        `generic topics must not drive thematic edges (leaked: ${leakedGenerics.join(", ") || "—"})`,
      );

      // Stat breakdown should include the new sub-counts so callers
      // can introspect the layered model without re-walking edges.
      assert(
        typeof debugDataset.stats.semanticEdgeCount === "number" &&
          typeof debugDataset.stats.crossContextSemanticEdgeCount === "number" &&
          typeof debugDataset.stats.structuralEdgeCount === "number" &&
          typeof debugDataset.stats.thematicEdgeCount === "number",
        "stats expose structural/semantic/crossContext/thematic edge counts",
      );
    } else {
      throw new Error(
        "window.__graphDataset__ was not exposed; re-run after ensuring dev build exports it.",
      );
    }

    if (consoleErrors.length > 0) {
      console.warn("  Console errors seen during run:");
      for (const e of consoleErrors) console.warn("    •", e);
    }
    console.log("\nAll graph smoke assertions passed.");
  } finally {
    if (browser) await browser.close();
    vite.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("\nSMOKE TEST FAILED:", err.message);
  process.exit(1);
});
