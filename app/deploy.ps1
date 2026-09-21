<#
.SYNOPSIS
  Builds the React PWA and assembles a Hostinger-ready public_html bundle.
.DESCRIPTION
  Run from the app/ directory:
      powershell -ExecutionPolicy Bypass -File deploy.ps1 [-DeployDatabase]
  Then upload deploy/public_html/ to your Hostinger hPanel File Manager or FTP.
  -DeployDatabase also copies db/install.php into the bundle, so you can create
  the database by opening /install.php once (it reads api/config.php and deletes
  itself afterwards). Set APP_ENV to 'production' first (see its comment block).
#>
#>
param([switch]$DeployDatabase)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $MyInvocation.MyCommand.Path -Parent)

Write-Host "1/4  Building frontend..."
Push-Location 'frontend'
npm install --no-audit --no-fund | Out-Null
npm run build
Pop-Location

Write-Host "2/4  Assembling deploy/public_html..."
$dest = Join-Path (Get-Location) 'deploy\public_html'
if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
New-Item -ItemType Directory -Path $dest -Force | Out-Null

# Backend (API entry, .htaccess, api/src)
Copy-Item -Recurse -Force 'backend\public\*' $dest

# Frontend build overlay
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

Write-Host "3/4  Verifying bundle..."
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

Write-Host "4/4  Ready."
Write-Host ""
Write-Host "  Bundle created at: $dest"
Write-Host ""
Write-Host "  NEXT STEPS (Hostinger):" -ForegroundColor Yellow
Write-Host "    1. Upload deploy/public_html/ contents to public_html/ (File Manager or FTP)."
Write-Host "    2. Edit public_html/api/config.php: fill DB_NAME / DB_USER / DB_PASS in the production block."
Write-Host "    3. Drop a file named 'APP_ENV' into public_html/api/ containing the word 'production' (one line, no .php)."
Write-Host "    4. Open https://yourdomain.com/install.php once to create the database tables + seed data (it deletes itself)."
Write-Host "       (install.php is only in the bundle when you run:  deploy.ps1 -DeployDatabase)"
Write-Host "    5. Enable SSL and set PHP 8.1+ in hPanel. Open the site, login PIN 1234, set prices in Products."
Write-Host ""
Write-Host "  DONE." -ForegroundColor Green