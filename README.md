# DapoerMitoha Seblak Cloud POS

Kasir web untuk outlet seblak: transaksi dengan level pedas, struk thermal 80/58 mm, stok, laporan, rekonsiliasi & tutup shift, dokumen cetak ber-QR dari template Google, dan migrasi data dari app lama.

- **Frontend:** HTML/CSS/JS vanilla (folder ini) → GitHub Pages
- **Backend:** Google Apps Script REST API + Google Sheets (berkas `.gs` disediakan terpisah)
- **Konfigurasi:** hanya `js/config.js` → `GAS_URL`. Kosong = Mode Demo.

Struktur:

```
index.html
css/style.css
js/config.js       ← isi GAS_URL di sini
js/icons.js        ikon garis (tanpa pustaka)
js/core.js         api() timeout/retry/reqId, cache SWR, router SPA
js/charts.js       grafik SVG ringan
js/shell.js        sidebar, topbar, pintasan keyboard, pemindai barcode
js/pages.js        login, dashboard, kasir, pembayaran, struk, tutup shift, verifikasi
js/pages-admin.js  produk, laporan, dokumen, migrasi, pengguna, pengaturan
js/demo.js         mode demo (dimuat hanya bila GAS_URL kosong)
```

Langkah lengkap: lihat **PANDUAN-INSTALASI.md**.

Pintasan: `F2` cari/scan · `Ctrl+K` cari menu · `F4` QRIS · `F8` bayar · `Enter` konfirmasi · `Esc` tutup · `Ctrl+P` cetak struk.
