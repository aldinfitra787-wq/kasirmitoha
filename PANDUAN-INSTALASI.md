# Panduan Instalasi — DapoerMitoha Seblak Cloud POS v2.4

Aplikasi kasir (POS) berbasis web: **frontend statis di GitHub Pages** + **Google Apps Script sebagai REST API** + **Google Sheets sebagai database**.

| Bagian | Isi | Dipasang di |
|---|---|---|
| Frontend | `index.html`, `css/`, `js/` (folder ZIP ini) | GitHub Pages |
| Backend | `Kode.gs`, `Migrasi.gs`, `DocEngine.gs`, `appsscript.json` (berkas terpisah) | script.google.com |

> **Coba dulu tanpa instalasi:** buka `index.html` lewat GitHub Pages (atau server lokal) dengan `GAS_URL` masih kosong → aplikasi berjalan dalam **Mode Demo** dengan data contoh 8 hari. Akun demo: Kasir `kasir01@dapoermitoha.internal` / `111111`, Supervisor `spv01@dapoermitoha.internal` / `222222`, Owner `owner@dapoermitoha.internal` / `123456`. Data demo hanya tersimpan di peramban itu.

---

## Tahap 1 — Backend (Google Apps Script)

1. Buka <https://script.google.com> → **Proyek baru**. Beri nama `DapoerMitoha POS API`.
2. Rename `Code.gs` menjadi **`Kode`**, hapus isinya, tempel seluruh isi **`Kode.gs`**.
3. Klik **+ → Skrip**, beri nama **`Migrasi`**, tempel isi **`Migrasi.gs`**.
4. Klik **+ → Skrip**, beri nama **`DocEngine`**, tempel isi **`DocEngine.gs`**.
5. **Setelan proyek (ikon roda gigi)** → centang **“Tampilkan file manifes appsscript.json”** → buka `appsscript.json` di editor → ganti isinya dengan **`appsscript.json`** yang disediakan (zona waktu `Asia/Jakarta`, izin Sheets/Drive/Docs/Slides).
6. Pilih fungsi **`setupAppEnvironment`** di dropdown → **▶ Jalankan** → **Tinjau izin** → izinkan.
   - Jalankan **SEKALI saja**. Log harus menampilkan ✅ beserta URL spreadsheet & folder Drive.
   - Yang dibuat otomatis: folder `📁 DapoerMitoha POS` (berisi `Foto Menu`, `Dokumen Terbit`, `Template Dokumen`), spreadsheet database dengan sheet `AppConfig, Users, Produk, Transaksi, Shift, StokLog, Logs` + sheet `DE_*` untuk dokumen, 12 menu contoh, dan pemicu `flushLogs` tiap 5 menit.
   - **Akun awal** (tercetak di log): Owner = email Google Anda / PIN `123456`, Supervisor `spv01@dapoermitoha.internal` / `222222`, Kasir `kasir01@dapoermitoha.internal` / `111111`. **Segera ganti semua PIN** (menu avatar → Ganti PIN saya, atau menu Pengguna).
7. **Deploy → Deployment baru → jenis: Aplikasi web**
   - Jalankan sebagai: **Saya**
   - Siapa yang memiliki akses: **Siapa saja**
   - Klik **Deploy** → salin **URL yang berakhiran `/exec`**.

> **Update kode di kemudian hari:** gunakan **Deploy → Kelola deployment → ✏️ Edit → Versi: Versi baru → Deploy**. Jangan membuat “Deployment baru”, karena URL `/exec` akan berubah dan frontend berhenti bekerja.
>
> Setelah upgrade yang menambah kolom/sheet, jalankan **`migrateSchema()`** dan **`DE_MIGRASI()`** (aman diulang, hanya menambah).

## Tahap 2 — Hubungkan frontend

Buka `js/config.js`, isi:

```js
GAS_URL: 'https://script.google.com/macros/s/AKfycb..../exec',
```

Itu satu-satunya berkas yang perlu diedit.

## Tahap 3 — Deploy ke GitHub Pages

**Folder kerja = folder hasil ekstrak ZIP ini** (yang langsung berisi `index.html`, `css/`, `js/`). Di folder inilah `git init` dijalankan — jangan naik satu tingkat.

```bash
cd "C:\path\ke\dapoermitoha-pos"   # folder yang berisi index.html
dir                                 # (Mac/Linux: ls) pastikan index.html terlihat di sini
git init
git add .
git commit -m "Upload pertama"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main             # password = Personal Access Token (scope: repo)
```

