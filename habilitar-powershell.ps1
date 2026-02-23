# Script para habilitar execução de scripts no PowerShell
# Execute este script como Administrador

# Verificar política atual
Write-Host "Política atual de execução:" -ForegroundColor Yellow
Get-ExecutionPolicy -List

# Habilitar execução para o usuário atual
Write-Host "`nHabilitando execução de scripts para o usuário atual..." -ForegroundColor Green
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

Write-Host "`nPolítica atualizada com sucesso!" -ForegroundColor Green
Write-Host "Agora você pode executar npm run dev normalmente." -ForegroundColor Green
