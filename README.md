# Pratham Car Care — Garage Management PWA

Billing, customers, service reminders, day sheet and expenses for **Pratham Car Care** (Karvenagar, Pune).

- **Frontend**: React Native for Web + Vite + TypeScript (installable PWA)
- **Backend**: PHP 8.1+ API + MySQL (vanilla PDO, no frameworks)
- **Deploy**: GitHub is the single source of truth → download from GitHub and place on Hostinger (`public_html/prathamcarcare/`)

```
(repo root)            THE deployable site (index.html, api/, assets/, .htaccess, ...)
app/
├── db/          schema.sql, seed.sql, migrations, reset helper, install.php
├── backend/     PHP API source (backend/public = what gets merged into the repo root)
├── frontend/    React Native Web PWA source
├── docs/        project docs, design spec, reference images
├── deploy.ps1   Builds the frontend into the repo root, ready to commit & push
└── README.md    Full local-dev + deployment guide
```

## Quick start

```bash
cd app
php db/reset_db.php        # fresh DB (default PIN 1234)
cd backend
php -S localhost:8080 -t public dev_router.php
```

Open http://localhost:8080 → PIN `1234`.

## Deploying (GitHub-only workflow)

The **repo root is the deployable site** — when you download the repo, the extracted
top-level files (index.html, api/, assets/, icons/, .htaccess, install.php, sw.js,
manifest.webmanifest) are exactly what goes on the server. There is no nested
`public_html` folder to get wrong.

1. **Build + commit + push** (from this machine):
   ```powershell
   powershell -ExecutionPolicy Bypass -File app\deploy.ps1 -DeployDatabase
   git add -A; git commit -m "deploy build"; git push origin main
   ```
   (`-DeployDatabase` includes `install.php` for the one-time DB setup.)

2. **On the server** (Hostinger): download the repo → **Code ▸ Download ZIP**,
   extract, and replace the contents of your `public_html/prathamcarcare/` with the
   extracted repo's top-level content (skip `app/` and `README.md` — build tools only).

3. **First launch only**: edit `api/config.php` — set `$APP_ENV = 'production'` and
   put your real Hostinger DB credentials, open
   `https://yourdomain/prathamcarcare/install` once, enable SSL + PHP 8.1+.

## Maintainers' notes

- The whole business lives in MySQL — export weekly and keep Hostinger auto-backup on.
- Hard-refresh (Ctrl+F5) after each deploy — the PWA service worker is network-first.