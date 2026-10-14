# ANZ Migrate · Email Signature Studio

A self-contained, mobile-friendly HTML signature generator for ANZ Migrate staff, based on the October 2026 email signature design. No package installation, API keys, build process, or employee database required.

## Open the generator

If GitHub Pages is already publishing the **main** branch at the repository root, open:

**https://anzmigrate.github.io/email-signature-generator/**

If that URL is not yet active, open **ANZMigrate/email-signature-generator → Settings → Pages** and configure **Deploy from a branch**, **main**, **/(root)**. The repository is standalone, and Pages publishes only this signature generator. GitHub Pages may take several minutes to publish.

You can also download the three web files and assets folder and open index.html locally. Rich clipboard APIs generally work best on HTTPS or localhost; HTML download works locally.

## For staff

1. Enter your name, job title, work email, and optional phone number.
2. Check the website, location list, logo and enabled social profiles.
3. See the signature update live in the email preview.
4. Click **Copy signature** and paste it into Gmail or Outlook signature settings. If rich copying is blocked by your browser, use **Download HTML**, open the downloaded file in a browser, and copy the rendered signature.

For Gmail: **Settings → See all settings → General → Signature**.  
For Outlook: open your account's **Signature** settings and paste the rendered signature.

## Brand assets

The original ANZ Migrate logo and the five PNG social icons are served from this public GitHub repository. Generated signatures use absolute HTTPS raw GitHub image URLs, not embedded data URIs. That improves cross-client reliability, but recipient email apps may still block remote images by default.

- Logo: assets/anz-migrate-logo.png
- Icons: facebook.png, x.png, youtube.png, linkedin.png, instagram.png

The icon x.png replaces the obsolete Twitter bird. The signature layout uses HTML tables and inline styles for Gmail/Outlook compatibility.

## Updating defaults

Initial staff details and company links are in index.html. The generated HTML template and icon paths are in script.js. Shared display styles for the web tool are in styles.css.

When changing the image host or file path, update both the default Logo image URL in index.html and ASSETS in script.js.

## Privacy and caveats

Employee input is processed entirely in the browser: no backend, form submission, analytics, or local storage is included. Standard network requests are made for the web fonts and hosted images. The generator does not create accounts or store staff profiles. Always check a signature in the actual target email client before distributing it company-wide.

**Repository location:** the root of the dedicated [ANZMigrate/email-signature-generator](https://github.com/ANZMigrate/email-signature-generator) repository.