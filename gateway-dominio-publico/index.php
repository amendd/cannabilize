<?php
/**
 * Gateway de domínio público – proxy reverso simples.
 * Quem acessa este domínio vê o conteúdo do túnel sem a URL do túnel na barra de endereço.
 * Requer PHP com allow_url_fopen ou cURL.
 */

$configFile = __DIR__ . '/config.php';
if (is_file($configFile)) {
    require $configFile;
}
if (!defined('TUNNEL_URL') || !TUNNEL_URL || strpos(TUNNEL_URL, 'SEU-TUNEL') !== false) {
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Configuração</title></head><body>';
    echo '<p>Configure a URL do túnel em <code>config.php</code> (constante <code>TUNNEL_URL</code>).</p>';
    echo '</body></html>';
    exit;
}

set_time_limit(90);  // arquivos estáticos (JS/CSS) podem demorar
$base = rtrim(TUNNEL_URL, '/');
$path = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '/';
$path = preg_replace('/\?.*$/', '', $path);
$path = '/' . ltrim(preg_replace('#/+#', '/', $path), '/');  // normaliza barras (evita // → 500)
$url = $base . $path;
if (!empty($_SERVER['QUERY_STRING'])) {
    $url .= '?' . $_SERVER['QUERY_STRING'];
}

$headers = [
    'ngrok-skip-browser-warning: true',  // evita a página de aviso do ngrok (interstitial)
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];
foreach ($_SERVER as $k => $v) {
    if (strpos($k, 'HTTP_') === 0 && $k !== 'HTTP_HOST') {
        $name = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($k, 5)))));
        $headers[] = $name . ': ' . $v;
    }
}

$postBody = ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') ? file_get_contents('php://input') : null;

$trySslVersions = [CURL_SSLVERSION_TLSv1_2, CURL_SSLVERSION_DEFAULT];
$response = false;
$err = '';
$info = [];

foreach ($trySslVersions as $sslVer) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 5,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_SSLVERSION => $sslVer,
        CURLOPT_HEADER => true,
        CURLOPT_NOBODY => $_SERVER['REQUEST_METHOD'] === 'HEAD',
        CURLOPT_CUSTOMREQUEST => $_SERVER['REQUEST_METHOD'],
        CURLOPT_ENCODING => '',
        CURLOPT_HTTPHEADER => $headers,
    ]);
    if ($postBody !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postBody);
    }
    $response = curl_exec($ch);
    $err = curl_error($ch);
    $info = curl_getinfo($ch);
    curl_close($ch);
    if (!$err) {
        break;
    }
}

if ($err) {
    $testUrl = $base . $path . (!empty($_SERVER['QUERY_STRING']) ? '?' . $_SERVER['QUERY_STRING'] : '');
    header('HTTP/1.1 502 Bad Gateway');
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Erro de túnel</title></head><body>';
    echo '<h1>Não foi possível conectar ao túnel</h1>';
    echo '<p><strong>Erro:</strong> ', htmlspecialchars($err), '</p>';
    if (strpos($err, 'SSL_ERROR_ZERO_RETURN') !== false) {
        echo '<p><strong>Esse erro quase sempre significa:</strong> o ngrok não está rodando <strong>ou</strong> a URL do túnel mudou (no plano grátis a URL muda cada vez que você inicia o ngrok).</p>';
    }
    echo '<p><strong>URL configurada no gateway:</strong> <code>', htmlspecialchars($base), '</code></p>';
    echo '<p><strong>O que fazer:</strong></p><ul>';
    echo '<li>No PC onde roda o Next.js, abra um terminal e execute <code>ngrok http 3000</code> (e deixe aberto).</li>';
    echo '<li>Copie a <strong>nova URL</strong> que o ngrok mostrar e atualize <code>TUNNEL_URL</code> em <code>config.php</code> no servidor do domínio.</li>';
    echo '<li>Teste no navegador: <a href="' . htmlspecialchars($testUrl, ENT_QUOTES, 'UTF-8') . '" target="_blank" rel="noopener">' . htmlspecialchars($testUrl) . '</a> — se não abrir, o túnel está parado ou a URL está errada.</li>';
    echo '</ul></body></html>';
    exit;
}

$headerSize = $info['header_size'];
$respHeaders = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

// Repassa o status HTTP do túnel (ex.: 200, 404, 500)
$firstLine = strtok($respHeaders, "\r\n");
if (preg_match('/^HTTP\/[\d.]+\s+(\d+)/', $firstLine, $m)) {
    $code = (int) $m[1];
    if ($code >= 100 && $code < 600) {
        http_response_code($code);
    }
}

$contentType = '';
foreach (explode("\r\n", $respHeaders) as $line) {
    if (stripos($line, 'Content-Type:') === 0) {
        $contentType = trim(substr($line, strpos($line, ':') + 1));
        break;
    }
}

$isHtml = (stripos($contentType, 'text/html') !== false);
$baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? '') . '/';

foreach (explode("\r\n", $respHeaders) as $line) {
    $line = trim($line);
    if ($line === '') continue;
    if (preg_match('/^HTTP\/[\d.]+\s+\d+/', $line)) continue;  // já tratamos o status acima
    if (stripos($line, 'Transfer-Encoding:') === 0) continue;
    if (stripos($line, 'Content-Length:') === 0) continue;
    if (stripos($line, 'Content-Encoding:') === 0) continue;
    if (stripos($line, 'Set-Cookie:') === 0) {
        $line = preg_replace('/domain=[^;]+/i', 'domain=', $line);
        $line = preg_replace('/path=[^;]+/i', 'path=/', $line);
    }
    header($line);
}

if ($isHtml && $path === '/' && $body !== '') {
    $baseUrlSafe = rtrim($baseUrl, '/');
    $body = preg_replace('/<head(\s[^>]*)?>/i', '<head$1><base href="' . htmlspecialchars($baseUrl, ENT_QUOTES, 'UTF-8') . '">', $body, 1);
    $body = preg_replace_callback('/(href|src)=(["\'])(?!https?:|\/\/|#|data:)([^"\']*)\2/i', function ($m) use ($baseUrlSafe) {
        $path = $m[3];
        $url = $baseUrlSafe . (strlen($path) > 0 && $path[0] === '/' ? $path : '/' . $path);
        return $m[1] . '=' . $m[2] . $url . $m[2];
    }, $body);
}
// Garante que HTML seja renderizado (não exibido como texto)
if ($isHtml && $contentType === '') {
    $contentType = 'text/html; charset=utf-8';
}
header('Content-Type: ' . ($contentType ?: 'application/octet-stream'));
if ($_SERVER['REQUEST_METHOD'] !== 'HEAD') {
    echo $body;
}
