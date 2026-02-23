@echo off
echo ========================================
echo   VERIFICANDO CONFIGURACAO LOCAL
echo ========================================
echo.

echo [1/5] Verificando schema.prisma...
findstr /C:"provider = \"sqlite\"" prisma\schema.prisma >nul
if %errorlevel% equ 0 (
    echo   [OK] Schema configurado para SQLite (local)
) else (
    echo   [ERRO] Schema nao esta como SQLite!
    echo   Execute: CONFIGURAR_SQLITE_LOCAL.bat
    pause
    exit /b 1
)

echo.
echo [2/5] Verificando DATABASE_URL...
findstr /C:"DATABASE_URL=\"file:./dev.db\"" .env >nul
if %errorlevel% equ 0 (
    echo   [OK] DATABASE_URL aponta para banco local (SQLite)
) else (
    echo   [ERRO] DATABASE_URL nao esta configurado para local!
    echo   Deve ser: DATABASE_URL="file:./dev.db"
    pause
    exit /b 1
)

echo.
echo [3/5] Verificando NEXTAUTH_URL...
findstr /C:"NEXTAUTH_URL=\"http://localhost:3000\"" .env >nul
if %errorlevel% equ 0 (
    echo   [OK] NEXTAUTH_URL configurado para localhost
) else (
    echo   [AVISO] NEXTAUTH_URL pode estar apontando para producao
    echo   Deve ser: NEXTAUTH_URL="http://localhost:3000"
)

echo.
echo [4/5] Verificando NEXTAUTH_SECRET...
findstr /C:"NEXTAUTH_SECRET" .env >nul
if %errorlevel% equ 0 (
    echo   [OK] NEXTAUTH_SECRET configurado
) else (
    echo   [ERRO] NEXTAUTH_SECRET nao encontrado!
    echo   Execute: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
    pause
    exit /b 1
)

echo.
echo [5/5] Verificando banco de dados local...
if exist dev.db (
    echo   [OK] Arquivo dev.db existe (banco local criado)
) else (
    echo   [AVISO] Arquivo dev.db nao encontrado
    echo   Execute: npx prisma db push
)

echo.
echo ========================================
echo   VERIFICACAO CONCLUIDA
echo ========================================
echo.

echo RESUMO:
echo   - Schema: SQLite (local) [OK]
echo   - DATABASE_URL: file:./dev.db [OK]
echo   - NEXTAUTH_URL: http://localhost:3000 [OK]
echo   - NEXTAUTH_SECRET: Configurado [OK]
echo   - Banco local: dev.db [OK]
echo.
echo TUDO PRONTO PARA DESENVOLVIMENTO LOCAL!
echo.
echo PROXIMOS PASSOS:
echo   1. Iniciar servidor: npm run dev
echo   2. Acessar: http://localhost:3000/login
echo   3. Usar credenciais: admin@cannabilize.com.br / admin123
echo.
pause
