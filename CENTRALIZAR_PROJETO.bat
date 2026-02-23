@echo off
chcp 65001 >nul
title Centralizando Projeto Click Cannabis
color 0B

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║     CENTRALIZANDO PROJETO EM UMA UNICA PASTA           ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

set "PASTA_DESTINO=C:\Users\Gabriel\clickcannabis-replica"
set "PASTA_ORIGEM1=C:\Users\Gabriel\OneDrive\Documentos\click"
set "PASTA_ORIGEM2=C:\Users\Gabriel\OneDrive\Documentos\clickcannabis-replica"

echo [1/4] Verificando pasta de destino...
if not exist "%PASTA_DESTINO%" (
    echo Criando pasta de destino...
    mkdir "%PASTA_DESTINO%"
)
echo [OK] Pasta de destino: %PASTA_DESTINO%
echo.

echo [2/4] Copiando arquivos da pasta click...
if exist "%PASTA_ORIGEM1%" (
    echo Copiando arquivos de: %PASTA_ORIGEM1%
    xcopy "%PASTA_ORIGEM1%\*" "%PASTA_DESTINO%\" /Y /E /I /Q >nul 2>&1
    echo [OK] Arquivos copiados
) else (
    echo [AVISO] Pasta nao encontrada: %PASTA_ORIGEM1%
)
echo.

echo [3/4] Copiando arquivos da pasta clickcannabis-replica (OneDrive)...
if exist "%PASTA_ORIGEM2%" (
    echo Copiando arquivos de: %PASTA_ORIGEM2%
    xcopy "%PASTA_ORIGEM2%\*" "%PASTA_DESTINO%\" /Y /E /I /Q >nul 2>&1
    echo [OK] Arquivos copiados
) else (
    echo [AVISO] Pasta nao encontrada: %PASTA_ORIGEM2%
)
echo.

echo [4/4] Organizando arquivos...
cd /d "%PASTA_DESTINO%"

:: Criar pasta de scripts se nao existir
if not exist "scripts" mkdir "scripts"

:: Mover scripts .bat para pasta scripts (exceto o principal)
for %%f in (*.bat) do (
    if not "%%f"=="CENTRALIZAR_PROJETO.bat" (
        if not "%%f"=="EXECUTAR.bat" (
            move "%%f" "scripts\" >nul 2>&1
        )
    )
)

:: Criar pasta de documentacao
if not exist "docs" mkdir "docs"

:: Mover arquivos .md para pasta docs
for %%f in (*.md) do (
    move "%%f" "docs\" >nul 2>&1
)

:: Mover arquivos .txt para pasta docs
for %%f in (*.txt) do (
    move "%%f" "docs\" >nul 2>&1
)

echo [OK] Arquivos organizados
echo.

cls
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║              ✅ CENTRALIZAÇÃO CONCLUÍDA!                 ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo 📁 Pasta centralizada:
echo    %PASTA_DESTINO%
echo.
echo 📂 Estrutura organizada:
echo    ├── app/              (aplicação)
echo    ├── components/       (componentes)
echo    ├── lib/              (bibliotecas)
echo    ├── prisma/           (banco de dados)
echo    ├── scripts/          (scripts .bat)
echo    └── docs/             (documentação)
echo.
echo 🚀 Para executar o projeto:
echo    1. Vá para: %PASTA_DESTINO%
echo    2. Execute: EXECUTAR.bat
echo.
echo ═══════════════════════════════════════════════════════════
echo.

pause
