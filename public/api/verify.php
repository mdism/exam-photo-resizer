<?php
/*
 * Cloudflare Turnstile check for the shaikhismail.com free tools.
 * The page sends the widget's token here; we ask Cloudflare if it is real and answer {"ok": true|false}.
 * Nothing is stored or logged. The secret lives OUTSIDE the website folder (see config/turnstile.example.php).
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function reply(int $status, bool $ok, string $error = ''): void {
    http_response_code($status);
    echo json_encode($error === '' ? ['ok' => $ok] : ['ok' => $ok, 'error' => $error]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') reply(405, false, 'method');

// Same-site requests only: the browser always sends Origin on a POST from fetch().
$host   = $_SERVER['HTTP_HOST'] ?? '';
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$o      = parse_url($origin);
$oHost  = is_array($o) ? ($o['host'] ?? '') . (isset($o['port']) ? ':' . $o['port'] : '') : '';
if ($origin === '' || $oHost !== $host) reply(403, false, 'origin');

// Config: first the private file outside public_html, then an environment variable.
$config = [];
foreach ([
    getenv('TURNSTILE_CONFIG') ?: '',
    dirname(__DIR__, 2) . '/config/turnstile.php',                 // repo layout: config/ next to public/ (local dev)
    ($_SERVER['HOME'] ?? getenv('HOME') ?: '') . '/.config/shaikhismail-tools/turnstile.php', // on the server
] as $file) {
    if ($file !== '' && is_readable($file)) { $config = (array) require $file; break; }
}
$secret    = $config['secret'] ?? (getenv('TURNSTILE_SECRET') ?: '');
$verifyUrl = $config['verify_url'] ?? 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
$hosts     = $config['allowed_hostname_suffix'] ?? 'shaikhismail.com';
if ($secret === '') reply(500, false, 'not configured');

$body  = json_decode((string) file_get_contents('php://input', false, null, 0, 4096), true);
$token = is_array($body) ? (string) ($body['token'] ?? '') : '';
if ($token === '' || strlen($token) > 2048) reply(400, false, 'token');

$ch = curl_init($verifyUrl);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => http_build_query(['secret' => $secret, 'response' => $token]), // no visitor IP is sent
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 8,
    CURLOPT_CONNECTTIMEOUT => 4,
]);
$raw = curl_exec($ch);
curl_close($ch);
$res = is_string($raw) ? json_decode($raw, true) : null;
if (!is_array($res)) reply(502, false, 'upstream');

$okHost = isset($res['hostname']) && (
    $res['hostname'] === $hosts || str_ends_with((string) $res['hostname'], '.' . $hosts) ||
    (in_array($res['hostname'], ['localhost', '127.0.0.1'], true) && ($config['allow_localhost'] ?? false))
);
reply(200, ($res['success'] ?? false) === true && $okHost);
