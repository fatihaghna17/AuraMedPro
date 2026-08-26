# Panduan Pembuatan Flashcard (Isian Singkat): AuraMed PRO

Gunakan panduan dan instruksi prompt di bawah ini untuk menginstruksikan AI menghasilkan bank soal tipe **Flashcard / Isian Singkat** dalam format JSON yang ringkas, kompatibel, dan efisien.

---

## 📋 Prompt Generator Flashcard (Siap Copy-Paste ke AI)

> **Prompt Instruksi AI:**
> 
> "Bertindaklah sebagai ahli pembuat soal kedokteran. Hasilkan kumpulan flashcard (isian singkat medis) berkualitas tinggi dalam format JSON dengan mengikuti aturan ketat berikut:
> 
> ### ATURAN KONTEN FLASHCARD:
> 1. **Clue (Vignette Klinis & Edukatif)**: Buat clue berupa vignette kasus klinis terstruktur (menyebutkan usia, jenis kelamin, keluhan utama, hasil pemeriksaan fisik, atau penemuan laboratorium kunci yang khas/patognomonik) untuk melatih daya analisis mahasiswa. Diakhiri dengan kalimat tanya yang menanyakan satu istilah medis spesifik secara jelas (misalnya: `"Apakah nama parasit penyebab infeksi tersebut?"`, `"Apakah nama obat lini pertama untuk kasus di atas?"`, atau `"Apakah diagnosis yang paling tepat dari cedera tersebut?"`).
> 2. **Answer (Jawaban)**: Harus berupa kata/istilah medis tunggal atau frasa pendek yang presisi (misal: `"tuberculosis"`, `"appendicitis"`, `"propranolol"`, `"plasmodium falciparum"`). Tulis dalam huruf kecil.
> 3. **Hints (Petunjuk Bertahap & Edukatif)**: Sediakan persis 3 petunjuk medis yang mendalam untuk membantu proses belajar dan penalaran ilmiah mahasiswa secara bertahap:
>    * Petunjuk 1 (Patofisiologi / Farmakodinamik): Menjelaskan mekanisme aksi obat, jalur persarafan, patogenesis penyakit, atau reseptor seluler yang terlibat (misal: `"Menghambat sintesis dinding sel bakteri dengan mengikat PBP"`).
>    * Petunjuk 2 (Temuan Penunjang / Patognomonik): Menyebutkan ciri khas pada pemeriksaan laboratorium, mikroskopis, radiologis, atau tanda fisik patognomonik (misal: `"Pada sediaan apus darah tepi ditemukan gambaran ring form dengan double chromatin"`).
>    * Petunjuk 3 (Karakteristik Klinis / Struktur Kata): Menyebutkan komplikasi khas, faktor risiko dominan, organ utama yang terkena, digabung dengan petunjuk awal huruf jika diperlukan (misal: `"Merupakan obat pilihan utama untuk profilaksis migrain, nama obat diawali huruf P"`).
> 4. **Explanation (Pembahasan)**: Penjelasan ringkas mengenai diagnosis, patofisiologi, atau tatalaksana terkait.
> 
> ### ATURAN METADATA:
> Sertakan objek `"metadata"` minimal untuk integrasi gamifikasi:
> * `"blok"`: Sistem organ/blok kedokteran (misal: `"Kardiovaskular"`, `"Respirologi"`, `"Infeksi Tropis"`, `"Neurologi"`, dll).
> * `"sub_kompetensi_klinis"`: Isikan string `"Isian Singkat"`.
> * `"tingkat_kesulitan"`: Tingkat kesulitan (Pilih salah satu: `"Mudah"`, `"Sedang"`, `"Sulit"`).
> * `"xp"`: Poin pengalaman (Gunakan integer: `10` untuk Mudah, `20` untuk Sedang, `30` untuk Sulit).
> 
> ### FORMAT OUTPUT (STRICT JSON):
> Kembalikan respon hanya dalam blok kode JSON valid dengan struktur root di bawah ini, tanpa kalimat pembuka/penutup tambahan:
> 
> ```json
> {
>   "featureFlags": {
>     "shuffleCards": true,
>     "showHints": true,
>     "hintPenalty": 0.25,
>     "maxHintsAllowed": 3,
>     "caseSensitive": false,
>     "acceptPartialMatch": true
>   },
>   "cards": [
>     {
>       "clue": "Vignette klinis singkat di sini...",
>       "answer": "jawaban_medis_di_sini",
>       "hints": [
>         "Menghambat secara kompetitif reseptor H2 histamin pada sel parietal lambung.",
>         "Pada biopsi lambung dapat menunjukkan atrofi mukosa atau kolonisasi bakteri spiral Gram-negatif.",
>         "Biasa digunakan sebagai terapi gastritis, nama obat diawali dengan huruf R."
>       ],
>       "explanation": "Pembahasan konseptual ringkas.",
>       "metadata": {
>         "blok": "Nama Blok",
>         "sub_kompetensi_klinis": "Isian Singkat",
>         "tingkat_kesulitan": "Sedang",
>         "xp": 20
>       }
>     }
>   ]
> }
> ```"

---

## 💡 Kelebihan Format Ini (Efisien & Ringan bagi AI)
1. **Mengurangi Token Output**: Dibandingkan soal Pilihan Ganda (yang membutuhkan opsi A-E dan bedah eliminasi untuk masing-masing opsi), format Flashcard ini jauh lebih hemat token keluaran AI, menjadikannya sangat murah dan cepat saat digenerate.
2. **Fungsionalitas Optimal**: Root-level `featureFlags` dikonfigurasi sekali saja di bagian atas file sehingga menghemat ruang data, sementara setiap kartu fokus pada inti kuis dengan petunjuk bertahap.

