@echo off
chcp 65001 >nul
title Conexão VPS ClickCannabis

REM ============================================
REM Edite a linha abaixo: troque SEU_IP pelo IP real da sua VPS (ex.: 123.45.67.89)
REM NÃO coloque a senha aqui. O SSH vai pedir a senha quando você conectar.
REM ============================================
set VPS_IP=5.189.168.66

if "%VPS_IP%"=="SEU_IP" (
    echo.
    echo Ainda nao configurado: abra o arquivo CONECTAR_VPS.bat e troque SEU_IP pelo IP da sua VPS.
    echo.
    pause
    exit /b 1
)

echo Conectando a root@%VPS_IP% ...
echo Digite a senha quando o SSH pedir.
echo.
ssh root@%VPS_IP%

pause
