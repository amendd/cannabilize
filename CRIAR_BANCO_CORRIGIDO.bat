@echo off
cd /d "%~dp0"
cls
echo.
echo ========================================
echo   CRIAR BANCO DE DADOS E DADOS
echo   (Versao Corrigida - Para Servidor)
echo ========================================
echo.

:: Verificar se servidor esta rodando na porta 3000
echo [1/4] Verificando se servidor esta rodando...
netstat -ano | findstr ":3000" >nul
if errorlevel 0 (
    echo [AVISO] Porta 3000 esta em uso!
    echo Parando processos na porta 3000...
    echo.
    
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
        echo Encerrando processo %%a...
        taskkill /PID %%a /F >nul 2>&1
    )
    
    timeout /t 3 /nobreak >nul
    echo [OK] Processos encerrados
) else (
    echo [OK] Nenhum servidor rodando
)
echo.

:: Limpar cache do Prisma
echo [2/4] Limpando cache do Prisma...
if exist "node_modules\.prisma" (
    rmdir /s /q "node_modules\.prisma" >nul 2>&1
    echo [OK] Cache limpo
) else (
    echo [OK] Nenhum cache para limpar
)
echo.

:: Gerar Prisma Client
echo [3/4] Gerando Prisma Client...
echo Aguarde, isso pode levar alguns segundos...
echo.
call npx prisma generate
if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao gerar Prisma Client
    echo.
    echo Tentando novamente apos limpar...
    timeout /t 2 /nobreak >nul
    call npx prisma generate
    if errorlevel 1 (
        echo.
        echo [ERRO] Ainda falhou. Possiveis causas:
        echo 1. Arquivo esta sendo usado por outro programa
        echo 2. Problema de permissao
        echo.
        echo SOLUCAO:
        echo 1. Feche todos os terminais e VS Code
        echo 2. Execute este script novamente como Administrador
        echo 3. Ou reinicie o computador
        echo.
        pause
        exit /b 1
    )
)
echo [OK] Prisma Client gerado
echo.

:: Criar tabelas no banco
echo [4/4] Criando tabelas no banco de dados...
echo IMPORTANTE: Isso vai criar todas as tabelas necessarias
echo.
call npx prisma db push --accept-data-loss
if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao criar tabelas no banco!
    echo.
    echo Verifique:
    echo 1. A DATABASE_URL no arquivo .env esta correta?
    echo 2. O banco Supabase esta ativo?
    echo 3. Sua conexao com internet esta funcionando?
    echo.
    pause
    exit /b 1
)
echo [OK] Tabelas criadas
echo.

:: Criar dados
echo.
echo ========================================
echo   CRIANDO DADOS (usuarios, medicamentos, etc)
echo ========================================
echo.
call npx tsx criar-dados-completos.ts
if errorlevel 1 (
    echo.
    echo [AVISO] Erro ao criar dados, mas as tabelas foram criadas
    echo Tente executar novamente: npx tsx criar-dados-completos.ts
    echo.
) else (
    echo.
    echo [OK] Dados criados com sucesso!
)

echo.
echo ========================================
echo   CONCLUIDO!
echo ========================================
echo.
echo Agora voce pode:
echo 1. Iniciar o servidor: npm run dev
echo 2. Fazer login com: admin@cannabilize.com.br / admin123
echo.
pause
