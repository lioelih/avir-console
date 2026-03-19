# Forward Windows port 3001 to WSL so phones can reach the lobby server.
# Run once per WSL session (WSL IP can change after WSL restarts).
# Requires: Run PowerShell as Administrator.

$Port = 3001

# Get WSL's current IPv4 (first address from hostname -I)
$wslIp = (wsl hostname -I 2>$null).Trim().Split()[0]
if (-not $wslIp -or $wslIp -notmatch '^\d{1,3}(\.\d{1,3}){3}$') {
  Write-Host "Could not get WSL IP. Is WSL running? Try: wsl hostname -I" -ForegroundColor Red
  exit 1
}

# Remove existing rule for this port so we can re-add (idempotent).
# When no rule exists, netsh prints "The system cannot find the file specified" — suppress via cmd.
cmd.exe /c "netsh interface portproxy delete v4tov4 listenport=$Port listenaddress=0.0.0.0 >nul 2>&1"

# Add forward: Windows 0.0.0.0:3001 -> WSL $wslIp:3001
netsh interface portproxy add v4tov4 listenport=$Port listenaddress=0.0.0.0 connectport=$Port connectaddress=$wslIp
if ($LASTEXITCODE -ne 0) {
  Write-Host "netsh failed. Run this script as Administrator." -ForegroundColor Red
  exit 1
}

# Allow inbound TCP 3001 in Windows Firewall (phones hit Windows first, then portproxy to WSL)
$ruleName = "Avir Console Lobby ($Port)"
Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
try {
  New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow -Profile Any | Out-Null
} catch {
  Write-Host "WARNING: Could not add Windows Firewall rule for port $Port. Phones may not connect. Run this script as Administrator, or add an inbound rule for TCP $Port manually." -ForegroundColor Yellow
}

Write-Host "Port forward: 0.0.0.0:$Port -> ${wslIp}:$Port (WSL). You can start the server in WSL now." -ForegroundColor Green
Write-Host "From another device, test: http://<this-PC-LAN-IP>:$Port/health  (IP must match Wi‑Fi/Ethernet on Windows, often 192.168.x.x or 10.x.x.x)" -ForegroundColor Gray
