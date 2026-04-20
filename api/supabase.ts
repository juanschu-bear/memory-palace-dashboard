import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL = "https://wofklmwbokdjoqlstjmy.supabase.co";

const ALLOWED_TABLES = new Set([
  "wa_contacts",
  "wa_owners",
  "wa_conversations",
  "wa_memories",
  "wa_messages",
  "wa_conversation_memory",
  "wa_perception_logs",
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!key) {
    return res.status(500).json({ error: "SUPABASE_SERVICE_KEY not configured" });
  }

  // Table name comes from the URL path: /api/supabase?table=wa_contacts&select=*
  const table = req.query.table as string | undefined;
  if (!table || !ALLOWED_TABLES.has(table)) {
    return res.status(403).json({ error: `Table '${table}' not allowed` });
  }

  // Build upstream URL with all query params except 'table'
  const upstream = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  const rawQs = req.url?.split("?")[1] || "";
  const params = new URLSearchParams(rawQs);
  params.delete("table");
  upstream.search = params.toString();

  try {
    const response = await fetch(upstream.toString(), {
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

    const ct = response.headers.get("content-type") || "application/json";
    const body = await response.text();
    res.setHeader("Content-Type", ct);
    return res.status(response.status).send(body);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(502).json({ error: "Supabase proxy error", detail: msg });
  }
}
