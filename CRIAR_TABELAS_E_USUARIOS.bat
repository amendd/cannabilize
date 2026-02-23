@echo off
echo ========================================
echo   CRIANDO TABELAS E USUARIOS
echo ========================================
echo.

echo [1/4] Gerando Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERRO ao gerar Prisma Client!
    pause
    exit /b 1
)

echo.
echo [2/4] Criando tabelas no banco de dados...
echo IMPORTANTE: Isso vai criar todas as tabelas necessarias
call npx prisma db push
if %errorlevel% neq 0 (
    echo.
    echo ERRO ao criar tabelas!
    echo Verifique:
    echo   1. A DATABASE_URL no .env esta correta?
    echo   2. O banco de dados esta acessivel?
    echo   3. A conexao com a internet esta funcionando?
    pause
    exit /b 1
)

echo.
echo [3/4] Criando usuarios de teste...
call npx tsx criar-usuarios.ts
if %errorlevel% neq 0 (
    echo.
    echo ERRO ao criar usuarios!
    pause
    exit /b 1
)

echo.
echo [4/4] Verificando usuarios criados...
call npx tsx verificar-usuarios.ts

echo.
echo ========================================
echo   CONCLUIDO!
echo ========================================
echo.
echo CREDENCIAIS PARA LOGIN:
echo.
echo   Admin:
echo     Email: admin@cannabilize.com.br
echo     Senha: admin123
echo.
echo   Medico:
echo     Email: doctor@cannabilize.com.br
echo     Senha: doctor123
echo.
echo   Paciente:
echo     Email: paciente@cannabilize.com.br
echo     Senha: paciente123
echo.
echo ========================================
echo.
echo PROXIMOS PASSOS:
echo   1. Certifique-se de que o servidor esta rodando: npm run dev
echo   2. Acesse: http://localhost:3000/login
echo   3. Use uma das credenciais acima
echo.
pause
