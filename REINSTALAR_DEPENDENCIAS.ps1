# Reinstalação limpa - corrige node_modules corrompido (ENOENT / framer-motion etc)
# Execute: clique direito -> Executar com PowerShell (ou no terminal: .\REINSTALAR_DEPENDENCIAS.ps1)

Set-Location $PSScriptRoot

Write-Host "Parando processos Node que possam travar arquivos..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Removendo node_modules..." -ForegroundColor Yellow
if (Test-Path node_modules) {
    Remove-Item -Recurse -Force node_modules
    Write-Host "node_modules removido." -ForegroundColor Green
} else {
    Write-Host "node_modules nao encontrado, ok." -ForegroundColor Gray
}

Write-Host "Limpando cache do npm..." -ForegroundColor Yellow
npm cache clean --force 2>$null

Write-Host "Instalando dependencias (aguarde, pode demorar)..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nPronto. Rode: npm run dev" -ForegroundColor Green
} else {
    Write-Host "`nAlgo falhou no npm install. Tente rodar npm install de novo." -ForegroundColor Red
}
