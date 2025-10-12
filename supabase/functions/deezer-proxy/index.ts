import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors() });

  const url   = new URL(req.url);
  const path  = url.searchParams.get("path");   // e.g. "search/track"
  const q     = url.searchParams.get("q") ?? "";
  const limit = url.searchParams.get("limit") ?? "";
  const index = url.searchParams.get("index") ?? "";

  if (!path) return json({ error: "Missing 'path' query param" }, 400);

  const target = new URL(`https://api.deezer.com/${path}`);
  if (q)     target.searchParams.set("q", q);
  if (limit) target.searchParams.set("limit", limit);
  if (index) target.searchParams.set("index", index);

  const r    = await fetch(target.toString(), { headers: { Accept: "application/json" } });
  const body = await r.text();

  return new Response(body, {
    status: r.status,
    headers: { ...cors(), "content-type": "application/json; charset=utf-8" },
  });
});

function cors() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  };
}
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors(), "content-type": "application/json; charset=utf-8" },
  });
}
