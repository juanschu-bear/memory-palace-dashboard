import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL = "https://wofklmwbokdjoqlstjmy.supabase.co";

// Allowed tables (whitelist to prevent arbitrary queries)
const ALLOWED_TABLES = new Set([
  "wa_contacts",
  "wa_owners",
  "wa_conversations",
  "wa_memories",
  "wa_conversation_memory",
  "wa_perception_logs",
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!key) {
    return res.status(500).json({ error: "SUPABASE_SERVICE_KEY not configured" });
  }

  // Extract the table and query from the path
  // URL: /api/supabase/wa_contacts?select=*&order=last_active_at.desc
  const { path } = req.query;
  const segments = Array.isArray(path) ? path : [path];
  const table = segments[0];

  if (!table || !ALLOWED_TABLES.has(table)) {
    return res.status(403).json({ error: `Table '${table}' not allowed` });
  }

  // Build the upstream URL preserving query params
  const url = new URL(`${SUPABASE_URL}/rest/v1/${segments.join("/")}`);
  const params = req.url?.split("?")[1];
  if (params) {
    // Re-parse to avoid double-encoding
    const searchParams = new URLSearchParams(params);
    // Remove the "path" param that Vercel adds
    searchParams.delete("path");
    url.search = searchParams.toString();
  }

  try {
    const upstream = await fetch(url.toString(), {
      method: req.method || "GET",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(req.headers["prefer"] ? { Prefer: req.headers["prefer"] as string } : {}),
      },
      ...(req.method === "POST" || req.method === "PATCH"
        ? { body: JSON.stringify(req.body) }
        : {}),
    });

    const contentType = upstream.headers.get("content-type") || "application/json";
    const body = await upstream.text();

    res.setHeader("Content-Type", contentType);
    return res.status(upstream.status).send(body);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(502).json({ error: "Supabase proxy error", detail: message });
  }
}
