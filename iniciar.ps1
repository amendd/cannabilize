# Script para iniciar o servidor de desenvolvimento
# Execute: .\iniciar.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CANNABILIZE - INICIAR SERVIDOR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está na pasta correta
if (-not (Test-Path "package.json")) {
    Write-Host "[ERRO] package.json não encontrado!" -ForegroundColor Red
    Write-Host "Você está na pasta correta?" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "[OK] Projeto encontrado!" -ForegroundColor Green
Write-Host ""

# Verificar Node.js
Write-Host "Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERRO] Node.js não está instalado!" -ForegroundColor Red
    Write-Host "Baixe e instale de: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}
Write-Host ""

# Verificar dependências
Write-Host "Verificando dependências..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "[AVISO] Dependências não encontradas!" -ForegroundColor Yellow
    Write-Host "Instalando dependências..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Tentando com --legacy-peer-deps..." -ForegroundColor Yellow
        npm install --legacy-peer-deps
    }
} else {
    Write-Host "[OK] Dependências encontradas" -ForegroundColor Green
}
Write-Host ""

# Verificar porta 3000
Write-Host "Verificando porta 3000..." -ForegroundColor Yellow
$portInUse = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "[AVISO] Porta 3000 está em uso!" -ForegroundColor Yellow
    Write-Host "Deseja tentar liberar automaticamente? (S/N)" -ForegroundColor Yellow
    $response = Read-Host "> "
    if ($response -eq "S" -or $response -eq "s") {
        $process = Get-Process -Id $portInUse.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Encerrando processo $($process.Id)..." -ForegroundColor Yellow
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
    }
} else {
    Write-Host "[OK] Porta 3000 está livre" -ForegroundColor Green
}
Write-Host ""

# Iniciar servidor
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   INICIANDO SERVIDOR..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Aguarde aparecer: 'Local: http://localhost:3000'" -ForegroundColor Yellow
Write-Host ""
Write-Host "ENTÃO abra o navegador em: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Para parar o servidor, pressione Ctrl+C" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Iniciar servidor
npm run dev
