# DECISIONS.md - Keputusan Arsitektur & Desain

Log keputusan yang diambil selama pengembangan Personal Project Dashboard.

---

## D001 - Package Manager: pnpm
**Tanggal:** 2026-10-14
**Keputusan:** Menggunakan pnpm sesuai spesifikasi.
**Alasan:** Sesuai requirement, pnpm dipilih karena efisiensi disk dan kecepatan instalasi.

## D002 - Next.js 16 dengan App Router
**Tanggal:** 2026-10-14
**Keputusan:** Menggunakan Next.js 16.4.0 (versi terbaru stabil saat ini) dengan App Router dan src directory.
**Alasan:** Versi terbaru stabil dari Next.js yang mendukung App Router secara penuh.

## D003 - TypeScript Strict Mode
**Tanggal:** 2026-10-14
**Keputusan:** `"strict": true` di tsconfig.json (sudah default dari create-next-app).
**Alasan:** Sesuai requirement. Mengurangi bug runtime dengan type safety yang lebih ketat.

## D004 - SQLite Database Path
**Tanggal:** 2026-10-14
**Keputusan:** Default DATABASE_URL = `file:./data/dashboard.db`, disimpan di subfolder `data/`.
**Alasan:** Memudahkan Docker volume mount dan memisahkan data dari kode.

## D005 - Session Secret Minimum Length
**Tanggal:** 2026-10-14
**Keputusan:** SESSION_SECRET minimal 32 karakter.
**Alasan:** Cukup panjang untuk keamanan HMAC signing tanpa terlalu memberatkan setup.

## D006 - Prisma ORM Versi 6.19.3 (Stable)
**Tanggal:** 2026-10-14
**Keputusan:** Menggunakan `@prisma/client@6.19.3` dan `prisma@6.19.3` (stable Prisma ORM).
**Alasan:** Prisma v8-rc mengubah CLI menjadi Prisma Platform cloud composer. Prisma v6.19.3 adalah versi stabil terbaru dari Prisma ORM tradisional dengan dukungan penuh untuk SQLite, migrations, push, dan schema engine lokal.

## D007 - SQLite WAL Mode & BigInt Serialization
**Tanggal:** 2026-10-14
**Keputusan:** 
1. Mengaktifkan `PRAGMA journal_mode = WAL;`, `PRAGMA synchronous = NORMAL;`, dan `PRAGMA foreign_keys = ON;` saat inisialisasi client.
2. Menyediakan helper `serializeForClient()` untuk mengonversi `BigInt` (GitHub ID) menjadi `string` sebelum JSON response agar aman dan tidak melempar TypeError.
**Alasan:** WAL mode memastikan performa tinggi dan konkurensi read-while-write pada SQLite. GitHub ID menggunakan bilangan 64-bit yang membutuhkan BigInt di Prisma/SQLite.

## D008 - Migrasi Next.js 16 Proxy Convention
**Tanggal:** 2026-10-15
**Keputusan:** Memigrasikan konvensi `src/middleware.ts` ke `src/proxy.ts` dengan export fungsi `proxy()`.
**Alasan:** Next.js 16 secara resmi mendepresiasi konvensi `middleware` demi kejelasan network boundary di layer gateway proxy. Menghilangkan peringatan deprecation pada runtime dev dan production build.

## D009 - Web Audio API Chime & Desktop Push Notifications
**Tanggal:** 2026-10-15
**Keputusan:** Menggunakan native browser Web Audio API oscillator synthesizer untuk audio chime tanpa dependensi asset file audio eksternal, dan integrasi Notification API untuk desktop alert saat event SSE masuk.
**Alasan:** Mengeliminasi kegagalan 404 pada aset file audio dan memungkinkan notifikasi real-time saat user sedang berpindah tab atau aplikasi.

## D010 - Diagnostik Webhook & Simulator UI
**Tanggal:** 2026-10-15
**Keputusan:** Menyediakan modal diagnostik webhook di UI serta endpoint `GET /api/webhook/history` dan `POST /api/webhook/history` untuk simulator pengujian webhook instan.
**Alasan:** Memudahkan pengujian pipeline real-time secara lokal tanpa harus melakukan git push asli berulang kali ke repositori GitHub.

## D011 - Ekspor Data (CSV & JSON) & Filter Rentang Waktu Dinamis
**Tanggal:** 2026-10-15
**Keputusan:** Menambahkan fungsi unduh laporan repositori (CSV dan JSON) dan memperluas grafik analitik komit harian ke opsi 7 hari, 14 hari, dan 30 hari.
**Alasan:** Memenuhi kebutuhan reporting dan portofolio bagi pengembang serta memberikan fleksibilitas analisis tren aktivitas.

## D012 - Pinned Repositories, One-Click Webhook Setup, & Actionable CI/CD Re-run
**Tanggal:** 2026-10-16
**Keputusan:**
1. Menambahkan kolom `isPinned` (Boolean, default `false`) pada model `Repository` di SQLite, dengan sorting prioritas ke atas di daftar kartu dan opsi filter khusus 'Disematkan'.
2. Mengintegrasikan endpoint `POST /api/repos/[id]/webhook` menggunakan Octokit REST API untuk mendaftarkan dan mengonfigurasi webhook GitHub secara instan dengan 1-klik tanpa perlu copy-paste manual di tab GitHub.
3. Menambahkan tombol aksi `Re-run` pada tab CI Workflow di modal detail repositori yang memanggil endpoint `POST /api/repos/[id]/actions/[runId]/rerun` dan memicu ulang GitHub Actions langsung dari dashboard.
**Alasan:** Meningkatkan efisiensi kerja sehari-hari, menghilangkan friksi pendaftaran webhook manual, dan mengubah dashboard dari sekadar read-only menjadi actionable tool.


