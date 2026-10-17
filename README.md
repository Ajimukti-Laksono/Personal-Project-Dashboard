# 🚀 Personal Project Dashboard

Dashboard personal modern dan responsif yang terhubung langsung ke akun GitHub Anda secara **REAL-TIME**. Setiap kali Anda melakukan `git push`, membuka Pull Request, melaporkan Issue, atau menjalankan GitHub Actions, dashboard akan langsung ter-update di browser **tanpa refresh**.

Dibangun dengan arsitektur **Next.js App Router**, **Server-Sent Events (SSE)**, **SQLite (WAL Mode)** via Prisma, dan **TypeScript Strict**.

---

## 📑 Daftar Isi
1. [Fitur Utama](#-fitur-utama)
2. [Arsitektur & Alur Kerja](#-arsitektur--alur-kerja)
3. [Kebutuhan Sistem](#-kebutuhan-sistem)
4. [Panduan Menjalankan di Lokal](#-panduan-menjalankan-di-lokal)
5. [Konfigurasi Webhook di GitHub (smee.io / ngrok)](#-konfigurasi-webhook-di-github)
6. [Panduan Membuat GitHub Token (Fine-grained PAT)](#-panduan-membuat-github-token)
7. [Setup Webhook Banyak Repositori (Akun / Organisasi)](#-setup-webhook-skala-besar)
8. [Panduan Deploy (Docker / Railway / Fly.io / VPS)](#-panduan-deploy)
9. [Troubleshooting & Solusi Masalah](#-troubleshooting)
10. [Batasan yang Diketahui (Known Limitations)](#-batasan-yang-diketahui)

---

## ✨ Fitur Utama

- **Real-Time Live Updates**: Menggunakan Server-Sent Events (SSE) dengan heartbeat berkala dan auto-reconnect dengan exponential backoff.
- **Ringkasan Metrik**: Total repositori, jumlah commit 7 hari terakhir, PR terbuka, issue terbuka, dan status build CI terbaru.
- **Live Activity Feed**: Aliran commit, PR, issue, dan status GitHub Actions dengan animasi halus saat event baru tiba.
- **Heatmap Kontribusi 12 Bulan**: Visualisasi kalender ala profil GitHub dengan indikator level kontribusi dan tooltip detail.
- **Grafik Tren & Bahasa**: Tren volume commit 14 hari terakhir menggunakan Recharts AreaChart serta persentase distribusi bahasa pemrograman.
- **Daftar & Detail Repositori**: Dilengkapi pencarian instan, filter bahasa, filter privasi (publik/private/diarsipkan/disematkan), sorting cerdas, serta modal rincian commit, PR, issue, dan actions run.
- **Repositori Disematkan (Pinned Repositories)**: Tandai repositori favorit Anda dengan tombol semat (Pin) agar selalu berada di urutan teratas, dilengkapi filter cepat "📌 Disematkan Saja".
- **One-Click Webhook Setup**: Pasang dan daftarkan webhook ke GitHub secara otomatis dengan 1 klik via REST API tanpa perlu menyalin URL dan secret manual.
- **Actionable CI/CD (Re-run Workflow)**: Picu ulang workflow GitHub Actions yang gagal atau selesai langsung dari modal detail repositori.
- **Keamanan Berlapis**:
  - Otentikasi berbasis password dengan session cookie bertanda tangan HMAC (`httpOnly`, `sameSite=lax`, `secure`).
  - Rate limiting pencegah serangan brute-force pada form login.
  - Verifikasi signature GitHub HMAC-SHA256 dengan perbandingan constant-time (`crypto.timingSafeEqual`).
  - Pemrosesan event idempoten berdasarkan delivery ID GitHub.

---

## 🏗️ Arsitektur & Alur Kerja

```
git push ──> GitHub ──> POST /api/webhook ──> Verifikasi Signature
                                                      │
                                                      ▼
SSE Stream (GET /api/events) <── Broadcast <── Simpan ke SQLite (WAL)
            │
            ▼
Dashboard Browser (Update realtime tanpa refresh)
```

---

## 💻 Kebutuhan Sistem

- **Node.js**: v20.x atau v22.x+
- **Package Manager**: `pnpm` (v9 atau v12+)
- **Git**

---

## 🛠️ Panduan Menjalankan di Lokal

### 1. Clone & Masuk ke Folder Proyek
```bash
git clone https://github.com/Ajimukti-Laksono/Personal-Project-Dashboard.git
cd Personal-Project-Dashboard/personal-project-dashboard
```

### 2. Pasang Dependensi
```bash
pnpm install
```

### 3. Buat File Environment (`.env`)
Salin template `.env.example` ke `.env`:
```bash
cp .env.example .env
```

Isi variabel pada file `.env`:
```env
# Personal Access Token dari GitHub (lihat bagian panduan token di bawah)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Rahasia acak untuk validasi signature webhook (samakan dengan secret di GitHub Webhook)
GITHUB_WEBHOOK_SECRET=buat_string_rahasia_webhook_disini_12345

# Username GitHub Anda
GITHUB_USERNAME=Ajimukti-Laksono

# Password untuk login ke dashboard (minimal 8 karakter)
DASHBOARD_PASSWORD=password_rahasia_dashboard_anda

# Kunci rahasia untuk tanda tangan cookie session (minimal 32 karakter)
SESSION_SECRET=string_acak_panjang_minimal_32_karakter_untuk_keamanan_session_123

# Lokasi database SQLite
DATABASE_URL="file:./data/dashboard.db"

# URL dasar publik aplikasi (untuk lokal gunakan http://localhost:3000)
PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Siapkan Database SQLite
Inisialisasi database dan generate Prisma client:
```bash
pnpm db:push
```

### 5. Jalankan Backfill Data Awal (Opsional tapi Disarankan)
Tarik semua repositori, commit, PR, issue, dan workflow run dari akun GitHub Anda:
```bash
pnpm sync
```

### 6. Jalankan Server Development
```bash
pnpm dev
```
Buka browser di `http://localhost:3000`. Masukkan password yang telah Anda set di `DASHBOARD_PASSWORD`.

---

## 🪝 Konfigurasi Webhook di GitHub

Agar server lokal dapat menerima webhook dari GitHub saat `git push`, gunakan proxy tunnel seperti **smee.io** atau **ngrok**.

### Menggunakan Smee.io (Direkomendasikan untuk Development)
1. Kunjungi [https://smee.io](https://smee.io) dan klik **"Start a new channel"**.
2. Salin URL channel Anda (contoh: `https://smee.io/abc123xyz`).
3. Pasang smee client:
   ```bash
   pnpm add -g smee-client
   ```
4. Jalankan forwarder ke endpoint webhook lokal Anda:
   ```bash
   smee -u https://smee.io/abc123xyz -t http://localhost:3000/api/webhook
   ```
5. Di repositori GitHub Anda:
   - Masuk ke **Settings** > **Webhooks** > **Add webhook**.
   - **Payload URL**: Masukkan URL smee Anda (`https://smee.io/abc123xyz`).
   - **Content type**: Pilih `application/json`.
   - **Secret**: Masukkan nilai yang sama persis dengan `GITHUB_WEBHOOK_SECRET` di `.env` Anda.
   - **Which events would you like to trigger this webhook?**: Pilih **Let me select individual events**:
     - [x] Pushes
     - [x] Pull requests
     - [x] Issues
     - [x] Workflow runs
     - [x] Repositories
     - [x] Branch or tag creation
     - [x] Branch or tag deletion
   - Pastikan **Active** dicentang, lalu klik **Add webhook**.

### Uji Coba Cepat Tanpa Menunggu Push Asli
Jalankan script simulator webhook untuk mengetes secara lokal:
```bash
pnpm test:webhook
```
Commit palsu akan langsung muncul di dashboard Anda tanpa refresh browser!

---

## 🔑 Panduan Membuat GitHub Token

Gunakan **Fine-grained Personal Access Token** agar mematuhi prinsip izin minimal (*least privilege*):

1. Masuk ke GitHub > **Settings** > **Developer Settings** > **Personal access tokens** > **Fine-grained tokens**.
2. Klik **Generate new token**.
3. Beri nama (misal: `Personal Project Dashboard`).
4. Tentukan masa berlaku (**Expiration**).
5. Pada **Repository access**: Pilih **All repositories** (atau repositori terpilih yang ingin ditampilkan).
6. Pada **Repository permissions**, pilih izin **Read-only** untuk:
   - **Contents**: `Read-only` (untuk commit dan repositori)
   - **Metadata**: `Read-only` (wajib oleh GitHub)
   - **Issues**: `Read-only` (untuk daftar issue)
   - **Pull requests**: `Read-only` (untuk daftar PR)
   - **Actions**: `Read-only` (untuk status workflow CI)
7. Klik **Generate token**, salin hasilnya, lalu masukkan ke `GITHUB_TOKEN` di `.env`.

---

## 🌐 Setup Webhook Skala Besar

Jika Anda memiliki puluhan atau ratusan repositori:

1. **GitHub Organization Webhook**: Jika proyek berada dalam organisasi GitHub, tambahkan webhook di tingkat Organisasi (**Organization Settings > Webhooks**). Satu webhook ini akan otomatis mendengarkan semua repositori dalam organisasi.
2. **GitHub App**: Buat GitHub App internal dengan permission Webhooks dan subscribe ke event yang relevan. GitHub App dapat diinstal ke akun pengguna Anda sekaligus mencakup seluruh repositori publik dan privat.

---

## 🚢 Panduan Deploy

Aplikasi ini dirancang untuk dijalankan sebagai **satu container Docker mandiri** dengan persistent volume untuk SQLite. **JANGAN dideploy ke serverless seperti Vercel**, karena SQLite dan SSE in-memory membutuhkan proses yang persisten (*long-running process*).

### Deploy Menggunakan Docker Compose (VPS / Server Pribadi)
1. Pastikan Docker dan Docker Compose telah terpasang.
2. Clone repository dan siapkan file `.env`.
3. Jalankan container:
   ```bash
   docker compose up -d --build
   ```
4. Database SQLite akan otomatis disimpan di Docker volume `sqlite_data` dan bertahan meskipun container direstart atau di-update.
5. Periksa kesehatan container:
   ```bash
   curl http://localhost:3000/api/health
   ```

### Deploy ke Railway
1. Buat project baru di [Railway.app](https://railway.app).
2. Hubungkan repository GitHub ini.
3. Tambahkan **Volume** pada service dengan Mount Path `/app/prisma/data`.
4. Tambahkan Environment Variables sesuai daftar di `.env.example`.
5. Ubah `PUBLIC_BASE_URL` ke domain Railway Anda (misal: `https://dashboard-produksi.up.railway.app`).
6. Daftarkan URL Webhook di GitHub: `{PUBLIC_BASE_URL}/api/webhook`.

### Deploy ke Fly.io
1. Inisialisasi fly app:
   ```bash
   fly launch
   ```
2. Buat persistent storage volume untuk SQLite:
   ```bash
   fly volumes create sqlite_data --size 1
   ```
3. Kaitkan volume di file `fly.toml`:
   ```toml
   [mounts]
     source = "sqlite_data"
     destination = "/app/prisma/data"
   ```
4. Set secrets environment:
   ```bash
   fly secrets set GITHUB_TOKEN="..." GITHUB_WEBHOOK_SECRET="..." DASHBOARD_PASSWORD="..." SESSION_SECRET="..."
   ```
5. Deploy:
   ```bash
   fly deploy
   ```

---

## 🔍 Troubleshooting

### 1. Webhook Tidak Masuk ke Dashboard
- Buka repositori GitHub > **Settings** > **Webhooks** > Klik webhook Anda > Tab **Recent Deliveries**.
- Periksa status response:
  - **401 Unauthorized**: Nilai `GITHUB_WEBHOOK_SECRET` di `.env` tidak sama persis dengan **Secret** di konfigurasi webhook GitHub.
  - **Connection Refused / Timed Out**: URL payload tidak dapat dijangkau dari internet. Pastikan tunneling (smee/ngrok) atau domain publik server aktif.
  - **200 OK tapi data tidak berubah**: Periksa apakah event yang dikirim termasuk dalam daftar yang ditangani (push, pull_request, issues, workflow_run, repository).

### 2. Indikator SSE Berstatus "Reconnecting" atau "Offline"
- Pastikan reverse proxy (Nginx / Cloudflare / Caddy) tidak mem-buffer response. Header `X-Accel-Buffering: no` sudah disertakan secara otomatis oleh aplikasi.
- Pada Cloudflare, pastikan fitur buffering dimatikan untuk path `/api/events`.

### 3. Rate Limit GitHub API Terlampaui
- Dashboard otomatis membaca header `x-ratelimit-remaining` dan mengeluarkan log peringatan jika sisa request di bawah 5.
- Fine-grained token memiliki kuota 5.000 request per jam untuk akun personal. Gunakan tombol "Sync Sekarang" secara bijak.

---

## ⚠️ Batasan yang Diketahui

1. **Single Instance Architecture**: Sistem event Server-Sent Events (SSE) saat ini menggunakan in-memory singleton EventEmitter di Node.js runtime. Hal ini dirancang khusus untuk deployment **1 container / instance tunggal**. Jika aplikasi di-scale secara horizontal menjadi multi-replica (misal Kubernetes dengan 3 pod), broadcast SSE memerlukan message broker eksternal seperti Redis Pub/Sub.
2. **SQLite Concurrency**: SQLite telah dikonfigurasi dengan mode **WAL (Write-Ahead Logging)** yang mengizinkan operasi pembacaan (read) konkuren tanpa memblokir operasi penulisan (write). Namun, beberapa proses penulisan bersamaan tetap dieksekusi secara serial. Untuk ribuan webhook per detik, pertimbangkan beralih ke PostgreSQL.
