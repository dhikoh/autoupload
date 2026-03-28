# 🚀 AutoPost Hub — Tutorial Deploy ke Coolify

## Arsitektur

```
up.modula.click        →  Frontend (Next.js)     :3000
api.up.modula.click    →  Backend  (FastAPI)      :8000
                          Redis (internal)        :6379
```

---

## Langkah 1: Setup DNS

Buka panel DNS domain kamu (Cloudflare / Niagahoster / dll), tambahkan:

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| A | `up` | `IP_VPS_KAMU` | ✅ ON |
| A | `api.up` | `IP_VPS_KAMU` | ✅ ON |

> ⏳ Tunggu 2–5 menit sampai DNS propagate.

---

## Langkah 2: Deploy Backend di Coolify

### 2.1 — Buat Project Baru
1. Login ke Coolify → **Projects** → **+ New Project**
2. Nama: `AutoPost Hub`

### 2.2 — Tambah Resource: Backend
1. Di project → **+ New Resource** → **Docker**
2. Pilih **Dockerfile** (bukan Docker Compose)
3. Connect ke repo GitHub: `https://github.com/dhikoh/autoupload.git`
4. Settings:
   - **Build Pack**: Dockerfile
   - **Dockerfile Location**: `/backend/Dockerfile`
   - **Base Directory**: `/backend`
   - **Port Exposed**: `8000`
   - **Domain**: `api.up.modula.click`

### 2.3 — Set Environment Variables Backend
Di tab **Environment Variables**, tambahkan:

```env
SECRET_KEY=GANTI_DENGAN_STRING_RANDOM_64_KARAKTER
DATABASE_URL=sqlite:///./autopost.db
UPLOAD_DIR=./uploads
REDIS_URL=redis://redis:6379/0
USE_CELERY=false
FRONTEND_URL=https://up.modula.click
```

> 💡 Generate SECRET_KEY: buka terminal → `openssl rand -hex 32`

### 2.4 — Tambah Persistent Storage
Di tab **Storages**, tambahkan:

| Source Path | Destination Path | Keterangan |
|-------------|-----------------|------------|
| (auto) | `/app/uploads` | File upload |
| (auto) | `/app/autopost.db` | SQLite database |

### 2.5 — Deploy
Klik **Deploy** → tunggu sampai ✅ hijau.

### 2.6 — Test
Buka: `https://api.up.modula.click/api/health`
Harus muncul: `{"status":"ok","service":"autopost-hub"}`

---

## Langkah 3: Deploy Redis di Coolify

1. Di project → **+ New Resource** → **Database**
2. Pilih **Redis**
3. Settings:
   - **Version**: `7` (alpine)
   - Jangan ekspos port ke public
4. Catat **Internal URL** Redis (format: `redis://redis-xxxxx:6379`)
5. Update env backend `REDIS_URL` dengan URL ini

> ⚠️ Jika tidak pakai Celery (USE_CELERY=false), Redis opsional. Boleh skip langkah ini.

---

## Langkah 4: Deploy Frontend di Coolify

### 4.1 — Tambah Resource: Frontend
1. Di project → **+ New Resource** → **Docker**
2. Pilih **Dockerfile**
3. Connect ke repo yang sama: `https://github.com/dhikoh/autoupload.git`
4. Settings:
   - **Build Pack**: Dockerfile
   - **Dockerfile Location**: `/frontend/Dockerfile`
   - **Base Directory**: `/frontend`
   - **Port Exposed**: `3000`
   - **Domain**: `up.modula.click`

### 4.2 — Set Build Arguments
Di tab **Environment Variables**, tambahkan sebagai **Build Variable** (bukan runtime):

```
NEXT_PUBLIC_API_URL=https://api.up.modula.click
```

> ⚠️ **PENTING**: Ini HARUS jadi **Build Argument**, bukan runtime env. Next.js bake `NEXT_PUBLIC_*` saat build.
> Di Coolify, tandai sebagai "Build Variable" atau masukkan di **Build Args**.

### 4.3 — Deploy
Klik **Deploy** → tunggu ✅.

### 4.4 — Test
Buka: `https://up.modula.click`
Harus muncul halaman landing AutoPost Hub.

---

## Langkah 5: Aktifkan SSL (HTTPS)

Coolify biasanya auto-generate SSL via Let's Encrypt. Pastikan:
1. Backend domain `api.up.modula.click` → **SSL**: ✅ Enabled
2. Frontend domain `up.modula.click` → **SSL**: ✅ Enabled

---

## Langkah 6: Verifikasi End-to-End

| Test | URL | Expected |
|------|-----|----------|
| Health | `https://api.up.modula.click/api/health` | `{"status":"ok"}` |
| Landing | `https://up.modula.click` | Landing page |
| Register | `https://up.modula.click/register` | Form → berhasil |
| Login | `https://up.modula.click/login` | Form → redirect dashboard |
| Dashboard | `https://up.modula.click/dashboard` | Stats 0, empty state |

---

## Troubleshooting

### CORS Error
Pastikan env backend: `FRONTEND_URL=https://up.modula.click` (bukan http, bukan trailing slash).

### Login Gagal / 401
Cek browser console → Network tab → pastikan request ke `https://api.up.modula.click` (bukan localhost).

### File Upload Gagal
Pastikan persistent storage `/app/uploads` sudah di-mount di Coolify.

### Database Hilang Setelah Redeploy
Pastikan `/app/autopost.db` di-mount ke persistent storage.

---

## Update / Redeploy

Setiap kali push ke GitHub:
1. Buka Coolify → project → resource
2. Klik **Redeploy** (atau aktifkan auto-deploy via webhook)

Atau aktifkan **Auto Deploy**:
- Resource → Settings → **Automatic Deploy**: ✅ ON
- Coolify akan auto-redeploy setiap ada push ke branch `master`
