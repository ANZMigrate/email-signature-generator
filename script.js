"use strict";

// Client-side only: staff information is never sent to a backend.
const ASSETS = "https://raw.githubusercontent.com/ANZMigrate/email-signature-generator/main/assets/";
const SOCIALS = [
  { key: "facebook", label: "Facebook", image: "facebook.png" },
  { key: "x", label: "X", image: "x.png" },
  { key: "youtube", label: "YouTube", image: "youtube.png" },
  { key: "linkedin", label: "LinkedIn", image: "linkedin.png" },
  { key: "instagram", label: "Instagram", image: "instagram.png" }
];
const form = document.getElementById("signatureForm");
const preview = document.getElementById("signaturePreview");
const sourceCode = document.getElementById("sourceCode");
const toast = document.getElementById("toast");
const startValues = {};
form.querySelectorAll("input,textarea").forEach(function(el) {
  startValues[el.id] = el.type === "checkbox" ? el.checked : el.value;
});
let currentSignature = "";
let toastTimer;

function value(id) { return document.getElementById(id).value.trim(); }
function htmlEscape(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function(ch) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
  });
}
function validUrl(raw) {
  if (!raw) return "";
  try {
    const u = new URL(raw);
    return u.protocol === "https:" ? u.href : "";
  } catch (_) { return ""; }
}
function getData() {
  return {
    name: value("fullName"), title: value("jobTitle"), email: value("email"),
    phone: value("phone"), company: value("company"), website: value("website"),
    logo: value("logoUrl"), locations: value("locations"),
    socials: SOCIALS.filter(function(s) {
      return document.getElementById(s.key + "On").checked;
    }).map(function(s) {
      return { label: s.label, image: s.image, url: value(s.key + "Url") };
    })
  };
}
function textOnly(html) {
  const el = document.createElement("div");
  el.innerHTML = html;
  return el.innerText || el.textContent || "";
}
function signatureMarkup(data) {
  const website = validUrl(data.website);
  const logo = validUrl(data.logo);
  const email = data.email;
  const emailHref = email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? "mailto:" + encodeURIComponent(email) : "";
  const phoneNumber = data.phone.replace(/[^\d+]/g, "");
  const locations = data.locations.split(",").map(function(x) { return x.trim(); }).filter(Boolean);
  const channels = data.socials.map(function(s) {
    const url = validUrl(s.url);
    if (!url) return "";
    return '<td valign="middle" style="padding:0 7px 0 0;">'
      + '<a href="' + htmlEscape(url) + '" target="_blank" rel="noopener noreferrer" title="' + htmlEscape(s.label) + '" style="text-decoration:none;display:block;">'
      + '<img src="' + ASSETS + s.image + '" alt="' + htmlEscape(s.label) + '" width="28" height="28" style="display:block;border:0;width:28px;height:28px;">'
      + '</a></td>';
  }).join("");
  const brandImage = logo
    ? '<a href="' + htmlEscape(website || "https://www.anzmigrate.com/") + '" style="text-decoration:none;">'
      + '<img src="' + htmlEscape(logo) + '" width="118" height="63" alt="' + htmlEscape(data.company || "ANZ Migrate") + '" style="width:118px;height:63px;display:block;border:0;outline:none;text-decoration:none;"></a>'
    : '<span style="display:block;font-size:16px;font-weight:700;color:#142d6b;">' + htmlEscape(data.company || "ANZ Migrate") + '</span>';
  const emailRow = email
    ? '<tr><td style="font:12px/19px Arial,Helvetica,sans-serif;"><a href="' + htmlEscape(emailHref || "#") + '" style="color:#33465d;text-decoration:none;">' + htmlEscape(email) + '</a></td></tr>' : "";
  const phoneRow = data.phone
    ? '<tr><td style="font:12px/19px Arial,Helvetica,sans-serif;"><a href="tel:' + htmlEscape(phoneNumber) + '" style="color:#33465d;text-decoration:none;">' + htmlEscape(data.phone) + '</a></td></tr>' : "";
  const websiteRow = website
    ? '<tr><td style="font:12px/19px Arial,Helvetica,sans-serif;"><a href="' + htmlEscape(website) + '" target="_blank" rel="noopener noreferrer" style="color:#204c94;text-decoration:none;font-weight:bold;">' + htmlEscape(website.replace(/^https?:\/\//, "").replace(/\/$/, "")) + '</a></td></tr>' : "";
  const footer = locations.length
    ? '<tr><td colspan="2" style="padding:10px 2px 2px;border-top:1px solid #e4eaf3;color:#718097;font:10px/16px Arial,Helvetica,sans-serif;">'
      + locations.map(htmlEscape).join(' &nbsp;&middot;&nbsp; ') + '</td></tr>' : "";

  // Fixed-layout tables + inline CSS are deliberate for Outlook, Gmail, and Apple Mail.
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;max-width:570px;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1b2b45;">'
    + '<tr><td colspan="2" height="3" style="height:3px;line-height:3px;font-size:1px;background-color:#142d6b;">&nbsp;</td></tr>'
    + '<tr>'
    + '<td valign="middle" width="135" style="vertical-align:middle;width:135px;padding:17px 16px 16px 2px;">' + brandImage + '</td>'
    + '<td valign="top" style="vertical-align:top;border-left:1px solid #dce4ef;padding:15px 0 15px 19px;">'
    + '<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">'
    + '<tr><td style="font:bold 18px/23px Arial,Helvetica,sans-serif;color:#142d6b;">' + htmlEscape(data.name || "Your name") + '</td></tr>'
    + '<tr><td style="padding-top:3px;font:12px/18px Arial,Helvetica,sans-serif;color:#53637a;">' + htmlEscape(data.title || "Your title")
    + (data.company ? ' <span style="color:#aeb9c8;">|</span> <span style="font-weight:bold;color:#344864;">' + htmlEscape(data.company) + '</span>' : "") + '</td></tr>'
    + '<tr><td height="10" style="height:10px;font-size:1px;line-height:10px;">&nbsp;</td></tr>'
    + emailRow + phoneRow + websiteRow
    + (channels ? '<tr><td height="11" style="height:11px;font-size:1px;line-height:11px;">&nbsp;</td></tr>'
       + '<tr><td><table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;"><tr>' + channels + '</tr></table></td></tr>' : '')
    + '</table></td></tr>' + footer + '</table>';
}
function update() {
  currentSignature = signatureMarkup(getData());
  preview.innerHTML = currentSignature;
  sourceCode.textContent = currentSignature;
}
function announce(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { toast.classList.remove("show"); }, 3200);
}
function ready() {
  const d = getData();
  if (!d.name || !d.title || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) {
    announce("Please enter a name, job title and valid work email.");
    return false;
  }
  if (d.logo && !validUrl(d.logo)) { announce("The logo URL must begin with https://"); return false; }
  if (d.website && !validUrl(d.website)) { announce("The website URL must begin with https://"); return false; }
  const invalidSocial = d.socials.some(function(s) { return s.url && !validUrl(s.url); });
  if (invalidSocial) { announce("Enabled social links must use https:// URLs."); return false; }
  return true;
}
function fallbackCopy() {
  // Copy the rendered table (not the entire editor UI) as rich HTML where supported.
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(preview);
  selection.removeAllRanges();
  selection.addRange(range);
  const ok = document.execCommand("copy");
  selection.removeAllRanges();
  return ok;
}
async function copyRich() {
  if (!ready()) return;
  let copied = false;
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const payload = new ClipboardItem({
        "text/html": new Blob([currentSignature], { type: "text/html" }),
        "text/plain": new Blob([textOnly(currentSignature)], { type: "text/plain" })
      });
      await navigator.clipboard.write([payload]);
      copied = true;
    }
  } catch (_) { /* Browser blocked rich clipboard; use selection fallback. */ }
  if (!copied) {
    try { copied = fallbackCopy(); } catch (_) { copied = false; }
  }
  announce(copied ? "Signature copied. Paste it into Gmail or Outlook settings." : "Clipboard unavailable here. Use Download HTML or Copy code.");
}
async function copyCode() {
  if (!ready()) return;
  try {
    await navigator.clipboard.writeText(currentSignature);
    announce("HTML source copied.");
  } catch (_) {
    const node = document.createElement("textarea");
    node.value = currentSignature; document.body.append(node);
    node.select(); const copied = document.execCommand("copy"); node.remove();
    announce(copied ? "HTML source copied." : "Clipboard unavailable. Use Download HTML.");
  }
}
function download() {
  if (!ready()) return;
  const fullHtml = '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Email signature</title></head><body style="margin:24px;background:#fff;">'
    + currentSignature + '</body></html>';
  const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const cleanName = (value("fullName") || "staff").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  link.href = url; link.download = "anzmigrate-" + (cleanName || "staff") + "-signature.html";
  document.body.append(link); link.click(); link.remove();
  setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
  announce("Signature HTML downloaded.");
}
// Optional Vercel Blob logo upload. A local file is only previewed here; it
// is never embedded as a data URI in the exported email signature.
const logoFileInput = document.getElementById("logoFile");
const uploadAccessCode = document.getElementById("uploadAccessCode");
const uploadImageBtn = document.getElementById("uploadImageBtn");
const imageUploadStatus = document.getElementById("imageUploadStatus");
const uploadThumbnail = document.getElementById("uploadThumbnail");
const MAX_IMAGE_BYTES = 1500000;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
let thumbnailObjectUrl = "";

