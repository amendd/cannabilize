# Envia dados para um ou mais IPs (HTTP/HTTPS), com controle de volume e paralelismo
# Uso: .\enviar-dados-ip.ps1 -Ip 192.168.1.10,192.168.1.11 -TamanhoBytes 500 -Repeticoes 100000 -Paralelo 200

param(
    [Parameter(Mandatory = $true, HelpMessage = "IP(s) de destino (um ou mais separados por vírgula)")]
    [string[]]$Ip,

    [Parameter(Mandatory = $false)]
    [int]$Porta = 80,

    [Parameter(Mandatory = $false)]
    [string]$Caminho = "/",

    [Parameter(Mandatory = $false, HelpMessage = "Usar HTTPS")]
    [switch]$Https,

    [Parameter(Mandatory = $false, HelpMessage = "Corpo da requisição. Se TamanhoBytes for usado, pode ser usado como base para preencher.")]
    [string]$Dados,

    [Parameter(Mandatory = $false, HelpMessage = "Enviar dados de um arquivo")]
    [string]$Arquivo,

    [Parameter(Mandatory = $false, HelpMessage = "Tamanho do corpo em bytes (gera/preenche até esse tamanho). Ex: 500, 1024")]
    [long]$TamanhoBytes = 0,

    [Parameter(Mandatory = $false, HelpMessage = "Número de envios (requisições) por IP")]
    [int]$Repeticoes = 1,

    [Parameter(Mandatory = $false, HelpMessage = "Requisições simultâneas (paralelo). Aumenta para mais envios por segundo.")]
    [int]$Paralelo = 1,

    [Parameter(Mandatory = $false)]
    [ValidateSet("GET", "POST", "PUT", "PATCH", "DELETE")]
    [string]$Metodo = "POST",

    [Parameter(Mandatory = $false, HelpMessage = "Content-Type do corpo")]
    [string]$ContentType = "application/json",

    [Parameter(Mandatory = $false, HelpMessage = "Timeout em segundos")]
    [int]$Timeout = 30,

    [Parameter(Mandatory = $false, HelpMessage = "Não exibir cada resposta (apenas progresso e resumo)")]
    [switch]$Silencioso
)

$ErrorActionPreference = "Stop"

# Normalizar IPs
$listaIPs = @()
foreach ($i in $Ip) {
    $listaIPs += $i.Split(",", [StringSplitOptions]::RemoveEmptyEntries) | ForEach-Object { $_.Trim() }
}
$listaIPs = $listaIPs | Where-Object { $_ -ne "" } | Select-Object -Unique

if ($listaIPs.Count -eq 0) {
    Write-Host "  ERRO: Nenhum IP informado." -ForegroundColor Red
    exit 1
}

$mostrarProgresso = $Repeticoes -gt 50 -or $Silencioso
if ($Repeticoes -gt 50 -and -not $Silencioso) { $Silencioso = $true }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Envio de dados para IP(s)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  IPs:        $($listaIPs -join ', ')" -ForegroundColor White
Write-Host "  Repetições: $Repeticoes por IP" -ForegroundColor White
Write-Host "  Paralelo:   $Paralelo requisições simultâneas" -ForegroundColor White
Write-Host "  Método:     $Metodo" -ForegroundColor White
Write-Host ""

# Montar corpo base
$body = $null
if ($Arquivo) {
    if (-not (Test-Path $Arquivo)) {
        Write-Host "  ERRO: Arquivo não encontrado: $Arquivo" -ForegroundColor Red
        exit 1
    }
    $body = Get-Content -Path $Arquivo -Raw -Encoding UTF8
    if (-not $mostrarProgresso) { Write-Host "  Corpo base: arquivo $Arquivo ($($body.Length) bytes)" -ForegroundColor Gray }
} elseif ($Dados) {
    $body = $Dados
    if (-not $mostrarProgresso) { Write-Host "  Corpo base: $($body.Length) bytes" -ForegroundColor Gray }
}

# Ajustar volume (tamanho em bytes)
if ($TamanhoBytes -gt 0) {
    $base = if ($body) { $body } else { " " }
    if ($body -and $body.Length -ge $TamanhoBytes) {
        $body = $body.Substring(0, [int]$TamanhoBytes)
    } else {
        if (-not $body) { $body = " " }
        $resto = $TamanhoBytes - $body.Length
        $body = $body + ($base * [Math]::Max(1, [Math]::Ceiling($resto / $base.Length))).Substring(0, [int][Math]::Min($resto, $TamanhoBytes))
    }
    Write-Host "  Volume:     $TamanhoBytes bytes" -ForegroundColor Yellow
}
if ($body -eq $null -and $Metodo -ne "GET") {
    $body = ""
}
Write-Host ""

