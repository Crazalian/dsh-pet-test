<#
.SYNOPSIS
  Install all pets in .\pets into ~/.codex/pets (the dsh-pet custom pets dir).
.DESCRIPTION
  Copies each pet folder under .\pets (folders containing a pet.json) into
  $env:USERPROFILE\.codex\pets, replacing any existing copies. Restart
  'dsh web' afterwards.
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/install-pets.ps1
#>
$ErrorActionPreference = 'Stop'

$src = Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..')).Path 'pets'
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE '.codex' }
$dest = Join-Path $codexHome 'pets'

New-Item -ItemType Directory -Force -Path $dest | Out-Null

$count = 0
foreach ($d in (Get-ChildItem $src -Directory)) {
    if (-not (Test-Path (Join-Path $d.FullName 'pet.json'))) { continue }
    $target = Join-Path $dest $d.Name
    if (Test-Path $target) { Remove-Item $target -Recurse -Force }
    Copy-Item $d.FullName $target -Recurse -Force
    Write-Host "installed $($d.Name)"
    $count++
}
Write-Host "Done: $count pet(s) installed to $dest"
Write-Host "Restart 'dsh web' for dsh-pet to pick them up."
