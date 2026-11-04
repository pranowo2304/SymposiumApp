# Panduan Deployment GitHub Pages (`/SymposiumApp/`)

Dokumen ini menjelaskan cara kerja *deployment* aplikasi **KIVNAHK IV & MUNAS V ADHPHKI 2026** ke GitHub Pages pada URL:
👉 **`https://pranowo2304.github.io/SymposiumApp/`**

---

## 1. Mengapa Project Site GitHub Pages Membutuhkan Base Path `/SymposiumApp/`?

GitHub Pages menyajikan *project repository* dari sub-path nama repositori (`https://<username>.github.io/<repo-name>/`), sedangkan file statis hasil *build* harus disajikan dari **root (`/(root)`)** branch publikasi (`gh-pages`) atau *artifact* GitHub Actions:

1. **Base Path `/SymposiumApp/` (`VITE_BASE_PATH`)**:
   - Di `vite.config.ts`, konfigurasi menggunakan `const basePath = process.env.VITE_BASE_PATH || './';`.
   - Saat di-*build* untuk GitHub Pages melalui `npm run build:gh-pages` atau GitHub Actions, `VITE_BASE_PATH` otomatis diset ke **`/SymposiumApp/`**.
   - Dengan demikian, `index.html`, `manifest.webmanifest`, dan Service Worker (`sw.js`) memuat seluruh aset dari `/SymposiumApp/assets/...` dan mendaftarkan *PWA scope* pada `/SymposiumApp/`, sehingga tetap berjalan mulus baik ketika pengunjung membuka `https://pranowo2304.github.io/SymposiumApp` (tanpa garis miring di akhir) maupun `https://pranowo2304.github.io/SymposiumApp/`.
2. **Penyajian File Statis dari Root Branch `gh-pages`**:
   - Jika GitHub Pages diarahkan ke branch `main`, GitHub akan membaca `index.html` mentah yang memanggil `./src/main.tsx` (file TypeScript yang belum di-*compile*), bukan hasil *build* di `dist/`.
   - Oleh karena itu, script `scripts/deploy-gh-pages.mjs` dan workflow `.github/workflows/deploy.yml` men-*compile* aplikasi ke folder `dist/`, membuat `404.html` dan `.nojekyll`, lalu menyalin **isi folder `dist/` langsung ke root (`/`) branch `gh-pages`**.

---

## 2. Cara Mengaktifkan Website di GitHub (Hanya 1 Kali Pengaturan)

Workflow GitHub Actions pada repositori `pranowo2304/SymposiumApp` **sudah berhasil membuat branch `gh-pages`** yang berisi file statis siap pakai di root branch tersebut.

Untuk mengaktifkan URL **`https://pranowo2304.github.io/SymposiumApp/`**, lakukan langkah berikut di GitHub:

1. Buka halaman pengaturan Pages repositori Anda:
   👉 **[https://github.com/pranowo2304/SymposiumApp/settings/pages](https://github.com/pranowo2304/SymposiumApp/settings/pages)**
2. Pada bagian **Build and deployment** -> **Source**, pastikan dipilih **Deploy from a branch**.
3. Pada bagian **Branch**:
   - Ubah pilihan branch dari `None` (atau `main`) menjadi **`gh-pages`**.
   - Pastikan folder di sebelahnya tetap **`/ (root)`**.
   - Klik tombol **Save**.
4. *(Alternatif)* Anda juga dapat mengubah **Source** menjadi **GitHub Actions** — workflow `.github/workflows/deploy.yml` mendukung keduanya secara bersamaan.
5. Tunggu sekitar **30–60 detik**, lalu buka:
   👉 **`https://pranowo2304.github.io/SymposiumApp/`**

---

## 3. Perintah Script Deployment Manual (Opsional via Terminal Lokal)

Jika Anda menjalankan proyek ini di komputer lokal dan ingin men-*deploy* langsung ke GitHub Pages:

```bash
# 1. Install dependencies
npm install

# 2. Build khusus untuk GitHub Pages (otomatis mendeteksi base path /SymposiumApp/)
npm run build:gh-pages

# 3. Build sekaligus push isi folder dist/ ke root branch gh-pages
npm run deploy:gh-pages
```

Anda juga dapat menentukan *base path* kustom bila nama repositori berubah:

```bash
node scripts/deploy-gh-pages.mjs --base=/NamaRepoBaru/ --push
```