$protocolo = if ($Https) { "https" } else { "http" }
$totalEnvios = $listaIPs.Count * $Repeticoes
$script:ok = 0
$script:erros = 0
$script:lock = [System.Object]::new()

# Construir lista de trabalhos: (url, índice)
$trabalhos = [System.Collections.ArrayList]::new()
foreach ($endereco in $listaIPs) {
    $url = "${protocolo}://${endereco}:${Porta}${Caminho}"
    for ($r = 1; $r -le $Repeticoes; $r++) {
        [void]$trabalhos.Add([PSCustomObject]@{ Url = $url; Ip = $endereco })
    }
}

$inicio = Get-Date
$feitos = 0
$reportarCada = [Math]::Max(1, [Math]::Min(5000, [Math]::Floor($trabalhos.Count / 20)))

function Enviar-Uma {
    param($uri, $metodo, $timeout, $bodyObj, $contentType, $useBasicParsing)
    try {
        $p = @{
            Uri             = $uri
            Method          = $metodo
            TimeoutSec      = $timeout
            UseBasicParsing = $true
        }
        if ($bodyObj -ne $null -and $bodyObj.Length -gt 0) {
            $p["Body"] = $bodyObj
            $p["ContentType"] = $contentType
        }
        $null = Invoke-WebRequest @p
        return $true
    } catch {
        return $false
    }
}

if ($Paralelo -le 1) {
    # Sequencial
    foreach ($t in $trabalhos) {
        $sucesso = Enviar-Uma -uri $t.Url -metodo $Metodo -timeout $Timeout -bodyObj $body -contentType $ContentType
        if ($sucesso) { $script:ok++ } else { $script:erros++ }
        $feitos++
        if ($mostrarProgresso -and $feitos % $reportarCada -eq 0) {
            Write-Host "  Progresso: $feitos / $($trabalhos.Count)" -ForegroundColor Gray
        }
    }
} else {
    # Paralelo com runspaces
    $runspacePool = [runspacefactory]::CreateRunspacePool(1, $Paralelo)
    $runspacePool.Open()
    $jobs = [System.Collections.ArrayList]::new()
    $bodyCopy = $body
    $metodoCopy = $Metodo
    $timeoutCopy = $Timeout
    $contentTypeCopy = $ContentType

    $scriptBlock = {
        param($uri, $bodyObj, $metodo, $timeout, $contentType)
        try {
            $p = @{ Uri = $uri; Method = $metodo; TimeoutSec = $timeout; UseBasicParsing = $true }
            if ($bodyObj -ne $null -and $bodyObj.Length -gt 0) {
                $p["Body"] = $bodyObj
                $p["ContentType"] = $contentType
            }
            $null = Invoke-WebRequest @p
            return $true
        } catch {
            return $false
        }
    }

    foreach ($t in $trabalhos) {
        $ps = [powershell]::Create().AddScript($scriptBlock).AddArgument($t.Url).AddArgument($bodyCopy).AddArgument($metodoCopy).AddArgument($timeoutCopy).AddArgument($contentTypeCopy)
        $ps.RunspacePool = $runspacePool
        [void]$jobs.Add([PSCustomObject]@{ Pipe = $ps; Handle = $ps.BeginInvoke() })
    }

    $feitos = 0
    foreach ($j in $jobs) {
        $resultado = $j.Pipe.EndInvoke($j.Handle)
        $j.Pipe.Dispose()
        if ($resultado -eq $true) { $script:ok++ } else { $script:erros++ }
        $feitos++
        if ($mostrarProgresso -and $feitos % $reportarCada -eq 0) {
            Write-Host "  Progresso: $feitos / $($trabalhos.Count)" -ForegroundColor Gray
        }
    }
    $runspacePool.Close()
    $runspacePool.Dispose()
}

$fim = Get-Date
$duracao = ($fim - $inicio).TotalSeconds
$porSegundo = if ($duracao -gt 0) { [Math]::Round($script:ok / $duracao, 1) } else { $script:ok }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Total: $($script:ok) sucesso, $($script:erros) erro(s) (de $totalEnvios envios)" -ForegroundColor $(if ($script:erros -eq 0) { "Green" } else { "Yellow" })
Write-Host "  Tempo: $([Math]::Round($duracao, 2)) s  |  Taxa: ~$porSegundo req/s" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($script:erros -gt 0) { exit 1 }
