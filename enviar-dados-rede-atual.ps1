# Envio para os IPs da rede atual: .33, .49, .143
# Tamanho: 500 bytes | Repetições: 100.000 por IP | Paralelo para maximizar req/s

$ips = "192.168.1.33", "192.168.1.49", "192.168.1.143"
$tamanho = 500
$repeticoes = 100000
$paralelo = 200   # requisições simultâneas (aumente se a rede/servidor aguentar)

& "$PSScriptRoot\enviar-dados-ip.ps1" -Ip $ips -TamanhoBytes $tamanho -Repeticoes $repeticoes -Paralelo $paralelo -Silencioso
