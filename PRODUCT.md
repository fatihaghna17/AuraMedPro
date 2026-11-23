# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Mahasiswa kedokteran yang sedang persiapan UKMPPD. Banyak belajar lewat HP (PWA), sering di sela waktu (koas, perjalanan, sebelum tidur), dan butuh mengulang materi dalam jumlah besar secara cepat.

## Product Purpose

AuraMed PRO adalah platform latihan soal CBT: bank soal MCQ dan Isian Singkat, kuis, pembahasan, catatan, grup belajar, analisis performa, dan Spaced Repetition (SM-2). Sukses berarti user bisa mengulang dan menguasai materi UKMPPD secara konsisten dan terukur.

## Operating Context

- Bank soal diimpor sebagai JSON (template di `public/template_mcq.json`, `public/template_flashcard.json`) dan bisa digenerate lewat prompt AI (`public/panduan_flashcard.md`).
- Navigasi utama: Beranda, Bank Soal, Mulai Kuis, SRS, Study Room & Catatan, Grup Belajar, Analisis, Profil.
- Backend Cloudflare Pages Functions + D1; penyimpanan lokal IndexedDB.

## Capabilities and Constraints

- Fitur "Flashcard" lama = Isian Singkat (ketik jawaban, 3 hint bertahap). **Wajib dipertahankan**, tidak diganti.
- Fitur baru (direncanakan): Flashcard 3D bolak-balik dengan menu sendiri; depan berisi pertanyaan dan/atau gambar, belakang berisi keterangan; user menandai "Hafal" / "Belum hafal". Kartu dibuat via JSON massal maupun editor di app.
- Ada mode terang (Catppuccin Latte) dan gelap (Catppuccin Mocha).

## Brand Commitments

- Nama: AuraMed PRO. Bahasa antarmuka: Bahasa Indonesia.
- User secara eksplisit meminta arah UI: estetik minimalis, liquid glass, dinamis.

## Evidence on Hand

- Contoh deck nyata: "Kunci Latihan Soal 2018" (105 kartu).
- Belum ada data statistik penggunaan atau testimoni; jangan difabrikasi.
