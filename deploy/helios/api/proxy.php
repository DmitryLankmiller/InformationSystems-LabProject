<?php

// These paths must match frontend-prototyp/.env.helios and Payara's --port.
$publicPrefix = '/~s373305/is/api/';
$upstream = 'http://127.0.0.1:18080/api/';

function fail($status, $message)
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(['code' => 'PROXY_ERROR', 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (!is_string($path) || ($path !== rtrim($publicPrefix, '/') && !str_starts_with($path, $publicPrefix))) {
    fail(404, 'Ресурс не найден.');
}

$resource = $path === rtrim($publicPrefix, '/') ? '' : substr($path, strlen($publicPrefix));
$pathToCheck = $resource;
do {
    $previousPath = $pathToCheck;
    $pathToCheck = rawurldecode($pathToCheck);
    if (
        str_contains($pathToCheck, '\\')
        || preg_match('~[\x00-\x1F\x7F]~', $pathToCheck)
        || preg_match('~(?:^|/)\.{1,2}(?:/|;|$)~', $pathToCheck)
    ) {
        fail(400, 'Некорректный путь запроса.');
    }
} while ($pathToCheck !== $previousPath);

$query = $_SERVER['QUERY_STRING'] ?? '';
$url = $upstream . $resource . ($query !== '' ? '?' . $query : '');
$incoming = array_change_key_case(getallheaders(), CASE_LOWER);
$contentType = $incoming['content-type'] ?? ($_SERVER['CONTENT_TYPE'] ?? '');
$authorization = $incoming['authorization']
    ?? $_SERVER['HTTP_AUTHORIZATION']
    ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
    ?? null;
if ($authorization === null && isset($_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW'])) {
    $authorization = 'Basic ' . base64_encode($_SERVER['PHP_AUTH_USER'] . ':' . $_SERVER['PHP_AUTH_PW']);
}

$requestBody = file_get_contents('php://input');
if ($requestBody === false) {
    fail(400, 'Не удалось прочитать запрос.');
}

// PHP normally consumes multipart POST bodies and puts uploaded files in $_FILES.
// Rebuild our single-file form instead of forwarding an empty php://input.
if (stripos($contentType, 'multipart/form-data') === 0) {
    $file = $_FILES['import_csv'] ?? null;
    if (is_array($file)) {
        $error = $file['error'] ?? UPLOAD_ERR_NO_FILE;
        if (in_array($error, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
            fail(413, 'CSV-файл превышает допустимый размер загрузки.');
        }
        if ($error !== UPLOAD_ERR_OK || !is_string($file['tmp_name'] ?? null) || !is_uploaded_file($file['tmp_name'])) {
            fail(400, 'Не удалось загрузить CSV-файл.');
        }
        $contents = file_get_contents($file['tmp_name']);
        if ($contents === false) {
            fail(400, 'Не удалось прочитать CSV-файл.');
        }
        $filename = addcslashes(str_replace(["\r", "\n"], '', basename($file['name'])), "\\\"");
        $boundary = 'cityspace-' . bin2hex(random_bytes(16));
        $contentType = 'multipart/form-data; boundary=' . $boundary;
        $requestBody = '--' . $boundary . "\r\n"
            . 'Content-Disposition: form-data; name="import_csv"; filename="' . $filename . "\"\r\n"
            . "Content-Type: text/csv\r\n\r\n"
            . $contents . "\r\n--" . $boundary . "--\r\n";
    } elseif ($requestBody === '') {
        fail(400, 'CSV-файл не получен. Проверьте формат и ограничение размера загрузки на сервере.');
    }
}

$requestHeaders = ['Connection: close'];
if (isset($incoming['accept'])) {
    $requestHeaders[] = 'Accept: ' . $incoming['accept'];
}
if ($contentType !== '') {
    $requestHeaders[] = 'Content-Type: ' . $contentType;
}
if ($authorization !== null) {
    $requestHeaders[] = 'Authorization: ' . $authorization;
}

$context = stream_context_create([
    'http' => [
        'method' => $_SERVER['REQUEST_METHOD'],
        'header' => $requestHeaders,
        'content' => $requestBody,
        'timeout' => 20,
        'ignore_errors' => true,
        'follow_location' => 0,
    ],
]);

$responseBody = @file_get_contents($url, false, $context);
if ($responseBody === false) {
    error_log('Cityspace: Payara upstream unavailable');
    fail(502, 'Сервер приложения недоступен.');
}

$status = 502;
foreach ($http_response_header ?? [] as $line) {
    if (preg_match('~^HTTP/\S+\s+(\d{3})~', $line, $matches)) {
        $status = (int) $matches[1];
    } elseif (preg_match('~^(Content-Type|Location|Allow|WWW-Authenticate|Cache-Control):\s*(.*)$~i', $line, $matches)) {
        $name = $matches[1];
        $value = $matches[2];
        if (strtolower($name) === 'location') {
            foreach ([rtrim($upstream, '/'), '/api'] as $prefix) {
                if (
                    $value === $prefix
                    || str_starts_with($value, $prefix . '/')
                    || str_starts_with($value, $prefix . '?')
                    || str_starts_with($value, $prefix . '#')
                ) {
                    $value = rtrim($publicPrefix, '/') . substr($value, strlen($prefix));
                    break;
                }
            }
        }
        header($name . ': ' . $value);
    }
}

http_response_code($status);
echo $responseBody;
