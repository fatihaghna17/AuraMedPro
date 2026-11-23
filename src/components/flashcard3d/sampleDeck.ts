// src/components/flashcard3d/sampleDeck.ts
// Contoh deck UKMPPD + prompt AI siap salin untuk membuat Flashcard 3D.

export const FLASHCARD3D_AI_PROMPT = `Bertindaklah sebagai dosen kedokteran persiapan UKMPPD.
Ubah materi/catatan di bawah ini menjadi kumpulan kartu Flashcard 3D dalam format JSON valid (tanpa teks pembuka/penutup).

Aturan kartu:
1. "front.text": Pertanyaan klinis singkat, istilah, atau skenario padat (1-3 kalimat).
2. "back.text": Keterangan/jawaban jelas dan terstruktur (boleh pakai **tebal** dan daftar poin singkat).
3. "image": Opsional (isi null jika tidak ada URL gambar).
4. Buat kartu yang fokus menguji satu konsep per kartu agar cepat dihafal.

Format JSON:
{
  "type": "flashcard3d",
  "title": "Judul Deck",
  "cards": [
    {
      "front": { "text": "Pertanyaan di muka depan kartu", "image": null },
      "back": { "text": "**Jawaban utama**\\n\\nPenjelasan ringkas dan poin klinis kunci.", "image": null },
      "tags": ["Blok / Sistem Organ"]
    }
  ]
}`;

export const SAMPLE_DECK_JSON = JSON.stringify(
  {
    type: 'flashcard3d',
    title: 'Contoh UKMPPD — Klinis Ringkas',
    cards: [
      {
        front: {
          text: 'ACL tear pada atlet sepak bola. Apa tujuan utama rehabilitasi pada kasus tersebut?',
          image: null,
        },
        back: {
          text: '**Mengembalikan stabilitas fungsional lutut & mencegah cedera ulang.**\n\n- Mengontrol bengkak dan nyeri fase akut\n- Mengembalikan *range of motion* (ROM) penuh (terutama ekstensi penuh)\n- Penguatan otot **quadriceps & hamstring** serta latihan propriosepsi sebelum *return to sport*',
          image: null,
        },
        tags: ['Muskuloskeletal'],
      },
      {
        front: {
          text: 'Apusan darah tepi pasien demam tinggi memperlihatkan parasit intraseluler berbentuk **pisang (crescent-shaped gametocyte)**. Spesies apakah ini?',
          image: null,
        },
        back: {
          text: '**Plasmodium falciparum**\n\nPenyebab malaria tropika (sering menimbulkan malaria serebral). Tatalaksana lini pertama di Indonesia: **DHP (Dihidroartemisinin-Piperakuin) 3 hari + Primakuin dosis tunggal hari ke-1**.',
          image: null,
        },
        tags: ['Infeksi Tropis'],
      },
      {
        front: {
          text: 'Pasien nyeri dada substernal menjalar ke lengan kiri > 20 menit. EKG menunjukkan elevasi ST di sadapan **II, III, dan aVF**. Lokasi infark & arteri koroner yang paling sering terlibat?',
          image: null,
        },
        back: {
          text: '**STEMI Inferior — Right Coronary Artery (RCA)**\n\nWaspadai keterlibatan ventrikel kanan (cek sadapan V3R–V4R). Hindari nitrat jika terdapat hipotensi atau infark RV.',
          image: null,
        },
        tags: ['Kardiovaskular'],
      },
      {
        front: {
          text: 'Trias klasik **Charcot** pada kolangitis akut terdiri dari apa saja?',
          image: null,
        },
        back: {
          text: '1. **Demam** (sering disertai menggigil)\n2. **Ikterus** (kuning)\n3. **Nyeri kuadran kanan atas (RUQ)**\n\nJika ditambah **hipotensi + penurunan kesadaran** disebut **Pentad Reynolds** (tanda kolangitis supuratif berat).',
          image: null,
        },
        tags: ['Gastroenterohepatologi'],
      },
      {
        front: {
          text: 'Apa mekanisme kerja **Furosemide** dan di segmen nefron manakah obat ini bekerja?',
          image: null,
        },
        back: {
          text: 'Menghambat kotransporter **Na⁺-K⁺-2Cl⁻ (NKCC2)** pada **thick ascending limb of Loop of Henle**.\n\nEfek samping khas: hipokalemia, hipomagnesemia, hiperurisemia, dan ototoksisitas dosis tinggi.',
          image: null,
        },
        tags: ['Farmakologi'],
      },
    ],
  },
  null,
  2
);
