# Panduan Pembuatan Flashcard 3D — AuraMed PRO

Format ini khusus untuk fitur **Flashcard 3D (kartu bolak-balik)** dan terpisah dari format *Flashcard Isian Singkat* lama.

## Format JSON

Setiap kartu memiliki dua sisi: `front` (muka depan) dan `back` (muka belakang). Masing-masing sisi boleh berisi `text` (mendukung Markdown dasar seperti `**tebal**`, `*miring*`, dan daftar) dan/atau `image` (URL gambar).

```json
{
  "type": "flashcard3d",
  "title": "Kunci Latihan Soal 2018",
  "cards": [
    {
      "front": {
        "text": "ACL tear pada atlet sepak bola. Apa tujuan rehabilitasi pada kasus tersebut?",
        "image": null
      },
      "back": {
        "text": "**Mengembalikan stabilitas lutut, ROM penuh, dan kekuatan quadriceps/hamstring.**",
        "image": null
      },
      "tags": ["Muskuloskeletal"]
    }
  ]
}
```

## Prompt AI Siap Salin

```text
Bertindaklah sebagai dosen kedokteran persiapan UKMPPD.
Ubah materi/catatan di bawah ini menjadi kumpulan kartu Flashcard 3D dalam format JSON valid (tanpa teks pembuka/penutup).

Aturan kartu:
1. "front.text": Pertanyaan klinis singkat, istilah, atau skenario padat (1-3 kalimat).
2. "back.text": Keterangan/jawaban jelas dan terstruktur (boleh pakai **tebal** dan daftar poin singkat).
3. "image": Opsional (isi null jika tidak ada URL gambar).
4. Fokus pada satu konsep per kartu agar cepat dihafal.

Format JSON:
{
  "type": "flashcard3d",
  "title": "Judul Deck",
  "cards": [
    {
      "front": { "text": "...", "image": null },
      "back": { "text": "...", "image": null },
      "tags": ["Blok"]
    }
  ]
}
```
