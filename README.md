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
   Every push to `main` auto-deploys to Hostinger via GitHub Actions (free) —
   no manual uploads. Manual upload is only needed once, below, to bootstrap.

2. **First launch only** (server):
   - Create `api/config.local.php` from `api/config.local.example.php` (it is
     gitignored and never overwritten by deploys) with:
     ```php
     'env' => 'production',
     'production' => ['db_host' => 'localhost', 'db_name' => '...', 'db_user' => '...', 'db_pass' => '...'],
     ```
   - Open `https://yourdomain/prathamcarcare/install` once, enable SSL + PHP 8.1+.

To enable the auto-deploy, add three **repo secrets** (GitHub → Settings → Secrets →
Actions): `FTP_SERVER`, `FTP_USER`, `FTP_PASSWORD` (create an FTP account in
Hostinger hPanel → Files → FTP Accounts; server-dir is `/prathamcarcare`).

## Maintainers' notes

- The whole business lives in MySQL — export weekly and keep Hostinger auto-backup on.
- Hard-refresh (Ctrl+F5) after each deploy — the PWA service worker is network-first.