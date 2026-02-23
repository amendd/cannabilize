# Obtém a URL atual do túnel ngrok (quando ngrok está rodando).
# Uso: .\obter-url-ngrok.ps1
# Execute com o ngrok já em execução (ex.: após npm run dev:tunnel ou ngrok http 3000).

$ErrorActionPreference = "Stop"
$api = "http://127.0.0.1:4040/api/tunnels"

try {
    $resp = Invoke-RestMethod -Uri $api -Method Get -ErrorAction Stop
} catch {
    Write-Host ""
    Write-Host "Nao foi possivel conectar ao ngrok (127.0.0.1:4040)." -ForegroundColor Red
    Write-Host "Certifique-se de que o ngrok esta rodando (ex.: npm run dev:tunnel ou ngrok http 3000)." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

$tunnels = $resp.tunnels
if (-not $tunnels -or $tunnels.Count -eq 0) {
    Write-Host "Nenhum tunel ativo no ngrok." -ForegroundColor Red
    exit 1
}

# Preferir HTTPS
$url = $null
foreach ($t in $tunnels) {
    if ($t.public_url -match '^https://') {
        $url = $t.public_url.TrimEnd('/')
        break
    }
}
if (-not $url) {
    $url = $tunnels[0].public_url.TrimEnd('/')
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  URL atual do tunel ngrok" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  $url" -ForegroundColor Green
Write-Host ""
Write-Host "Copie a linha abaixo para gateway-dominio-publico/config.php (constante TUNNEL_URL):" -ForegroundColor Yellow
Write-Host ""
Write-Host "  define('TUNNEL_URL', '$url');" -ForegroundColor White
Write-Host ""
Write-Host "Se o gateway esta na hospedagem do dominio, edite o config.php la com essa URL." -ForegroundColor Gray
Write-Host ""
