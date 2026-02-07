import { z } from "zod";

/**
 * Safely parses a JSON string and validates it against a Zod schema.
 * Returns the validated data or a fallback value if parsing/validation fails.
 *
 * Use this instead of raw JSON.parse on data from localStorage, sessionStorage,
 * or any other untrusted source.
 */
export function safeJsonParse<T>(
  raw: string | null,
  schema: z.ZodType<T>,
  fallback: T
): T {
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    const result = schema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
    console.warn("[safeJsonParse] Validation failed:", result.error.message);
    return fallback;
  } catch {
    console.warn("[safeJsonParse] JSON.parse failed for input");
    return fallback;
  }
}

/** UUID v4 regex for validating IDs from Supabase */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates that a string is a valid UUID v4.
 * Use before constructing file paths or database queries with user-supplied IDs.
 */
export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

/** Allowed MIME types for image uploads */
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
]);

/**
 * Validates that a file has an allowed image MIME type.
 * More reliable than checking the file extension alone.
 */
export function isAllowedImageType(file: File): boolean {
  return ALLOWED_IMAGE_MIME_TYPES.has(file.type);
}

/**
 * Extracts and validates a file extension against the MIME type.
 * Returns a safe extension string or null if invalid.
 */
export function getSafeFileExtension(file: File): string | null {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/avif": "avif",
  };
  return mimeToExt[file.type] ?? null;
}
