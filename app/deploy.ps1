<#
.SYNOPSIS
  Builds the React PWA and assembles a Hostinger-ready public_html bundle.
.DESCRIPTION
  Run from the app/ directory:
      powershell -ExecutionPolicy Bypass -File deploy.ps1
  Then upload deploy/public_html/ to your Hostinger hPanel File Manager or FTP.
  Before uploading, edit deploy/public_html/api/config.php and set APP_ENV to 'production'
  with your actual Hostinger MySQL credentials.
#>
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

Write-Host "3/4  Verifying bundle..."
$index = Join-Path $dest 'index.html'
$api   = Join-Path $dest 'api\index.php'
if (!(Test-Path $index)) { throw "Missing $index" }
if (!(Test-Path $api))   { throw "Missing $api" }
Write-Host "   OK: index.html + api/index.php"

Write-Host "4/4  Ready."
Write-Host ""
Write-Host "  Bundle created at: $dest"
Write-Host ""
Write-Host "  NEXT STEPS (Hostinger):" -ForegroundColor Yellow
Write-Host "    1. hPanel > Databases > MySQL: create database + user, note credentials."
Write-Host "    2. phpMyAdmin: import db/schema.sql then db/seed.sql."
Write-Host "    3. File Manager / FTP: upload deploy/public_html/ contents to public_html/."
Write-Host "    4. Edit public_html/api/config.php: set APP_ENV to production, fill DB_USER/DB_PASS."
Write-Host "    5. Open https://yourdomain.com/  -  default PIN is 1234. Change it in Settings."
Write-Host ""
Write-Host "  DONE." -ForegroundColor Green