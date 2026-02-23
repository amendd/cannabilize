@echo off
cd /d "%~dp0"
echo.
echo Envio para multiplos IPs com volume de dados
echo Exemplo IPs: 192.168.1.10,192.168.1.11,192.168.1.12
echo Exemplo tamanho: 1024 (bytes), 1048576 (1 MB)
echo.
set /p IPs="IP(s) de destino (separados por virgula): "
if "%IPs%"=="" goto fim
set /p TAM="Tamanho do corpo em bytes (0 = usar dados abaixo): "
set /p REP="Repeticoes por IP (1 = uma vez): "
if "%REP%"=="" set REP=1
if "%TAM%"=="" set TAM=0
set /p DADOS="Dados/JSON (Enter para vazio ou payload padrao): "

if "%DADOS%"=="" (
    if "%TAM%"=="0" (
        powershell -ExecutionPolicy Bypass -File "%~dp0enviar-dados-ip.ps1" -Ip %IPs% -Repeticoes %REP%
    ) else (
        powershell -ExecutionPolicy Bypass -File "%~dp0enviar-dados-ip.ps1" -Ip %IPs% -TamanhoBytes %TAM% -Repeticoes %REP% -Dados " "
    )
) else (
    if "%TAM%"=="0" (
        powershell -ExecutionPolicy Bypass -File "%~dp0enviar-dados-ip.ps1" -Ip %IPs% -Repeticoes %REP% -Dados "%DADOS%"
    ) else (
        powershell -ExecutionPolicy Bypass -File "%~dp0enviar-dados-ip.ps1" -Ip %IPs% -TamanhoBytes %TAM% -Repeticoes %REP% -Dados "%DADOS%"
    )
)
:fim
pause
