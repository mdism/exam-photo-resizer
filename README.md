# Exam Photo Resizer

Resize photos, signatures and thumb impressions to the exact pixel size and KB range that online exam and job application forms ask for. Crop, zoom, black-and-white and an optional name and date strip.

**Live:** https://photo.shaikhismail.com · part of the [free tools](https://shaikhismail.com/tools/) by [Mohammed Ismail Shaikh](https://shaikhismail.com)

- 100% client-side: files and numbers never leave your browser
- Nothing is uploaded or saved; anything held while processing is temporary and deleted afterwards
- No analytics or ads; Cloudflare Turnstile keeps bots out
- No build step, no server, no cost to host
- Works on phones, light and dark theme

## Run locally

Open `public/index.html` in a browser, or serve the folder:

```
cd public
python -m http.server 8080
```

Then visit http://localhost:8080.

## Project layout

```
public/                 Everything that gets published
├── index.html          The page
├── privacy.html        Privacy policy
├── .htaccess           HTTPS, security headers, bot blocking
├── robots.txt, sitemap.xml, .well-known/security.txt
├── privacy.html        Privacy policy
├── api/verify.php      Confirms the Turnstile token with Cloudflare (server side)
├── .htaccess           HTTPS, security headers, bot blocking
├── robots.txt, sitemap.xml, .well-known/security.txt
└── assets/
    ├── fonts/          JetBrains Mono, self-hosted (OFL)
    ├── fonts/          JetBrains Mono, self-hosted (OFL)
    ├── css/tool.css    Shared look (same tokens as shaikhismail.com)
    ├── js/common.js    Theme toggle, drop zone, download helpers
    └── js/app.js       The tool's logic
config/                 turnstile.example.php (the real turnstile.php is git-ignored)
scripts/bump_version.py Release helper
.cpanel.yml             Tells cPanel to copy only public/ to the subdomain
```

Third-party libraries: None

## Privacy and security

Nothing is uploaded, saved or tracked: see [PRIVACY.md](PRIVACY.md) (also published as `privacy.html`) and [SECURITY.md](SECURITY.md).

### Bot check (Cloudflare Turnstile)

The tool unlocks only after a Turnstile check that the server confirms in `public/api/verify.php` (needs PHP 8 with curl, which cPanel has).
The site key is in `public/assets/js/common.js`. **The secret never goes in git.** One time on the server:

1. Copy `config/turnstile.example.php` to `turnstile.php` and put the secret in it.
2. cPanel → File Manager → create `/home/qyotupjl/.config/shaikhismail-tools/` and upload `turnstile.php` there (outside public_html; all four tools share it). Set permissions to 600.
3. In the Cloudflare dashboard → Turnstile → your widget, make sure the hostnames include this subdomain.

Locally, opening `public/index.html` from disk skips the check. To test it, run `php -S localhost:8080 -t public` with a `config/turnstile.php` that uses Cloudflare's test secret (see the example file).

`public/.htaccess` adds the security headers, forces HTTPS and blocks spam bots and scanners. Optional, also free: put the domain behind [Cloudflare](https://www.cloudflare.com/plans/free/) (change the nameservers at your registrar, keep "Proxied" on for each subdomain, turn on *Bot Fight Mode* and *Always Use HTTPS*). That hides the hosting server and absorbs bot floods before they reach MilesWeb.

## Deploy on MilesWeb (cPanel)

One-time setup:

1. cPanel → **Domains** → Create a new domain → `photo.shaikhismail.com`. Untick "Share document root" and set the document root to `photo.shaikhismail.com` (that is `/home/qyotupjl/photo.shaikhismail.com`). If you pick a different folder, update `DEPLOYPATH` in `.cpanel.yml`.
2. cPanel → **SSL/TLS Status** → Run AutoSSL so the subdomain gets a free certificate.
3. cPanel → **Git Version Control** → Create → Clone a Repository:
   - Clone URL: `https://github.com/mdism/tool-exam-photo-resizer.git`
   - Repository path: `repositories/tool-exam-photo-resizer`

Each update: push to GitHub, then cPanel → Git Version Control → Manage → **Pull or Deploy** → *Update from Remote*, then *Deploy HEAD Commit*.

Finally set this tool to `status: "live"` in the TOOLS list at the bottom of `site/tools/index.html` in the [mdism/mdism](https://github.com/mdism/mdism) repo.

## Releasing

The version shows in the footer and links to CHANGELOG.md. Before each release:

```
python scripts/bump_version.py 1.3.0 "What changed"
```

It updates the footer, the `?v=` cache-busting on CSS/JS, and adds a CHANGELOG entry.

## License

MIT, see [LICENSE](LICENSE).
