@echo off
echo ========================================
echo Corrigindo Prisma Client
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Gerando Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ERRO ao gerar Prisma Client!
    pause
    exit /b 1
)

echo.
echo [2/3] Atualizando banco de dados...
call npx prisma db push
if errorlevel 1 (
    echo ERRO ao atualizar banco de dados!
    pause
    exit /b 1
)

echo.
echo [3/3] Verificando modelos...
call npx prisma studio --browser none
if errorlevel 1 (
    echo Aviso: Prisma Studio nao pode ser iniciado, mas isso e normal.
)

echo.
echo ========================================
echo Prisma Client corrigido com sucesso!
echo ========================================
echo.
echo IMPORTANTE: Reinicie o servidor Next.js!
echo.
pause
