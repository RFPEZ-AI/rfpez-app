Param(
  [string]$Container = 'supabase_kong_rfpez-app-local',
  [string]$Src = './temp/kong.yml.fixed',
  [int]$Timeout = 60
)

if (-not (Test-Path -Path $Src)) {
  Write-Error "Source file '$Src' not found"
  exit 2
}

Write-Host "Waiting up to $Timeout s for container '$Container' to exist..."
$start = Get-Date
while ($true) {
  $exists = docker ps -a --format '{{.Names}}' | Select-String -Pattern "^$Container$"
  if ($exists) { break }
  if ((Get-Date) - $start -gt [TimeSpan]::FromSeconds($Timeout)) {
    Write-Error "Timeout: container '$Container' not found after $Timeout seconds"
    exit 3
  }
  Start-Sleep -Seconds 1
}

Write-Host "Copying '$Src' to $Container:/home/kong/kong.yml"
docker cp $Src "$Container":/home/kong/kong.yml

Write-Host "Attempting to chown inside container as root"
try {
  docker exec -u 0 $Container chown kong:root /home/kong/kong.yml
} catch {
  Write-Warning "Could not exec as root inside container; attempting normal exec"
  try { docker exec $Container chown kong:root /home/kong/kong.yml } catch { Write-Warning "chown failed" }
}

Write-Host "Restarting container $Container"
docker restart $Container

Start-Sleep -Seconds 3

Write-Host "Tailing last 200 lines of logs for $Container"
docker logs --tail 200 $Container

Write-Host "Done. If Kong still fails to start, run 'docker logs -f $Container' and inspect errors." 
