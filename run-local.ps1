param([switch]$Install)

$BOT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$LOG_DIR = Join-Path $BOT_DIR "logs"
$ENV_FILE = Join-Path $BOT_DIR ".env"
$GSK_DIR = "C:\Users\uncom\Desktop\brain-in-a-box"
$GSK_PORT = 4242
$NODE = "node"

if (-not (Test-Path $LOG_DIR)) { New-Item -ItemType Directory -Path $LOG_DIR -Force | Out-Null }

function Log { param($m) $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"; "$ts $m" | Out-File -Append (Join-Path $LOG_DIR "bot.log"); Write-Host "$ts $m" }

# Load .env if it exists
if (Test-Path $ENV_FILE) {
    Get-Content $ENV_FILE | ForEach-Object {
        if ($_ -match '^\s*([^#=]+)=(.*)\s*$') {
            [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
    Log "Loaded .env"
}

# Check required env vars
$required = @('BLUESKY_IDENTIFIER','BLUESKY_PASSWORD')
$missing = $required | Where-Object { -not [Environment]::GetEnvironmentVariable($_, "Process") }
if ($missing) {
    Log "ERROR: Missing env vars: $($missing -join ', ')"
    Log "Create a .env file in $BOT_DIR with:"
    Log "BLUESKY_IDENTIFIER=your-handle"
    Log "BLUESKY_PASSWORD=your-password"
    Log "MASTODON_INSTANCE=https://..."
    Log "MASTODON_ACCESS_TOKEN=..."
    exit 1
}

# Check if GSK is running
$gskRunning = $false
try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:$GSK_PORT/health" -TimeoutSec 3 -UseBasicParsing
    $gskRunning = $r.StatusCode -eq 200
} catch {}

if ($gskRunning) {
    Log "GSK (Brain-in-a-Box) running on port $GSK_PORT"
} else {
    Log "GSK not running — bot will use content library fallback"
}

# Run the bot
Log "Starting bot..."
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logFile = Join-Path $LOG_DIR "run-$timestamp.log"

$env:GSK_API_URL = "http://127.0.0.1:$GSK_PORT"
& $NODE (Join-Path $BOT_DIR "post.js") 2>&1 | Out-File $logFile
$exitCode = $LASTEXITCODE

Get-Content $logFile | ForEach-Object { Log $_ }
Log "Bot exit code: $exitCode"

# Install as scheduled task if -Install flag
if ($Install) {
    $taskName = "BUYaSOUL-BlueskyBot"
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`""
    $trigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 365) -At (Get-Date).AddMinutes(1) -Once
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Force
    Log "Scheduled task '$taskName' installed — runs every hour"
}
