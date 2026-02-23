# Conexão SSH para a VPS ClickCannabis
# NÃO coloque a senha aqui. O SSH pede a senha ao conectar.

$VPS_IP = "5.189.168.66"

Write-Host ""
Write-Host "Conectando a root@$VPS_IP ..." -ForegroundColor Cyan
Write-Host "Digite a senha quando o SSH pedir." -ForegroundColor Yellow
Write-Host ""

ssh root@$VPS_IP
