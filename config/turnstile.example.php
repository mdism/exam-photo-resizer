<?php
// Copy this file to turnstile.php and put your real Turnstile secret in it.
// NEVER commit turnstile.php (it is in .gitignore) and never put the secret in public/.
//
// On MilesWeb, upload the filled-in file to (outside public_html, shared by all the tools):
//   /home/qyotupjl/.config/shaikhismail-tools/turnstile.php
// and set its permissions to 600.
return [
    'secret' => 'PUT-YOUR-TURNSTILE-SECRET-HERE',
    'allowed_hostname_suffix' => 'shaikhismail.com',
    // For local testing with Cloudflare's test keys only:
    // 'secret' => '1x0000000000000000000000000000000AA',
    // 'allow_localhost' => true,
];
