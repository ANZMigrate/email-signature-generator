# ANZ Migrate — Email Signature Studio

A browser-based signature generator for ANZ Migrate employees, with branded social icons, Gmail/Outlook-friendly HTML, and **optional image upload on Vercel**.

## Use

Enter your staff information and edit the company details, then choose **Copy signature** (formatted rich-text HTML for Gmail or Outlook), **Copy HTML** (raw markup copied as text for development or manual editing), or **Download HTML** (a standalone HTML file). You can also expand **View signature HTML** to inspect and copy the same source. The default company logo and icons are hosted publicly on GitHub.

### Custom logo image upload (Vercel)

Uploaded files must have a public HTTPS address to work in sent email signatures. This app uses Vercel Blob for that address, **not** temporary local object URLs or embedded base64 images.

**One-time setup by the Vercel project administrator:**

1. In the Vercel project, open **Storage** and connect a **Public Blob** store to this specific project. New Vercel Blob connections typically use automatic OIDC authentication; no manual `BLOB_READ_WRITE_TOKEN` is needed. Older token-based connections can use the automatically supplied server-only `BLOB_READ_WRITE_TOKEN`. If you created a store at team level, explicitly connect it to the project under the store's **Projects** tab.
2. Open **Settings** → **Environment Variables**. Add a secret `SIGNATURE_UPLOAD_KEY` with a long, random value (at least 20 characters recommended). Make it available in the production environment and preview environments where staff need to upload. **Do not prefix it with `VITE_`, `NEXT_PUBLIC_`, or expose it in HTML/JavaScript.**
3. Redeploy if necessary so both environment variables are present in the running Vercel Functions.

The uploaded files live in the Blob store as public, uniquely named URLs. Vercel Blob storage and transfer may incur charges. Because these images appear in email signatures, only upload artwork that is meant to be public.

**Staff use:**

1. In **Company branding** → **Upload a custom logo**, choose a PNG, JPEG, or WebP image (maximum 1.5 MB).
2. Enter the **upload access code** supplied by your administrator.
3. Click **Upload & use image**. On success, the Logo image URL is updated to the public Vercel Blob address and appears in the signature preview.
4. Copy the signature or download its HTML.

Uploads are limited to 1.5 MB. Image file signatures are checked on the server; SVG and potentially executable formats are rejected. The endpoint requires a server-side access code so the public website cannot be used for unrestricted anonymous uploads. Keep the code confidential, rotate it in Vercel if exposed, and be aware that any employee with the code can create public images in your Blob store.

**Vercel project requirement:** The repository must be deployed on Vercel with serverless Functions support (the endpoint is `/api/upload`). GitHub Pages or opening `index.html` as a file still support signature generation and image URLs, but **not image uploads**.

### Existing image URL

If your staff already have an image hosted publicly, they can paste its HTTPS URL directly into the **Logo image URL** field without uploading. A copied HTML signature must refer to an image that remains publicly accessible.

## Repository layout

- `index.html` — web form and live signature preview
- `styles.css` — responsive generator UI
- `script.js` — signature builder and upload UI
- `api/upload.js` — Vercel Node.js Function; access-code check, image verification, Blob storage
- `package.json` — pinned `@vercel/blob` server-side dependency
- `assets/` — public default logo and Facebook, X, YouTube, LinkedIn, Instagram icons

## Email-client notes

The exported signature uses inline styles and an HTML table for common email clients. Remote images can still be blocked by the recipient's email settings. Always test a signature in your organization's actual Gmail or Outlook configuration before broad rollout.

## Privacy

The generator does not save employees' text fields to a database or local storage. For image uploads only, the chosen file is transmitted to the Vercel Function and stored **publicly** in the team's Vercel Blob store. The upload access code is transmitted in the request header and verified server-side; it is not embedded into generated signatures or saved by the application.

## Deployment

The intended source is [github.com/ANZMigrate/email-signature-generator](https://github.com/ANZMigrate/email-signature-generator). If Vercel is connected to the `main` branch, Git pushes normally initiate a new deployment. The administrator must still set up Blob storage and secrets as described above.
