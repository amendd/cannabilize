@echo off
cd /d "%~dp0"
echo.
echo ========================================
echo   CRIAR USUARIOS NO BANCO DE DADOS
echo ========================================
echo.
echo Criando usuarios admin e medico...
echo.

npx tsx criar-usuarios.ts

echo.
echo Pressione qualquer tecla para fechar...
pause >nul
