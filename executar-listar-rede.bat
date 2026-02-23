@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0listar-dispositivos-rede.ps1"
pause
