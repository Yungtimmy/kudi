import { MEZO_RELAY_PATHS, MEZO_RELAY_UPSTREAM } from "@/lib/mezoRelay";

export const dynamic = "force-dynamic";

// Mezo's testnet relay sends no CORS headers, so a browser on localhost or a
// vercel.app address can't call it directly. Passport's relay calls are routed
// here instead and this server makes the same POST. Only the two relay
// endpoints Passport uses are allowed, so this is not an open proxy.

const MAX_BODY_BYTES = 64 * 1024;

function json(status: number, body: unknown) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request, { params }: { params: { path: string[] } }) {
  const path = (params.path ?? []).join("/");
  if (!(MEZO_RELAY_PATHS as readonly string[]).includes(path)) {
    return json(404, { error: "unknown relay path" });
  }

  const body = await req.text();
  if (body.length > MAX_BODY_BYTES) return json(413, { error: "body too large" });

  let upstream: Response;
  try {
    upstream = await fetch(`${MEZO_RELAY_UPSTREAM}${path}`, {
      method: "POST",
      // Passport only sends Content-Type. Origin, host and cookies are not passed on.
      headers: {
        "content-type": req.headers.get("content-type") ?? "application/json",
        accept: "application/json",
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
  } catch (err) {
    return json(502, { error: "could not reach the Mezo relay", detail: String(err) });
  }

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    },
  });
}

// The browser calls this route on the same origin, so no preflight is needed.
// Answer OPTIONS anyway so a stray preflight doesn't fail.
export function OPTIONS() {
  return new Response(null, { status: 204, headers: { allow: "POST, OPTIONS" } });
}
