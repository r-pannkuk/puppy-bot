Get-WmiObject Win32_Process | Where-Object {
    $_.CommandLine -like '*Lavalink.jar*'
} | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}