function clearImageSelection() {
  if (thumbnailObjectUrl) URL.revokeObjectURL(thumbnailObjectUrl);
  thumbnailObjectUrl = "";
  uploadThumbnail.hidden = true;
  uploadThumbnail.removeAttribute("src");
  uploadImageBtn.disabled = true;
}
function chooseImage() {
  clearImageSelection();
  const file = logoFileInput.files && logoFileInput.files[0];
  if (!file) {
    imageUploadStatus.textContent = "Select a file to host it publicly through Vercel Blob.";
    return;
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    imageUploadStatus.textContent = "Choose a PNG, JPEG, or WebP image.";
    return;
  }
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    imageUploadStatus.textContent = "Image must be between 1 byte and 1.5 MB.";
    return;
  }
  thumbnailObjectUrl = URL.createObjectURL(file);
  uploadThumbnail.src = thumbnailObjectUrl;
  uploadThumbnail.hidden = false;
  uploadImageBtn.disabled = false;
  imageUploadStatus.textContent = "Local preview only. Select Upload & use image to publish it for email recipients.";
}
async function readBase64(file) {
  return new Promise(function(resolve, reject) {
    const reader = new FileReader();
    reader.onerror = function() { reject(new Error("Unable to read this image.")); };
    reader.onload = function() {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      if (comma === -1) reject(new Error("Invalid image data."));
      else resolve(result.slice(comma + 1));
    };
    reader.readAsDataURL(file);
  });
}
async function uploadLogoImage() {
  const file = logoFileInput.files && logoFileInput.files[0];
  const secret = uploadAccessCode.value;
  if (!file || !ALLOWED_IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES || file.size === 0) {
    imageUploadStatus.textContent = "Please choose a supported image up to 1.5 MB.";
    return;
  }
  if (!secret) {
    imageUploadStatus.textContent = "Enter the upload access code supplied by your administrator.";
    uploadAccessCode.focus();
    return;
  }
  uploadImageBtn.disabled = true;
  uploadImageBtn.textContent = "Uploading…";
  imageUploadStatus.textContent = "Uploading securely to public image storage…";
  try {
    const base64 = await readBase64(file);
    const result = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + secret
      },
      body: JSON.stringify({ filename: file.name, contentType: file.type, base64 })
    });
    const data = await result.json().catch(function() { return {}; });
    if (!result.ok) throw new Error(data.error || ("Upload failed (HTTP " + result.status + ")."));
    const publicUrl = validUrl(data.url);
    if (!publicUrl) throw new Error("The upload did not return a valid HTTPS image URL.");
    document.getElementById("logoUrl").value = publicUrl;
    uploadAccessCode.value = "";
    imageUploadStatus.textContent = "Uploaded successfully. The public image URL is now used in the signature.";
    update();
    announce("Image uploaded and signature updated.");
  } catch (error) {
    imageUploadStatus.textContent = error.message || "Image upload failed. Check the Vercel configuration.";
  } finally {
    uploadImageBtn.disabled = false;
    uploadImageBtn.textContent = "Upload & use image ↗";
  }
}
logoFileInput.addEventListener("change", chooseImage);
uploadImageBtn.addEventListener("click", uploadLogoImage);

form.addEventListener("input", update);
form.addEventListener("change", update);
form.addEventListener("submit", function(e) { e.preventDefault(); });
document.getElementById("copyRichBtn").addEventListener("click", copyRich);
document.getElementById("copyHtmlActionBtn").addEventListener("click", copyCode);
document.getElementById("downloadBtn").addEventListener("click", download);
document.getElementById("copyHtmlBtn").addEventListener("click", copyCode);
document.getElementById("resetBtn").addEventListener("click", function() {
  form.querySelectorAll("input,textarea").forEach(function(el) {
    if (el.type === "checkbox") el.checked = startValues[el.id];
    else el.value = startValues[el.id];
  });
  clearImageSelection();
  imageUploadStatus.textContent = "Select a file to host it publicly through Vercel Blob.";
  update(); announce("Restored the default ANZ Migrate signature.");
});
document.getElementById("sourceToggle").addEventListener("click", function() {
  const panel = document.getElementById("sourcePanel");
  const showing = panel.hidden;
  panel.hidden = !showing;
  this.setAttribute("aria-expanded", String(showing));
  document.getElementById("sourceCaret").textContent = showing ? "⌃" : "⌄";
});
update();