Lalu di GitHub: **Settings → Pages → Deploy from a branch → `main` / `(root)` → Save**, centang **Enforce HTTPS**. Situs aktif di `https://USERNAME.github.io/NAMA-REPO/` dalam 1–2 menit.

Update berikutnya cukup: `git add .` → `git commit -m "update"` → `git push`. Jika tampilan belum berubah, tekan **Ctrl+Shift+R**.

> Jangan pernah mengunggah lewat tombol “Upload files” di web GitHub — struktur folder `css/` dan `js/` akan rusak (halaman tampil tanpa gaya).

## Tahap 4 — Setelan pertama (login sebagai Owner)

1. **Pengaturan**: isi nama outlet, cabang, alamat, telepon, ID terminal, PPN, target omzet, modal awal, kategori menu, teks struk.
2. **Pengaturan → `VERIFY_BASE_URL`** → klik **“Gunakan alamat ini”** (alamat GitHub Pages Anda). Ini alamat yang dituju QR verifikasi dokumen.
3. **Pengguna**: tambah kasir & supervisor, beri PIN 6 angka. Supervisor/Owner adalah verifikator PIN untuk void & tutup shift.
4. **Produk & Stok**: hapus/ubah menu contoh, unggah foto (otomatis dikompres ±1200 px dan disimpan di Drive).
5. (Opsional) **Login Google Workspace**: buat OAuth Client ID tipe *Web* di Google Cloud Console dengan *Authorized JavaScript origin* = `https://USERNAME.github.io`, isi `GOOGLE_CLIENT_ID` (dan `EMAIL_DOMAIN` bila wajib domain tertentu). Email Google staf harus sudah terdaftar di menu Pengguna.

## Alur kerja harian

1. Kasir login → **Buka Shift** (hitung modal awal laci).
2. **Kasir**: ketuk menu (seblak → pilih level pedas Lv 0–5 + catatan dapur), atau pindai barcode (pemindai USB/Bluetooth langsung bekerja). Diskon, Hold Order, Dine-in/Take Away/Online.
3. **Bayar (F8)**: Tunai (chip uang pas/bulat/lembar), EDC, QRIS (F4), E-Wallet, atau Split. Harga, PPN, dan stok **dihitung ulang di server**; tombol aman diulang (tidak menimbulkan transaksi ganda saat sinyal putus).
4. **Struk**: cetak 80 mm / 58 mm lewat dialog cetak (pilih printer thermal Anda), salinan dapur (KOT), kirim WhatsApp, void dengan PIN supervisor.
5. **Tutup Shift**: hitung denominasi uang di laci → selisih otomatis (Seimbang/Kurang/Lebih) → PIN supervisor → Z-Report tercetak.

## Modul Dokumen Cetak (template kustom)

Menu **Dokumen Cetak → Kelola Template → “Buat Template Contoh”** membuat 4 template siap pakai di folder Drive `Template Dokumen`:

| Kode | Dokumen | Sumber data | Keluaran |
|---|---|---|---|
| `ZREPORT` | Z-Report tutup shift (A4) | Shift | PDF |
| `NOTA` | Nota / invoice transaksi A4 | Transaksi | PDF, DOCX |
| `REKAP` | Rekap penjualan periode | Laporan | XLSX, PDF |
| `PESANAN` | Surat pesanan bahan ke supplier | Isian manual | PDF, DOCX |

Membuat template sendiri: desain di Google Docs/Sheets/Slides, tulis placeholder, lalu daftarkan URL-nya di **Kelola Template** (sistem memindai placeholder dan membuat form isian otomatis).

- Nilai: `{{NAMA_SUPPLIER}}`, `{{TOTAL|rupiah}}`, `{{TOTAL|terbilang:rupiah}}`, `{{TGL_KIRIM|tanggal}}`, `{{WAKTU_TRX|tanggal:dd/MM/yyyy HH:mm}}`, `{{NAMA|kapital}}`, `{{X|bawaan:-}}`
- Baris tabel berulang: sel pertama `{{#ITEM}}{{NO}}`, kolom `{{ITEM.NAMA}}`, `{{ITEM.QTY}}`
- Bagian opsional (Docs): `{{?CATATAN}}` … `{{/CATATAN}}` (dihapus bila kosong)
- Sistem: `{{NOMOR}}` `{{TANGGAL}}` `{{HARI}}` `{{QR}}` `{{KODE_VERIFIKASI}}` `{{URL_VERIFIKASI}}` `{{INSTITUSI_NAMA}}` `{{INSTITUSI_ALAMAT}}`
- Penanda tangan: `{{NAMA_PEJABAT_1}}` `{{JABATAN_1}}` `{{KODE_PEJABAT_1}}` `{{TTD_1}}` `{{WAKTU_TTD_1}}` (slot 2, 3, … dengan akhiran `_2`, `_3`)

