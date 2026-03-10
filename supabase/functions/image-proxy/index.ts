import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const ALLOWED_ORIGINS = [
  "https://sprouthub.netlify.app",
  "https://www.sprouthub.app",
  "http://localhost:8080",
  "http://localhost:5173",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const url = new URL(req.url);
  const imageUrl = url.searchParams.get("url");

  if (!imageUrl) {
    return new Response("Missing ?url= parameter", { status: 400 });
  }

  try {
    // Validate it looks like an image URL
    const parsed = new URL(imageUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return new Response("Invalid URL protocol", { status: 400 });
    }

    const response = await fetch(imageUrl, {
      headers: {
        // Mimic a normal browser request to avoid hotlink blocks
        "User-Agent":
          "Mozilla/5.0 (compatible; SproutHub/1.0; +https://sprouthub.app)",
        Accept: "image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return new Response(`Upstream returned ${response.status}`, {
        status: 502,
      });
    }

    const contentType =
      response.headers.get("content-type") || "image/jpeg";
    const body = await response.arrayBuffer();

    return new Response(body, {
      headers: {
        ...getCorsHeaders(req),
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, immutable", // 7 days
      },
    });
  } catch (err) {
    return new Response(`Failed to fetch image: ${err.message}`, {
      status: 502,
    });
  }
});
