@echo off
echo ========================================
echo   SOLUCAO COMPLETA PARA PROBLEMA DE LOGIN
echo ========================================
echo.

echo [1/5] Verificando conexao com banco...
call npx tsx verificar-usuarios.ts
if %errorlevel% neq 0 (
    echo.
    echo ERRO: Nao foi possivel conectar ao banco!
    echo Verifique a DATABASE_URL no arquivo .env
    echo.
    pause
    exit /b 1
)

echo.
echo [2/5] Criando/atualizando usuarios...
call npx tsx criar-usuarios.ts
if %errorlevel% neq 0 (
    echo.
    echo ERRO: Nao foi possivel criar usuarios!
    pause
    exit /b 1
)

echo.
echo [3/5] Verificando configuracoes do NextAuth...
if not exist .env (
    echo AVISO: Arquivo .env nao encontrado!
    echo Criando arquivo .env.example...
    copy .env.example .env
    echo.
    echo IMPORTANTE: Configure as seguintes variaveis no arquivo .env:
    echo   - DATABASE_URL
    echo   - NEXTAUTH_SECRET
    echo   - NEXTAUTH_URL
    echo.
)

echo.
echo [4/5] Verificando NEXTAUTH_SECRET...
findstr /C:"NEXTAUTH_SECRET" .env >nul 2>&1
if %errorlevel% neq 0 (
    echo AVISO: NEXTAUTH_SECRET nao encontrado no .env!
    echo.
    echo Para gerar uma chave, execute:
    echo   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
    echo.
    echo Depois adicione no .env:
    echo   NEXTAUTH_SECRET="sua-chave-gerada"
    echo.
)

echo.
echo [5/5] Resumo final...
echo.
echo ========================================
echo   CREDENCIAIS PARA LOGIN:
echo ========================================
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
echo Se o login ainda nao funcionar:
echo   - Verifique se NEXTAUTH_SECRET esta no .env
echo   - Verifique se NEXTAUTH_URL esta no .env
echo   - Reinicie o servidor apos alterar o .env
echo.
pause
