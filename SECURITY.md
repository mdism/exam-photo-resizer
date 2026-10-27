# Security

This tool is a static page plus one tiny bot-check endpoint: no database, no forms, no uploads. Files and inputs are processed only in the visitor's browser.

## What protects it

- **Content Security Policy** (in `public/.htaccess` and a `<meta>` tag): only scripts, styles, fonts and images from this site and Cloudflare Turnstile can load, and the page may only talk to this site (`connect-src 'self'`), which it uses solely for the bot-check token.
- **Bot check**: Cloudflare Turnstile must pass before the tool unlocks, and `public/api/verify.php` confirms every token with Cloudflare on the server, checks the hostname, accepts only same-origin POSTs and stores nothing.
- **Secret handling**: the Turnstile secret is never in this repo or in `public/`. It lives in `~/.config/shaikhismail-tools/turnstile.php` on the server (see `config/turnstile.example.php`); `config/turnstile.php` is git-ignored.
- **HTTPS only**, with HSTS.
- **No other third parties**: libraries and the font are served from this repo, not a CDN.
- **Other headers**: `X-Frame-Options: DENY` (no clickjacking), `nosniff`, `Referrer-Policy: no-referrer`, a locked-down `Permissions-Policy`.
- **Server rules**: only GET/HEAD allowed (POST only to `api/verify.php`), dotfiles and `.git` hidden, directory listing off, PHP/WordPress probes and known scanner bots refused.
- **In the code**: user-supplied text (file names, inputs) is always written with `textContent`, never as HTML; files are checked by their real signature, not just the extension; file size and count limits stop a tab from freezing.

## Reporting a problem

Email hello@shaikhismail.com. Please do not open a public issue for a security problem.
