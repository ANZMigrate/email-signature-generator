// Vercel Node.js Function: authenticated public image upload for email signatures.
// Requires BLOB_READ_WRITE_TOKEN and SIGNATURE_UPLOAD_KEY in Vercel project settings.
import { createHash, timingSafeEqual } from "node:crypto";
import { put } from "@vercel/blob";

const MAX_BYTES = 1500000;
const MIME_EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const MAX_JSON_BYTES = 2200000;

function imageMatchesMime(buf, mime) {
  if (mime === "image/png") {
    return buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (mime === "image/jpeg") {
    return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (mime === "image/webp") {
    return buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP";
  }
  return false;
}
function verifyAccess(req) {
  const provided = req.headers.authorization;
  const configured = process.env.SIGNATURE_UPLOAD_KEY;
  if (!configured || typeof provided !== "string" || !provided.startsWith("Bearer ")) return false;
  const supplied = provided.slice(7);
  if (supplied.length === 0 || supplied.length > 256) return false;
  const a = createHash("sha256").update(supplied).digest();
  const b = createHash("sha256").update(configured).digest();
  return timingSafeEqual(a, b);
}
function reject(res, code, error) { return res.status(code).json({ error }); }

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return reject(res, 405, "Only POST uploads are supported.");
  }
  // Vercel Blob supports OIDC on new project connections, and legacy stores
  // can use BLOB_READ_WRITE_TOKEN. Let the SDK resolve either credential.
  if (!process.env.SIGNATURE_UPLOAD_KEY) {
    return reject(res, 503, "Uploads are not configured yet. Ask your administrator to set SIGNATURE_UPLOAD_KEY in Vercel.");
  }
  if (!verifyAccess(req)) return reject(res, 401, "Incorrect upload access code.");
  if (!String(req.headers["content-type"] || "").startsWith("application/json")) {
    return reject(res, 415, "Upload must use JSON.");
  }
  const length = Number(req.headers["content-length"] || 0);
  if (length > MAX_JSON_BYTES) return reject(res, 413, "File is too large. Maximum 1.5 MB.");

  let payload;
  try {
    payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (_) {
    return reject(res, 400, "Invalid upload request.");
  }
  if (!payload || typeof payload !== "object") return reject(res, 400, "Missing image data.");

  const { contentType, base64 } = payload;
  if (typeof contentType !== "string" || !Object.hasOwn(MIME_EXT, contentType)) {
    return reject(res, 415, "Only PNG, JPEG, and WebP images are accepted.");
  }
  if (typeof base64 !== "string" || base64.length > 2000000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    return reject(res, 400, "Invalid image encoding.");
  }
  const image = Buffer.from(base64, "base64");
  if (image.length === 0 || image.length > MAX_BYTES) {
    return reject(res, 413, "Image must be no larger than 1.5 MB.");
  }
  if (!imageMatchesMime(image, contentType)) {
    return reject(res, 415, "The selected file does not match its declared image format.");
  }

  try {
    const extension = MIME_EXT[contentType];
    const filename = "staff-logos/logo-" + Date.now() + "." + extension;
    const uploaded = await put(filename, image, {
      access: "public",
      addRandomSuffix: true,
      contentType
    });
    return res.status(201).json({ url: uploaded.url });
  } catch (error) {
    console.error("Vercel Blob image upload failed", error?.message || error);
    return reject(res, 502, "Storage upload failed. Check your Vercel Blob connection.");
  }
}
