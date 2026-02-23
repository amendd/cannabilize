@echo off
echo ========================================
echo   CORRIGINDO ERRO DE PERMISSAO PRISMA
echo ========================================
echo.

echo IMPORTANTE: Feche o servidor (Ctrl+C) e o Cursor/VS Code antes de continuar!
echo.
pause

echo.
echo [1/4] Limpando cache do Prisma...
if exist "node_modules\.prisma" (
    echo Removendo pasta .prisma...
    rmdir /s /q "node_modules\.prisma" 2>nul
    echo Pasta removida!
) else (
    echo Pasta .prisma nao encontrada, continuando...
)

echo.
echo [2/4] Limpando node_modules do Prisma...
if exist "node_modules\@prisma" (
    echo Removendo @prisma...
    rmdir /s /q "node_modules\@prisma" 2>nul
    echo Removido!
) else (
    echo @prisma nao encontrado, continuando...
)

echo.
echo [3/4] Reinstalando Prisma...
call npm install @prisma/client --save
if %errorlevel% neq 0 (
    echo ERRO ao reinstalar Prisma!
    pause
    exit /b 1
)

echo.
echo [4/4] Gerando Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo.
    echo ERRO ainda persiste!
    echo.
    echo Tente:
    echo   1. Fechar TODOS os processos Node.js (Task Manager)
    echo   2. Executar este script como Administrador
    echo   3. Desabilitar temporariamente o antivirus
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCESSO! PRISMA CLIENT GERADO
echo ========================================
echo.
echo Agora execute: CRIAR_TABELAS.bat
echo.
pause
