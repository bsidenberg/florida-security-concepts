param(
  [Parameter(Mandatory=$true)][string]$SessionId,
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot),
  [ValidateRange(1,1800)][int]$CheckTimeoutSeconds = 600
)
$ErrorActionPreference = 'Stop'
$ProjectRoot = [IO.Path]::GetFullPath($ProjectRoot)
Set-Location -LiteralPath $ProjectRoot
$runId = (Get-Date -Format 'yyyyMMdd-HHmmss-fff') + '-' + [guid]::NewGuid().ToString('N')
$evidence = Join-Path $ProjectRoot 'harness/evidence'
[IO.Directory]::CreateDirectory($evidence) | Out-Null
$safeSession = $SessionId -replace '[^a-zA-Z0-9_-]', '_'
$logPath = Join-Path $evidence "$safeSession-verify-$runId.log"
function Log([string]$Text) { [IO.File]::AppendAllText($logPath, $Text + [Environment]::NewLine); Write-Host $Text }
Log "VERIFICATION session=$SessionId run=$runId"
Log "Project=$ProjectRoot"
Log "Log=$logPath"
$failed = $false
try {
  $manifest = Get-Content -LiteralPath (Join-Path $ProjectRoot 'harness/verification.json') -Raw | ConvertFrom-Json -AsHashtable
  if (-not $manifest.sessions.ContainsKey($SessionId)) { throw "Unknown session: $SessionId" }
  $required = @($manifest.sessions[$SessionId])
  $floor = @('lint','typecheck','test:unit','test:gate','build','test:e2e')
  if ($SessionId -eq 'S-006') { $floor += 'test:release' }
  foreach ($name in $floor) { if ($name -notin $required) { throw "Missing required check: $name" } }
  if (@($required | Select-Object -Unique).Count -ne $required.Count) { throw 'Duplicate check in manifest' }
  $package = Get-Content -LiteralPath (Join-Path $ProjectRoot 'package.json') -Raw | ConvertFrom-Json -AsHashtable
  $guard = Join-Path $ProjectRoot 'scripts/network-guard.cjs'
  if (-not (Test-Path -LiteralPath $guard -PathType Leaf)) { throw 'Missing required network guard' }
  foreach ($name in $required) {
    if (-not $manifest.checks.ContainsKey($name) -or -not $package.scripts.ContainsKey($name)) { throw "Missing script/check: $name" }
    if (-not $package.scripts[$name]) { throw "Empty script: $name" }
    if ($name.StartsWith('test:')) {
      $expectedFormat = $(if ($name -in @('test:e2e','test:release')) { 'playwright' } else { 'vitest' })
      if ($manifest.checks[$name].report -ne $expectedFormat -or -not $manifest.checks[$name].reportEnv) { throw "Missing required report contract: $name" }
    }
  }
  if (Get-Command git -ErrorAction SilentlyContinue) {
    $revision = & git rev-parse HEAD 2>&1
    Log ('Revision: ' + ($revision -join ' '))
    $dirty = & git status --short 2>&1
    Log ('Dirty files:' + [Environment]::NewLine + ($dirty -join [Environment]::NewLine))
  }
  $node = (Get-Command node -ErrorAction Stop).Source
  $nodeVersion = & $node --version
  Log "Node: $nodeVersion"
  if ($nodeVersion -notmatch '^v24\.') { throw 'Verification requires Node 24.x' }
  Log ('Dependency versions: ' + ($package.devDependencies | ConvertTo-Json -Compress))
  foreach ($name in $required) {
    $check = $manifest.checks[$name]
    if (-not $check.args -or -not (Test-Path -LiteralPath (Join-Path $ProjectRoot $check.args[0]) -PathType Leaf)) { throw "Missing executable for $name" }
    $psi = [Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = $node
    $psi.WorkingDirectory = $ProjectRoot
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    foreach ($arg in $check.args) { $psi.ArgumentList.Add([string]$arg) }
    # Allow only runtime essentials; never carry provider credentials to children.
    $keep = @('PATH','Path','SystemRoot','SYSTEMROOT','SystemDrive','SYSTEMDRIVE','WINDIR','TEMP','TMP','HOME','USERPROFILE','LOCALAPPDATA','APPDATA','COMSPEC','PATHEXT','NUMBER_OF_PROCESSORS','PROCESSOR_ARCHITECTURE','PLAYWRIGHT_BROWSERS_PATH')
    foreach ($key in @($psi.Environment.Keys)) { if ($key -notin $keep) { $psi.Environment.Remove($key) | Out-Null } }
    $psi.Environment['CI'] = 'true'
    $psi.Environment['NO_COLOR'] = '1'
    $psi.Environment['NEXT_TELEMETRY_DISABLED'] = '1'
    $psi.Environment['LEAD_DELIVERY_MODE'] = 'console'
    $psi.Environment['FSC_LOCAL_PREVIEW'] = ''
    $psi.Environment['FSC_LOCAL_FAILURE'] = ''
    $psi.Environment['NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL'] = ''
    foreach ($key in @('RESEND_API_KEY','LEAD_NOTIFICATION_TO','LEAD_NOTIFICATION_FROM','LEAD_CONFIRMATION_FROM','LEAD_CONFIRMATION_REPLY_TO','LEADS_WEBHOOK_URL','LEADS_WEBHOOK_SECRET','PRIME_SUPABASE_URL','PRIME_SUPABASE_SERVICE_ROLE_KEY','PRIME_ACCOUNT_SLUG')) { $psi.Environment[$key] = '' }
    $psi.Environment['LEAD_CONFIRMATION_ENABLED'] = 'false'
    $psi.Environment['NODE_OPTIONS'] = '--require="' + $guard.Replace('\','/') + '"'
    $psi.Environment['FSC_ALLOW_FONT_NETWORK'] = $(if ($name -eq 'build') { '1' } else { '0' })
    $violationPath = Join-Path $evidence "$safeSession-$($name.Replace(':','-'))-$runId.network"
    $psi.Environment['FSC_NETWORK_VIOLATION'] = $violationPath
    $reportPath = Join-Path $evidence "$safeSession-$($name.Replace(':','-'))-$runId.json"
    if ($check.report) {
      if (-not $check.reportEnv) { throw "Missing report environment for $name" }
      $psi.Environment[[string]$check.reportEnv] = $reportPath
    }
    Log ("CHECK $name COMMAND node " + ($check.args | ConvertTo-Json -Compress))
    $process = [Diagnostics.Process]::new()
    $process.StartInfo = $psi
    $checkStarted = [DateTime]::UtcNow
    try {
      if (-not $process.Start()) { throw "Could not start $name" }
      $stdoutTask = $process.StandardOutput.ReadToEndAsync()
      $stderrTask = $process.StandardError.ReadToEndAsync()
      if (-not $process.WaitForExit($CheckTimeoutSeconds * 1000)) {
        $process.Kill($true); $process.WaitForExit()
        Log ('STDOUT' + [Environment]::NewLine + $stdoutTask.GetAwaiter().GetResult())
        Log ('STDERR' + [Environment]::NewLine + $stderrTask.GetAwaiter().GetResult())
        throw "Check timed out: $name"
      }
      Log ('STDOUT' + [Environment]::NewLine + $stdoutTask.GetAwaiter().GetResult())
      Log ('STDERR' + [Environment]::NewLine + $stderrTask.GetAwaiter().GetResult())
      Log "CHECK $name EXIT $($process.ExitCode)"
      if ($process.ExitCode -ne 0) { throw "Child failed: $name" }
    } finally {
      if ($process.Id -and -not $process.HasExited) { $process.Kill($true); $process.WaitForExit() }
      $process.Dispose()
    }
    if (Test-Path -LiteralPath $violationPath) { throw "Forbidden network attempt: $name" }
    if ($check.report) {
      if (-not (Test-Path -LiteralPath $reportPath)) { throw "Missing report: $name" }
      $report = Get-Content -LiteralPath $reportPath -Raw | ConvertFrom-Json
      if ($check.report -eq 'vitest') {
        $count = [int]$report.numTotalTests
        $bad = [int]$report.numFailedTests + [int]$report.numPendingTests + [int]$report.numTodoTests
        if ($report.success -ne $true) { $bad++ }
      } elseif ($check.report -eq 'playwright') {
        $count = [int]$report.stats.expected
        $bad = [int]$report.stats.unexpected + [int]$report.stats.skipped + [int]$report.stats.flaky
        if ($report.errors) { $bad += @($report.errors).Count }
      } else { throw "Unknown report format: $name" }
      Log "TEST COUNTS $name passed=$count rejected=$bad report=$reportPath"
      if ($count -le 0 -or $bad -ne 0) { throw "Missing, zero, failed or skipped tests: $name" }
    }
    if ($name -eq 'build') {
      $artifact = Join-Path $ProjectRoot $manifest.buildArtifact
      if (-not (Test-Path -LiteralPath $artifact -PathType Leaf)) { throw 'Missing build output' }
      if ((Get-Item -LiteralPath $artifact).LastWriteTimeUtc -lt $checkStarted.AddSeconds(-2)) { throw 'Stale build output' }
    }
  }
  Log "RESULT: ALL CHECKS PASSED ($($required.Count)/$($required.Count))"
} catch {
  $failed = $true
  Log ('RESULT: FAILED - ' + $_.Exception.Message)
}
if ($failed) { exit 1 }
exit 0
