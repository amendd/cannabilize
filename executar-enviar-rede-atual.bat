@echo off
cd /d "%~dp0"
echo.
echo Enviando para 192.168.1.33, 192.168.1.49, 192.168.1.143
echo Tamanho: 10000 bytes ^| 100.000 repeticoes por IP ^| paralelo 10000
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0enviar-dados-rede-atual.ps1"
pause
