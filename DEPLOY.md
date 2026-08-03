# Starlet Creative Solutions — website

One-page animated site, pure HTML/CSS/JS. No build step, no dependencies —
open `index.html` in any browser, or upload the folder anywhere.

## Files
- `index.html` — the whole site (7 sections)
- `css/style.css` — brand styling (navy `#071c30`, gold `#c79e62`, cream `#f8f3ea`)
- `js/main.js` — animations: starfields, star-wipe transitions, shimmer, counters, sparkle burst
- `assets/` — real artwork extracted from the company profile PDF (logo, 16 client logos, portfolio crops)
- Append `?shot=1` to the URL for a static no-animation version (used for QA screenshots)

## Going live (free) — pick one
**Netlify (easiest):** go to https://app.netlify.com/drop and drag this whole folder
into the page. Site is live in ~10 seconds at `something.netlify.app`.
Rename it to `starletcreative.netlify.app` in Site settings → Change site name.

**GitHub Pages:** create a repo named `starletcreative`, upload these files,
enable Settings → Pages → deploy from `main` branch. Live at
`<account>.github.io/starletcreative`.

**Vercel:** import the folder at https://vercel.com/new → live at `starletcreative.vercel.app`.

## Attaching a real domain (e.g. starletcreative.com)
1. Buy the domain at any registrar (Namecheap, GoDaddy, Hostinger — ~$10–15/yr).
   Candidates: `starletcreative.com`, `starlet.agency`, `starletcreativesolutions.com`
   (the one printed in the company profile).
2. In your host's dashboard (Netlify/Vercel/GitHub Pages) choose **Add custom domain**
   and type the domain.
3. At the registrar, set the DNS records the host shows you (usually one A record
   and one CNAME for `www`). HTTPS certificate is automatic.
Total time: ~15 minutes, mostly waiting for DNS.
