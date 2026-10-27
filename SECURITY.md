# Security

This tool is a static page: no server code, no database, no forms, no uploads. Files and inputs are processed only in the visitor's browser.

## What protects it

- **Content Security Policy** (in `public/.htaccess` and a `<meta>` tag): only scripts, styles, fonts and images from this site can load, and the page cannot make network requests (`connect-src 'none'`), so nothing a visitor drops in can be sent anywhere.
- **HTTPS only**, with HSTS.
- **No third parties**: libraries and the font are served from this repo, not a CDN.
- **Other headers**: `X-Frame-Options: DENY` (no clickjacking), `nosniff`, `Referrer-Policy: no-referrer`, a locked-down `Permissions-Policy`.
- **Server rules**: only GET/HEAD allowed, dotfiles and `.git` hidden, directory listing off, PHP/WordPress probes and known scanner bots refused.
- **In the code**: user-supplied text (file names, inputs) is always written with `textContent`, never as HTML; files are checked by their real signature, not just the extension; file size and count limits stop a tab from freezing.

## Reporting a problem

Email hello@shaikhismail.com. Please do not open a public issue for a security problem.
