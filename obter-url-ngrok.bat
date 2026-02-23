@echo off
REM Mostra a URL atual do ngrok (execute com o ngrok ja rodando).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0obter-url-ngrok.ps1"
pause
