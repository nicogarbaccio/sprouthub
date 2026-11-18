import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

/**
 * Permanently deletes the calling user's account: their plants (which cascade to watering,
 * fertilization, journal and schedule records), the auth user itself (which cascades to the
 * profile, preferences, households they created, memberships, saved/hidden articles, push
 * tokens and notifications), and the photos they uploaded.
 *
 * The browser can't delete an auth user, which is why this runs here: before it existed,
 * "Delete Account" only removed plants and the profile and left the login working.
 */

const ALLOWED_ORIGINS = [
  "https://sprouthub.netlify.app",
  "https://www.sprouthub.app",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const BUCKET = "plant-images";
const STORAGE_URL_PART = `/storage/v1/object/public/${BUCKET}/`;
/** Files the image upload creates: <uuid>.<ext> at the bucket root. Catalog images there have plant names. */
const UPLOADED_FILE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$/i;
/** The folder the old upload-image function put user photos in; anything else on Cloudinary may be shared */
const CLOUDINARY_UPLOAD_FOLDER = "plant-collection/";

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

/** Storage path of an uploaded photo in our bucket, or null for anything else (catalog images, other hosts) */
function uploadedStoragePath(url: string): string | null {
  const at = url.indexOf(STORAGE_URL_PART);
  if (at === -1) return null;
  const path = decodeURIComponent(url.slice(at + STORAGE_URL_PART.length).split("?")[0]);
  return UPLOADED_FILE.test(path) ? path : null;
}

/** Cloudinary public id of a user upload, or null if the URL isn't one of ours */
function uploadedCloudinaryId(url: string, cloudName: string): string | null {
  const prefix = `https://res.cloudinary.com/${cloudName}/image/upload/`;
  if (!url.startsWith(prefix)) return null;
  const segments = url.slice(prefix.length).split("?")[0].split("/");
  // Skip any transformation segments and the version (v1234567890)
  const version = segments.findIndex((s) => /^v\d+$/.test(s));
  const publicId = segments.slice(version + 1).join("/").replace(/\.[a-z0-9]+$/i, "");
  return publicId.startsWith(CLOUDINARY_UPLOAD_FOLDER) ? publicId : null;
}

/** Every file under a folder in the bucket (journal photos live at <userId>/<plantId>/...) */
async function listFolder(admin: SupabaseClient, folder: string): Promise<string[]> {
  const paths: string[] = [];
  const { data, error } = await admin.storage.from(BUCKET).list(folder, { limit: 1000 });
  if (error) throw error;
  for (const entry of data ?? []) {
    const path = `${folder}/${entry.name}`;
    // Folders come back without an id
    if (entry.id) paths.push(path);
    else paths.push(...(await listFolder(admin, path)));
  }
  return paths;
}

async function destroyCloudinaryImage(publicId: string) {
  const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
  const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
  const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");
  if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary isn't configured");

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const digest = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
  );
  const signature = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");

  const body = new FormData();
  body.append("public_id", publicId);
  body.append("timestamp", timestamp);
  body.append("api_key", apiKey);
  body.append("signature", signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: "POST", body });
  const result = await res.json().catch(() => ({}));
  if (!res.ok || (result.result !== "ok" && result.result !== "not found")) {
    throw new Error(`Cloudinary destroy failed: ${JSON.stringify(result)}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: getCorsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json(req, { error: "Unauthorized" }, 401);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Only ever the caller's own account, identified by their session token
  const { data: { user }, error: authError } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !user) return json(req, { error: "Invalid token" }, 401);
  const userId = user.id;

  try {
    // ── Work out which photos to remove, while the rows pointing at them still exist ──
    const [{ data: plants, error: plantsError }, { data: profile, error: profileError }] = await Promise.all([
      admin.from("user_plants").select("image").eq("user_id", userId),
      admin.from("profiles").select("avatar_url").eq("id", userId).maybeSingle(),
    ]);
    if (plantsError) throw plantsError;
    if (profileError) throw profileError;

    const urls = [...new Set([
      ...(plants ?? []).map((p) => p.image),
      profile?.avatar_url,
    ].filter((u): u is string => Boolean(u)))];

    // A URL someone else also uses isn't this user's to delete
    const shared = new Set<string>();
    if (urls.length > 0) {
      const [{ data: otherPlants }, { data: otherProfiles }] = await Promise.all([
        admin.from("user_plants").select("image").in("image", urls).neq("user_id", userId),
        admin.from("profiles").select("avatar_url").in("avatar_url", urls).neq("id", userId),
      ]);
      (otherPlants ?? []).forEach((p) => shared.add(p.image));
      (otherProfiles ?? []).forEach((p) => p.avatar_url && shared.add(p.avatar_url));
    }

    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME") ?? "";
    const storagePaths = new Set<string>();
    const cloudinaryIds = new Set<string>();
    for (const url of urls) {
      if (shared.has(url)) continue;
      const path = uploadedStoragePath(url);
      if (path) storagePaths.add(path);
      const publicId = cloudName ? uploadedCloudinaryId(url, cloudName) : null;
      if (publicId) cloudinaryIds.add(publicId);
    }
    (await listFolder(admin, userId)).forEach((path) => storagePaths.add(path));

    // ── Delete the account. Plants first: user_plants doesn't cascade from auth.users ──
    const { error: deletePlantsError } = await admin.from("user_plants").delete().eq("user_id", userId);
    if (deletePlantsError) throw deletePlantsError;

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId);
    if (deleteUserError) throw deleteUserError;

    // ── Photos last: the account is already gone, so a failure here can't leave it half-deleted ──
    const fileErrors: string[] = [];
    let photosRemoved = 0;
    if (storagePaths.size > 0) {
      const { data: removed, error } = await admin.storage.from(BUCKET).remove([...storagePaths]);
      if (error) fileErrors.push(`storage: ${error.message}`);
      photosRemoved += removed?.length ?? 0;
    }
    for (const publicId of cloudinaryIds) {
      try {
        await destroyCloudinaryImage(publicId);
        photosRemoved++;
      } catch (error) {
        fileErrors.push(`cloudinary ${publicId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    if (fileErrors.length > 0) {
      // Logged with the user id so leftover photos can be cleaned up by hand
      console.error(`delete-account ${userId}: account deleted, but some photos weren't:`, fileErrors);
    }

    return json(req, {
      success: true,
      photos_removed: photosRemoved,
      photo_errors: fileErrors.length,
    });
  } catch (error) {
    console.error(`delete-account ${userId} failed:`, error);
    return json(req, { error: "Could not delete account" }, 500);
  }
});
