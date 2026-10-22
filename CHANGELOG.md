# Changelog

## 2026-10-22

Clone section 1–3 dari [stillminds.webflow.io](https://stillminds.webflow.io/) ke vanilla HTML/CSS/JS, lalu eksplorasi interaksi untuk section 2.

### Ditambahkan

**Struktur awal**
- `index.html` + `style.css`: Hero, About, How We Can Help. Hanya breakpoint desktop (aturan dasar Webflow, tanpa media query).
- Ukuran font fluid pakai `clamp()` (dihitung dari variabel tipografi Webflow). Di 1440px hasilnya sama dengan aslinya.
- `.claude/launch.json`: local server (`python3 -m http.server`, port 5173) supaya `style.css` dan `script.js` ter-load di preview.

**Section 2: hover lingkaran** (dari Webflow IX `t-704bc364`, CSS saja)
- Foto muncul, dot berputar di garis lingkaran, teks berubah jadi krem.
- Saat mouse keluar, animasinya mundur 2× lebih cepat, sama seperti aslinya.

**Section 2: interaksi yang selalu aktif** (`script.js`)
- **Heading:** tiga baris heading naik dari mask secara bergantian, diputar ulang tiap kali masuk viewport.
- **Lingkaran merapat:** kiri/kanan bergeser dari ±140px ke posisi overlap mengikuti scroll, lingkaran tengah membesar dari 0.88 ke 1, opacity dari 0.25 ke 1.
- **Lingkaran memisah lagi:** saat section di-scroll ke atas dan keluar, lingkaran bergeser menjauh lagi. Opacity tetap 100% saat keluar.
- **Orbit dot:** dot terus berputar pelan (14°/detik).
  - Saat di-scroll (ke atas atau ke bawah), putarannya makin cepat, maksimal +400°/detik, lalu kembali pelan setelah scroll berhenti.
  - Saat lingkaran di-hover, dot meluncur ke arah kursor.
- **Parallax kursor:** teks dan foto bergeser sedikit, berlawanan arah, mengikuti kursor.
- **Stats:** angka naik dari 0 dengan jeda bertahap (stagger), dan garis tipis tergambar di atas tiap stat. Lebar tiap stat dikunci supaya stat di sebelahnya tidak ikut bergeser.
- **Lingkaran yang di-hover selalu di atas** (`z-index`), jadi dot dari lingkaran lain tidak lewat di atas fotonya. `z-index` baru turun lagi setelah fade-out selesai (0.35 detik).
- Kelas `.has-fx` dipasang oleh JS. Kalau JS gagal jalan, heading tetap terlihat dan hover tetap fade biasa.

**Masuknya foto di lingkaran (zoom + fade + blur)**
- Tiga arah:
  - **In:** disc mekar dari tengah (0.4 → 1).
  - **Out · Photo:** foto di dalam lingkaran mengecil dari ukuran besar. Mendarat di 1.15 supaya overshoot easing tidak menyisakan celah di pinggir.
  - **Out · Disc:** seluruh disc mengecil dari 1.5 ke 1.15, dipotong pas di garis lingkaran (`@property --disc` + `clip-path`).
- Empat easing untuk zoom-nya: Expo, Quart, Back (overshoot), Spring (`linear()`).
- Zoom memakai properti `scale` terpisah, jadi tidak bentrok dengan `transform` untuk parallax.

**Switcher (alat bantu dev, di bawah layar)**
- **Zoom:** In / Out · Photo / Out · Disc. Ditambah slider ukuran awal Out · Photo (1.2×–3×).
- **Ease:** Expo / Quart / Back / Spring.
- **Follow:** On / Off. Off membuat dot tetap orbit saat di-hover dan tidak mengikuti kursor.
- Pilihan tersimpan di URL, contoh `?zoom=out-photo&ease=spring&follow=on&from=2.6`.
- Switcher turun baris otomatis kalau layarnya sempit.

### Diubah
- Nama class variant Webflow (`w-variant-xxxx`) diganti jadi `is-dark`, `is-negative`, `is-alt`.
- Navbar pakai `position: absolute`, bukan `fixed`. Di aslinya navbar berganti ke versi gelap saat lewat section terang (pakai JS), dan perilaku itu tidak dibawa.
- Label switcher dari `light-50` ke `light-80` supaya lolos kontras (sebelumnya 3.7:1).

### Dihapus
- Elemen yang cuma ada untuk animasi Webflow: `button_fill`, `button_text-hover`, ikon panah di tombol.
- Slideshow di section 3: hanya gambar pertama (`help-1.png`) yang dipakai.
- Tombol "Learn More" di help card (di aslinya baru muncul saat hover).
- Varian reveal yang dicoba lalu tidak dipakai: Fade, Iris, Sweep, Rise.

### Belum selesai
- **TODO(human)** di `.help_images` (`style.css`): posisi gambar di tengah grid section 3 belum diisi, jadi layout section 3 masih berantakan.
- **Switcher** masih ada. Setelah kombinasi zoom, easing, dan ukuran awal dipilih, nilainya dikunci di CSS dan switcher-nya dihapus.
- **Temuan hook desain** (letter-spacing h1, padding, Plus Jakarta Sans, palet krem) dibiarkan karena berasal dari desain asli.
