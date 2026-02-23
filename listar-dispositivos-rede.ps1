# Lista dispositivos na rede e identifica este computador
# Uso: .\listar-dispositivos-rede.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Dispositivos na rede" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. MEU DISPOSITIVO (este computador)
Write-Host "[ MEU DISPOSITIVO ]" -ForegroundColor Green
$myIPs = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -notlike "*Loopback*" -and 
    $_.IPAddress -notlike "169.*" 
}
$hostname = $env:COMPUTERNAME
foreach ($ip in $myIPs) {
    Write-Host "  Nome: $hostname" -ForegroundColor White
    Write-Host "  IP:   $($ip.IPAddress)" -ForegroundColor White
    Write-Host "  Rede: $($ip.InterfaceAlias)" -ForegroundColor Gray
    Write-Host ""
}

# 2. Obter gateway e rede para escanear
$gateway = (Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Where-Object { $_.NextHop -ne "0.0.0.0" } | Select-Object -First 1).NextHop
if (-not $gateway) {
    $gateway = (Get-NetRoute | Where-Object { $_.DestinationPrefix -like "192.168.*" -or $_.DestinationPrefix -like "10.*" } | Select-Object -First 1).NextHop
}

$myMainIP = ($myIPs | Select-Object -First 1).IPAddress
$baseNetwork = $myMainIP -replace '\.\d+$', ''

Write-Host "[ ESCANEANDO TODA A REDE $baseNetwork.0/24 ]" -ForegroundColor Yellow
Write-Host "  Ping em todos os IPs (1 a 254)..." -ForegroundColor Gray
Write-Host ""

# 3. Ping em toda a sub-rede (1-254) com .NET (rápido) e progresso na tela
$ping = New-Object System.Net.NetworkInformation.Ping
$total = 254
$timeoutMs = 150
1..$total | ForEach-Object -Begin { $i = 0 } -Process {
    $i++
    $ip = "$baseNetwork.$_"
    if ($i % 25 -eq 0 -or $i -eq $total) {
        Write-Host "  $i/$total verificados..." -ForegroundColor DarkGray
    }
    try {
        $null = $ping.Send($ip, $timeoutMs)
    } catch { }
}
Write-Host ""

# 4. Ler tabela ARP
$arp = arp -a
$devices = @()

foreach ($line in $arp) {
    if ($line -match '^\s*(\d+\.\d+\.\d+\.\d+)\s+([0-9a-f-]+)\s+(\w+)') {
        $ip = $matches[1]
        $mac = $matches[2]
        $type = $matches[3]
        if ($ip -notlike "224.*" -and $ip -notlike "255.*") {
            $isMe = ($ip -eq $myMainIP)
            $isGateway = ($ip -eq $gateway)
            $devices += [PSCustomObject]@{
                IP        = $ip
                MAC       = $mac
                Type      = $type
                IsMe      = $isMe
                IsGateway = $isGateway
                Hostname  = $null
            }
        }
    }
}

# Tentar resolver hostname (só do meu e de alguns para não demorar)
foreach ($d in $devices) {
    if ($d.IsMe) {
        $d.Hostname = $hostname
    }
}

# 5. Listar todos os dispositivos (toda a rede, incluindo gateway) com número para seleção
$sortedDevices = $devices | Sort-Object { [version]$_.IP }
Write-Host "[ TODOS OS DISPOSITIVOS NA REDE ]" -ForegroundColor Cyan
Write-Host ""

$num = 0
$sortedDevices | ForEach-Object {
    $num++
    $marker = if ($_.IsMe) { " <-- EU" } elseif ($_.IsGateway) { " (gateway)" } else { "" }
    $color = if ($_.IsMe) { "Green" } elseif ($_.IsGateway) { "Yellow" } else { "White" }
    $name = if ($_.Hostname) { " ($($_.Hostname))" } else { "" }
    Write-Host "  [$num] $($_.IP)`t$($_.MAC)`t$($_.Type)$name$marker" -ForegroundColor $color
}

