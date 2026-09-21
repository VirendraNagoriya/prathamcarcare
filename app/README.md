# Pratham Car Care — Garage Management PWA

Multibrand car-service billing system for **Pratham Car Care** (Karvenagar, Pune).
Built with a React Native for Web PWA frontend, vanilla PHP 8 API, and MySQL.

---

## Architecture

| Layer | Stack | Notes |
|-------|-------|-------|
| **Frontend** | Vite + React Native Web (TypeScript) | Mobile-first PWA, renders the exact invoice layout from the spec |
| **Backend** | PHP 8 + PDO | REST API, zero external dependencies beyond PHP + MySQL extensions |
| **Database** | MySQL (MariaDB via XAMPP locally) | 3 tables per spec + `catalog` (34 seeded items) + `settings` |

---

## Local development (XAMPP)

```bash
# 1. Make sure XAMPP MySQL is running (port 3306)

# 2. Create the database + seed default data
cd app
php db/reset_db.php
# → pratham_care created, 34 catalog items + default PIN 1234 inserted

# 3. Start the API server
cd backend
php -S localhost:8080 -t public dev_router.php

# 4a. Option A – build & serve from PHP (production-faithful, single origin)
cd ../frontend
npm install
npm run build
# Copy dist → backend/public (see deploy.ps1 for automation)
Copy-Item -Recurse -Force dist\* ..\backend\public\
Copy-Item -Force public\manifest.webmanifest ..\backend\public\
Copy-Item -Force public\sw.js ..\backend\public\
# Open http://localhost:8080  (PIN: 1234)

# 4b. Option B – Vite dev server with /api proxy (hot reload)
cd ../frontend
npm run dev
# Vite proxies /api → http://localhost:8080
# Open http://localhost:5173  (PIN: 1234)
```

**Reset database** (destructive, dev only):
```
php db/reset_db.php
```

---

## Hostinger deployment (GitHub-only workflow)

GitHub is the single source of truth. The **repo root is the deployable site**
(index.html, api/, assets/, .htaccess, install.php, ...) — downloading the repo
gives you the site files directly, with no wrapper folder to nest wrong.

```powershell
# From app/ directory: rebuild the frontend into the repo root
powershell -ExecutionPolicy Bypass -File deploy.ps1 -DeployDatabase
# then commit + push — this auto-deploys to Hostinger via GitHub Actions:
git add -A; git commit -m "deploy build"; git push origin main
```

**Auto-deploy (free GitHub Actions, ~1 min/push):** every push to `main` FTP-syncs
the repo root into `public_html/prathamcarcare/` (`app/`, `README.md`,
`config.local.php`, `APP_ENV` are excluded). One-time repo secrets needed:
`FTP_SERVER`, `FTP_USER`, `FTP_PASSWORD` (like above, or upload manually once and
skip the secret wiring).

First launch on the server:

1. Create **`api/config.local.php`** from `api/config.local.example.php` — it is
   gitignored, holds real credentials, and is never overwritten by deploys:
   - `'env' => 'production'`
   - `'production' => ['db_host' => 'localhost', 'db_name' => '...', 'db_user' => '...', 'db_pass' => '...']`
   (Do NOT edit `api/config.php` itself for credentials — that file is redeployed on every push.)
2. **Open `https://yourdomain.com/prathamcarcare/install` once** — it creates
   the 8 tables + 34 catalog items + settings, then deletes itself.
3. Open the app — default PIN: **1234**. Change it immediately via Settings.

> **Remote MySQL note**: Hostinger shared hosting usually blocks remote MySQL connections. The PHP API runs on the *same* server, so it connects via `localhost` without needing remote access enabled.

---

## Default PIN

**1234** (bcrypt-hashed in `db/seed.sql`). Change via the Settings screen inside the app.

---

## Features

- **Ad-hoc line-item billing** with 34-item catalog autocomplete — type any product name or enter a new one; quantity and rate are fully flexible.
- **Invoice preview** matching the physical bill layout (blue header, cog logo, metadata grid, ledger table, "Rs. in words", customer/proprietor signatures).
- **Print** (`window.print()` with print CSS).
- **WhatsApp** receipt sharing via deep-link (`wa.me/?text=...`) with serialized receipt string + Google Review link.
- **History** and re-print of past invoices.
- **PWA**: installable on iOS/Android home screen, service worker caching.
- **Changeable PIN** (requires old PIN to change).

---

## Project structure

```
(repo root)          THE deployable site — index.html, api/, assets/, icons/,
                     .htaccess, install.php, sw.js, manifest.webmanifest
app/
├── db/              SQL schema, catalog seed, reset script, install.php
├── backend/
│   └── public/      PHP API source that deploy.ps1 merges into the repo root
│       └── api/     PHP entry + src/ (bootstrap, helpers, controllers)
├── frontend/
│   └── src/         React Native Web app (screens, components, utils)
├── docs/            design spec + reference images
├── deploy.ps1       Rebuilds the app into the repo root (tracked), then commit + push
└── README.md
```

---

## Key files

| File | Purpose |
|------|---------|
| `db/schema.sql` | DDL for `vehicles`, `invoices`, `invoice_items`, `catalog`, `settings` |
| `db/seed.sql` | 34 master catalog items + default PIN row |
| `db/reset_db.php` | XAMPP helper: drops & recreates `pratham_care` |
| `backend/public/api/index.php` | API entry point |
| `backend/public/api/src/bootstrap.php` | Router + auth + CORS + session |
| `backend/public/api/config.php` | DB credentials + CORS origins |
| `frontend/src/screens/BillingScreen.tsx` | Dynamic line-item editor with autocomplete |
| `frontend/src/components/InvoiceSheet.tsx` | Pixel-matched invoice layout (RNW) |
| `frontend/src/utils/whatsapp.ts` | Receipt serialization + WhatsApp deep-link |
| `frontend/src/utils/amountInWords.ts` | Indian Rupees text converter |
| `deploy.ps1` | Builds + assembles Hostinger bundle |