Saat terbit: nomor diambil otomatis per template per tahun, penanda tangan menyetujui dengan **PIN** (Owner dapat mengesahkan tanpa PIN dengan alasan → tercatat `BYPASS`), dokumen diberi **QR verifikasi** yang membuka `…/#/v/KODE`. Halaman verifikasi menampilkan status SAH/DITARIK dan dapat mencocokkan sidik jari SHA-256 berkas PDF. Dokumen yang salah ditarik dari **Arsip Dokumen** (wajib alasan).

## Migrasi dari app POS lama

Menu **Migrasi Data** (Owner):

1. Tempel URL spreadsheet app lama (harus milik/dibagikan ke akun pemilik backend ini — gunakan akun Google yang sama agar ID foto Drive tetap terbaca).
2. Centang data yang diambil (Users, Produk, Shift, Transaksi, StokLog) → **Pindai (Dry-run)**: tampil jumlah ditambah/diperbarui/dilewati + kolom yang terdeteksi + peringatan, tanpa menulis apa pun. Pilih nama sheet sumber bila berbeda.
3. **Jalankan Import**. Header dibaca berdasarkan nama (alias umum seperti “Nama Menu”, “Harga Jual”, “No Struk” otomatis dikenali). Import ulang tidak menggandakan data.
4. Tepat sebelum pindah, **jalankan import sekali lagi** (delta sync).

Ada juga **Import CSV** untuk Produk/Users (template CSV bisa diunduh).

Catatan: akun OWNER lama diturunkan menjadi SUPERVISOR; staf tanpa PIN harus diberi PIN di menu Pengguna; sesi login lama tidak ikut pindah; shift lama selalu berstatus ditutup.

## Performa (sudah diterapkan)

- Login mengembalikan seluruh data layar pertama dalam **1 panggilan**; data tersimpan di perangkat sehingga membuka ulang aplikasi tampil < 1 detik.
- Pindah menu merender dari cache lebih dulu (tanpa spinner), lalu menyegarkan di latar hanya bila sudah lewat batas kesegaran.
- Dashboard & laporan di-*prefetch* lewat satu panggilan `batch` saat perangkat senggang.
- Server: cache berversi + memo per eksekusi, log ditulis bertahap oleh pemicu, token HMAC tanpa penyimpanan sesi, transaksi idempoten (`reqId`).
- Diagnostik: **Pengaturan → Diagnostik Performa**, atau ketik `Perf.table()` di Console.

## Pemecahan masalah

| Gejala | Penyebab & solusi |
|---|---|
| Situs 404 | `index.html` tidak di root repo → push dari folder yang berisi `index.html` |
| Tampil tanpa gaya | Folder `css/` `js/` rusak (upload via web) → push ulang lewat terminal |
| “Server membalas HTTP … bukan JSON” | `GAS_URL` salah, atau deployment belum “Siapa saja” |
| Masih Mode Demo | `GAS_URL` di `js/config.js` masih kosong |
| “Backend belum di-setup” | `setupAppEnvironment()` belum dijalankan |
| Perubahan backend tidak berlaku | Deploy ulang via **Kelola deployment → Versi baru** |
| Foto menu tidak tampil | Kebijakan Workspace memblokir berbagi “siapa saja yang memiliki link” |
| Login Google gagal | Origin GitHub Pages belum didaftarkan di OAuth Client ID |
| Template tidak terbaca | Berkas Word/Excel → buka di Drive lalu *File → Simpan sebagai Google Docs/Sheets* |

## Batasan yang perlu diketahui

- **Cetak thermal** memakai dialog cetak peramban (driver printer OS). Perintah ESC/POS mentah (buka laci otomatis, potong kertas) bergantung pada pengaturan driver printer Anda.
- **QR verifikasi** dibuat di peramban (pustaka qrcode-generator dari cdnjs); bila CDN tidak terjangkau, dokumen tetap terbit dengan kode verifikasi tertulis.
- **Tanda tangan elektronik** di modul dokumen (PIN + QR) termasuk TTE *tidak tersertifikasi* menurut PP 71/2019 — cocok untuk dokumen internal (Z-Report, rekap, surat pesanan). Untuk dokumen berkekuatan hukum penuh diperlukan PSrE tersertifikasi. Ini bukan nasihat hukum.
- Kuota Apps Script akun gratis (±30 eksekusi serentak, 6 menit per eksekusi) cukup untuk 1–3 terminal per outlet. Untuk banyak cabang, pertimbangkan satu backend per cabang.
