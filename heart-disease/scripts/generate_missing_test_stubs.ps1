$ErrorActionPreference = 'Stop'

$root = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))

$uiSourceRoot = Join-Path $root 'ui/src'
$apiSourceRoot = Join-Path $root 'src'
$pyTestsRoot = Join-Path $root 'tests/src'

$uiCreated = 0
$pyCreated = 0

function Get-RelativePath([string]$basePath, [string]$targetPath) {
  $baseFull = [System.IO.Path]::GetFullPath($basePath)
  if (-not $baseFull.EndsWith('\')) {
    $baseFull += '\'
  }
  $targetFull = [System.IO.Path]::GetFullPath($targetPath)

  $baseUri = New-Object System.Uri($baseFull)
  $targetUri = New-Object System.Uri($targetFull)
  $relative = $baseUri.MakeRelativeUri($targetUri).ToString()
  return [System.Uri]::UnescapeDataString($relative).Replace('/', '\\')
}

function Get-SpecBaseName([System.IO.FileInfo]$file) {
  if ($file.BaseName -eq 'index' -or $file.BaseName -eq '__init__') {
    return $file.Directory.Name
  }
  return $file.BaseName
}

# UI TS/TSX stubs: <source-dir>/test/<Component>.spec.ts(x)
$uiFiles = Get-ChildItem -Path $uiSourceRoot -Recurse -File -Include *.ts,*.tsx |
  Where-Object {
    $_.Name -notlike '*.d.ts' -and
    $_.FullName -notmatch '\\test\\' -and
    $_.FullName -notmatch '\\__tests__\\' -and
    $_.Name -notmatch '\.spec\.(ts|tsx)$'
  }

foreach ($file in $uiFiles) {
  $specDir = Join-Path $file.Directory.FullName 'test'
  if (-not (Test-Path $specDir)) {
    New-Item -Path $specDir -ItemType Directory | Out-Null
  }

  $specBase = Get-SpecBaseName $file
  $specExt = if ($file.Extension -eq '.tsx') { 'tsx' } else { 'ts' }
  $specPath = Join-Path $specDir ("{0}.spec.{1}" -f $specBase, $specExt)

  if (Test-Path $specPath) {
    continue
  }

  $content = @"
import { describe, expect, it } from 'vitest';

describe.skip('$specBase', () => {
  it('has a test placeholder', () => {
    expect(true).toBe(true);
  });
});
"@

  Set-Content -Path $specPath -Value $content -Encoding UTF8
  $uiCreated++
}

# Backend Python stubs: tests/src/<relative-dir>/test/<module>_spec.py
$pyFiles = Get-ChildItem -Path $apiSourceRoot -Recurse -File -Include *.py |
  Where-Object {
    $_.FullName -notmatch '\\__pycache__\\' -and
    $_.Name -notmatch '_spec\.py$'
  }

foreach ($file in $pyFiles) {
  $relativeFile = Get-RelativePath $apiSourceRoot $file.FullName
  $relativeDir = Split-Path -Parent $relativeFile
  if ($relativeDir -eq '.') {
    $relativeDir = ''
  }
  $targetDir = if ([string]::IsNullOrEmpty($relativeDir)) {
    Join-Path $pyTestsRoot 'test'
  } else {
    Join-Path (Join-Path $pyTestsRoot $relativeDir) 'test'
  }

  if (-not (Test-Path $targetDir)) {
    New-Item -Path $targetDir -ItemType Directory -Force | Out-Null
  }

  $specBase = Get-SpecBaseName $file
  $specPath = Join-Path $targetDir ("{0}_spec.py" -f $specBase)

  if (Test-Path $specPath) {
    continue
  }

  $relative = (Get-RelativePath $root $file.FullName).Replace('\\', '/')
  $content = @"
import pytest

pytestmark = pytest.mark.skip(reason='TODO: implement tests for $relative')


def test_placeholder() -> None:
    assert True
"@

  Set-Content -Path $specPath -Value $content -Encoding UTF8
  $pyCreated++
}

Write-Output "Created UI stubs: $uiCreated"
Write-Output "Created Python stubs: $pyCreated"
