# Panduan Deployment & Arsitektur Hash Routing GitHub Pages (`/SymposiumApp/`)

Dokumen ini menjelaskan cara kerja *deployment* dan sistem navigasi *Single-Page Application* (SPA) pada aplikasi **KIVNAHK IV & MUNAS V ADHPHKI 2026** di GitHub Pages:
👉 **`https://pranowo2304.github.io/SymposiumApp/`**

---

## 1. Verifikasi Sistem Navigasi Berbasis URL Hash (`#`)

Karena GitHub Pages adalah layanan *static file hosting* yang tidak memiliki *server-side router* dinamis, penggunaan URL path standar (seperti `/SymposiumApp/symposium` atau `history.pushState`) dapat memicu permintaan HTTP ke file fisik yang tidak ada saat pengguna melakukan *refresh* atau membagikan tautan.

Oleh karena itu, aplikasi ini **secara konsisten menggunakan URL Hash (`window.location.hash`)** yang dikelola terpusat di **`src/utils/hashRouter.ts`** dan **`src/App.tsx`**:

| Menu / Halaman Aplikasi | URL Hash Kanonik | Contoh URL Lengkap di GitHub Pages |
| :--- | :--- | :--- |
| **Beranda (Landing Page)** | `#home` | `https://pranowo2304.github.io/SymposiumApp/#home` |
| **Daftar Speaker** | `#speaker` | `https://pranowo2304.github.io/SymposiumApp/#speaker` |
| **Jadwal Workshop** | `#workshop` | `https://pranowo2304.github.io/SymposiumApp/#workshop` |
| **Jadwal Symposium** | `#symposium` | `https://pranowo2304.github.io/SymposiumApp/#symposium` |
| **Pameran (Exhibition)** | `#pameran` | `https://pranowo2304.github.io/SymposiumApp/#pameran` |
| **Denah Venue (Interactive Map)** | `#venue` | `https://pranowo2304.github.io/SymposiumApp/#venue` |
| **Jadwal Saya (Bookmark)** | `#jadwal-saya` | `https://pranowo2304.github.io/SymposiumApp/#jadwal-saya` |
| **Panel Admin** | `#admin` | `https://pranowo2304.github.io/SymposiumApp/#admin` |

### Detail Implementasi Hash Routing:
1. **`src/utils/hashRouter.ts`**:
   - Menyediakan `parseTabFromHash()`, `formatTabHash()`, `syncTabToUrlHash()`, dan `buildShareableHashUrl()`.
   - Tidak ada pemanggilan `history.pushState` atau `history.replaceState` yang mengubah `window.location.pathname`.
2. **Sinkronisasi Dua Arah di `src/App.tsx`**:
   - Saat aplikasi pertama kali dibuka (misalnya dari link `.../#symposium`), state `activeTab` langsung membaca hash tersebut.
   - Setiap perpindahan menu melalui **Header**, **Landing Page**, **MainMenuTabs**, **BottomDock**, maupun **Toast Broadcast** memanggil `navigateToTab(tab)` yang memperbarui `window.location.hash` ke `#<tab>` sekaligus menjalankan animasi *slide* Framer Motion.
   - Event listener `window.addEventListener('hashchange', ...)` memastikan tombol **Back / Forward** pada browser ponsel maupun desktop berpindah antar-tab dengan mulus.
3. **Tautan Berbagi WhatsApp (`src/utils/whatsappShare.ts`)**:
   - Menggunakan `buildShareableHashUrl('workshop' | 'symposium')` sehingga tautan yang dibagikan ke peserta selalu menyertakan *subpath* repositori dan hash tab (contoh: `https://pranowo2304.github.io/SymposiumApp/#symposium`).

---

## 2. Mengapa Project Site GitHub Pages Membutuhkan Base Path `/SymposiumApp/`?

GitHub Pages menyajikan *project repository* dari sub-path nama repositori (`https://<username>.github.io/<repo-name>/`), sedangkan file statis hasil *build* disajikan dari **root (`/(root)`)** branch publikasi (`gh-pages`) atau *artifact* GitHub Actions:

1. **Base Path `/SymposiumApp/` (`VITE_BASE_PATH`)**:
   - Di `vite.config.ts`, konfigurasi menggunakan `const basePath = process.env.VITE_BASE_PATH || './';`.
   - Saat di-*build* untuk GitHub Pages melalui `npm run build:gh-pages` atau GitHub Actions, `VITE_BASE_PATH` otomatis diset ke **`/SymposiumApp/`**.
   - Dengan demikian, `index.html`, `manifest.webmanifest`, dan Service Worker (`sw.js`) memuat seluruh aset dari `/SymposiumApp/assets/...` dan mendaftarkan *PWA scope* pada `/SymposiumApp/`.
2. **Penyajian File Statis dari Root Branch `gh-pages`**:
   - Script `scripts/deploy-gh-pages.mjs` dan workflow `.github/workflows/deploy.yml` men-*compile* aplikasi ke folder `dist/`, membuat `404.html` dan `.nojekyll`, lalu menyalin **isi folder `dist/` langsung ke root (`/`) branch `gh-pages`**.

---

## 3. Cara Mengaktifkan Website di GitHub (Hanya 1 Kali Pengaturan)

Untuk mengaktifkan URL **`https://pranowo2304.github.io/SymposiumApp/`**, lakukan langkah berikut di GitHub:

1. Buka halaman pengaturan Pages repositori Anda:
   👉 **[https://github.com/pranowo2304/SymposiumApp/settings/pages](https://github.com/pranowo2304/SymposiumApp/settings/pages)**
2. Pada bagian **Build and deployment** -> **Source**, pastikan dipilih **Deploy from a branch**.
3. Pada bagian **Branch**:
   - Ubah pilihan branch dari `None` (atau `main`) menjadi **`gh-pages`**.
   - Pastikan folder di sebelahnya tetap **`/ (root)`**.
   - Klik tombol **Save**.
4. *(Alternatif)* Anda juga dapat mengubah **Source** menjadi **GitHub Actions**.
5. Tunggu sekitar **30–60 detik**, lalu buka:
   👉 **`https://pranowo2304.github.io/SymposiumApp/#home`**

---

## 4. Perintah Script Deployment Manual (Opsional via Terminal Lokal)

```bash
# 1. Install dependencies
npm install

# 2. Build khusus untuk GitHub Pages (otomatis mendeteksi base path /SymposiumApp/)
npm run build:gh-pages

# 3. Build sekaligus push isi folder dist/ ke root branch gh-pages
npm run deploy:gh-pages
```
