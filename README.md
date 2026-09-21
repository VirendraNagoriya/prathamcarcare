# Pratham Car Care — Garage Management PWA

Billing, customers, service reminders, day sheet and expenses for **Pratham Car Care** (Karvenagar, Pune).

- **Frontend**: React Native for Web + Vite + TypeScript (installable PWA)
- **Backend**: PHP 8.1+ API + MySQL (vanilla PDO, no frameworks)
- **Deploy**: GitHub is the single source of truth → download from GitHub and place on Hostinger (`public_html/`)

```
public_html/   THE deployable site (upload its contents to the server)
app/
├── db/          schema.sql, seed.sql, migrations, reset helper, install.php
├── backend/     PHP API source (backend/public = what becomes part of public_html)
├── frontend/    React Native Web PWA source
├── deploy.ps1   Builds the frontend into ../public_html, ready to commit & push
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

Everything deployable lives in the repo's **`public_html/`** folder — it is the exact
content that goes on the server. Workflow for every update:

1. **Build + commit + push** (from this machine):
   ```powershell
   powershell -ExecutionPolicy Bypass -File app\deploy.ps1 -DeployDatabase
   git add -A; git commit -m "deploy build"; git push origin main
   ```
   (`-DeployDatabase` includes `install.php` for the one-time DB setup.)

2. **On the server** (Hostinger): download the repo → **Code ▸ Download ZIP**,
   extract, and replace the contents of your `public_html/prathamcarcare/` with
   the repo's `public_html/` contents. (`git pull` works too if SSH is enabled.)

3. **First launch only**: edit `api/config.php` (real Hostinger DB credentials),
   create an `APP_ENV` file containing `production`, open
   `https://yourdomain/prathamcarcare/install.php` once, enable SSL + PHP 8.1+.

## Maintainers' notes

- The whole business lives in MySQL — export weekly and keep Hostinger auto-backup on.
- Hard-refresh (Ctrl+F5) after each deploy — the PWA service worker is network-first.