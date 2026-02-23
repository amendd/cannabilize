@echo off
cd /d "%~dp0"
echo.
echo ========================================
echo   ORGANIZANDO ARQUIVOS
echo ========================================
echo.

:: Criar pastas de organização
if not exist "scripts" mkdir "scripts"
if not exist "docs" mkdir "docs"

echo [1/3] Movendo scripts .bat para pasta scripts...
for %%f in (*.bat) do (
    if not "%%f"=="EXECUTAR.bat" (
        if not "%%f"=="ORGANIZAR_ARQUIVOS.bat" (
            if not "%%f"=="CENTRALIZAR_PROJETO.bat" (
                echo Movendo: %%f
                move "%%f" "scripts\" >nul 2>&1
            )
        )
    )
)
echo [OK] Scripts organizados
echo.

echo [2/3] Movendo documentacao para pasta docs...
for %%f in (*.md) do (
    if not "%%f"=="README_INICIO_RAPIDO.md" (
        echo Movendo: %%f
        move "%%f" "docs\" >nul 2>&1
    )
)
for %%f in (*.txt) do (
    echo Movendo: %%f
    move "%%f" "docs\" >nul 2>&1
)
echo [OK] Documentacao organizada
echo.

echo [3/3] Estrutura finalizada!
echo.
echo Estrutura:
echo   - EXECUTAR.bat (arquivo principal)
echo   - scripts/ (outros scripts)
echo   - docs/ (documentacao)
echo.
pause
