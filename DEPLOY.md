# 🚀 AutoPost Hub — Panduan Deploy ke Coolify

## Arsitektur Production

```
up.modula.click        →  Frontend (Next.js)    :3000
api.up.modula.click    →  Backend  (FastAPI)     :8000
                          Redis    (internal)    :6379
```

GitHub Repo: `https://github.com/dhikoh/autoupload` (branch: `master`)

---

## Langkah 1: Setup DNS

Buka panel DNS domain (Cloudflare/Niagahoster/dll), tambahkan A records:

| Type | Name    | Value        | Proxy |
|------|---------|--------------|-------|
| A    | `up`    | `IP_VPS_KAMU` | ✅ ON  |
| A    | `api.up` | `IP_VPS_KAMU` | ✅ ON  |

> ⏳ Tunggu 2–5 menit propagasi DNS sebelum lanjut.

---

## Langkah 2: Generate Secret Key

Di terminal (VPS atau lokal):
```bash
openssl rand -hex 32
# Atau:
python3 -c "import secrets; print(secrets.token_hex(64))"
```
Simpan output — ini akan dipakai sebagai `SECRET_KEY`.

---

## Langkah 3: Deploy Backend di Coolify

### 3.1 — Buat Project Baru
1. Login Coolify → **Projects** → **+ New Project**
2. Nama: `AutoPost Hub`

### 3.2 — Tambah Resource Backend
1. Project → **+ New Resource** → **Docker** → **Dockerfile**
2. Connect GitHub repo: `https://github.com/dhikoh/autoupload`
3. Settings:
   - **Dockerfile Location**: `/backend/Dockerfile`
   - **Base Directory**: `/backend`
   - **Port**: `8000`
   - **Domain**: `api.up.modula.click`

### 3.3 — Set Environment Variables Backend

Di tab **Environment Variables**, tambahkan semua ini:

```env
SECRET_KEY=<output dari step 2 — string 64 karakter>

SUPERADMIN_EMAIL=admin@yourdomain.com
SUPERADMIN_PASSWORD=GantiPasswordKuat@2024!
SUPERADMIN_NAME=Super Admin

DATABASE_URL=sqlite:////app/data/autopost.db
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE_MB=500

FRONTEND_URL=https://up.modula.click
ACCESS_TOKEN_EXPIRE_DAYS=7

REDIS_URL=redis://redis:6379/0
USE_CELERY=false
```

> ⚠️ **PENTING**: `DATABASE_URL` pakai 4 slash (`sqlite:////app/data/...`) untuk path absolut di Linux.

### 3.4 — Tambah Persistent Storage

Di tab **Storages**:

| Source (auto-generate) | Mount Path      | Keterangan          |
|------------------------|-----------------|---------------------|
| (auto)                 | `/app/uploads`  | File video/gambar   |
| (auto)                 | `/app/data`     | SQLite database     |

> 🔑 **KRITIS**: Tanpa persistent storage, database akan HILANG setiap redeploy!

### 3.5 — Deploy & Verifikasi
1. Klik **Deploy** → tunggu build selesai (3–5 menit)
2. Test: `https://api.up.modula.click/api/health`
3. Expected response:
```json
{"status": "ok", "service": "autopost-hub", "version": "2.0.0", "scheduler": "running"}
```

---

## Langkah 4: Deploy Frontend di Coolify

### 4.1 — Tambah Resource Frontend  
1. Project → **+ New Resource** → **Docker** → **Dockerfile**
2. Connect GitHub repo yang sama
3. Settings:
   - **Dockerfile Location**: `/frontend/Dockerfile`
   - **Base Directory**: `/frontend`
   - **Port**: `3000`
   - **Domain**: `up.modula.click`

### 4.2 — Set Build Argument

Di tab **Environment Variables** → pilih **Build Variable** (penting!):

```
NEXT_PUBLIC_API_URL=https://api.up.modula.click
```

> ⚠️ Ini **HARUS** Build Variable, bukan Runtime. Next.js bake `NEXT_PUBLIC_*` saat build time.

### 4.3 — Deploy & Verifikasi
1. Klik **Deploy** → tunggu build (5–8 menit, ada npm build)
2. Buka: `https://up.modula.click`
3. Harus muncul halaman login AutoPost Hub

---

## Langkah 5: SSL/HTTPS

Coolify auto-generate SSL via Let's Encrypt. Pastikan:
- `api.up.modula.click` → SSL ✅ Enabled  
- `up.modula.click` → SSL ✅ Enabled

Jika SSL gagal: pastikan port 80 & 443 terbuka di firewall VPS.

---

## Langkah 6: Verifikasi End-to-End

| Test | URL | Expected |
|------|-----|----------|
| API Health | `https://api.up.modula.click/api/health` | `{"status":"ok","scheduler":"running"}` |
| API Docs | `https://api.up.modula.click/docs` | Swagger UI |
| Landing | `https://up.modula.click` | Login page |
| Register | `https://up.modula.click/register` | Form berhasil |
| Login Admin | Email + password dari env vars | Redirect ke `/admin` |
| Dashboard | `https://up.modula.click/dashboard` | Stats, empty state |

### Test Flow Lengkap:
1. Login sebagai admin → `/admin`
2. Buka Settings → set harga upload, bank info
3. Register akun tenant baru → login
4. Buka Topup → upload bukti transfer
5. Login admin → review → approve topup
6. Login tenant → saldo bertambah
7. Buat post → upload file → pilih platform → submit

---

## Auto-Deploy (Recommended)

Aktifkan agar setiap `git push` ke `master` auto-deploy:
1. Backend resource → Settings → **Automatic Deploy**: ✅ ON
2. Frontend resource → Settings → **Automatic Deploy**: ✅ ON

Atau gunakan Coolify Webhook → tambah ke GitHub repo Settings → Webhooks.

---

## Troubleshooting

### CORS Error di Browser
```
Pastikan: FRONTEND_URL=https://up.modula.click (tanpa trailing slash, pakai https)
```

### Login Selalu 401
```
Cek: Network tab browser → request harus ke https://api.up.modula.click (bukan localhost)
Pastikan NEXT_PUBLIC_API_URL di-set sebagai Build Variable (bukan runtime env)
```

### File Upload Gagal / 500
```
Pastikan persistent storage /app/uploads sudah di-mount di Coolify
Cek log backend: apakah ada "Permission denied" error
```

### Database Hilang Setelah Redeploy
```
Pastikan persistent storage /app/data sudah di-mount
DATABASE_URL=sqlite:////app/data/autopost.db (4 slash!)
```

### Superadmin Tidak Bisa Login
```
Cek log backend saat startup — harus ada: "✅ Superadmin created: email@..."
Jika tidak muncul, cek SUPERADMIN_EMAIL dan SUPERADMIN_PASSWORD sudah di-set
```

### Scheduler Tidak Jalan
```
GET /api/health → "scheduler" harus "running"
Jika "stopped", cek log untuk APScheduler error
```

---

## Redeploy Setelah Update

```bash
# 1. Push perubahan ke GitHub
git push origin master

# 2. Di Coolify — klik Redeploy pada resource yang berubah
# Atau biarkan auto-deploy berjalan (jika sudah diaktifkan)
```
