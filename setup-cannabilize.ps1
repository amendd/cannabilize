# Script de Setup Automatizado - Projeto CannabiLizi
# Este script automatiza todo o processo de configuração inicial do projeto

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SETUP PROJETO CANNABILIZI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar política de execução do PowerShell
$executionPolicy = Get-ExecutionPolicy -Scope CurrentUser
if ($executionPolicy -eq "Restricted") {
    Write-Host "ATENCAO: Politica de execucao de scripts esta desabilitada!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para habilitar, execute este comando:" -ForegroundColor Yellow
    Write-Host "  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ou consulte o arquivo: SOLUCAO_ERRO_POWERSHELL.md" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Deseja que eu tente habilitar automaticamente agora? (S/N)"
    if ($response -eq "S" -or $response -eq "s") {
        try {
            Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
            Write-Host "[OK] Politica de execucao habilitada!" -ForegroundColor Green
            Write-Host "Reinicie o script para continuar." -ForegroundColor Yellow
            exit 0
        } catch {
            Write-Host "[ERRO] Nao foi possivel habilitar automaticamente." -ForegroundColor Red
            Write-Host "Execute manualmente: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "Script cancelado. Habilite a execução de scripts primeiro." -ForegroundColor Yellow
        exit 1
    }
}

# Verificar se o Git está instalado
Write-Host "[1/6] Verificando dependências..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "[OK] Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERRO] Git nao encontrado. Por favor, instale o Git primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERRO] Node.js nao encontrado. Por favor, instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se npm está instalado
try {
    $npmVersion = npm --version
    Write-Host "[OK] npm encontrado: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERRO] npm nao encontrado. Por favor, instale o npm primeiro." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Definir diretório de trabalho (URL pode ser alterada se o repo for diferente)
$repoUrl = "https://github.com/Cannabilize/cannabilize.git"
$repoName = "cannabilize"
$currentDir = Get-Location

# Verificar se a pasta já existe
if (Test-Path $repoName) {
    Write-Host "[2/6] A pasta '$repoName' ja existe." -ForegroundColor Yellow
    $response = Read-Host "Deseja continuar e usar a pasta existente? (S/N)"
    if ($response -ne "S" -and $response -ne "s") {
        Write-Host "Operacao cancelada." -ForegroundColor Red
        exit 0
    }
    Set-Location $repoName
} else {
    # Clonar o repositório
    Write-Host "[2/6] Clonando repositorio..." -ForegroundColor Yellow
    Write-Host "Executando: git clone $repoUrl" -ForegroundColor Gray
    
    try {
        git clone $repoUrl 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "" -ForegroundColor Red
            Write-Host "[ERRO] Repositorio nao encontrado ou sem acesso." -ForegroundColor Red
            Write-Host "  - Confirme a URL com quem passou as instrucoes." -ForegroundColor Yellow
            Write-Host "  - Se for privado, verifique login: git config user.name e user.email" -ForegroundColor Yellow
            Write-Host "  - Veja SETUP_CANNABILIZE.md secao 'Setup manual (sem clonar)'" -ForegroundColor Yellow
            exit 1
        }
        Write-Host "[OK] Repositorio clonado com sucesso!" -ForegroundColor Green
        Set-Location $repoName
    } catch {
        Write-Host "[ERRO] Erro ao clonar: $_" -ForegroundColor Red
        Write-Host "  Veja SETUP_CANNABILIZE.md para 'Setup manual (sem clonar)'." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# Verificar se já existe package.json (projeto Next.js já criado)
if (Test-Path "package.json") {
    Write-Host "[3/6] Projeto Next.js já existe na pasta." -ForegroundColor Yellow
    $response = Read-Host "Deseja recriar o projeto? Isso pode sobrescrever arquivos existentes. (S/N)"
    if ($response -eq "S" -or $response -eq "s") {
        Write-Host "Recriando projeto Next.js..." -ForegroundColor Yellow
        # Não vamos deletar tudo, mas vamos executar o create-next-app
        # O create-next-app vai perguntar se quer sobrescrever
    } else {
        Write-Host "Pulando criação do projeto Next.js..." -ForegroundColor Yellow
        $skipNextApp = $true
    }
} else {
    $skipNextApp = $false
}

# Criar projeto Next.js
if (-not $skipNextApp) {
    Write-Host "[3/6] Criando projeto Next.js..." -ForegroundColor Yellow
    Write-Host "Configurações que serão usadas:" -ForegroundColor Gray
    Write-Host "  - TypeScript: Yes" -ForegroundColor Gray
    Write-Host "  - ESLint: Yes" -ForegroundColor Gray
    Write-Host "  - Tailwind CSS: Yes" -ForegroundColor Gray
    Write-Host "  - src/ directory: Yes" -ForegroundColor Gray
    Write-Host "  - App Router: Yes" -ForegroundColor Gray
    Write-Host "  - Import alias: Yes (@/*)" -ForegroundColor Gray
    Write-Host ""
    
    # Tentar usar flags (versões mais recentes do create-next-app suportam)
    Write-Host "Tentando criar com flags automáticas..." -ForegroundColor Gray
    $createNextAppArgs = @(
        "create-next-app@latest",
        ".",
        "--typescript",
        "--eslint",
        "--tailwind",
        "--app",
        "--src-dir",
        "--import-alias", "@/*",
        "--yes"
    )
    
    try {
        & npx $createNextAppArgs
        
        if ($LASTEXITCODE -ne 0) {
            throw "Erro ao executar com flags"
        }
        
        Write-Host "[OK] Projeto Next.js criado com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "[AVISO] Nao foi possivel usar flags automaticas. Executando modo interativo..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "IMPORTANTE: Responda às perguntas conforme abaixo:" -ForegroundColor Yellow
        Write-Host "  TypeScript? → Yes" -ForegroundColor White
        Write-Host "  ESLint? → Yes" -ForegroundColor White
        Write-Host "  Tailwind CSS? → Yes" -ForegroundColor White
        Write-Host "  src/ directory? → Yes" -ForegroundColor White
        Write-Host "  App Router? → Yes" -ForegroundColor White
        Write-Host "  Import alias? → Yes (ou aceite o padrão @/*)" -ForegroundColor White
        Write-Host ""
        Write-Host "Pressione Enter para continuar..." -ForegroundColor Cyan
        Read-Host
        
        npx create-next-app@latest .
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERRO] Erro ao criar projeto Next.js" -ForegroundColor Red
            Write-Host "Tente executar manualmente: npx create-next-app@latest ." -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host "[OK] Projeto Next.js criado com sucesso!" -ForegroundColor Green
    }
}

Write-Host ""

# Criar arquivo .env.local
Write-Host "[4/6] Criando arquivo .env.local..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "[AVISO] Arquivo .env.local ja existe. Nao sera sobrescrito." -ForegroundColor Yellow
} else {
    New-Item -Path ".env.local" -ItemType File -Force | Out-Null
    Write-Host "[OK] Arquivo .env.local criado!" -ForegroundColor Green
    Write-Host "[AVISO] IMPORTANTE: Adicione as variaveis de ambiente neste arquivo!" -ForegroundColor Yellow
}

