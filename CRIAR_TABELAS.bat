@echo off
echo ========================================
echo   CRIANDO TABELAS NO BANCO DE DADOS
echo ========================================
echo.

echo IMPORTANTE: Se der erro de permissao (EPERM):
echo   1. Feche o servidor (Ctrl+C)
echo   2. Feche o Cursor/VS Code temporariamente
echo   3. Execute: CORRIGIR_PERMISSAO_PRISMA.bat
echo   4. Depois execute este script novamente
echo.
pause

echo.
echo [1/3] Gerando Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo.
    echo ERRO ao gerar Prisma Client!
    echo.
    echo Se o erro for EPERM (permissao):
    echo   1. Feche o servidor e o Cursor/VS Code
    echo   2. Execute: CORRIGIR_PERMISSAO_PRISMA.bat
    echo   3. Depois execute este script novamente
    echo.
    pause
    exit /b 1
)

echo.
echo [2/3] Criando tabelas no banco...
echo IMPORTANTE: Isso vai criar todas as tabelas necessarias
echo.
call npx prisma db push
if %errorlevel% neq 0 (
    echo.
    echo ERRO ao criar tabelas!
    echo.
    echo Verifique:
    echo   1. A DATABASE_URL no .env esta correta?
    echo   2. O banco de dados esta acessivel?
    echo   3. A conexao com a internet esta funcionando?
    echo.
    pause
    exit /b 1
)

echo.
echo [3/3] Criando usuarios de teste...
call npx tsx criar-usuarios.ts
if %errorlevel% neq 0 (
    echo.
    echo ERRO ao criar usuarios!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCESSO! TABELAS CRIADAS
echo ========================================
echo.
echo CREDENCIAIS PARA LOGIN:
echo.
echo   Admin: admin@cannabilize.com.br / admin123
echo   Medico: doctor@cannabilize.com.br / doctor123
echo   Paciente: paciente@cannabilize.com.br / paciente123
echo.
echo Agora voce pode fazer login em: http://localhost:3000/login
echo.
pause
