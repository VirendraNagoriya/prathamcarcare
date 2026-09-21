<#
.SYNOPSIS
  Builds the React PWA into the repo ROOT (the exact content to deploy to
  Hostinger), then pushes it to GitHub so the server is updated from GitHub only.
.DESCRIPTION
  GitHub is the single source of truth. The repo root IS the deployable site
  (index.html, api/, assets/, .htaccess, install.php, ...), so a Download ZIP
  extracts straight to the site files - no wrapper folder to nest wrong.
  Run this from the app/ directory:
      powershell -ExecutionPolicy Bypass -File deploy.ps1 [-DeployDatabase]
  It rebuilds the frontend into the repo root (mixing in the PHP API from
  backend/public and the icons/manifest/service worker from frontend/public).
  -DeployDatabase also copies db/install.php in, so the database can be created
  by opening /install once (it reads api/config.php, self-deletes after).
  After it finishes:
      git add -A  &&  git push origin main
  Then on the server, replace the contents of public_html/prathamcarcare/ with
  this repo's top-level content (GitHub > Code > Download ZIP, or git pull).
#>
param([switch]$DeployDatabase)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $MyInvocation.MyCommand.Path -Parent)

Write-Host "1/3  Building frontend..."
Push-Location 'frontend'
npm install --no-audit --no-fund | Out-Null
npm run build
Pop-Location

Write-Host "2/3  Assembling repo root (deployable)..."
$dest = Split-Path (Get-Location) -Parent
Write-Host "  target: $dest (root of repo = server content)"

# Backend (API entry, .htaccess, api/src) - merged INTO the repo root
Copy-Item -Recurse -Force 'backend\public\*' $dest

# Prune stale hashed bundles: assets must come from THIS build only
if (Test-Path "$dest\assets") { Remove-Item -Recurse -Force "$dest\assets" }

# Frontend build overlay (brings in the fresh dist/assets/)
Copy-Item -Recurse -Force 'frontend\dist\*' $dest
Copy-Item -Force 'frontend\public\manifest.webmanifest' $dest
Copy-Item -Force 'frontend\public\sw.js' $dest
if (Test-Path 'frontend\public\icons') {
    New-Item -ItemType Directory -Path (Join-Path $dest 'icons') -Force | Out-Null
    Copy-Item -Recurse -Force 'frontend\public\icons\*' (Join-Path $dest 'icons')
}

# Optional: include the one-time database installer (self-deletes after success)
if ($DeployDatabase.IsPresent) {
    Copy-Item -Force 'db\install.php' (Join-Path $dest 'install.php')
}

Write-Host "3/3  Verifying bundle..."
$index = Join-Path $dest 'index.html'
$api   = Join-Path $dest 'api\index.php'
if (!(Test-Path $index)) { throw "Missing $index" }
if (!(Test-Path $api))   { throw "Missing $api" }
Write-Host "   OK: index.html + api/index.php"
if ($DeployDatabase.IsPresent) {
    $install = Join-Path $dest 'install.php'
    if (!(Test-Path $install)) { throw "Missing $install" }
    Write-Host "   OK: install.php (first-run database installer included)"
}

Write-Host ""
Write-Host "  Bundle rebuilt at repo root: $dest"
Write-Host ""
Write-Host "  NEXT STEPS:" -ForegroundColor Yellow
Write-Host '    1. Commit + push: this AUTO-DEPLOYS via GitHub Actions.'
Write-Host '         git add -A; git commit -m "deploy build"; git push origin main'
Write-Host '    2. First-time server setup only (deploys skip these):'
Write-Host '       - create api/config.local.php from api/config.local.example.php'
Write-Host '         set env to production + real db_name/db_user/db_pass (gitignored).'
Write-Host '       - open https://yourdomain.com/install once, it self-deletes.'
Write-Host '    3. Add repo secrets FTP_SERVER, FTP_USER, FTP_PASSWORD to enable deploys.'
Write-Host '    4. Enable SSL + PHP 8.1+ in hPanel. Login PIN 1234.'
Write-Host ""
Write-Host "  DONE." -ForegroundColor Green