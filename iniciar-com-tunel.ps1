# Inicia o projeto Next.js e o túnel ngrok juntos.
# Uso: .\iniciar-com-tunel.ps1
# Ou clique com o botão direito -> "Executar com PowerShell"

$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot

Set-Location $projectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CannabiLize - Dev + Túnel ngrok" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verifica se ngrok está disponível
$ngrokCmd = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokCmd) {
    Write-Host "ngrok nao encontrado. Instale com: npm install -g ngrok" -ForegroundColor Yellow
    Write-Host "Ou baixe em: https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Iniciando apenas o servidor (npm run dev)..." -ForegroundColor Yellow
    npm run dev
    exit
}

Write-Host "Quando o ngrok estiver rodando, em OUTRO terminal execute:" -ForegroundColor Gray
Write-Host "  .\obter-url-ngrok.ps1" -ForegroundColor Gray
Write-Host "  (mostra a URL atual para colar em gateway-dominio-publico\config.php)" -ForegroundColor Gray
Write-Host ""

# Usa concurrently se estiver instalado, senao abre dois processos
$hasConcurrently = Test-Path (Join-Path $projectRoot "node_modules\concurrently")
if ($hasConcurrently) {
    Write-Host "Iniciando Next.js + ngrok (Ctrl+C encerra os dois)..." -ForegroundColor Green
    Write-Host ""
    npm run dev:tunnel
} else {
    Write-Host "Instalando 'concurrently' para rodar os dois juntos..." -ForegroundColor Yellow
    npm install --save-dev concurrently
    Write-Host ""
    Write-Host "Iniciando Next.js + ngrok..." -ForegroundColor Green
    npm run dev:tunnel
}
