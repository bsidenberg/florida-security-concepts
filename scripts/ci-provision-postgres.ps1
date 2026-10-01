# S-CI-001: provide the pinned PostgreSQL 17.11 win-x64 portable test runtime (D-018) on a CI runner.
# Test tooling only. It downloads the official EDB binaries ZIP, checks its SHA-256 against the D-018
# record BEFORE extraction, and extracts it to .fsc-test/pgsql/runtime, so that
# tests/helpers/postgres.ts RUNTIME_BIN (.fsc-test/pgsql/runtime/pgsql/bin) resolves unchanged.
# It never installs a service, never touches global configuration and never deletes anything.
# The download runs here, before scripts/verify.ps1, outside the gate's network guard.
[CmdletBinding()]
param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$ArchivePath = ''
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# D-018 / S-005 resume contract: archive SHA-256 of the PostgreSQL 17.11 win-x64 portable ZIP.
$ExpectedSha256 = '4b8db0930c38f6ef845db919551dedda3b6b845aeb0927b3d79a6e8e9e4537cf'
# Official EDB download endpoints. 1260491 is the vendor file id recorded in the handoff; 1260616 is
# the id the EDB binaries page lists for 17.11 today. Only an archive whose hash equals the pin is used.
$Sources = @(
  'https://sbp.enterprisedb.com/getfile.jsp?fileid=1260491',
  'https://sbp.enterprisedb.com/getfile.jsp?fileid=1260616'
)

$runtimeRoot = Join-Path $ProjectRoot '.fsc-test/pgsql/runtime'
$bin = Join-Path $runtimeRoot 'pgsql/bin'
$required = @('postgres.exe', 'initdb.exe', 'pg_ctl.exe')
if (-not $ArchivePath) { $ArchivePath = Join-Path $ProjectRoot '.fsc-test/pgsql/postgresql-17.11-1-windows-x64-binaries.zip' }
New-Item -ItemType Directory -Force -Path (Split-Path $ArchivePath -Parent) | Out-Null

function Get-Sha256([string]$Path) { (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }

# A cached archive is used only if it still matches the pin.
if ((Test-Path -LiteralPath $ArchivePath) -and ((Get-Sha256 $ArchivePath) -ne $ExpectedSha256)) {
  Write-Host "Cached archive hash does not match the pin; downloading again."
  Move-Item -LiteralPath $ArchivePath -Destination "$ArchivePath.mismatch-$([DateTime]::UtcNow.ToString('yyyyMMddHHmmss'))"
}
if (-not (Test-Path -LiteralPath $ArchivePath)) {
  $got = $false
  foreach ($url in $Sources) {
    $partial = "$ArchivePath.download"
    try {
      Write-Host "Downloading $url"
      Invoke-WebRequest -Uri $url -OutFile $partial -UseBasicParsing -MaximumRedirection 10
    } catch {
      Write-Host "Download failed from ${url}: $($_.Exception.Message)"
      continue
    }
    $actual = Get-Sha256 $partial
    if ($actual -eq $ExpectedSha256) { Move-Item -LiteralPath $partial -Destination $ArchivePath; $got = $true; break }
    Write-Host "Hash mismatch from ${url}: $actual (expected $ExpectedSha256); not used."
    Move-Item -LiteralPath $partial -Destination "$partial.mismatch-$([DateTime]::UtcNow.ToString('yyyyMMddHHmmss'))"
  }
  if (-not $got) { throw "No official archive matched the pinned PostgreSQL 17.11 SHA-256 $ExpectedSha256" }
}

# Verify again immediately before extraction (also covers a cache restore).
$final = Get-Sha256 $ArchivePath
if ($final -ne $ExpectedSha256) { throw "Archive hash $final does not match the pin $ExpectedSha256; refusing to extract" }
Write-Host "Archive SHA-256 verified: $final"

New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null
Expand-Archive -LiteralPath $ArchivePath -DestinationPath $runtimeRoot -Force
$missing = @($required | Where-Object { -not (Test-Path -LiteralPath (Join-Path $bin $_) -PathType Leaf) })
if ($missing.Count) { throw "Extracted runtime is missing $($missing -join ', ') under $bin" }
$version = & (Join-Path $bin 'postgres.exe') --version
if ($version -notmatch '\b17\.11\b') { throw "Unexpected PostgreSQL version: $version" }
Write-Host "PostgreSQL test runtime ready: $version at $bin"