Write-Host ""
Write-Host "Concluído. Dispositivos ativos: $($devices.Count)" -ForegroundColor Gray
Write-Host ""

# 6. Perguntar se quer monitorar alguns IPs
Write-Host "[ MONITORAR DISPOSITIVOS ]" -ForegroundColor Magenta
Write-Host "  Digite os numeros (ex: 1,3,5) ou IPs (ex: 192.168.1.1,192.168.1.50) para verificar se continuam online." -ForegroundColor Gray
Write-Host "  Deixe em branco e Enter para encerrar sem monitorar." -ForegroundColor Gray
$inputMonitor = Read-Host "  IPs ou numeros"
if ([string]::IsNullOrWhiteSpace($inputMonitor)) {
    Write-Host "Encerrado." -ForegroundColor Gray
    exit 0
}

# Interpretar entrada: números (1-based) ou IPs
$toMonitor = @()
$tokens = $inputMonitor -split '[,;\s]+' | Where-Object { $_ }
foreach ($t in $tokens) {
    $t = $t.Trim()
    if ($t -match '^\d+\.\d+\.\d+\.\d+$') {
        $toMonitor += $t
    } elseif ($t -match '^\d+$') {
        $idx = [int]$t
        if ($idx -ge 1 -and $idx -le $sortedDevices.Count) {
            $toMonitor += $sortedDevices[$idx - 1].IP
        }
    }
}
$toMonitor = $toMonitor | Select-Object -Unique

if ($toMonitor.Count -eq 0) {
    Write-Host "Nenhum IP valido. Encerrado." -ForegroundColor Gray
    exit 0
}

# Intervalo em segundos
Write-Host ""
$inputInterval = Read-Host "  Intervalo entre verificacoes em segundos (ex: 5, 10, 30)"
$intervalSec = 10
if ($inputInterval -match '^\d+$') {
    $intervalSec = [Math]::Max(1, [int]$inputInterval)
}

# Quantidade de pings por verificacao
$inputPings = Read-Host "  Quantidade de pings por verificacao (ex: 1, 3, 5)"
$pingCount = 1
if ($inputPings -match '^\d+$') {
    $pingCount = [Math]::Max(1, [Math]::Min(20, [int]$inputPings))
}

# Timeout de cada ping em milissegundos (tempo maximo de espera por resposta)
$inputTimeout = Read-Host "  Timeout do ping em ms (ex: 200, 500, 1000). Enter = 500"
$timeoutMs = 500
if (-not [string]::IsNullOrWhiteSpace($inputTimeout) -and $inputTimeout -match '^\d+$') {
    $timeoutMs = [Math]::Max(100, [Math]::Min(60000, [int]$inputTimeout))
}
Write-Host "  Monitorando $($toMonitor.Count) IP(s): $pingCount ping(s), timeout ${timeoutMs}ms, a cada $intervalSec s. Ctrl+C para parar." -ForegroundColor Gray
Write-Host ""

# 7. Loop: N pings por IP, mostrar online/offline (X/N), esperar intervalo
$ping = New-Object System.Net.NetworkInformation.Ping
$round = 0
while ($true) {
    $round++
    $now = Get-Date -Format "HH:mm:ss"
    Write-Host "--- Verificacao #$round ($now) ---" -ForegroundColor Cyan
    foreach ($ip in $toMonitor) {
        $okCount = 0
        for ($p = 0; $p -lt $pingCount; $p++) {
            try {
                $result = $ping.Send($ip, $timeoutMs)
                if ($result.Status -eq 'Success') { $okCount++ }
            } catch { }
        }
        $ok = ($okCount -gt 0)
        if ($ok) {
            Write-Host "  $ip  ONLINE ($okCount/$pingCount)" -ForegroundColor Green
        } else {
            Write-Host "  $ip  OFFLINE (0/$pingCount)" -ForegroundColor Red
        }
    }
    Write-Host ""
    Start-Sleep -Seconds $intervalSec
}