Write-Host ""

# Testar se o projeto roda
Write-Host "[5/6] Testando se o projeto funciona..." -ForegroundColor Yellow
Write-Host "Instalando dependências..." -ForegroundColor Gray
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Erro ao instalar dependencias" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Dependencias instaladas!" -ForegroundColor Green
Write-Host ""
Write-Host "Para testar o projeto, execute em outro terminal:" -ForegroundColor Cyan
Write-Host "  cd $repoName" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Depois abra no navegador: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

# Preparar commit
Write-Host "[6/6] Preparando commit inicial..." -ForegroundColor Yellow

# Verificar status do git
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "Arquivos modificados detectados:" -ForegroundColor Gray
    git status --short
    
    Write-Host ""
    $response = Read-Host "Deseja fazer commit e push agora? (S/N)"
    if ($response -eq "S" -or $response -eq "s") {
        git add .
        git commit -m "Initial Next.js project"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Commit criado com sucesso!" -ForegroundColor Green
            
            Write-Host ""
            $response = Read-Host "Deseja fazer push para o GitHub agora? (S/N)"
            if ($response -eq "S" -or $response -eq "s") {
                git push origin main
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "[OK] Codigo enviado para o GitHub com sucesso!" -ForegroundColor Green
                } else {
                    Write-Host "[AVISO] Erro ao fazer push. Verifique as configurações do Git." -ForegroundColor Yellow
                }
            }
        } else {
            Write-Host "[AVISO] Erro ao criar commit. Verifique as configurações do Git." -ForegroundColor Yellow
        }
    } else {
        Write-Host "Commit não realizado. Execute manualmente quando estiver pronto:" -ForegroundColor Yellow
        Write-Host "  git add ." -ForegroundColor White
        Write-Host "  git commit -m 'Initial Next.js project'" -ForegroundColor White
        Write-Host "  git push origin main" -ForegroundColor White
    }
} else {
    Write-Host "[OK] Nenhuma alteracao para commitar." -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SETUP CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Adicione as variáveis de ambiente no arquivo .env.local" -ForegroundColor White
Write-Host "2. Teste o projeto localmente: npm run dev" -ForegroundColor White
Write-Host "3. Verifique se o código está no GitHub" -ForegroundColor White
Write-Host "4. Avise quando finalizar para continuar com configurações" -ForegroundColor White
Write-Host ""
Write-Host "Diretório atual: $(Get-Location)" -ForegroundColor Gray
Write-Host ""
