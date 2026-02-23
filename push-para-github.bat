@echo off
chcp 65001 >nul
echo ========================================
echo   Enviar codigo para o GitHub
echo ========================================
echo.

cd /d "%~dp0"

where git >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Git nao encontrado. Instale o Git: https://git-scm.com/download/win
    pause
    exit /b 1
)

if not exist .git (
    echo Inicializando repositorio...
    git init
    echo.
)

git remote remove origin 2>nul
git remote add origin https://github.com/amendd/cannabilis.git
echo Remote 'origin' configurado para amendd/cannabilis
echo.

echo Adicionando arquivos...
git add .
echo.

echo Fazendo commit...
git commit -m "Deploy: Next.js + Supabase + Vercel" 2>nul
if errorlevel 1 (
    echo Nenhuma alteracao para commitar, ou commit ja existe.
) else (
    echo Commit criado.
)
echo.

echo Enviando para GitHub (branch main)...
git branch -M main
git push -u origin main

if errorlevel 1 (
    echo.
    echo Se o GitHub pedir usuario/senha, use:
    echo - Usuario: seu usuario GitHub
    echo - Senha: um Personal Access Token ^(Settings - Developer settings - Personal access tokens^)
    echo.
)
pause
