<#
.SYNOPSIS
  Builds the React PWA into the repo-root public_html/ folder (the exact content
  to deploy to Hostinger), then pushes it to GitHub so the server is updated
  from GitHub only.
.DESCRIPTION
  GitHub is the single source of truth. Run this from the app/ directory:
      powershell -ExecutionPolicy Bypass -File deploy.ps1 [-DeployDatabase]
  It rebuilds the frontend into  ../public_html  (mixing in the PHP API from
  backend/public and the icons/manifest/service worker from frontend/public).
  -DeployDatabase also copies db/install.php in, so the database can be created
  by opening /install.php once (it reads api/config.php, self-deletes after).
  After it finishes:
      git add -A  &&  git push origin main
  Then on the server, replace public_html/... contents with the downloaded repo
  (GitHub > Code > Download ZIP, or pull via git if SSH is enabled).
#>
param([switch]$DeployDatabase)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $MyInvocation.MyCommand.Path -Parent)

Write-Host "1/3  Building frontend..."
Push-Location 'frontend'
npm install --no-audit --no-fund | Out-Null
npm run build
Pop-Location

Write-Host "2/3  Assembling public_html/ (repo root)..."
$dest = Join-Path (Get-Location) '..\public_html'
if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
New-Item -ItemType Directory -Path $dest -Force | Out-Null

# Backend (API entry, .htaccess, api/src)
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
Write-Host "  Bundle rebuilt at: $dest"
Write-Host ""
Write-Host "  NEXT STEPS:" -ForegroundColor Yellow
Write-Host "    1. Commit + push so GitHub carries the new bundle:"
Write-Host "         git add -A; git commit -m \"deploy build\"; git push origin main"
Write-Host "    2. On the server (Hostinger): replace your public_html/... contents with"
Write-Host "       this repo's public_html/ contents (GitHub > Code > Download ZIP,"
Write-Host "       or git pull if you have SSH). Do NOT upload the zip file itself."
Write-Host "    3. First-time server setup only:"
Write-Host "       - edit api/config.php (DB_NAME / DB_USER / DB_PASS in the production block)"
Write-Host "       - edit api/config.php: set `$APP_ENV = 'production' (top line), fill DB_NAME / DB_USER / DB_PASS"
Write-Host "       - open https://yourdomain.com/install.php once, then it deletes itself"
Write-Host "    4. Enable SSL + PHP 8.1+ in hPanel. Login PIN 1234, set prices, change PIN."
Write-Host ""
Write-Host "  DONE." -ForegroundColor Green