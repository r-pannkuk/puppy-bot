$ll = Get-NetTCPConnection -LocalPort 2333 -ErrorAction SilentlyContinue
if ($ll) {
    Stop-Process -Id $ll.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
}
java -jar "$PSScriptRoot/../lavalink/Lavalink.jar" --spring.config.location="$PSScriptRoot/../lavalink/application.yml"
exit 0
