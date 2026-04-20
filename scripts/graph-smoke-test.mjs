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

const MARIA_MEMORY_COUNT = 5; // rows produced by the fixture below
const MARIA_SESSION_COUNT = 3; // distinct call-anima-api-* sources
const MARIA_VOICE_COUNT = 1; // voice-message rows
const MARIA_TEXT_COUNT = 2; // wa_messages rows

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
const MEMORIES = [
  {
    id: "m1",
    contact_id: "c1",
    owner_id: "o1",
    persona_name: "Juan Schubert",
    source: "call-anima-api-aaa111",
    summary: "Maria and Juan talked about pricing.",
    raw_text: "FULL TRANSCRIPT + BEHAVIORAL ANALYSIS — noisy data should NOT be shown in the detail panel.",
    topics: ["pricing"],
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
    topics: ["growth"],
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

const MESSAGES = [
  { id: "msg1", contact_id: "c1", created_at: "2026-04-01T00:00:00Z" },
  { id: "msg2", contact_id: "c5", created_at: "2026-04-18T00:00:00Z" },
  { id: "msg3", contact_id: "c6", created_at: "2026-04-03T00:00:00Z" },
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
        maria.sessionCount === MARIA_SESSION_COUNT,
        `Maria sessionCount === ${MARIA_SESSION_COUNT} (got ${maria?.sessionCount})`,
      );
      assert(
        maria.voiceMessageCount === MARIA_VOICE_COUNT,
        `Maria voiceMessageCount === ${MARIA_VOICE_COUNT} (got ${maria?.voiceMessageCount})`,
      );
      assert(
        maria.textMessageCount === MARIA_TEXT_COUNT,
        `Maria textMessageCount === ${MARIA_TEXT_COUNT} (got ${maria?.textMessageCount})`,
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
