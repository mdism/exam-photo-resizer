# Changelog

## 1.2.0 — 2026-10-27
- Cloudflare Turnstile bot check before the tool unlocks, verified on the server (api/verify.php); the secret stays outside the repo
- Version number in the footer, linking to this changelog; scripts/bump_version.py for releases
- Privacy notice and policy now say anything held for processing is temporary and deleted afterwards, and explain Turnstile

## 1.1.0 — 2026-10-27
- Clear "nothing is saved" notice on the page, plus a privacy policy (privacy.html, PRIVACY.md)
- Security: strict Content Security Policy, HTTPS + HSTS, clickjacking and sniffing protection, bot and scanner blocking (.htaccess)
- Font is now self-hosted, so no request goes to Google
- Files are checked by signature, with size and count limits; user text is never rendered as HTML

## 1.0.0 — 2026-10-27
- First release of Exam Photo Resizer at https://photo.shaikhismail.com
