# Pratham Car Care — Garage Management PWA

Billing, customers, service reminders, day sheet and expenses for **Pratham Car Care** (Karvenagar, Pune).

- **Frontend**: React Native for Web + Vite + TypeScript (installable PWA)
- **Backend**: PHP 8.1+ API + MySQL (vanilla PDO, no frameworks)
- **Deploy**: Hostinger (`public_html`), bundle built by `app/deploy.ps1`

```
app/
├── db/          schema.sql, seed.sql, migrations, reset helper
├── backend/     PHP API (public/ = what becomes public_html/)
├── frontend/    React Native Web PWA
├── deploy.ps1   Builds + assembles a Hostinger-ready bundle
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

## Deploying to Hostinger

See `app/README.md` → "Hostinger deployment" for the step-by-step. Essentials:

1. `powershell -ExecutionPolicy Bypass -File app/deploy.ps1` → creates `app/deploy/public_html/`
2. Import `app/db/schema.sql` + `app/db/seed.sql` in phpMyAdmin
3. Upload bundle to `public_html/`, then edit `api/config.php` → `APP_ENV = 'production'` + your DB credentials
4. Set PHP **8.1+** and enable **SSL** in hPanel before opening the site
5. Change the default PIN to a private one in Settings, then set your Google place ID

## Maintainers' notes

- Backups: the whole business lives in MySQL — export weekly, keep Hostinger auto-backup on.
- Before any deploy, re-sync: `npm run build` → copy `dist/*` into `backend/public/` (deploy.ps1 does this automatically).
- Hard-refresh (Ctrl+F5) after each deploy — the PWA service worker is network-first.