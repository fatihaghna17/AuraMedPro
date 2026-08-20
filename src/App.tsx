import React, { useState, useEffect, useRef } from 'react';
import * as jsYaml from 'js-yaml';
import confetti from 'canvas-confetti';
import { supabase } from './supabaseClient';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { DashboardCharts } from './components/DashboardCharts';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  Award,
  Activity,
  FileText,
  ClipboardList,
  RotateCcw,
  UploadCloud,
  Trash2,
  Sun,
  Moon,
  ChevronDown,
  Home,
  Play,
  Flame,
  HelpCircle,
  Check,
  X,
  Lock,
  Plus,
  Calendar,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronRight,
  Folder,
  FolderOpen,
  LogOut,
  User,
  Download,
  Copy,
  Bell,
  BarChart2,
  PlusCircle,
  Menu,
  ArrowLeft,
  Search,
  FolderPlus,
  Maximize2,
  Minimize2,
  Smartphone,
  Share2
} from 'lucide-react';

// === interfaces ===
interface QuestionMetadata {
  sub_kompetensi_klinis?: string;
  tingkat_kognitif?: string;
  tingkat_kesulitan?: string;
  xp?: number;
}

interface Question {
  pertanyaan: string;
  pilihan: string[];
  jawaban_benar: string;
  pembahasan: string;
  eliminasi_opsi?: Record<string, string>;
  metadata?: QuestionMetadata;
  gambar?: string;
  gambar_url?: string;
  image?: string;
  image_url?: string;
  imageUrl?: string;
  hints?: string[];
  featureFlags?: any;
}

interface HistoryEntry {
  id: number;
  date: string;
  score: number;
  correct: number;
  wrong: number;
  empty: number;
  total: number;
  files: string[];
  mode: 'utuh' | 'simulasi';
  questions?: Question[];
  userAnswers?: (string | null)[];
}

// === SAMPLE QUESTION BANKS ===
const SAMPLE_BANKS: Record<string, Question[]> = {
  'UKMPPD Kedokteran - Kardiorespirasi.json': [
    {
      pertanyaan: "Seorang pria berusia 56 tahun datang ke IGD dengan keluhan nyeri dada kiri yang dirasakan seperti tertindih beban berat sejak 2 jam yang lalu. Nyeri menjalar ke bahu kiri dan rahang bawah, berlangsung selama lebih dari 30 menit dan tidak berkurang dengan istirahat. Pada pemeriksaan fisik didapatkan pasien tampak pucat dan berkeringat dingin. TD 140/90 mmHg, HR 98 x/m, RR 20 x/m. EKG menunjukkan ST elevasi di sadapan II, III, dan aVF. Apakah diagnosis yang paling tepat pada pasien tersebut?",
      pilihan: [
        "Infarkt Miokard Akut dengan ST Elevasi (STEMI) Inferior",
        "Infarkt Miokard Akut dengan ST Elevasi (STEMI) Anteroseptal",
        "Non-ST Elevation Myocardial Infarction (NSTEMI)",
        "Angina Pectoris Tidak Stabil (UAP)",
        "Perikarditis Akut"
      ],
      jawaban_benar: "Infarkt Miokard Akut dengan ST Elevasi (STEMI) Inferior",
      pembahasan: "Pasien menunjukkan gejala khas nyeri dada kardiak iskemik akut (angina onset mendadak, menjalar, >20 menit, disertai gejala otonom seperti diaphoresis/keringat dingin). Hasil pemeriksaan EKG menunjukkan elevasi segmen ST yang khas pada sadapan inferior (II, III, aVF), mengonfirmasi terjadinya STEMI dinding inferior. Pilihan lain seperti anteroseptal ditandai dengan ST elevasi di V1-V4, sedangkan NSTEMI dan UAP tidak memiliki gambaran ST elevasi yang persisten.",
      eliminasi_opsi: {
        "A": "Benar. EKG menunjukkan ST elevasi di sadapan II, III, aVF yang merupakan representasi dinding inferior jantung.",
        "B": "Salah. STEMI Anteroseptal akan menunjukkan perubahan segmen ST pada sadapan prekordial V1-V4.",
        "C": "Salah. NSTEMI tidak menunjukkan elevasi segmen ST pada EKG melainkan depresi ST atau inversi gelombang T.",
        "D": "Salah. UAP tidak memiliki peningkatan biomarker jantung dan tidak disertai elevasi segmen ST presisten.",
        "E": "Salah. Perikarditis akut ditandai dengan elevasi segmen ST yang bersifat difus (hampir di semua sadapan) dan berbentuk cekung (saddleback)."
      },
      metadata: {
        sub_kompetensi_klinis: "Kardiologi & Vaskular",
        tingkat_kognitif: "C3 - Aplikasi Klinis",
        tingkat_kesulitan: "Sedang",
        xp: 120
      }
    },
    {
      pertanyaan: "Seorang anak perempuan berusia 8 tahun dibawa ibunya ke Puskesmas dengan keluhan sesak napas disertai bunyi mengi yang hilang timbul. Keluhan sering kambuh terutama saat udara dingin di malam hari atau setelah anak bermain kelelahan. Ayah pasien diketahui memiliki riwayat bersin-bersin di pagi hari dan sering gatal-gatal. Pada auskultasi paru didapatkan suara napas vesikuler disertai wheezing ekspiratoar di kedua lapangan paru. Apakah tatalaksana lini pertama (reliever) yang tepat untuk meredakan serangan akut pada pasien tersebut?",
      pilihan: [
        "Inhalasi Salbutamol (Beta-2 Agonis Kerja Singkat)",
        "Inhalasi Flutikason (Kortikosteroid Inhalasi)",
        "Tablet Teofilin Oral",
        "Inhalasi Salmeterol (Beta-2 Agonis Kerja Panjang)",
        "Injeksi Epinefrin Subkutan"
      ],
      jawaban_benar: "Inhalasi Salbutamol (Beta-2 Agonis Kerja Singkat)",
      pembahasan: "Kasus ini menunjukkan gejala klinis Asma Bronkial Eksaserbasi Akut (sesak napas kambuhan, bunyi wheezing, dipicu dingin/aktivitas, disertai riwayat atopi keluarga). Pilihan utama untuk meredakan bronkospasme akut dengan cepat (reliever) adalah inhalasi Beta-2 agonis kerja singkat (SABA) seperti Salbutamol. Kortikosteroid inhalasi (Flutikason) digunakan sebagai pengontrol jangka panjang (controller), bukan pereda serangan akut.",
      eliminasi_opsi: {
        "A": "Benar. SABA (Salbutamol) merupakan bronkodilator kerja cepat pilihan pertama untuk melebarkan jalan napas akut.",
        "B": "Salah. Flutikason adalah kortikosteroid inhalasi (ICS) yang berperan sebagai pengontrol inflamasi kronis, bukan pereda bronkospasme mendadak.",
        "C": "Salah. Teofilin oral memiliki indeks terapi sempit dan onset lebih lambat dibanding SABA inhalasi.",
        "D": "Salah. Salmeterol adalah LABA yang digunakan sebagai terapi pemeliharaan kombinasi, bukan untuk meredakan serangan akut.",
        "E": "Salah. Epinefrin subkutan hanya dicadangkan untuk serangan asma berat atau anafilaksis ketika terapi inhalasi tidak tersedia."
      },
      metadata: {
        sub_kompetensi_klinis: "Respirasi & Pulmonologi",
        tingkat_kognitif: "C4 - Analisis Keputusan",
        tingkat_kesulitan: "Mudah",
        xp: 100
      }
    },
    {
      pertanyaan: "Seorang wanita berusia 34 tahun mengeluh sering merasa berdebar-debar, mudah berkeringat, dan berat badannya menurun sebanyak 5 kg dalam 1 bulan terakhir meskipun nafsu makannya meningkat. Pasien juga mengeluhkan sulit tidur dan sering merasa cemas. Pada pemeriksaan fisik didapatkan TD 130/80 mmHg, nadi 110 x/menit regular, suhu 37.6 C. Didapatkan adanya pembesaran kelenjar tiroid difus non-nyeri dan eksoptalmus ringan pada kedua mata. Pemeriksaan penunjang laboratorium apakah yang diharapkan pada pasien ini?",
      pilihan: [
        "TSH menurun, FT4 meningkat",
        "TSH meningkat, FT4 meningkat",
        "TSH meningkat, FT4 menurun",
        "TSH menurun, FT4 menurun",
        "TSH normal, FT4 meningkat"
      ],
      jawaban_benar: "TSH menurun, FT4 meningkat",
      pembahasan: "Gejala penurunan berat badan di tengah nafsu makan meningkat, hiperhidrosis, takikardia, tremor, eksoptalmus, dan struma difus merupakan tanda klinis hipertiroidisme (kemungkinan besar Penyakit Graves). Uji saring terbaik untuk fungsi tiroid adalah kadar TSH (Thyroid Stimulating Hormone) dan FT4 (Free Thyroxine). Pada hipertiroidisme primer, pelepasan hormon tiroid (FT4) yang berlebih memberikan umpan balik negatif ke kelenjar hipofisis anterior, menyebabkan produksi TSH menurun drastis.",
      eliminasi_opsi: {
        "A": "Benar. Pola TSH tersupresi (menurun) dan FT4 bebas meningkat adalah konfirmasi laboratoris hipertiroidisme primer.",
        "B": "Salah. Pola TSH meningkat dan FT4 meningkat mengindikasikan hipertiroidisme sekunder (pusat/adenoma hipofisis) yang sangat jarang terjadi.",
        "C": "Salah. TSH meningkat dan FT4 menurun adalah penanda hipotiroidisme primer.",
        "D": "Salah. TSH menurun dan FT4 menurun menandakan hipotiroidisme sekunder atau sindrom eutiroid sakit.",
        "E": "Salah. Pada hipertiroidisme klinis sejati, kadar TSH hampir selalu tersupresi di bawah rentang normal."
      },
      metadata: {
        sub_kompetensi_klinis: "Endokrin & Metabolik",
        tingkat_kognitif: "C3 - Aplikasi Klinis",
        tingkat_kesulitan: "Sedang",
        xp: 110
      }
    },
    {
      pertanyaan: "Seorang laki-laki berusia 45 tahun datang ke poliklinik untuk kontrol rutin pasca perawatan stroke non-hemoragik 1 bulan yang lalu. Pasien memiliki riwayat hipertensi dan diabetes melitus tipe 2 sejak 5 tahun lalu yang tidak terkontrol secara teratur. Dari hasil pemeriksaan fisik saat ini didapatkan TD 150/90 mmHg, HR 78 x/m, GDS 182 mg/dL. Dokter merencanakan pemberian terapi antiplatelet jangka panjang untuk pencegahan sekunder stroke berulang. Apakah obat pilihan utama yang direkomendasikan?",
      pilihan: [
        "Aspirin (Asam Asetilsalisilat) 81 mg oral",
        "Warfarin 2 mg oral",
        "Sildenafil 50 mg oral",
        "Heparin 5000 IU subkutan",
        "Alteplase (rtPA) 0.9 mg/kgBB intravena"
      ],
      jawaban_benar: "Aspirin (Asam Asetilsalisilat) 81 mg oral",
      pembahasan: "Pencegahan sekunder setelah kejadian stroke iskemik non-kardioembolik ditujukan untuk mengurangi risiko kekambuhan tromboemboli. Terapi standar lini pertama yang direkomendasikan adalah obat antiplatelet oral tunggal, di mana Asam Asetilsalisilat (Aspirin) dosis rendah (81-325 mg) atau Clopidogrel 75 mg menjadi pilihan utama. Warfarin (antikoagulan) diindikasikan jika stroke disebabkan oleh emboli jantung (seperti pada Fibrilasi Atrium), bukan aterosklerosis arteri.",
      eliminasi_opsi: {
        "A": "Benar. Aspirin dosis rendah terbukti efektif sebagai pencegahan sekunder stroke iskemik non-embolik.",
        "B": "Salah. Warfarin adalah antikoagulan, hanya diutamakan jika stroke berlatar belakang kardioemboli (misal katup buatan atau atrial fibrilasi).",
        "C": "Salah. Sildenafil adalah inhibitor PDE-5 untuk disfungsi ereksi atau hipertensi pulmonal, tidak relevan untuk stroke profilaksis.",
        "D": "Salah. Heparin adalah antikoagulan parenteral yang tidak praktis dan tidak diindikasikan untuk pencegahan sekunder jangka panjang.",
        "E": "Salah. Alteplase (rtPA) adalah trombolitik fibrinolitik dosis tinggi yang hanya digunakan pada fase akut/hiperakut stroke iskemik (<4.5 jam onset), bukan pencegahan kronis."
      },
      metadata: {
        sub_kompetensi_klinis: "Neurologi & Psikiatri",
        tingkat_kognitif: "C4 - Analisis Keputusan",
        tingkat_kesulitan: "Sulit",
        xp: 150
      }
    }
  ],
  'Sains dan Ruang Angkasa - Umum.json': [
    {
      pertanyaan: "Teori Relativitas Umum Albert Einstein, yang dipublikasikan pada tahun 1915, merevolusi cara kita memahami gravitasi. Berbeda dengan pandangan Isaac Newton yang menganggap gravitasi sebagai gaya tarik-menarik instan antar massa, bagaimana Relativitas Umum mendefinisikan esensi dari gaya gravitasi tersebut?",
      pilihan: [
        "Sebagai kelengkungan atau distorsi ruang-waktu yang disebabkan oleh distribusi massa dan energi",
        "Sebagai pertukaran partikel elementer bermassa nol yang disebut graviton",
        "Sebagai fluktuasi medan elektromagnetik kosmik yang sangat padat",
        "Sebagai efek gesekan friksi antara eter kosmik dengan atmosfer planet",
        "Sebagai gaya sentrifugal yang dihasilkan oleh rotasi galaksi bima sakti"
      ],
      jawaban_benar: "Sebagai kelengkungan atau distorsi ruang-waktu yang disebabkan oleh distribusi massa dan energi",
      pembahasan: "Dalam Relativitas Umum, ruang dan waktu digabungkan menjadi jalinan empat dimensi kontinu yang disebut ruang-waktu. Keberadaan massa dan energi (seperti bintang atau planet) melengkungkan jalinan ruang-waktu di sekitarnya. Objek lain bergerak di sepanjang jalur terpendek (geodesik) pada ruang yang melengkung ini, yang kita persepsikan secara makroskopis sebagai 'gaya tarik gravitasi'.",
      eliminasi_opsi: {
        "A": "Benar. Gravitasi adalah visualisasi kelengkungan geometris ruang-waktu akibat adanya massa objek.",
        "B": "Salah. Pertukaran graviton adalah hipotesis dalam mekanika kuantum/gravitasi kuantum yang hingga kini belum berhasil diverifikasi dalam model standar.",
        "C": "Salah. Medan elektromagnetik kosmik adalah fenomena terpisah dan tidak mendefinisikan gravitasi dalam relativitas umum.",
        "D": "Salah. Teori 'eter' kosmik telah dipatahkan oleh eksperimen Michelson-Morley pada tahun 1887.",
        "E": "Salah. Gaya sentrifugal galaksi tidak mendasari teori gravitasi lokal maupun kosmis Einstein."
      },
      metadata: {
        sub_kompetensi_klinis: "Kosmologi Fisika",
        tingkat_kognitif: "C2 - Pemahaman Konsep",
        tingkat_kesulitan: "Mudah",
        xp: 90
      }
    },
    {
      pertanyaan: "Mengapa sebuah lubang hitam (Black Hole) memiliki gravitasi yang sangat kuat sehingga bahkan cahaya dengan kecepatan 300.000 km/detik tidak dapat meloloskan diri darinya setelah melewati batas tertentu?",
      pilihan: [
        "Karena massa yang sangat besar terkonsentrasi ke dalam volume ruang yang sangat kecil (densitas tak terbatas)",
        "Karena lubang hitam memancarkan gelombang antimateri yang mematikan partikel foton",
        "Karena adanya hisapan mekanis vakum raksasa di pusat galaksi",
        "Karena lubang hitam tidak memiliki medan magnet sama sekali",
        "Karena partikel gelap (Dark Matter) menumpuk di permukaan event horizon"
      ],
      jawaban_benar: "Karena massa yang sangat besar terkonsentrasi ke dalam volume ruang yang sangat kecil (densitas tak terbatas)",
      pembahasan: "Lubang hitam terbentuk ketika bintang bermassa sangat besar runtuh di bawah gravitasinya sendiri pada akhir masa hidupnya, memadatkan seluruh massanya ke titik singularitas dengan densitas yang secara teoritis tak terbatas. Kelengkungan ruang-waktu di sekitarnya menjadi sangat ekstrem sehingga 'kecepatan lepas' (escape velocity) yang dibutuhkan untuk keluar melampaui kecepatan cahaya setelah melintasi batas hipotesis yang disebut Event Horizon (Horizon Peristiwa).",
      eliminasi_opsi: {
        "A": "Benar. Densitas ekstrem menciptakan gradien gravitasi yang tak terbatas di dekat singularitas.",
        "B": "Salah. Foton cahaya tidak hancur oleh antimateri, tetapi lintasannya dibengkokkan ke dalam lubang hitam oleh gravitasi ekstrem.",
        "C": "Salah. Lubang hitam bukan penyedot debu vakum mekanis; efek gravitasinya di luar Event Horizon mengikuti hukum gravitasi biasa.",
        "D": "Salah. Lubang hitam dapat memiliki medan magnet kuat akibat piringan akresi materi yang berputar di sekitarnya.",
        "E": "Salah. Materi gelap tersebar di halo galaksi, bukan terkonsentrasi secara khusus yang memicu hisapan cahaya lubang hitam."
      },
      metadata: {
        sub_kompetensi_klinis: "Astrofisika Ekstrem",
        tingkat_kognitif: "C3 - Aplikasi Klinis",
        tingkat_kesulitan: "Sedang",
        xp: 110
      }
    }
  ],
  'Isian Singkat - Farmakologi & Anatomi.json': [
    {
      pertanyaan: "Apakah nama golongan obat antihipertensi yang bekerja dengan cara menghambat enzim angiotensin-converting enzyme?",
      pilihan: [],
      jawaban_benar: "ACE inhibitor",
      pembahasan: "ACE inhibitor (Angiotensin-Converting Enzyme Inhibitor) adalah golongan obat yang menghambat perubahan angiotensin I menjadi angiotensin II, sehingga terjadi vasodilatasi dan penurunan tekanan darah.",
      eliminasi_opsi: {},
      metadata: {
        sub_kompetensi_klinis: "Farmakologi",
        tingkat_kognitif: "C1",
        tingkat_kesulitan: "Mudah",
        xp: 150
      },
      hints: [
        "Singkatan dari Angiotensin Converting Enzyme Inhibitor.",
        "Contoh obatnya adalah Captopril, Lisinopril, Ramipril.",
        "Terdiri dari kata 'ACE' diikuti dengan kata 'Inhibitor'."
      ],
      featureFlags: {
        showHints: true,
        hintPenalty: 0.25,
        maxHintsAllowed: 3,
        caseSensitive: false,
        acceptPartialMatch: true
      }
    },
    {
      pertanyaan: "Sebutkan nama tulang terpanjang dan terkuat pada tubuh manusia yang menyusun bagian paha!",
      pilihan: [],
      jawaban_benar: "Femur",
      pembahasan: "Tulang paha atau femur adalah tulang terpanjang, terkuat, dan terberat pada tubuh manusia. Tulang ini berfungsi menopang berat badan tubuh.",
      eliminasi_opsi: {},
      metadata: {
        sub_kompetensi_klinis: "Anatomi",
        tingkat_kognitif: "C1",
        tingkat_kesulitan: "Mudah",
        xp: 150
      },
      hints: [
        "Mulai dengan huruf F.",
        "Bahasa Indonesianya sering disebut tulang paha.",
        "Memiliki nama latin 'Femur'."
      ],
      featureFlags: {
        showHints: true,
        hintPenalty: 0.2,
        maxHintsAllowed: 3,
        caseSensitive: false,
        acceptPartialMatch: true
      }
    }
  ],
  'Isian Singkat - Parasitologi Mikroskopis.json': [
    {
      pertanyaan: "Perhatikan gambar hasil pemeriksaan mikroskopis berikut, lalu identifikasi parasit ini.",
      pilihan: [],
      jawaban_benar: "Brugia timori",
      pembahasan: "Brugia timori adalah penyebab filariasis limfatik yang hanya ditemukan di wilayah Indonesia bagian timur (Nusa Tenggara). Mikrofilaria bersarung dengan susunan inti tidak teratur; terdapat dua inti terminal yang letaknya terpisah jauh dari ujung ekor.",
      eliminasi_opsi: {},
      metadata: {
        sub_kompetensi_klinis: "Parasitologi",
        tingkat_kognitif: "C3",
        tingkat_kesulitan: "Sulit",
        xp: 150
      },
      image: "https://ik.imagekit.io/kkskr/Parashit/Brugia%20timori%20(inti%20terminal%20jauh).jpg?updatedAt=1764343064135",
      hints: [
        "Mikrofilaria bersarung dengan susunan inti tidak teratur; terdapat dua inti terminal yang letaknya terpisah jauh dari ujung ekor.",
        "Penyebab filariasis limfatik yang hanya ditemukan di wilayah Indonesia bagian timur (Nusa Tenggara).",
        "Nama spesiesnya diawali huruf T."
      ],
      featureFlags: {
        showHints: true,
        hintPenalty: 0.25,
        maxHintsAllowed: 3,
        caseSensitive: false,
        acceptPartialMatch: true
      }
    },
    {
      pertanyaan: "Perhatikan gambar hasil pemeriksaan mikroskopis berikut, lalu identifikasi parasit ini.",
      pilihan: [],
      jawaban_benar: "Ascaris lumbricoides",
      pembahasan: "Ascaris lumbricoides adalah cacing gelang usus terbesar yang menginfeksi manusia. Telur oval berdinding tebal, dilapisi selubung albuminoid kasar bergerigi berwarna coklat keemasan.",
      eliminasi_opsi: {},
      metadata: {
        sub_kompetensi_klinis: "Parasitologi",
        tingkat_kognitif: "C2",
        tingkat_kesulitan: "Sedang",
        xp: 150
      },
      image: "https://ik.imagekit.io/kkskr/Parashit/Ascaris%20Lumbricoides%20Telur%20Fertil%20dengan%20Selubung%20Protein.jpg?updatedAt=1764343012109",
      hints: [
        "Telur oval berdinding tebal, dilapisi selubung albuminoid kasar bergerigi berwarna coklat keemasan.",
        "Merupakan cacing gelang usus terbesar yang menginfeksi manusia.",
        "Nama spesiesnya diawali huruf L."
      ],
      featureFlags: {
        showHints: true,
        hintPenalty: 0.25,
        maxHintsAllowed: 3,
        caseSensitive: false,
        acceptPartialMatch: true
      }
    },
    {
      pertanyaan: "Perhatikan gambar hasil pemeriksaan mikroskopis berikut, lalu identifikasi parasit ini.",
      pilihan: [],
      jawaban_benar: "Balantidium coli",
      pembahasan: "Balantidium coli adalah satu-satunya protozoa siliata yang dapat menginfeksi manusia, seluruh permukaan tubuh diselimuti silia. Memiliki makronukleus berbentuk seperti ginjal/kacang.",
      eliminasi_opsi: {},
      metadata: {
        sub_kompetensi_klinis: "Parasitologi",
        tingkat_kognitif: "C3",
        tingkat_kesulitan: "Sedang",
        xp: 150
      },
      image: "https://ik.imagekit.io/kkskr/Parashit/Tropozoid%20dan%20Kista%20Balantidium%20coli.jpg?updatedAt=1764343005347",
      hints: [
        "Satu-satunya protozoa siliata yang dapat menginfeksi manusia, seluruh permukaan tubuh diselimuti silia.",
        "Memiliki makronukleus berbentuk seperti ginjal/kacang.",
        "Nama genusnya diawali huruf B."
      ],
      featureFlags: {
        showHints: true,
        hintPenalty: 0.25,
        maxHintsAllowed: 3,
        caseSensitive: false,
        acceptPartialMatch: true
      }
    },
    {
      pertanyaan: "Perhatikan gambar hasil pemeriksaan mikroskopis berikut, lalu identifikasi parasit ini.",
      pilihan: [],
      jawaban_benar: "Giardia lamblia",
      pembahasan: "Giardia lamblia berbentuk seperti buah pir atau layang-layang, dengan dua inti simetris menyerupai wajah tersenyum. Memiliki empat pasang flagela dan cakram penghisap (sucking disc) di bagian ventral. Menyebabkan giardiasis akibat air minum terkontaminasi.",
      eliminasi_opsi: {},
      metadata: {
        sub_kompetensi_klinis: "Parasitologi",
        tingkat_kognitif: "C2",
        tingkat_kesulitan: "Sedang",
        xp: 150
      },
      image: "https://ik.imagekit.io/kkskr/Parashit/Trofozoit%20Giardia.jpg?updatedAt=1764342998027",
      hints: [
        "Berbentuk seperti buah pir atau layang-layang, dengan dua inti simetris menyerupai wajah tersenyum.",
        "Memiliki empat pasang flagela dan cakram penghisap (sucking disc) di bagian ventral.",
        "Penyebab giardiasis akibat air minum terkontaminasi."
      ],
      featureFlags: {
        showHints: true,
        hintPenalty: 0.25,
        maxHintsAllowed: 3,
        caseSensitive: false,
        acceptPartialMatch: true
      }
    }
  ]
};

// Kalimat roasting yang lucu, sarkas, dan menghibur ala mahasiswa kedokteran & umum
const SCORE_FEEDBACKS: Record<number, string> = {
  0: "Skor 0? Kamu ngerjainnya merem, atau emang niat nyumbang kuota doang ke server? Astaga naga...",
  10: "Skor 10! Selamat, insting kamu lebih rendah dari tebakan acak seekor kucing rumahan. Yuk belajar lagi!",
  20: "Skor 20. Ini transkrip nilai CBT apa sisa baterai HP kamu yang minta dicharge? Mengenaskan sekali.",
  30: "Skor 30. Nilai segini kalo dijadiin suhu ruangan udah bikin hipotermia. Otak kamu ikutan beku ya pas ngerjain?",
  40: "Skor 40. Gak usah sedih, seenggaknya kamu konsisten... konsisten di bawah KKM. Pura-pura amnesia aja kalau ditanya temen.",
  50: "Skor 50! Pas banget setengah. Setengah pinter, setengahnya lagi ga tertolong oleh sistem.",
  60: "Skor 60! Dikit lagi lulus, tapi kenyataannya tetep gagal. Sakitnya tuh nembus ke tulang rusuk belakang.",
  70: "Skor 70! Lulus pas-pasan! Napas kamu lega dikit, mirip pasien asma abis disemprot inhaler. Selamat bertahan!",
  80: "Skor 80! Keren, sinaps otak kamu bekerja dengan efisiensi tinggi. Pantes jadi kandidat asisten laboratorium nih!",
  90: "Skor 90! Edan! Nilai A mutlak sudah digenggam. Orang tuamu akhirnya bisa bangga pamer di grup WhatsApp keluarga!",
  100: "Skor 100! Sempurna Tanpa Cela! Kamu ini manusia, dewa ujian, atau emang kunci jawabannya udah kamu hafalkan? Sungkem sepuh!"
};

const getFeedbackForScore = (score: number): string => {
  const scoreKeys = Object.keys(SCORE_FEEDBACKS).map(Number).sort((a, b) => b - a);
  for (const key of scoreKeys) {
    if (score >= key) {
      return SCORE_FEEDBACKS[key];
    }
  }
  return "Nilai di luar nalar manusia.";
};

const formatTimer = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const getCorrectLetterForQuestion = (q: Question): string => {
  if (!q) return 'A';

  const letters = ['A', 'B', 'C', 'D', 'E'];

  // 1. First priority: Check if any rationale in eliminasi_opsi explicitly starts with "benar" or "betul"
  if (q.eliminasi_opsi) {
    const foundEntry = Object.entries(q.eliminasi_opsi).find(([key, desc]) => {
      const cleanDesc = (desc as string).trim().toLowerCase();
      return cleanDesc.startsWith('benar') || cleanDesc.startsWith('betul');
    });
    if (foundEntry) {
      return foundEntry[0].toUpperCase();
    }
  }

  // 2. Second priority: Check if any option in pilihan explicitly starts with "benar" or "betul"
  if (q.pilihan && q.pilihan.length > 0) {
    const idx = q.pilihan.findIndex(opt => {
      const cleanOpt = opt.trim().toLowerCase();
      return cleanOpt.startsWith('benar') || cleanOpt.startsWith('betul');
    });
    if (idx !== -1 && idx < letters.length) {
      return letters[idx];
    }
  }

  // 3. Third priority: Try to match q.jawaban_benar with options in q.pilihan
  if (q.jawaban_benar) {
    const jb = q.jawaban_benar.trim();
    const jbLower = jb.toLowerCase();

    // Exact match in pilihan
    const exactIdx = q.pilihan.findIndex(opt => opt.trim().toLowerCase() === jbLower);
    if (exactIdx !== -1 && exactIdx < letters.length) {
      return letters[exactIdx];
    }

    // Is jawaban_benar exactly a letter (A-E)?
    if (/^[A-E]$/i.test(jb)) {
      return jb.toUpperCase();
    }

    // Is it a letter with dot or parenthesis (e.g. "A." or "A)")?
    if (/^[A-E][\s.)]/i.test(jb)) {
      return jb[0].toUpperCase();
    }

    // Check if any option starts with or contains jawaban_benar
    const partialIdx = q.pilihan.findIndex(opt => 
      opt.toLowerCase().includes(jbLower) || jbLower.includes(opt.toLowerCase())
    );
    if (partialIdx !== -1 && partialIdx < letters.length) {
      return letters[partialIdx];
    }
  }

  // Fallback: If q.jawaban_benar matches any letter in some way
  if (q.jawaban_benar) {
    const firstChar = q.jawaban_benar.trim()[0]?.toUpperCase();
    if (letters.includes(firstChar)) {
      return firstChar;
    }
  }

  return 'A'; // Absolute fallback
};

const isUserAnswerCorrect = (userAns: string | null, q: Question): boolean => {
  if (userAns === null) return false;
  
  // If short answer (Isian Singkat) with empty pilihan array
  if (!q.pilihan || q.pilihan.length === 0) {
    const flags = q.featureFlags || {};
    const caseSensitive = flags.caseSensitive === true;
    const acceptPartialMatch = flags.acceptPartialMatch !== false; // default true
    
    let userVal = userAns.trim();
    let correctVal = q.jawaban_benar.trim();
    
    if (!caseSensitive) {
      userVal = userVal.toLowerCase();
      correctVal = correctVal.toLowerCase();
    }
    
    if (userVal === correctVal) {
      return true;
    }
    
    // Fuzzy matching similarity (Levenshtein Distance)
    const getSimilarity = (s1: string, s2: string): number => {
      let longer = s1.toLowerCase();
      let shorter = s2.toLowerCase();
      if (s1.length < s2.length) {
        longer = s2.toLowerCase();
        shorter = s1.toLowerCase();
      }
      const longerLength = longer.length;
      if (longerLength === 0) return 1.0;
      
      const costs = [];
      for (let i = 0; i <= longer.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= shorter.length; j++) {
          if (i === 0) {
            costs[j] = j;
          } else {
            if (j > 0) {
              let newValue = costs[j - 1];
              if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
                newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
              }
              costs[j - 1] = lastValue;
              lastValue = newValue;
            }
          }
        }
        if (i > 0) {
          costs[shorter.length] = lastValue;
        }
      }
      return (longerLength - costs[shorter.length]) / longerLength;
    };

    if (getSimilarity(userVal, correctVal) >= 0.80) {
      return true;
    }
    
    if (acceptPartialMatch) {
      // If user answer or correct answer is contained within each other
      if (userVal.includes(correctVal) || correctVal.includes(userVal)) {
        if (userVal.length >= 3 && correctVal.length >= 3) {
          return true;
        }
      }
    }
    return false;
  }
  
  const correctLetter = getCorrectLetterForQuestion(q);
  const correctIndex = ['A', 'B', 'C', 'D', 'E'].indexOf(correctLetter);
  
  // If the correct index was found in choices
  if (correctIndex !== -1 && correctIndex < q.pilihan.length) {
    const correctOptionText = q.pilihan[correctIndex];
    if (userAns === correctOptionText) {
      return true;
    }
  }

  // Fallback: direct comparison
  if (userAns === q.jawaban_benar) {
    return true;
  }

  // Fallback: if userAns matches the correct letter exactly
  if (userAns.trim().toUpperCase() === correctLetter) {
    return true;
  }

  return false;
};

const renderHtmlText = (text: any) => {
  if (!text || typeof text !== 'string') return text || null;
  return <span dangerouslySetInnerHTML={{ __html: text }} />;
};

const getQuestionImage = (q: Question): string | null => {
  if (q.gambar && typeof q.gambar === 'string') return q.gambar;
  if (q.gambar_url && typeof q.gambar_url === 'string') return q.gambar_url;
  if (q.image && typeof q.image === 'string') return q.image;
  if (q.image_url && typeof q.image_url === 'string') return q.image_url;
  if (q.imageUrl && typeof q.imageUrl === 'string') return q.imageUrl;
  return null;
};

const renderQuestionImage = (q: Question, setLightbox: (url: string | null) => void, theme: 'light' | 'dark') => {
  const imageUrl = getQuestionImage(q);
  if (!imageUrl) return null;

  return (
    <div className="my-4 relative group max-w-xl mx-auto">
      <div className={`overflow-hidden rounded-xl border shadow-sm flex justify-center items-center relative ${
        theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-100'
      }`}>
        <img 
          src={imageUrl} 
          alt="Soal Visual" 
          referrerPolicy="no-referrer"
          className="max-h-[320px] object-contain transition-transform duration-300 group-hover:scale-[1.01] cursor-zoom-in p-2"
          onClick={() => setLightbox(imageUrl)}
        />
        <div 
          className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 cursor-pointer backdrop-blur-sm transition-all"
          onClick={() => setLightbox(imageUrl)}
        >
          <Eye className="w-3.5 h-3.5" />
          Perbesar Gambar
        </div>
      </div>
    </div>
  );
};

const mapUnifiedQuestion = (item: any, rootFeatureFlags: any = {}): Question => {
  const pilihan = item.pilihan || item.answers || [];
  
  let jawaban_benar = "";
  if (item.jawaban_benar !== undefined && item.jawaban_benar !== null) {
    jawaban_benar = String(item.jawaban_benar);
  } else if (item.answer !== undefined && item.answer !== null) {
    jawaban_benar = String(item.answer);
  } else if (item.correct_answer !== undefined && item.correct_answer !== null) {
    if (typeof item.correct_answer === 'number' && pilihan.length > 0) {
      jawaban_benar = pilihan[item.correct_answer - 1] || "";
    } else {
      jawaban_benar = String(item.correct_answer);
    }
  }

  const isIsian = pilihan.length === 0;

  const defaultMetadata = isIsian
    ? {
        sub_kompetensi_klinis: "Isian Singkat",
        tingkat_kognitif: "C1",
        tingkat_kesulitan: "Sedang",
        xp: 150
      }
    : {
        sub_kompetensi_klinis: "Klinis Umum",
        tingkat_kognitif: "C3",
        tingkat_kesulitan: "Sedang",
        xp: 100
      };

  return {
    pertanyaan: item.pertanyaan || item.clue || item.question || "Tanpa pertanyaan",
    pilihan,
    jawaban_benar,
    pembahasan: item.pembahasan || item.explanation || "",
    eliminasi_opsi: item.eliminasi_opsi || {},
    metadata: {
      ...defaultMetadata,
      ...(item.metadata || {})
    },
    hints: item.hints || [],
    featureFlags: item.featureFlags || rootFeatureFlags || {},
    image: item.image,
    image_url: item.image_url,
    imageUrl: item.imageUrl,
    gambar: item.gambar,
    gambar_url: item.gambar_url
  };
};

const parseRawFileToQuestions = (raw: string, ext: string): Question[] | null => {
  let finalQuestions: Question[] = [];
  try {
    let parsed: any = null;
    if (ext === 'yaml' || ext === 'yml') {
      parsed = jsYaml.load(raw);
    } else if (ext === 'json') {
      parsed = JSON.parse(raw);
    }

    if (!parsed) return null;

    const rootFlags = parsed.featureFlags || {};

    if (Array.isArray(parsed)) {
      finalQuestions = parsed.map(item => mapUnifiedQuestion(item, {}));
    } else if (typeof parsed === 'object') {
      let itemsList: any[] = [];
      Object.keys(parsed).forEach(key => {
        if (key !== 'featureFlags' && Array.isArray(parsed[key])) {
          itemsList = itemsList.concat(parsed[key]);
        }
      });

      if (itemsList.length > 0) {
        finalQuestions = itemsList.map(item => mapUnifiedQuestion(item, rootFlags));
      }
    }
  } catch (err) {
    console.error('Error parsing file content:', err);
    return null;
  }
  return finalQuestions.length > 0 ? finalQuestions : null;
};

export default function App() {
  // === React states ===
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('cbt_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const [questionDatabase, setQuestionDatabase] = useState<Record<string, Question[]>>({});

  // === Auth states ===
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [localSessionId, setLocalSessionId] = useState<string | null>(null);
  const [isSessionKicked, setIsSessionKicked] = useState(false);
  const [globalDatabases, setGlobalDatabases] = useState<string[]>([]);
  const [profileUsername, setProfileUsername] = useState<string>('user');
  const [uploaderMap, setUploaderMap] = useState<Record<string, string>>({});
  const isLoggingInRef = useRef(false);
  const isProfileSyncedRef = useRef(false);

  const [selectedDatabases, setSelectedDatabases] = useState<string[]>([]);
  const [questionLimits, setQuestionLimits] = useState<Record<string, number>>({});
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [quizMode, setQuizMode] = useState<'utuh' | 'simulasi'>('utuh');
  const [customFolders, setCustomFolders] = useState<string[]>(() => {
    const saved = localStorage.getItem('cbt_custom_folders');
    return saved ? JSON.parse(saved) : [];
  });
  const [quizFolderMap, setQuizFolderMap] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('cbt_quiz_folder_map');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [globalCustomFolders, setGlobalCustomFolders] = useState<string[]>([]);
  const [globalQuizFolderMap, setGlobalQuizFolderMap] = useState<Record<string, string>>({});
  const [quizHistory, setQuizHistory] = useState<HistoryEntry[]>(() => {
    const saved = localStorage.getItem('cbtQuizHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedHistoryDetail, setSelectedHistoryDetail] = useState<HistoryEntry | null>(null);
  const [openHistoryReviewIndices, setOpenHistoryReviewIndices] = useState<Record<number, boolean>>({});

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIosInstallModal, setShowIosInstallModal] = useState(false);

  // Auto Fullscreen on Desktop upon first user interaction (click)
  useEffect(() => {
    const handleFirstClick = () => {
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.log("Auto-fullscreen request failed/blocked: ", err);
        });
      }
      window.removeEventListener('click', handleFirstClick);
    };

    window.addEventListener('click', handleFirstClick);
    return () => {
      window.removeEventListener('click', handleFirstClick);
    };
  }, []);
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Leaderboard and saved sessions states
  const [pendingSessions, setPendingSessions] = useState<any[]>([]);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteFileName, setPasteFileName] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [pasteError, setPasteError] = useState('');
  const activeQuizSessionIdRef = useRef<string | null>(null);
  const [activeDashboardTab, setActiveDashboardTab] = useState<'riwayat' | 'leaderboard'>('riwayat');
  const [leaderboardType, setLeaderboardType] = useState<'global' | 'file'>('global');
  const [selectedLeaderboardFile, setSelectedLeaderboardFile] = useState<string>('');
  const [globalLeaderboard, setGlobalLeaderboard] = useState<any[]>([]);
  const [fileLeaderboard, setFileLeaderboard] = useState<any[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [hasSubmittedLeaderboard, setHasSubmittedLeaderboard] = useState(false);
  const [lastQuizScore, setLastQuizScore] = useState(0);
  const [globalTimeFilter, setGlobalTimeFilter] = useState<'all' | '1' | '7' | '30'>('all');

  // Overhaul Tab States
  const [dashboardTab, setDashboardTab] = useState<'home' | 'banks' | 'new' | 'analysis' | 'profile'>('home');
  const [mobileQuizNavOpen, setMobileQuizNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bankFilter, setBankFilter] = useState<'all' | 'ukmppd' | 'flashcard' | 'custom'>('all');
  const [expandedCompetencies, setExpandedCompetencies] = useState<Record<string, boolean>>({});

  // Active quiz states
  const [screen, setScreen] = useState<'setup' | 'quiz' | 'result'>('setup');
  const [currentQuiz, setCurrentQuiz] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [doubtStatus, setDoubtStatus] = useState<boolean[]>([]);
  const [isRevealed, setIsRevealed] = useState<boolean[]>([]);
  const [unlockedHints, setUnlockedHints] = useState<Record<number, number>>({});
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [quizSecondsLeft, setQuizSecondsLeft] = useState<number>(0);
  const [quizTimerActive, setQuizTimerActive] = useState<boolean>(false);
  const [isDailyChallenge, setIsDailyChallenge] = useState<boolean>(false);
  const [keyboardNavEnabled, setKeyboardNavEnabled] = useState<boolean>(true);
  
  // Phase 5: Adaptive Quiz States
  const [isAdaptiveMode, setIsAdaptiveMode] = useState<boolean>(false);
  const [adaptiveHistory, setAdaptiveHistory] = useState<boolean[]>([]);
  const [currentDifficulty, setCurrentDifficulty] = useState<'mudah' | 'sedang' | 'sukar'>('sedang');
  const [adaptiveQuestionPool, setAdaptiveQuestionPool] = useState<Question[]>([]);

  // PWA iOS Install Prompt effect
  useEffect(() => {
    const isIos = /ipad|iphone|ipod/.test(navigator.userAgent.toLowerCase()) && !(window as any).MSStream;
    const isStandalone = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    const hasSeenPrompt = localStorage.getItem('cbt_ios_prompt_seen');
    if (isIos && !isStandalone && !hasSeenPrompt) {
      setShowIosInstallModal(true);
      localStorage.setItem('cbt_ios_prompt_seen', 'true');
    }
  }, []);

  // Active quiz timer effect
  useEffect(() => {
    if (!quizTimerActive || screen !== 'quiz') return;

    const interval = setInterval(() => {
      setQuizSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setQuizTimerActive(false);
          // Auto submit the quiz when time runs out
          finishQuiz();
          triggerToast('Waktu Ujian Telah Habis!', '⏰');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [quizTimerActive, screen]);
  
  const [userXP, setUserXP] = useState(0);
  const [currentCombo, setCurrentCombo] = useState(0); // in-quiz consecutive correct answers
  const [currentStreak, setCurrentStreak] = useState(0); // daily learning streak
  const [longestStreak, setLongestStreak] = useState(0);
  const [streakFreezeLeft, setStreakFreezeLeft] = useState(1);
  const [lastActiveDate, setLastActiveDate] = useState<string | null>(null);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);
  const [xpHistory, setXpHistory] = useState<number[]>([0]);

  // Sync XP and Streak back to Supabase profiles when changed
  useEffect(() => {
    if (!currentUser || authLoading || !isProfileSyncedRef.current) return;
    
    const updateProfile = async () => {
      try {
        const currentLevel = Math.min(100, Math.floor(0.5 + 0.5 * Math.sqrt(1 + userXP / 12.5))) || 1;
        await supabase
          .from('profiles')
          .update({
            xp: userXP,
            level: currentLevel,
            streak: currentStreak, // legacy
            current_streak: currentStreak,
            longest_streak: longestStreak,
            streak_freeze_left: streakFreezeLeft,
            last_active_date: lastActiveDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentUser.id);
      } catch (err) {
        console.error('Gagal sinkronisasi data gamifikasi ke cloud:', err);
      }
    };
    
    updateProfile();
  }, [userXP, currentStreak, currentUser, authLoading]);

  // Floating text / XP notification
  const [floatingXP, setFloatingXP] = useState<{ id: number; text: string; isBenar: boolean; x: number; y: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; icon?: string } | null>(null);

  // Modal confirm states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [modalAction, setModalAction] = useState<(() => void) | null>(null);

  // Accordion review states
  const [openReviewIndices, setOpenReviewIndices] = useState<Record<number, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Group question databases by folder
  const groupedDatabases = React.useMemo(() => {
    const folders: Record<string, { key: string; displayName: string; questions: Question[] }[]> = {};
    const rootItems: { key: string; displayName: string; questions: Question[] }[] = [];

    // Pre-populate custom folders (Global and Local)
    [...globalCustomFolders, ...customFolders].forEach(folder => {
      if (!folders[folder]) folders[folder] = [];
    });

    Object.entries(questionDatabase).forEach(([key, questionsData]) => {
      const questions = questionsData as Question[];
      
      // Prioritize: Local Map -> Global Map -> None
      let folderPath = quizFolderMap[key] !== undefined ? quizFolderMap[key] : globalQuizFolderMap[key];
      let displayName = key;

      if (!folderPath && key.includes('/')) {
        const parts = key.split('/');
        folderPath = parts.slice(0, -1).join('/');
        displayName = parts[parts.length - 1];
      } else if (folderPath && folderPath !== 'root') {
        // If mapped to a custom folder, extract the real display name (remove old path if any)
        if (key.includes('/')) {
          displayName = key.split('/').pop() || key;
        } else {
          displayName = key;
        }
      }

      // If folderPath is explicitly 'root', we clear it so it goes to rootItems
      if (folderPath === 'root') {
        folderPath = undefined;
        if (key.includes('/')) {
          displayName = key.split('/').pop() || key;
        }
      }

      displayName = displayName.replace(/\.(json|yaml|yml)$/i, '');

      if (folderPath) {
        if (!folders[folderPath]) {
          folders[folderPath] = [];
        }
        folders[folderPath].push({ key, displayName, questions });
      } else {
        rootItems.push({ key, displayName, questions });
      }
    });

    return { folders, rootItems };
  }, [questionDatabase, customFolders, quizFolderMap, globalCustomFolders, globalQuizFolderMap]);

  // Filtered databases memo based on search query and category filter
  const filteredDatabases = React.useMemo(() => {
    const q = searchQuery.toLowerCase();
    const matchFilter = (key: string) => {
      if (bankFilter === 'all') return true;
      if (bankFilter === 'ukmppd') return key.toLowerCase().includes('ukmppd');
      if (bankFilter === 'flashcard') return key.toLowerCase().includes('flashcard') || key.toLowerCase().includes('isian') || key.toLowerCase().includes('kombinasi') || key.toLowerCase().includes('card');
      if (bankFilter === 'custom') return !key.toLowerCase().includes('ukmppd') && !key.toLowerCase().includes('flashcard') && !key.toLowerCase().includes('isian') && !key.toLowerCase().includes('kombinasi') && !key.toLowerCase().includes('card');
      return true;
    };

    const folders: Record<string, { key: string; displayName: string; questions: Question[] }[]> = {};
    const rootItems: { key: string; displayName: string; questions: Question[] }[] = [];

    Object.entries(groupedDatabases.folders).forEach(([folderPath, files]) => {
      const filteredFiles = (files as { key: string; displayName: string; questions: Question[] }[]).filter(f => f.displayName.toLowerCase().includes(q) && matchFilter(f.key));
      // Include empty folders only if not searching
      if (filteredFiles.length > 0 || (q === '' && bankFilter === 'all')) {
        folders[folderPath] = filteredFiles;
      }
    });

    groupedDatabases.rootItems.forEach(item => {
      if (item.displayName.toLowerCase().includes(q) && matchFilter(item.key)) {
        rootItems.push(item);
      }
    });

    return { folders, rootItems };
  }, [groupedDatabases, searchQuery, bankFilter]);

  // Apply theme class to document
  useEffect(() => {
    localStorage.setItem('cbt_theme', theme);
  }, [theme]);

  // Save custom folders to local storage
  useEffect(() => {
    localStorage.setItem('cbt_custom_folders', JSON.stringify(customFolders));
  }, [customFolders]);

  // Save quiz folder mapping to local storage
  useEffect(() => {
    localStorage.setItem('cbt_quiz_folder_map', JSON.stringify(quizFolderMap));
  }, [quizFolderMap]);

  // Save history helper
  const saveHistoryToLocalStorage = (newHistory: HistoryEntry[]) => {
    setQuizHistory(newHistory);
    localStorage.setItem('cbtQuizHistory', JSON.stringify(newHistory));
  };

  // Helper to show custom dynamic toast
  const triggerToast = (text: string, icon = 'ℹ️') => {
    setToastMessage({ text, icon });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Trigger floating XP indicator
  const triggerFloatingXP = (text: string, isBenar: boolean, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * 40;
    const y = rect.top - 15;
    setFloatingXP({ id: Date.now(), text, isBenar, x, y });
    setTimeout(() => setFloatingXP(null), 1500);
  };

  // === AUTHENTICATION METHODS ===

  const syncUserProfile = async (user: any, currentSessionId: string) => {
    const userId = user.id;
    const email = user.email || '';
    const defaultUsername = email ? email.split('@')[0] : 'user';
    try {
      // 1. Ambil data profil dari Supabase profiles
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profil belum dibuat (trigger Supabase lambat), kita buat manual
        const newProfile = {
          id: userId,
          username: defaultUsername,
          xp: 0,
          streak: 0,
          level: 1,
          active_session_id: currentSessionId
        };
        await supabase.from('profiles').insert(newProfile);
        profile = newProfile;
      } else if (error) {
        throw error;
      }

      if (profile) {
        // 2. Cek Single Device Session
        if (isLoggingInRef.current) {
          // Jika proses login baru, langsung update session ID di DB dan matikan flag
          await supabase
            .from('profiles')
            .update({ active_session_id: currentSessionId })
            .eq('id', userId);
          isLoggingInRef.current = false;
        } else {
          // Jika background check biasa, cek apakah session ID bentrok dengan device lain
          if (profile.active_session_id && profile.active_session_id !== currentSessionId) {
            setIsSessionKicked(true);
            await supabase.auth.signOut();
            return;
          }

          // Update active_session_id di database jika masih kosong
          if (!profile.active_session_id) {
            await supabase
              .from('profiles')
              .update({ active_session_id: currentSessionId })
              .eq('id', userId);
          }
        }

        // Set state gamifikasi dari cloud profile
        setUserXP(profile.xp || 0);
        
        // Cek timezone Asia/Jakarta
        const nowInJakarta = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
        const todayStr = nowInJakarta.toISOString().split('T')[0];
        
        let savedStreak = profile.current_streak ?? profile.streak ?? 0;
        let freezeLeft = profile.streak_freeze_left ?? 1;
        let lastActive = profile.last_active_date || null;
        
        // Logika Reset Streak saat login (jika terlewat hari)
        if (lastActive) {
          const lastActiveDateObj = new Date(lastActive);
          // Normalize to midnight
          lastActiveDateObj.setHours(0, 0, 0, 0);
          const todayDateObj = new Date(todayStr);
          todayDateObj.setHours(0, 0, 0, 0);
          
          const diffDays = Math.floor((todayDateObj.getTime() - lastActiveDateObj.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays > 1) {
            // Cek apakah punya freeze dan mau digunakan otomatis? (Implementasi di sini anggap manual via tombol, jadi reset aja jika > 1)
            // Atau otomatis pakai freeze jika diffDays == 2
            if (diffDays === 2 && freezeLeft > 0) {
              freezeLeft -= 1;
              // Streak aman
            } else {
              savedStreak = 0; // Reset streak
            }
          }
        }
        
        setCurrentStreak(savedStreak);
        setLongestStreak(profile.longest_streak || savedStreak);
        setStreakFreezeLeft(freezeLeft);
        setLastActiveDate(lastActive);

        setTotalQuestionsAnswered(profile.total_questions_answered || 0);
        setXpHistory([profile.xp || 0]);
        setProfileUsername(profile.username || 'user');
        isProfileSyncedRef.current = true;
      }

      // 3. Tarik data kuis (question_banks) terisolasi & bawaan
      await fetchUserQuestions(userId, profile?.username || 'user');

      // 4. Periksa sesi kuis tertunda
      await checkActiveQuizSession(userId);

      // 5. Muat leaderboard global
      await fetchGlobalLeaderboard();
    } catch (err) {
      console.error('Error syncing user profile:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const checkActiveQuizSession = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      let cloudSessions: any[] = [];
      if (data && data.current_quiz_json) {
        const parsedQuiz = typeof data.current_quiz_json === 'string'
          ? JSON.parse(data.current_quiz_json)
          : data.current_quiz_json;
        
        if (parsedQuiz && parsedQuiz.is_multi_session === true) {
          cloudSessions = parsedQuiz.sessions || [];
        } else if (parsedQuiz) {
          const selectedDbs = typeof data.selected_databases === 'string'
            ? JSON.parse(data.selected_databases)
            : data.selected_databases;
          cloudSessions = [{
            id: `legacy_${new Date(data.updated_at).getTime()}`,
            title: selectedDbs ? selectedDbs.join(', ') : 'Kuis Sebelumnya',
            current_quiz_json: data.current_quiz_json,
            current_index: data.current_index,
            user_answers_json: data.user_answers_json,
            doubt_status_json: data.doubt_status_json,
            is_revealed_json: data.is_revealed_json,
            unlocked_hints_json: data.unlocked_hints_json,
            selected_databases: selectedDbs,
            quiz_mode: data.quiz_mode,
            updated_at: data.updated_at
          }];
        }
      }

      let localSessions: any[] = [];
      try {
        const savedLocal = localStorage.getItem('cbt_active_sessions');
        if (savedLocal) {
          localSessions = JSON.parse(savedLocal);
        }
      } catch (e) {
        console.error('Error loading local sessions:', e);
      }

      const sessionMap = new Map<string, any>();
      [...localSessions, ...cloudSessions].forEach(s => {
        if (!s || !s.id) return;
        const existing = sessionMap.get(s.id);
        if (!existing || new Date(s.updated_at) > new Date(existing.updated_at)) {
          sessionMap.set(s.id, s);
        }
      });

      const mergedSessions = Array.from(sessionMap.values()).sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      setPendingSessions(mergedSessions);
      localStorage.setItem('cbt_active_sessions', JSON.stringify(mergedSessions));
    } catch (err) {
      console.error('Error checking active quiz session:', err);
    }
  };

  const resumeQuizSession = (session: any) => {
    try {
      const pool = typeof session.current_quiz_json === 'string'
        ? JSON.parse(session.current_quiz_json)
        : session.current_quiz_json;
      const answers = typeof session.user_answers_json === 'string'
        ? JSON.parse(session.user_answers_json)
        : session.user_answers_json;
      const doubt = typeof session.doubt_status_json === 'string'
        ? JSON.parse(session.doubt_status_json)
        : session.doubt_status_json;
      const revealed = typeof session.is_revealed_json === 'string'
        ? JSON.parse(session.is_revealed_json)
        : session.is_revealed_json;
      const hints = typeof session.unlocked_hints_json === 'string'
        ? JSON.parse(session.unlocked_hints_json)
        : session.unlocked_hints_json;
      const selectedDbs = typeof session.selected_databases === 'string'
        ? JSON.parse(session.selected_databases)
        : session.selected_databases;

      activeQuizSessionIdRef.current = session.id;

      setCurrentQuiz(pool);
      setUserAnswers(answers);
      setDoubtStatus(doubt);
      setIsRevealed(revealed);
      setUnlockedHints(hints);
      setCurrentIndex(session.current_index);
      setSelectedDatabases(selectedDbs || []);
      setQuizMode(session.quiz_mode);

      setScreen('quiz');
      setShowSidebar(true);
      setQuizSecondsLeft(session.seconds_left !== undefined ? session.seconds_left : pool.length * 60);
      setQuizTimerActive(true);
      triggerToast(`Melanjutkan kuis: ${session.title}!`, '🚀');
    } catch (err) {
      console.error('Error parsing session data:', err);
      triggerToast('Gagal memuat sesi kuis tertunda', '❌');
    }
  };

  const discardQuizSession = async (sessionId: string) => {
    if (!currentUser) return;
    setModalTitle('Hapus Sesi Tertunda?');
    setModalDesc('Sesi kuis ini akan dihapus secara permanen. Apakah Anda yakin?');
    setModalAction(() => async () => {
      try {
        let localList: any[] = [];
        try {
          const saved = localStorage.getItem('cbt_active_sessions');
          if (saved) localList = JSON.parse(saved);
        } catch (e) {}

        const updatedList = localList.filter(s => s.id !== sessionId);
        localStorage.setItem('cbt_active_sessions', JSON.stringify(updatedList));
        setPendingSessions(updatedList);

        if (updatedList.length > 0) {
          await supabase
            .from('quiz_sessions')
            .upsert({
              user_id: currentUser.id,
              current_quiz_json: { is_multi_session: true, sessions: updatedList },
              updated_at: new Date().toISOString()
            });
        } else {
          await supabase
            .from('quiz_sessions')
            .delete()
            .eq('user_id', currentUser.id);
        }
        
        triggerToast('Sesi kuis tertunda dihapus.', '🗑');
      } catch (err) {
        console.error(err);
        triggerToast('Gagal menghapus sesi tertunda', '❌');
      }
    });
    setModalOpen(true);
  };

  const fetchGlobalLeaderboard = async () => {
    try {
      setIsLeaderboardLoading(true);
      let allData: any[] = [];
      if (globalTimeFilter === 'all') {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, total_questions_answered, level')
          .order('total_questions_answered', { ascending: false });
        
        if (error) throw error;
        allData = data || [];
      } else {
        const { data, error } = await supabase
          .rpc('get_time_leaderboard', { interval_days: parseInt(globalTimeFilter) });
        
        if (error) throw error;
        allData = (data || []).map((row: any) => ({
          id: row.user_id, // assuming rpc returns user_id
          username: row.username,
          level: row.level,
          total_questions_answered: parseInt(row.total_questions_answered)
        }));
      }

      // If we don't have user_id from RPC, we might not be able to match currentUser exactly, but we can match by username
      const userRankIndex = allData.findIndex(u => u.username === profileUsername);
      let top10 = allData.slice(0, 10);
      
      // If user is not in top 10, add them at the end with their actual rank
      if (userRankIndex > 9) {
        top10.push({
          ...allData[userRankIndex],
          isCurrentUserOutOfTop10: true,
          actualRank: userRankIndex + 1
        });
      }

      setGlobalLeaderboard(top10);
    } catch (err) {
      console.error('Error fetching global leaderboard:', err);
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  const fetchFileLeaderboard = async (fileName: string) => {
    if (!fileName) return;
    try {
      setIsLeaderboardLoading(true);
      const { data, error } = await supabase
        .from('leaderboard')
        .select(`
          user_id,
          score,
          questions_count,
          created_at,
          profiles (
            username,
            level
          )
        `)
        .eq('file_name', fileName)
        .order('score', { ascending: false })
        .order('questions_count', { ascending: false });
      
      if (error) throw error;
      
      const allData: any[] = (data || []).map((row: any) => ({
        user_id: row.user_id,
        username: row.profiles?.username || 'User',
        level: row.profiles?.level || 1,
        score: row.score,
        questions_count: row.questions_count,
        created_at: row.created_at
      }));
      
      const userRankIndex = allData.findIndex(u => u.username === profileUsername);
      let top10 = allData.slice(0, 10);
      
      if (userRankIndex > 9) {
        top10.push({
          ...allData[userRankIndex],
          isCurrentUserOutOfTop10: true,
          actualRank: userRankIndex + 1
        });
      }

      setFileLeaderboard(top10);
    } catch (err) {
      console.error('Error fetching file leaderboard:', err);
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  const submitScoreToLeaderboard = async () => {
    if (!currentUser || selectedDatabases.length === 0) return;
    try {
      setIsLeaderboardLoading(true);
      const dbName = selectedDatabases[0];
      const { error } = await supabase
        .from('leaderboard')
        .upsert({
          user_id: currentUser.id,
          file_name: dbName,
          score: lastQuizScore,
          questions_count: currentQuiz.length,
          created_at: new Date().toISOString()
        }, { onConflict: 'user_id,file_name' });

      if (error) throw error;
      setHasSubmittedLeaderboard(true);
      triggerToast('Skor Anda berhasil diunggah ke leaderboard!', '🏆');
      await fetchFileLeaderboard(dbName);
    } catch (err) {
      console.error(err);
      triggerToast('Gagal mengunggah skor ke leaderboard', '❌');
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  // Debounced auto-save effect
  useEffect(() => {
    if (screen !== 'quiz' || !currentUser || currentQuiz.length === 0) return;

    const timer = setTimeout(async () => {
      if (!activeQuizSessionIdRef.current) return; // Prevent auto-save if quiz is already finished

      try {
        const activeId = activeQuizSessionIdRef.current;

        const title = selectedDatabases.map(db => db.replace('.json', '').replace('.yaml', '')).join(', ') || 'Kuis Kustom';
        const currentSession = {
          id: activeId,
          title,
          current_quiz_json: currentQuiz,
          current_index: currentIndex,
          user_answers_json: userAnswers,
          doubt_status_json: doubtStatus,
          is_revealed_json: isRevealed,
          unlocked_hints_json: unlockedHints,
          selected_databases: selectedDatabases,
          quiz_mode: quizMode,
          seconds_left: quizSecondsLeft,
          updated_at: new Date().toISOString()
        };

        let localList: any[] = [];
        try {
          const saved = localStorage.getItem('cbt_active_sessions');
          if (saved) localList = JSON.parse(saved);
        } catch (e) {}

        const idx = localList.findIndex(s => s.id === activeId);
        if (idx !== -1) {
          localList[idx] = currentSession;
        } else {
          localList.unshift(currentSession);
        }

        localStorage.setItem('cbt_active_sessions', JSON.stringify(localList));
        setPendingSessions(localList);

        await supabase
          .from('quiz_sessions')
          .upsert({
            user_id: currentUser.id,
            current_quiz_json: { is_multi_session: true, sessions: localList },
            updated_at: new Date().toISOString()
          });
      } catch (err) {
        console.error('Gagal menyimpan sesi kuis otomatis:', err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [screen, currentQuiz, currentIndex, userAnswers, doubtStatus, isRevealed, unlockedHints, selectedDatabases, quizMode, currentUser]);

  useEffect(() => {
    if (selectedLeaderboardFile && activeDashboardTab === 'leaderboard') {
      fetchFileLeaderboard(selectedLeaderboardFile);
    }
  }, [selectedLeaderboardFile, activeDashboardTab]);

  useEffect(() => {
    if (activeDashboardTab === 'leaderboard' && leaderboardType === 'global') {
      fetchGlobalLeaderboard();
    }
  }, [globalTimeFilter, activeDashboardTab, leaderboardType]);

  const fetchGlobalSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value');
      if (error) {
        if (error.code !== '42P01') console.error('Error fetching global settings:', error);
        return;
      }
      if (data) {
        data.forEach(row => {
          if (row.key === 'customFolders') setGlobalCustomFolders(row.value || []);
          if (row.key === 'quizFolderMap') setGlobalQuizFolderMap(row.value || {});
        });
      }
    } catch (err) {
      console.error('Error in fetchGlobalSettings:', err);
    }
  };

  const fetchUserQuestions = async (userId: string, username: string) => {
    try {
      const { data, error } = await supabase
        .from('question_banks')
        .select(`
          name,
          questions_json,
          user_id,
          profiles (
            username
          )
        `);
      
      if (error) throw error;
      
      const mappedData: Record<string, Question[]> = {};
      const globals: string[] = [];
      const uploaders: Record<string, string> = {};
      
      if (data) {
        data.forEach((row: any) => {
          mappedData[row.name] = typeof row.questions_json === 'string'
            ? JSON.parse(row.questions_json)
            : row.questions_json;
          
          // Cek apakah pemiliknya adalah admin (global database)
          const ownerProfile = row.profiles as any;
          if (ownerProfile) {
            uploaders[row.name] = ownerProfile.username;
            if (ownerProfile.username === 'admin') {
              globals.push(row.name);
            }
          }
        });
      }
      setUploaderMap(uploaders);
      
      // Seed bank soal sampel jika login sebagai admin dan database kosong
      if (username === 'admin' && Object.keys(mappedData).length === 0) {
        console.log('Akun admin kosong. Melakukan seeding sampel bawaan...');
        for (const [name, questions] of Object.entries(SAMPLE_BANKS)) {
          await supabase
            .from('question_banks')
            .upsert({ user_id: userId, name, questions_json: questions }, { onConflict: 'user_id,name' });
          mappedData[name] = questions;
          globals.push(name);
        }
      }
      
      setGlobalDatabases(globals);
      setQuestionDatabase(mappedData);
      setSelectedDatabases([]);
    } catch (err) {
      console.error('Error fetching questions:', err);
    }
  };

  // Auth Listener
  useEffect(() => {
    const checkSession = async () => {
      try {
        await fetchGlobalSettings();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setCurrentUser(session.user);
          let token = localStorage.getItem('cbt_session_token');
          if (!token) {
            token = Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem('cbt_session_token', token);
          }
          setLocalSessionId(token);
          await syncUserProfile(session.user, token);
        } else {
          setCurrentUser(null);
          setQuestionDatabase({});
          setSelectedDatabases([]);
          setProfileUsername('user');
          setAuthLoading(false);
        }
      } catch (err) {
        console.error('Error checking session:', err);
        setAuthLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_IN' && session) {
          setCurrentUser(session.user);
          let token = localStorage.getItem('cbt_session_token');
          if (!token) {
            token = Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem('cbt_session_token', token);
          }
          setLocalSessionId(token);
          await syncUserProfile(session.user, token);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setLocalSessionId(null);
          setQuestionDatabase({});
          setSelectedDatabases([]);
          setProfileUsername('user');
          isProfileSyncedRef.current = false;
          setAuthLoading(false);
        }
      } catch (err) {
        console.error('Error on auth state change:', err);
        setAuthLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Periodic active session checking
  useEffect(() => {
    if (!currentUser || !localSessionId) return;

    const interval = setInterval(async () => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('active_session_id')
          .eq('id', currentUser.id)
          .single();

        if (error) throw error;
        
        if (profile && profile.active_session_id !== localSessionId) {
          setIsSessionKicked(true);
          await supabase.auth.signOut();
        }
      } catch (err) {
        console.error('Error checking active session:', err);
      }
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [currentUser, localSessionId]);

  // Auth Submit Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      triggerToast('Username dan password wajib diisi!', '⚠️');
      return;
    }
    setAuthLoading(true);
    setIsSessionKicked(false);
    isLoggingInRef.current = true;

    // Generate new token on fresh login to take over session
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('cbt_session_token', token);
    setLocalSessionId(token);

    try {
      const email = emailInput.includes('@') 
        ? emailInput.trim() 
        : `${emailInput.trim().toLowerCase()}@ai.online`;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: passwordInput,
      });
      if (error) {
        isLoggingInRef.current = false;
        throw error;
      }
      triggerToast('Berhasil masuk!', '🔑');
    } catch (err: any) {
      console.error(err);
      isLoggingInRef.current = false;
      triggerToast('Username atau password salah', '❌');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    const folderName = window.prompt("Masukkan nama folder baru:");
    if (folderName && folderName.trim() !== "") {
      const name = folderName.trim();
      const isAdmin = profileUsername === 'collector' || profileUsername === 'admin';
      
      let isGlobal = false;
      if (isAdmin) {
        isGlobal = window.confirm("Jadikan folder ini global (terlihat untuk semua pengguna)?\nBatal (Cancel) untuk folder personal.");
      }

      if (isGlobal) {
        if (!globalCustomFolders.includes(name)) {
          const newGlobal = [...globalCustomFolders, name];
          setGlobalCustomFolders(newGlobal);
          try {
            await supabase.from('app_settings').upsert({ key: 'customFolders', value: newGlobal });
            triggerToast(`Folder global "${name}" berhasil dibuat!`, '🌍');
          } catch (e) {
            triggerToast(`Gagal menyimpan ke server`, '❌');
          }
        } else {
          triggerToast(`Folder "${name}" sudah ada.`, '⚠️');
        }
      } else {
        if (!customFolders.includes(name)) {
          setCustomFolders(prev => [...prev, name]);
          triggerToast(`Folder "${name}" berhasil dibuat secara personal!`, '📁');
        } else {
          triggerToast(`Folder "${name}" sudah ada.`, '⚠️');
        }
      }
    }
  };

  const handleMoveQuiz = async (quizKey: string, targetFolder: string) => {
    const isAdmin = profileUsername === 'collector' || profileUsername === 'admin';
    if (isAdmin) {
      const newMap = { ...globalQuizFolderMap };
      if (targetFolder === 'root') {
        delete newMap[quizKey];
        triggerToast(`Kuis dipindahkan ke file lepas secara Global`, '🌍');
      } else {
        newMap[quizKey] = targetFolder;
        triggerToast(`Kuis dipindahkan ke folder "${targetFolder}" secara Global`, '🌍');
      }
      setGlobalQuizFolderMap(newMap);
      
      // Hapus dari personal map agar global terpancar
      setQuizFolderMap(prev => {
        const pMap = { ...prev };
        delete pMap[quizKey];
        return pMap;
      });

      try {
        await supabase.from('app_settings').upsert({ key: 'quizFolderMap', value: newMap });
      } catch (e) {
        console.error(e);
      }
    } else {
      setQuizFolderMap(prev => {
        const newMap = { ...prev };
        if (targetFolder === 'root') {
          // Khusus non-admin, target 'root' akan kita anggap paksa override agar lepas
          newMap[quizKey] = 'root';
          triggerToast(`Kuis dikembalikan ke file lepas`, '📦');
        } else {
          newMap[quizKey] = targetFolder;
          triggerToast(`Kuis dipindahkan ke folder "${targetFolder}"`, '📂');
        }
        return newMap;
      });
    }
  };

  const handleResetPersonal = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus semua susunan folder personal Anda dan kembali ke susunan Global/Admin?")) {
      setCustomFolders([]);
      setQuizFolderMap({});
      triggerToast("Susunan folder personal direset", "♻️");
    }
  };

  // === DATABASE METHODS ===
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    reader.onload = (event) => {
      const raw = event.target?.result as string;
      if (ext !== 'json' && ext !== 'yaml' && ext !== 'yml') {
        triggerToast('Hanya mendukung format .json, .yaml, atau .yml', '❌');
        return;
      }

      const finalQuestions = parseRawFileToQuestions(raw, ext);
      if (finalQuestions && finalQuestions.length > 0) {
        // Simpan ke database Supabase
        (async () => {
          try {
            const { error } = await supabase
              .from('question_banks')
              .upsert({ user_id: currentUser.id, name: file.name, questions_json: finalQuestions }, { onConflict: 'user_id,name' });
            if (error) throw error;
            const updated = { ...questionDatabase, [file.name]: finalQuestions };
            setQuestionDatabase(updated);
            localStorage.setItem('questionDB', JSON.stringify(updated));
            setSelectedDatabases((prev) => [...new Set([...prev, file.name])]);
            triggerToast(`Berhasil memuat ${finalQuestions.length} soal dari "${file.name}"`, '✅');
          } catch (err) {
            console.error(err);
            // Fallback lokal jika database cloud bermasalah
            const updated = { ...questionDatabase, [file.name]: finalQuestions };
            setQuestionDatabase(updated);
            localStorage.setItem('questionDB', JSON.stringify(updated));
            setSelectedDatabases((prev) => [...new Set([...prev, file.name])]);
            triggerToast(`Berhasil memuat soal secara lokal, gagal menyimpan di cloud Supabase`, '⚠️');
          }
        })();
      } else {
        triggerToast('Gagal mem-parsing file tersebut atau tidak ditemukan soal valid', '❌');
      }
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let loadedCount = 0;
    let skippedCount = 0;
    let totalQuestionsCount = 0;
    const newDatabases: Record<string, Question[]> = {};

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = file.webkitRelativePath || file.name;
      const ext = file.name.split('.').pop()?.toLowerCase();

      // Only process json, yaml, yml files
      if (ext !== 'json' && ext !== 'yaml' && ext !== 'yml') {
        skippedCount++;
        continue;
      }

      try {
        const raw = await readFileAsText(file);
        const finalQuestions = parseRawFileToQuestions(raw, ext);

        if (finalQuestions && finalQuestions.length > 0) {
          newDatabases[path] = finalQuestions;
          loadedCount++;
          totalQuestionsCount += finalQuestions.length;
        } else {
          skippedCount++;
        }
      } catch (err) {
        console.error(`Error parsing file ${path}:`, err);
        skippedCount++;
      }
    }

    if (loadedCount > 0) {
      try {
        // Simpan setiap bank soal ke Supabase
        for (const [name, questions] of Object.entries(newDatabases)) {
          const { error } = await supabase
            .from('question_banks')
            .upsert({ user_id: currentUser.id, name, questions_json: questions }, { onConflict: 'user_id,name' });
          if (error) throw error;
        }

        const updated = { ...questionDatabase, ...newDatabases };
        setQuestionDatabase(updated);
        localStorage.setItem('questionDB', JSON.stringify(updated));
        
        // Auto-select all newly loaded databases
        const newKeys = Object.keys(newDatabases);
        setSelectedDatabases((prev) => [...new Set([...prev, ...newKeys])]);

        // Expand folders that were newly loaded
        const foldersToOpen = { ...openFolders };
        newKeys.forEach((k) => {
          if (k.includes('/')) {
            const folderName = k.substring(0, k.lastIndexOf('/'));
            foldersToOpen[folderName] = true;
          }
        });
        setOpenFolders(foldersToOpen);

        triggerToast(`Berhasil memuat ${loadedCount} bank soal (${totalQuestionsCount} soal) dari folder!`, '✅');
      } catch (err) {
        console.error(err);
        // Tetap simpan lokal sebagai fallback
        const updated = { ...questionDatabase, ...newDatabases };
        setQuestionDatabase(updated);
        localStorage.setItem('questionDB', JSON.stringify(updated));
        const newKeys = Object.keys(newDatabases);
        setSelectedDatabases((prev) => [...new Set([...prev, ...newKeys])]);
        triggerToast(`Berhasil memuat folder secara lokal, gagal menyimpan di cloud Supabase`, '⚠️');
      }
    } else {
      triggerToast('Tidak ditemukan berkas soal .json/.yaml valid di dalam folder', '⚠️');
    }

    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const handlePasteSubmit = async () => {
    setPasteError('');
    if (!pasteFileName.trim()) {
      setPasteError('Nama kuis wajib diisi!');
      return;
    }
    if (!pasteContent.trim()) {
      setPasteError('Kode JSON/YAML tidak boleh kosong!');
      return;
    }

    const name = pasteFileName.endsWith('.json') || pasteFileName.endsWith('.yaml') || pasteFileName.endsWith('.yml') 
      ? pasteFileName 
      : `${pasteFileName}.json`;

    // Try parsing
    let ext = 'json';
    if (pasteContent.trim().startsWith('-') || !pasteContent.trim().startsWith('[')) {
      ext = 'yaml'; // Simple heuristic
    }

    const finalQuestions = parseRawFileToQuestions(pasteContent, ext);
    if (finalQuestions && finalQuestions.length > 0) {
      if (currentUser) {
        try {
          const { error } = await supabase
            .from('question_banks')
            .upsert({ user_id: currentUser.id, name, questions_json: finalQuestions }, { onConflict: 'user_id,name' });
          if (error) throw error;
          
          triggerToast(`Berhasil menyimpan ${finalQuestions.length} soal sebagai "${name}"`, '✅');
        } catch (err) {
          triggerToast(`Berhasil menyimpan secara lokal, gagal upload ke cloud`, '⚠️');
        }
      } else {
        triggerToast(`Berhasil menyimpan ${finalQuestions.length} soal sebagai "${name}"`, '✅');
      }

      const updated = { ...questionDatabase, [name]: finalQuestions };
      setQuestionDatabase(updated);
      localStorage.setItem('questionDB', JSON.stringify(updated));
      setSelectedDatabases((prev) => [...new Set([...prev, name])]);
      
      setPasteModalOpen(false);
      setPasteFileName('');
      setPasteContent('');
    } else {
      setPasteError('Gagal mem-parsing isi teks. Pastikan format JSON/YAML valid.');
    }
  };

  const removeDatabase = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    (async () => {
      try {
        const { error } = await supabase
          .from('question_banks')
          .delete()
          .eq('name', name)
          .eq('user_id', currentUser.id);
        if (error) throw error;
        const updated = { ...questionDatabase };
        delete updated[name];
        setQuestionDatabase(updated);
        localStorage.setItem('questionDB', JSON.stringify(updated));
        setSelectedDatabases((prev) => prev.filter((d) => d !== name));
        triggerToast(`File "${name}" dihapus dari database`, '🗑');
      } catch (err) {
        console.error(err);
        // Hapus lokal saja jika server gagal
        const updated = { ...questionDatabase };
        delete updated[name];
        setQuestionDatabase(updated);
        localStorage.setItem('questionDB', JSON.stringify(updated));
        setSelectedDatabases((prev) => prev.filter((d) => d !== name));
        triggerToast(`File "${name}" dihapus secara lokal, gagal menghapus di cloud`, '⚠️');
      }
    })();
  };

  const removeFolder = (folderPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalTitle('Hapus Folder?');
    setModalDesc(`Apakah Anda yakin ingin menghapus folder "${folderPath}" beserta seluruh bank soal di dalamnya?`);
    setModalAction(() => async () => {
      const keysToRemove = Object.keys(questionDatabase).filter(
        (key) => key.startsWith(folderPath + '/')
      );
      if (keysToRemove.length === 0) return;

      try {
        // Hapus setiap file dari Supabase
        for (const key of keysToRemove) {
          const { error } = await supabase
            .from('question_banks')
            .delete()
            .eq('name', key)
            .eq('user_id', currentUser.id);
          if (error) throw error;
        }

        const updated = { ...questionDatabase };
        keysToRemove.forEach((k) => delete updated[k]);

        setQuestionDatabase(updated);
        localStorage.setItem('questionDB', JSON.stringify(updated));

        setSelectedDatabases((prev) => prev.filter((d) => !keysToRemove.includes(d)));
        setQuestionLimits((prev) => {
          const next = { ...prev };
          keysToRemove.forEach((k) => delete next[k]);
          return next;
        });

        triggerToast(`Folder "${folderPath}" dan semua isinya berhasil dihapus!`, '🗑️');
      } catch (err) {
        console.error(err);
        // Fallback hapus lokal
        const updated = { ...questionDatabase };
        keysToRemove.forEach((k) => delete updated[k]);
        setQuestionDatabase(updated);
        localStorage.setItem('questionDB', JSON.stringify(updated));
        setSelectedDatabases((prev) => prev.filter((d) => !keysToRemove.includes(d)));
        triggerToast(`Folder dihapus secara lokal, gagal menghapus beberapa file di cloud`, '⚠️');
      }
    });
    setModalOpen(true);
  };

  const clearAllDatabases = () => {
    setModalTitle('Hapus Semua Database?');
    setModalDesc('Semua bank soal yang tersimpan di server dan browser akan dihapus permanen.');
    setModalAction(() => async () => {
      try {
        const { error } = await supabase
          .from('question_banks')
          .delete()
          .eq('user_id', currentUser.id);
        if (error) throw error;
        setQuestionDatabase({});
        localStorage.removeItem('questionDB');
        setSelectedDatabases([]);
        triggerToast('Seluruh database berhasil dibersihkan', '🗑');
      } catch (err) {
        console.error(err);
        setQuestionDatabase({});
        localStorage.removeItem('questionDB');
        setSelectedDatabases([]);
        triggerToast('Database dibersihkan lokal, gagal membersihkan di cloud', '⚠️');
      }
    });
    setModalOpen(true);
  };

  const downloadDatabase = (name: string, questions: Question[], e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(questions, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", name.endsWith('.json') || name.endsWith('.yaml') || name.endsWith('.yml') ? name : `${name}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      triggerToast(`Berhasil mengunduh "${name}"`, '📥');
    } catch (err) {
      console.error(err);
      triggerToast('Gagal mengunduh file', '❌');
    }
  };

  const copyQuestionToClipboard = () => {
    const q = currentQuiz[currentIndex];
    if (!q) return;

    let textToCopy = `Soal:\n${q.pertanyaan.replace(/<[^>]*>/g, '')}\n\n`;
    if (q.pilihan && q.pilihan.length > 0) {
      const letters = ['A', 'B', 'C', 'D', 'E'];
      textToCopy += 'Pilihan Jawaban:\n';
      q.pilihan.forEach((opt, i) => {
        textToCopy += `${letters[i]}. ${opt}\n`;
      });
    }
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        triggerToast('Soal & opsi disalin ke clipboard!', '📋');
      })
      .catch((err) => {
        console.error('Gagal menyalin kuis:', err);
        triggerToast('Gagal menyalin soal', '❌');
      });
  };

  const loadSampleQuestions = async () => {
    try {
      // Simpan semua SAMPLE_BANKS ke Supabase
      for (const [name, questions] of Object.entries(SAMPLE_BANKS)) {
        const { error } = await supabase
          .from('question_banks')
          .upsert({ user_id: currentUser.id, name, questions_json: questions }, { onConflict: 'user_id,name' });
        if (error) throw error;
      }
      
      const updated = { ...questionDatabase, ...SAMPLE_BANKS };
      setQuestionDatabase(updated);
      localStorage.setItem('questionDB', JSON.stringify(updated));
      setSelectedDatabases(Object.keys(SAMPLE_BANKS));
      triggerToast('Bank soal sampel kedokteran & sains berhasil dimuat!', '✨');
    } catch (err) {
      console.error(err);
      // Fallback lokal
      const updated = { ...questionDatabase, ...SAMPLE_BANKS };
      setQuestionDatabase(updated);
      localStorage.setItem('questionDB', JSON.stringify(updated));
      setSelectedDatabases(Object.keys(SAMPLE_BANKS));
      triggerToast('Bank soal sampel dimuat lokal, gagal memuat ke cloud', '⚠️');
    }
  };

  // === HISTORIS METHODS ===
  const deleteHistoryItem = (id: number) => {
    const updated = quizHistory.filter((item) => item.id !== id);
    saveHistoryToLocalStorage(updated);
    triggerToast('Satu riwayat kuis dihapus', '🗑');
  };

  const clearAllHistory = () => {
    setModalTitle('Hapus Semua Riwayat?');
    setModalDesc('Seluruh catatan hasil skor kuis terdahulu akan dihapus secara permanen.');
    setModalAction(() => () => {
      saveHistoryToLocalStorage([]);
      triggerToast('Riwayat percobaan berhasil dikosongkan', '🗑');
    });
    setModalOpen(true);
  };

  // === QUIZ LOGIC ===
  const shuffleArray = <T,>(array: T[]): T[] => {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const shuffleQuestionOptions = (q: Question): Question => {
    if (!q.pilihan || q.pilihan.length <= 1) return q;

    // 1. Dapatkan teks jawaban benar yang asli
    let correctOptionText = '';
    const correctLetter = getCorrectLetterForQuestion(q);
    const correctIndex = ['A', 'B', 'C', 'D', 'E'].indexOf(correctLetter);

    if (correctIndex !== -1 && correctIndex < q.pilihan.length) {
      correctOptionText = q.pilihan[correctIndex];
    } else {
      correctOptionText = q.jawaban_benar;
    }

    // 2. Acak opsi jawaban
    const shuffledPilihan = shuffleArray([...q.pilihan]);

    // 3. Tentukan letak indeks jawaban yang baru setelah diacak
    const newCorrectIndex = shuffledPilihan.indexOf(correctOptionText);
    let newJawabanBenar = q.jawaban_benar;

    if (newCorrectIndex !== -1) {
      const letters = ['A', 'B', 'C', 'D', 'E'];
      const newCorrectLetter = letters[newCorrectIndex];

      // Jika jawaban_benar aslinya adalah huruf tunggal A-E, perbarui ke huruf baru
      if (/^[A-E]$/i.test(q.jawaban_benar.trim())) {
        newJawabanBenar = newCorrectLetter;
      }
    }

    // 4. Remap eliminasi_opsi jika ada
    let newEliminasiOpsi = q.eliminasi_opsi;
    if (q.eliminasi_opsi) {
      const letters = ['A', 'B', 'C', 'D', 'E'];
      const updatedEliminasi: Record<string, string> = {};

      q.pilihan.forEach((oldOpt, oldIdx) => {
        const oldLetter = letters[oldIdx];
        const desc = q.eliminasi_opsi![oldLetter] || q.eliminasi_opsi![oldLetter.toLowerCase()];
        if (desc) {
          const newIdx = shuffledPilihan.indexOf(oldOpt);
          if (newIdx !== -1) {
            const newLetter = letters[newIdx];
            updatedEliminasi[newLetter] = desc;
          }
        }
      });
      newEliminasiOpsi = updatedEliminasi;
    }

    return {
      ...q,
      pilihan: shuffledPilihan,
      jawaban_benar: newJawabanBenar,
      eliminasi_opsi: newEliminasiOpsi
    };
  };

  const startQuiz = () => {
    if (selectedDatabases.length === 0) {
      triggerToast('Pilih minimal satu bank soal di bawah!', '⚠️');
      return;
    }

    let pool: Question[] = [];
    selectedDatabases.forEach((dbName) => {
      let qList = [...(questionDatabase[dbName] || [])];
      if (qList.length === 0) return;

      const hasShuffleCards = qList.some((q) => q.featureFlags?.shuffleCards === true);
      if (shuffleQuestions || hasShuffleCards) {
        qList = shuffleArray(qList);
      }

      if (shuffleOptions) {
        qList = qList.map(shuffleQuestionOptions);
      }

      const limit = questionLimits[dbName] || 0;
      if (limit > 0 && limit < qList.length) {
        qList = qList.slice(0, limit);
      }

      pool = pool.concat(qList);
    });

    if (quizMode === 'simulasi' && selectedDatabases.length > 1) {
      pool = shuffleArray(pool);
    }

    if (pool.length === 0) {
      triggerToast('Tidak ada soal yang tersedia dengan pengaturan ini!', '⚠️');
      return;
    }

    if (isAdaptiveMode) {
      setAdaptiveQuestionPool(pool);
      // Pick first question (sedang if possible)
      let firstQ = pool.find(q => q.metadata?.tingkat_kesulitan?.toLowerCase() === 'sedang');
      if (!firstQ) firstQ = pool[0];
      
      setCurrentQuiz([firstQ]);
      setUserAnswers([null]);
      setDoubtStatus([false]);
      setIsRevealed([false]);
      setAdaptiveHistory([]);
      setCurrentDifficulty('sedang');
      setCurrentIndex(0);
      setQuizSecondsLeft(Math.min(pool.length, 30) * 60); // Max 30 questions limit for adaptive
    } else {
      setCurrentQuiz(pool);
      setUserAnswers(new Array(pool.length).fill(null));
      setDoubtStatus(new Array(pool.length).fill(false));
      setIsRevealed(new Array(pool.length).fill(false));
      setCurrentIndex(0);
      setQuizSecondsLeft(pool.length * 60);
    }

    // Reset Gamification (keep persistent lifetime stats)
    setXpHistory([userXP]);
    setOpenReviewIndices({});
    setUnlockedHints({});
    setHasSubmittedLeaderboard(false);
    setLastQuizScore(0);
    setIsDailyChallenge(false);

    activeQuizSessionIdRef.current = 'quiz_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    setQuizSecondsLeft(pool.length * 60); // 60 seconds per question
    setQuizTimerActive(true);
    setScreen('quiz');
    setShowSidebar(true);
    triggerToast('Kuis dimulai! Selamat mengerjakan, semoga sukses!', '🚀');
  };

  const startDailyChallenge = () => {
    let allQuestions: Question[] = [];
    Object.values(questionDatabase).forEach(qList => {
      allQuestions = [...allQuestions, ...(qList as Question[])];
    });

    if (allQuestions.length === 0) {
      triggerToast('Tidak ada soal tersedia untuk Daily Challenge!', '⚠️');
      return;
    }

    // Shuffle and pick 5
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 5);
    
    // Process them
    const pool = shuffled.map(q => {
      let finalChoices = q.pilihan ? [...q.pilihan] : [];
      if (finalChoices.length > 0) {
        finalChoices = finalChoices.sort(() => Math.random() - 0.5);
      }
      return { ...q, pilihan: finalChoices };
    });

    setCurrentQuiz(pool);
    setUserAnswers(new Array(pool.length).fill(null));
    setDoubtStatus(new Array(pool.length).fill(false));
    setIsRevealed(new Array(pool.length).fill(false));
    setCurrentIndex(0);

    // Reset Gamification
    setXpHistory([userXP]);
    setOpenReviewIndices({});
    setUnlockedHints({});
    setHasSubmittedLeaderboard(false);
    setLastQuizScore(0);
    setIsDailyChallenge(true);

    activeQuizSessionIdRef.current = 'quiz_daily_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    setQuizSecondsLeft(600); // 10 minutes
    setQuizTimerActive(true);
    setScreen('quiz');
    setShowSidebar(true);
    triggerToast('Daily Challenge dimulai! 10 Menit, 5 Soal, 2x XP!', '🔥');
  };

  const checkAnswerNow = (event: React.MouseEvent<HTMLButtonElement>) => {
    const userAnswer = userAnswers[currentIndex];
    const q = currentQuiz[currentIndex];
    const isIsian = !q.pilihan || q.pilihan.length === 0;

    if (!userAnswer || userAnswer.trim() === '') {
      triggerToast(isIsian ? 'Masukkan jawaban Anda terlebih dahulu!' : 'Pilih salah satu pilihan jawaban dulu!', '⚠️');
      return;
    }

    if (isRevealed[currentIndex]) return;

    const isCorrect = isUserAnswerCorrect(userAnswer, q);
    let baseXP = q.metadata?.xp || 100;

    // Hint penalty logic for Isian Singkat
    if (isIsian && isCorrect) {
      const hintsUsed = unlockedHints[currentIndex] || 0;
      const penaltyRate = q.featureFlags?.hintPenalty !== undefined ? q.featureFlags.hintPenalty : 0.25;
      const penalty = hintsUsed * penaltyRate;
      baseXP = Math.max(10, Math.floor(baseXP * (1 - penalty)));
    }

    let xpGained = 0;

    // Daily Streak Logic
    if (currentUser) {
      const nowInJakarta = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      const todayStr = nowInJakarta.toISOString().split('T')[0];
      
      let nextDailyStreak = currentStreak;
      let nextLongestStreak = longestStreak;
      let isStreakUpdated = false;

      if (lastActiveDate !== todayStr) {
        if (lastActiveDate) {
          const lastActiveDateObj = new Date(lastActiveDate);
          lastActiveDateObj.setHours(0, 0, 0, 0);
          const todayDateObj = new Date(todayStr);
          todayDateObj.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((todayDateObj.getTime() - lastActiveDateObj.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            nextDailyStreak += 1;
            isStreakUpdated = true;
          } else if (diffDays > 1) {
            // It should have been handled at login, but just in case
            if (diffDays === 2 && streakFreezeLeft > 0) {
              setStreakFreezeLeft(prev => prev - 1);
              nextDailyStreak += 1;
              isStreakUpdated = true;
            } else {
              nextDailyStreak = 1;
              isStreakUpdated = true;
            }
          }
        } else {
          nextDailyStreak = 1;
          isStreakUpdated = true;
        }

        if (isStreakUpdated) {
          if (nextDailyStreak > nextLongestStreak) nextLongestStreak = nextDailyStreak;
          setCurrentStreak(nextDailyStreak);
          setLongestStreak(nextLongestStreak);
          setLastActiveDate(todayStr);
          triggerToast(`🔥 Daily Streak bertambah: ${nextDailyStreak} Hari!`, '🔥');
        }
      }
    }

    let nextCombo = currentCombo;
    if (isCorrect) {
      nextCombo += 1;
      xpGained = baseXP + (nextCombo - 1) * 20; // 20 XP combo bonus
      
      // Daily Challenge 2x XP bonus
      if (isDailyChallenge) {
        xpGained *= 2;
      }
      
      // Phase 5: Adaptive Quiz - Hard questions give 1.5x XP
      if (isAdaptiveMode && q.metadata?.tingkat_kesulitan?.toLowerCase() === 'sukar') {
        xpGained = Math.floor(xpGained * 1.5);
      }
      
      // Adaptive History update
      if (isAdaptiveMode) {
        setAdaptiveHistory(prev => [...prev, isCorrect]);
      }
      
      const nextXP = userXP + xpGained;
      setUserXP(nextXP);
      setCurrentCombo(nextCombo);
      setXpHistory((prev) => [...prev, nextXP]);
      triggerFloatingXP(`+${xpGained} XP! 🔥`, true, event);
      triggerToast('Jawaban Benar! Anda mendapatkan XP bonus.', '✅');

      // Live update total_questions_answered
      if (currentUser) {
        setTotalQuestionsAnswered((prev) => {
          const nextTotal = prev + 1;
          supabase
            .from('profiles')
            .update({ total_questions_answered: nextTotal })
            .eq('id', currentUser.id)
            .then(({ error }) => {
              if (error) console.error('Error updating live total_questions_answered:', error);
            });
          return nextTotal;
        });
      }
    } else {
      let xpLoss = Math.floor(baseXP / 2);
      const nextXP = Math.max(0, userXP - xpLoss);
      setUserXP(nextXP);
      setCurrentCombo(0);
      setXpHistory((prev) => [...prev, nextXP]);
      triggerFloatingXP(`-${xpLoss} XP`, false, event);
      triggerToast('Jawaban Kurang Tepat. Pelajari pembahasannya!', '❌');
    }
    
    // Adaptive History update for both correct and wrong
    if (isAdaptiveMode) {
      setAdaptiveHistory(prev => [...prev, isCorrect]);
    }

    const updatedRevealed = [...isRevealed];
    updatedRevealed[currentIndex] = true;
    setIsRevealed(updatedRevealed);
  };

  const selectAnswer = (ans: string) => {
    if (isRevealed[currentIndex]) return;
    const updated = [...userAnswers];
    updated[currentIndex] = ans;
    setUserAnswers(updated);
  };

  const toggleDoubt = () => {
    const updated = [...doubtStatus];
    updated[currentIndex] = !updated[currentIndex];
    setDoubtStatus(updated);
  };

  const navigateQuestion = (direction: number) => {
    const target = currentIndex + direction;
    if (target >= 0 && target < currentQuiz.length) {
      setCurrentIndex(target);
    }
  };

  const handleNextQuestion = () => {
    if (isAdaptiveMode && currentIndex === currentQuiz.length - 1 && currentQuiz.length < 30) {
      if (userAnswers[currentIndex] === null) return; // Prevent advancing without answering
      const recent = adaptiveHistory.slice(-5);
      let nextDiff = currentDifficulty;
      if (recent.length >= 5) {
        const correctCount = recent.filter(x => x).length;
        if (correctCount >= 4) {
          nextDiff = nextDiff === 'mudah' ? 'sedang' : 'sukar';
        } else if (correctCount <= 2) {
          nextDiff = nextDiff === 'sukar' ? 'sedang' : 'mudah';
        }
      }
      
      let nextQs = adaptiveQuestionPool.filter(q => q.metadata?.tingkat_kesulitan?.toLowerCase() === nextDiff);
      const askedIds = currentQuiz.map(q => q.pertanyaan);
      nextQs = nextQs.filter(q => !askedIds.includes(q.pertanyaan));
      
      if (nextQs.length === 0) {
        nextQs = adaptiveQuestionPool.filter(q => !askedIds.includes(q.pertanyaan));
      }
      
      if (nextQs.length === 0) {
        openFinishModal();
        return;
      }
      
      const nextQ = nextQs[Math.floor(Math.random() * nextQs.length)];
      setCurrentDifficulty(nextDiff);
      setCurrentQuiz(prev => [...prev, nextQ]);
      setUserAnswers(prev => [...prev, null]);
      setDoubtStatus(prev => [...prev, false]);
      setIsRevealed(prev => [...prev, false]);
      setCurrentIndex(prev => prev + 1);
    } else if (currentIndex < currentQuiz.length - 1) {
      navigateQuestion(1);
    } else {
      openFinishModal();
    }
  };

  const openFinishModal = () => {
    const unanswered = userAnswers.filter((a) => a === null).length;
    const desc = unanswered > 0
      ? `Anda memiliki ${unanswered} soal yang belum dijawab. Apakah Anda yakin ingin mengakhiri sesi kuis ini sekarang?`
      : 'Semua soal telah dijawab. Apakah Anda ingin mengumpulkan jawaban dan melihat analisis skor?';

    setModalTitle('Akhiri & Kumpulkan?');
    setModalDesc(desc);
    setModalAction(() => () => finishQuiz());
    setModalOpen(true);
  };

  const finishQuiz = () => {
    setQuizTimerActive(false);
    let correct = 0;
    let empty = 0;

    currentQuiz.forEach((q, i) => {
      const ans = userAnswers[i];
      if (ans === null) {
        empty++;
      } else if (isUserAnswerCorrect(ans, q)) {
        correct++;
      }
    });

    const total = currentQuiz.length;
    const wrong = total - correct - empty;
    const finalScore = Math.round((correct / total) * 100);

    // Adaptive Mode Finish Toast
    if (isAdaptiveMode) {
      let scoreAcc = 0;
      currentQuiz.forEach(q => {
        const diff = q.metadata?.tingkat_kesulitan?.toLowerCase();
        if (diff === 'sukar') scoreAcc += 3;
        else if (diff === 'sedang') scoreAcc += 2;
        else scoreAcc += 1; // mudah
      });
      const avg = scoreAcc / total;
      const avgStr = avg > 2.5 ? 'Sukar (Hard) 🔥' : avg > 1.5 ? 'Sedang 🎯' : 'Mudah 🌟';
      setTimeout(() => {
        triggerToast(`Kuis Adaptif Selesai - Level Rata-Rata: ${avgStr}`, '🤖');
      }, 500);
    }

    // Save attempt into history
    const newEntry: HistoryEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      score: finalScore,
      correct,
      wrong,
      empty,
      total,
      files: selectedDatabases,
      mode: quizMode,
      questions: [...currentQuiz],
      userAnswers: [...userAnswers]
    };

    const updatedHistory = [newEntry, ...quizHistory].slice(0, 50);
    saveHistoryToLocalStorage(updatedHistory);

    setLastQuizScore(finalScore);

    // Delete active session and update total questions count in Supabase
    const activeId = activeQuizSessionIdRef.current;
    activeQuizSessionIdRef.current = null; // Invalidate immediately to prevent race conditions with autoSaveSession

    if (currentUser && activeId) {
      (async () => {
        try {
          // 1. Remove this session from multiple active sessions list
          let localList: any[] = [];
          try {
            const saved = localStorage.getItem('cbt_active_sessions');
            if (saved) localList = JSON.parse(saved);
          } catch (e) {}

          const updatedList = localList.filter(s => s.id !== activeId);
          localStorage.setItem('cbt_active_sessions', JSON.stringify(updatedList));
          setPendingSessions(updatedList);

          if (updatedList.length > 0) {
            await supabase
              .from('quiz_sessions')
              .upsert({
                user_id: currentUser.id,
                current_quiz_json: { is_multi_session: true, sessions: updatedList },
                updated_at: new Date().toISOString()
              });
          } else {
            await supabase
              .from('quiz_sessions')
              .delete()
              .eq('user_id', currentUser.id);
          }
          // 1.5. Insert quiz attempt log
          await supabase
            .from('quiz_history_logs')
            .insert({
              user_id: currentUser.id,
              file_name: selectedDatabases.join(', '),
              score: finalScore,
              correct_count: correct,
              total_count: total
            });

          // 2. Refresh global leaderboard to update local view
          // (total_questions_answered has already been updated live for correct answers)
          await fetchGlobalLeaderboard();
        } catch (err) {
          console.error('Error updating stats after quiz completion:', err);
        }
      })();
    }

    setScreen('result');
    triggerToast('Kuis diselesaikan! Lihat analisis performa Anda.', '🏆');

    // Celebration confetti if score is >= 80
    if (finalScore >= 80) {
      // Primary burst
      confetti({
        particleCount: 150,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6']
      });

      // Side bursts
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.8 },
          colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6']
        });
      }, 250);

      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.8 },
          colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6']
        });
      }, 400);

      // Fireworks style burst
      setTimeout(() => {
        const end = Date.now() + (2 * 1000); // 2 seconds of random fireworks
        const interval = setInterval(() => {
          if (Date.now() > end) {
            return clearInterval(interval);
          }
          confetti({
            startVelocity: 30,
            spread: 360,
            ticks: 60,
            origin: { x: Math.random(), y: Math.random() - 0.2 }
          });
        }, 200);
      }, 800);
    }
  };

  const exitQuiz = () => {
    setModalTitle('Simpan & Keluar Kuis?');
    setModalDesc('Progres pengerjaan kuis Anda telah disimpan secara otomatis. Anda dapat melanjutkannya kapan saja ketika kembali.');
    setModalAction(() => async () => {
      if (currentUser) {
        try {
          const activeId = activeQuizSessionIdRef.current || `session_${Date.now()}`;
          const title = selectedDatabases.map(db => db.replace('.json', '').replace('.yaml', '')).join(', ') || 'Kuis Kustom';
          
          const currentSession = {
            id: activeId,
            title,
            current_quiz_json: currentQuiz,
            current_index: currentIndex,
            user_answers_json: userAnswers,
            doubt_status_json: doubtStatus,
            is_revealed_json: isRevealed,
            unlocked_hints_json: unlockedHints,
            selected_databases: selectedDatabases,
            quiz_mode: quizMode,
            updated_at: new Date().toISOString()
          };

          let localList: any[] = [];
          try {
            const saved = localStorage.getItem('cbt_active_sessions');
            if (saved) localList = JSON.parse(saved);
          } catch (e) {}

          const idx = localList.findIndex(s => s.id === activeId);
          if (idx !== -1) {
            localList[idx] = currentSession;
          } else {
            localList.unshift(currentSession);
          }

          localStorage.setItem('cbt_active_sessions', JSON.stringify(localList));
          setPendingSessions(localList);

          await supabase
            .from('quiz_sessions')
            .upsert({
              user_id: currentUser.id,
              current_quiz_json: { is_multi_session: true, sessions: localList },
              updated_at: new Date().toISOString()
            });
        } catch (err) {
          console.error('Gagal menyimpan sesi kuis sebelum keluar:', err);
        }
      }
      activeQuizSessionIdRef.current = null;
      setQuizTimerActive(false);
      setScreen('setup');
      setCurrentQuiz([]);
    });
    setModalOpen(true);
  };

  // Helper functions for scoring
  const getLevelInfo = (xp: number) => {
    const getXPForLevel = (l: number) => 50 * (l - 1) * (l - 1) + 50 * (l - 1);
    const currentLevel = Math.min(100, Math.floor(0.5 + 0.5 * Math.sqrt(1 + xp / 12.5))) || 1;
    
    const prevXP = getXPForLevel(currentLevel);
    const nextXPVal = currentLevel < 100 ? getXPForLevel(currentLevel + 1) : null;
    
    const nextXP = nextXPVal !== null ? nextXPVal : 'MAX';
    const progress = nextXPVal !== null ? Math.max(0, Math.min(100, ((xp - prevXP) / (nextXPVal - prevXP)) * 100)) : 100;
    
    const getRankName = (lvl: number) => {
      if (lvl >= 100) return 'Kultivator Surgawi Abadi Sejati (Eternal True Heavenly Sage)';
      if (lvl >= 91) return 'Luhur Kultivator Surgawi (Heavenly Venerable Scholar)';
      if (lvl >= 81) return 'Kaisar Kultivator Surgawi (Heavenly Cultivator Emperor)';
      if (lvl >= 71) return 'Raja Kultivator Surgawi (Heavenly Cultivator King)';
      if (lvl >= 61) return 'Kultivator Surgawi Akhir (Late Heavenly Scholar)';
      if (lvl >= 51) return 'Kultivator Surgawi Menengah (Mid Heavenly Scholar)';
      if (lvl >= 41) return 'Kultivator Surgawi Awal (Early Heavenly Scholar)';
      if (lvl >= 31) return 'Mahasiswa Kultivator Kuasi-Surgawi (Quasi-Heavenly Student)';
      if (lvl >= 21) return 'Mahasiswa Kultivator Dunia Atas (Upper Realm Cultivator)';
      if (lvl >= 16) return 'Mahasiswa Kultivator Dunia Tengah (Middle Realm Scholar)';
      if (lvl >= 11) return 'Mahasiswa Kultivator Dunia Bawah (Underworld Student)';
      if (lvl >= 6) return 'Mahasiswa Kultivator Bumi (Earth Scholar)';
      return 'Mahasiswa Kultivator Fana (Mortal Student)';
    };

    return {
      level: currentLevel,
      rank: getRankName(currentLevel),
      nextXP,
      prevXP,
      progress
    };
  };

  // Analytics calculator
  const calculateAnalytics = () => {
    const competencies: Record<string, { correct: number; total: number }> = {};
    const cognitives: Record<string, { correct: number; total: number }> = {};
    const difficulties: Record<string, { correct: number; total: number }> = {};

    let hasMetadata = false;

    currentQuiz.forEach((q, i) => {
      const userAns = userAnswers[i];
      const isCorrect = isUserAnswerCorrect(userAns, q);

      if (q.metadata) {
        hasMetadata = true;
        const comp = q.metadata.sub_kompetensi_klinis || 'Umum';
        const cog = q.metadata.tingkat_kognitif || 'Aplikasi';
        const diff = q.metadata.tingkat_kesulitan || 'Sedang';

        if (!competencies[comp]) competencies[comp] = { correct: 0, total: 0 };
        if (!cognitives[cog]) cognitives[cog] = { correct: 0, total: 0 };
        if (!difficulties[diff]) difficulties[diff] = { correct: 0, total: 0 };

        competencies[comp].total++;
        cognitives[cog].total++;
        difficulties[diff].total++;

        if (isCorrect) {
          competencies[comp].correct++;
          cognitives[cog].correct++;
          difficulties[diff].correct++;
        }
      }
    });

    return { competencies, cognitives, difficulties, hasMetadata };
  };

  const analytics = calculateAnalytics();

  // Find clinical weakness below 70%
  const getWeaknesses = () => {
    const list: { name: string; percentage: number; correct: number; total: number }[] = [];
    Object.entries(analytics.competencies).forEach(([name, data]) => {
      const pct = Math.round((data.correct / data.total) * 100);
      if (pct < 70) {
        list.push({ name, percentage: pct, correct: data.correct, total: data.total });
      }
    });
    return list;
  };

  const weaknessesList = getWeaknesses();

  // History Analytics Calculator
  const calculateHistoryAnalytics = () => {
    const competencies: Record<string, { correct: number; total: number }> = {};
    
    quizHistory.forEach(entry => {
      if (!entry.questions) return;
      entry.questions.forEach((q, i) => {
        const userAns = entry.userAnswers?.[i];
        const isCorrect = isUserAnswerCorrect(userAns, q);
        const comp = q.metadata?.sub_kompetensi_klinis || 'Klinis Umum';
        
        if (!competencies[comp]) {
          competencies[comp] = { correct: 0, total: 0 };
        }
        competencies[comp].total++;
        if (isCorrect) {
          competencies[comp].correct++;
        }
      });
    });
    
    // Default fallback mock categories if history is empty
    if (Object.keys(competencies).length === 0) {
      return {
        'Tropis & Infeksi': { correct: 17, total: 20 },
        'Anatomi & Fisiologi': { correct: 14, total: 20 },
        'Kardiologi & Vaskular': { correct: 12, total: 20 },
        'Neurologi & Psikiatri': { correct: 10, total: 20 }
      };
    }
    
    return competencies;
  };

  // Toggle review items
  const toggleReviewAccordion = (idx: number) => {
    setOpenReviewIndices((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Gunakan Custom Hook untuk Navigasi Keyboard
  useKeyboardNavigation({
    isActive: keyboardNavEnabled,
    screen,
    currentQuiz,
    currentIndex,
    setCurrentIndex,
    selectAnswer,
    toggleDoubt,
    setIsQuestionMapOpen: () => {},
    handleNext: handleNextQuestion,
    closeModals: () => {
      setModalOpen(false);
      setLightboxImage(null);
    },
    toggleImageZoom: () => {
      const q = currentQuiz[currentIndex];
      if (q?.gambar) {
        setLightboxImage(lightboxImage ? null : q.gambar);
      }
    }
  });

  return (
    <div className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${theme === 'dark' ? 'dark text-brand-text bg-brand-bg' : 'text-slate-900 bg-slate-50'}`}>
      
      {/* Dynamic Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <span className="absolute w-[450px] h-[450px] rounded-full bg-rose-400/20 dark:bg-rose-900/10 blur-[100px] -top-[120px] -left-[100px] animate-float-orb" />
        <span className="absolute w-[400px] h-[400px] rounded-full bg-indigo-400/20 dark:bg-indigo-900/10 blur-[100px] top-[25%] -right-[140px] animate-float-orb [animation-delay:-6s]" />
        <span className="absolute w-[480px] h-[480px] rounded-full bg-purple-400/20 dark:bg-purple-900/10 blur-[100px] -bottom-[160px] left-[15%] animate-float-orb [animation-delay:-12s]" />
        <span className="absolute w-[320px] h-[320px] rounded-full bg-amber-200/20 dark:bg-amber-900/10 blur-[90px] bottom-[10%] right-[8%] animate-float-orb [animation-delay:-3s]" />
      </div>

      {authLoading ? (
        <div className="min-h-screen flex flex-col items-center justify-center relative z-10">
          <Activity className="w-10 h-10 animate-pulse text-indigo-650 dark:text-indigo-400 mb-4" />
          <p className="text-sm font-bold opacity-80">Menghubungkan ke server cloud AuraMed...</p>
        </div>
      ) : !currentUser ? (
        <div className="min-h-screen flex flex-col items-center justify-center relative z-10 px-4">
          <div className="w-full max-w-md backdrop-blur-md bg-white/75 dark:bg-slate-900/75 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl shadow-2xl p-8 transition-all duration-300">
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-650 text-white flex items-center justify-center font-extrabold text-xl mx-auto shadow-lg shadow-teal-500/10 mb-4">
                <Activity className="w-6 h-6 text-white animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight font-sans">
                Masuk ke AuraMed
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-semibold">
                Platform Evaluasi Kompetensi Klinis & Sains Terintegrasi
              </p>
            </div>

            {isSessionKicked && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-start gap-3 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Sesi Berakhir</p>
                  <p className="opacity-90">Akun Anda baru saja masuk di perangkat lain. Sesi sebelumnya telah dikeluarkan demi keamanan.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-1.5 pl-1">
                  Username / ID Ujian
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Masukkan username"
                    className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-1.5 pl-1">
                  Kata Sandi
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-indigo-650 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer mt-4"
              >
                Masuk Dashboard
              </button>
            </form>
          </div>
          <button
            onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
            className="mt-6 p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-xs font-semibold"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            Mode {theme === 'dark' ? 'Terang' : 'Gelap'}
          </button>
        </div>
      ) : (
        <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-brand-bg text-brand-text' : 'bg-slate-50 text-slate-900'}`}>
          {screen === 'setup' && (
            <>
              {/* SIDEBAR DESKTOP */}
              <aside className={`fixed top-0 bottom-0 left-0 z-30 w-60 hidden lg:flex flex-col justify-between border-r transition-colors ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800/80 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                {/* Logo & Header in Sidebar */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-8">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-650 text-white flex items-center justify-center font-extrabold shadow-sm">
                      <Activity className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div>
                      <span className="font-black text-lg tracking-tight">AuraMed</span>
                      <span className="ml-1 px-1.5 py-0.5 rounded text-[8px] font-black bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20 uppercase tracking-widest">PRO</span>
                    </div>
                  </div>

                  {/* Navigation list */}
                  <nav className="space-y-1">
                    {[
                      { id: 'home', label: 'Beranda', icon: Home },
                      { id: 'banks', label: 'Bank Soal', icon: BookOpen },
                      { id: 'new', label: 'Baru', icon: PlusCircle },
                      { id: 'analysis', label: 'Analisis', icon: BarChart2 },
                      { id: 'profile', label: 'Profil', icon: User },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isActive = dashboardTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setDashboardTab(item.id as any)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/10 scale-[1.02]'
                              : theme === 'dark'
                                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Streak Overview in Sidebar */}
                <div className="px-6 py-4 border-t border-slate-200/50 dark:border-slate-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{currentStreak} Hari</span>
                    </div>
                    <div className="flex items-center gap-1.5" title={`${streakFreezeLeft} Freeze Tersedia`}>
                      <span className="text-xs font-black text-sky-500">{streakFreezeLeft}</span>
                      <span className="text-[10px]">❄️</span>
                    </div>
                  </div>
                </div>

                {/* Profile & Logout in Sidebar Bottom */}
                <div className="p-6 border-t border-slate-200/50 dark:border-slate-800/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-650 text-white flex items-center justify-center font-black text-xs border border-white/20">
                      {(profileUsername?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black truncate text-slate-800 dark:text-slate-200">{profileUsername}</p>
                      <p className="text-[9px] font-extrabold uppercase text-slate-450">LV {getLevelInfo(userXP).level}</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      triggerToast('Sampai jumpa lagi!', '👋');
                    }}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-800/80 hover:bg-red-500/10 border-slate-700 text-slate-400 hover:text-red-400'
                        : 'bg-white hover:bg-red-50 border-slate-200 text-slate-500 hover:text-red-500'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar</span>
                  </button>
                </div>
              </aside>

              {/* BOTTOM NAVIGATION FOR MOBILE */}
              <nav className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden flex justify-around items-center h-16 border-t transition-colors ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-655'
              }`}>
                {[
                  { id: 'home', label: 'Beranda', icon: Home },
                  { id: 'banks', label: 'Bank Soal', icon: BookOpen },
                  { id: 'new', label: 'Baru', icon: PlusCircle },
                  { id: 'analysis', label: 'Analisis', icon: BarChart2 },
                  { id: 'profile', label: 'Profil', icon: User },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = dashboardTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setDashboardTab(item.id as any)}
                      className={`flex flex-col items-center justify-center w-14 h-full gap-1 transition-all ${
                        isActive
                          ? 'text-indigo-500 dark:text-indigo-400 scale-105'
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[9px] font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </>
          )}

          {/* MAIN WRAPPER CONTAINER */}
          <div className={`flex flex-col min-h-screen flex-1 transition-all ${screen === 'setup' ? 'lg:pl-60' : ''}`}>
            
            {/* Sticky Header (Compact) */}
            {screen === 'setup' && (
              <header className={`sticky top-0 z-20 backdrop-blur-md transition-colors border-b ${
                theme === 'dark' ? 'bg-slate-950/60 border-slate-900/80 text-white' : 'bg-slate-50/60 border-slate-200/60 text-slate-900'
              }`}>
                <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                  <div className="lg:hidden flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-650 text-white flex items-center justify-center font-extrabold shadow-sm">
                      <Activity className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-black text-base tracking-tight">AuraMed</span>
                  </div>

                  <div className="hidden lg:block text-xs font-bold text-slate-450">
                    Dashboard Platform
                  </div>

                  {/* Header actions (XP, Theme, Bell) */}
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                      theme === 'dark' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-500/5 border-amber-500/15 text-amber-600'
                    }`}>
                      <Flame className="w-3.5 h-3.5 fill-current text-amber-500 animate-pulse" />
                      <span>LV {getLevelInfo(userXP).level}</span>
                      <span className="opacity-30 font-normal">|</span>
                      <span>{userXP} XP</span>
                    </div>

                    <button 
                      onClick={() => triggerToast('Anda memiliki notifikasi modul baru!', '🔔')}
                      className={`p-2 rounded-xl border relative transition-all ${
                        theme === 'dark' ? 'bg-slate-900/80 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    </button>

                    <button
                      onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
                      className={`p-2 rounded-xl border transition-all ${
                        theme === 'dark' ? 'bg-slate-900/80 border-slate-800 text-indigo-400' : 'bg-white border-slate-200 text-amber-500'
                      }`}
                    >
                      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </header>
            )}

        {/* === SETUP SCREEN (DASHBOARD REDESIGN) === */}
        {screen === 'setup' && (
          <div className="space-y-6 animate-fade-in pb-16 lg:pb-0">
            
            {/* 🏠 TAB 1: BERANDA */}
            {dashboardTab === 'home' && (
              <div className="space-y-6">
                {/* Greeting & Level progress card */}
                <div className={`p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border-indigo-500/10 shadow-2xl'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-teal-400 via-indigo-500 to-amber-400" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                    <div>
                      <h1 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-indigo-900'}`}>
                        👋 Selamat datang, {profileUsername}!
                      </h1>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Award className="w-4 h-4 text-indigo-500" />
                          <span>Level {getLevelInfo(userXP).level} • {getLevelInfo(userXP).rank}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-4 h-4 text-teal-500" />
                          <span>{userXP} XP</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          <span>{currentStreak} Hari Streak</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Level progress bar */}
                  <div className="mt-6">
                    <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1.5">
                      <span>Progres Level</span>
                      <span>{getLevelInfo(userXP).progress}% ke Level {getLevelInfo(userXP).level + 1}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-400 to-indigo-500 rounded-full transition-all duration-550"
                        style={{ width: `${getLevelInfo(userXP).progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Daily Challenge Card */}
                <div className={`p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-amber-500/10 to-orange-600/10 border-amber-500/20 shadow-lg'
                    : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-sm'
                }`}>
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
                    <Flame className="w-40 h-40 text-amber-500" />
                  </div>
                  <div className="flex items-start gap-4 z-10 relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
                      <Flame className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        Tantangan Harian
                      </h3>
                      <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        Kerjakan 5 soal acak dalam 10 menit. Dapatkan <strong className="text-amber-600 dark:text-amber-400">2x XP</strong> dan pertahankan Streak Belajar Anda!
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={startDailyChallenge}
                    className="z-10 relative flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/25 transition-all cursor-pointer whitespace-nowrap min-w-[140px]"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Mulai Sekarang
                  </button>
                </div>

                {/* iOS PWA Installation Banner */}
                <div className={`p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  theme === 'dark'
                    ? 'bg-slate-900/40 border-white/[0.08] shadow-lg'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-505 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">📲 AuraMed PRO untuk iPhone & iPad</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Jadikan aplikasi ini sebagai PWA di perangkat iOS Anda untuk akses instan langsung dari Home Screen.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowIosInstallModal(true)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/15 transition-all cursor-pointer flex-shrink-0 text-center"
                  >
                    Petunjuk Instalasi iOS
                  </button>
                </div>

                {/* Main section contents */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left panel: Quick Actions & Sesi Tertunda */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* Quick actions row */}
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">Aksi Cepat</h3>
                      <div className="flex overflow-x-auto snap-x snap-mandatory lg:grid lg:grid-cols-3 gap-4 pb-2 lg:pb-0 scrollbar-none">
                        
                        <div
                          onClick={() => setDashboardTab('new')}
                          className={`min-w-[220px] snap-center flex-1 p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] hover:-translate-y-0.5 ${
                            theme === 'dark' ? 'bg-slate-900/50 border-slate-800 hover:border-indigo-500/30' : 'bg-white border-slate-200 hover:border-indigo-200'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-505 flex items-center justify-center mb-3">
                            <Play className="w-5 h-5 text-indigo-500" />
                          </div>
                          <h4 className="text-sm font-black">Try-Out Baru</h4>
                          <p className="text-[11px] text-slate-400 mt-1">Konfigurasi materi & mulai simulasi kuis baru.</p>
                        </div>

                        <div
                          onClick={() => {
                            if (pendingSessions.length > 0) {
                              resumeQuizSession(pendingSessions[0]);
                            } else {
                              setDashboardTab('banks');
                            }
                          }}
                          className={`min-w-[220px] snap-center flex-1 p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] hover:-translate-y-0.5 ${
                            theme === 'dark' ? 'bg-slate-900/50 border-slate-800 hover:border-indigo-500/30' : 'bg-white border-slate-200 hover:border-indigo-200'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                            <Flame className="w-5 h-5 text-amber-500" />
                          </div>
                          <h4 className="text-sm font-black">
                            {pendingSessions.length > 0 ? 'Lanjutkan Kuis' : 'Pilih Topik Soal'}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {pendingSessions.length > 0
                              ? `Lanjutkan kuis tertunda (${Math.round((pendingSessions[0].user_answers_json?.filter((a: any) => a !== null).length / pendingSessions[0].current_quiz_json?.length) * 100)}%)`
                              : 'Jelajahi dan pilih bank soal yang tersedia.'}
                          </p>
                        </div>

                        <div
                          onClick={() => setDashboardTab('banks')}
                          className={`min-w-[220px] snap-center flex-1 p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] hover:-translate-y-0.5 ${
                            theme === 'dark' ? 'bg-slate-900/50 border-slate-800 hover:border-indigo-500/30' : 'bg-white border-slate-200 hover:border-indigo-200'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center mb-3">
                            <UploadCloud className="w-5 h-5 text-teal-500" />
                          </div>
                          <h4 className="text-sm font-black">Upload Soal</h4>
                          <p className="text-[11px] text-slate-400 mt-1">Impor file kuis JSON/YAML atau folder soal baru.</p>
                        </div>

                      </div>
                    </div>

                    {/* Sesi Kuis Tertunda */}
                    {pendingSessions.length > 0 && (
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">Sesi Kuis Tertunda</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {pendingSessions.map((session) => {
                            const totalQ = session.current_quiz_json?.length || 0;
                            const answered = session.user_answers_json?.filter((a: any) => a !== null).length || 0;
                            const pct = totalQ > 0 ? Math.round((answered / totalQ) * 100) : 0;
                            return (
                              <div
                                key={session.id}
                                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-colors ${
                                  theme === 'dark' ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-200'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                                      {session.quiz_mode === 'simulasi' ? 'Simulasi' : 'Utuh'}
                                    </span>
                                    <span className="text-[9px] text-slate-400">
                                      {new Date(session.updated_at).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short'
                                      })}
                                    </span>
                                  </div>
                                  <h4 className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">{session.title}</h4>
                                  <div className="mt-2.5">
                                    <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                                      <span>Progres: {answered}/{totalQ} Soal</span>
                                      <span>{pct}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 mt-1">
                                  <button
                                    onClick={() => resumeQuizSession(session)}
                                    className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold bg-indigo-500 hover:bg-indigo-600 text-white transition-all cursor-pointer"
                                  >
                                    Lanjutkan
                                  </button>
                                  <button
                                    onClick={() => discardQuizSession(session.id)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-extrabold bg-rose-500/10 hover:bg-rose-500/20 text-rose-455 transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Right panel: Accordion Analysis */}
                  <div className="lg:col-span-4 space-y-6">
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">Analisis Sub-Kompetensi</h3>
                      <div className={`border rounded-2xl divide-y overflow-hidden transition-colors ${
                        theme === 'dark' ? 'bg-slate-900/40 border-slate-800/80 divide-slate-850' : 'bg-white border-slate-200 divide-slate-100'
                      }`}>
                        {Object.entries(calculateHistoryAnalytics()).map(([name, data]) => {
                          const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                          const expanded = !!expandedCompetencies[name];
                          const toggleExpand = () => setExpandedCompetencies(prev => ({ ...prev, [name]: !prev[name] }));
                          return (
                            <div key={name} className="text-xs">
                              <button
                                onClick={toggleExpand}
                                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-500/5 transition-colors font-bold text-left"
                              >
                                <span className="truncate pr-4">{name}</span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    pct >= 80 
                                      ? 'bg-emerald-500/10 text-emerald-500' 
                                      : pct >= 60 
                                        ? 'bg-indigo-500/10 text-indigo-500' 
                                        : 'bg-rose-500/10 text-rose-500'
                                  }`}>
                                    {pct}%
                                  </span>
                                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                                </div>
                              </button>
                              
                              {expanded && (
                                <div className="p-3.5 bg-slate-500/[0.02] border-t border-slate-200/50 dark:border-slate-800/50 space-y-2 text-[11px] text-slate-500 dark:text-slate-400">
                                  <div className="flex justify-between">
                                    <span>Total Soal Dikerjakan</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-350">{data.total}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Jawaban Benar</span>
                                    <span className="font-bold text-emerald-500">{data.correct}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Jawaban Salah / Kosong</span>
                                    <span className="font-bold text-rose-555">{data.total - data.correct}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 📚 TAB 2: BANK SOAL */}
            {dashboardTab === 'banks' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Search & Filter Header Card */}
                <div className={`p-6 rounded-3xl border transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-slate-900/40 border-white/[0.08] shadow-xl'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <h2 className={`text-lg font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                    Daftar Bank Soal
                  </h2>
                  <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                    {/* Search bar */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                      <input
                        type="text"
                        placeholder="Cari bank soal..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                          theme === 'dark'
                            ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500'
                            : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                        }`}
                      />
                    </div>
                    {/* Category Filter Buttons */}
                    <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-850">
                      {[
                        { id: 'all', label: 'Semua' },
                        { id: 'ukmppd', label: 'UKMPPD' },
                        { id: 'flashcard', label: 'Flashcard' },
                        { id: 'custom', label: 'Kustom' }
                      ].map((btn) => (
                        <button
                          key={btn.id}
                          onClick={() => setBankFilter(btn.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                            bankFilter === btn.id
                              ? 'bg-indigo-500 text-white shadow-sm'
                              : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-200'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Upload Zone & Guide */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Upload inputs card */}
                  <div className={`md:col-span-8 p-6 rounded-3xl border transition-all duration-300 space-y-5 ${
                    theme === 'dark'
                      ? 'bg-slate-900/40 border-white/[0.08] shadow-xl'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Impor Soal Baru</h3>
                      <p className="text-[11px] text-slate-450 mt-1">Impor berkas soal Anda untuk diujikan di platform CBT AuraMed.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Upload Single File */}
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.01] ${
                          theme === 'dark'
                            ? 'bg-slate-950/40 border-slate-800 hover:border-indigo-500/40'
                            : 'bg-slate-50 border-slate-200 hover:border-indigo-500/40'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3">
                          <UploadCloud className="w-5 h-5 text-indigo-500" />
                        </div>
                        <h4 className="text-xs font-bold">Pilih File Soal</h4>
                        <p className="text-[10px] text-slate-400 mt-1.5">JSON, YAML, atau YML (Maks. 5MB)</p>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept=".json,.yaml,.yml"
                          className="hidden"
                        />
                      </div>

                      {/* Upload Folder Directory */}
                      <div 
                        onClick={() => folderInputRef.current?.click()}
                        className={`p-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.01] ${
                          theme === 'dark'
                            ? 'bg-slate-950/40 border-slate-800 hover:border-teal-500/40'
                            : 'bg-slate-50 border-slate-200 hover:border-teal-500/40'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center mb-3">
                          <FolderPlus className="w-5 h-5 text-teal-555" />
                        </div>
                        <h4 className="text-xs font-bold">Impor Folder Soal</h4>
                        <p className="text-[10px] text-slate-400 mt-1.5">Unggah direktori folder berisi berkas kuis</p>
                        <input
                          type="file"
                          ref={folderInputRef}
                          onChange={handleFolderUpload}
                          {...{ directory: "", webkitdirectory: "" }}
                          multiple
                          className="hidden"
                        />
                      </div>

                      {/* Paste JSON */}
                      <div 
                        onClick={() => setPasteModalOpen(true)}
                        className={`p-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.01] ${
                          theme === 'dark'
                            ? 'bg-slate-950/40 border-slate-800 hover:border-amber-500/40'
                            : 'bg-slate-50 border-slate-200 hover:border-amber-500/40'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                          <ClipboardList className="w-5 h-5 text-amber-500" />
                        </div>
                        <h4 className="text-xs font-bold">Tempel JSON</h4>
                        <p className="text-[10px] text-slate-400 mt-1.5">Salin dan tempel kode soal mentah</p>
                      </div>
                    </div>
                  </div>

                  {/* Format Guide card */}
                  <div className={`md:col-span-4 p-6 rounded-3xl border transition-all duration-350 flex flex-col justify-between ${
                    theme === 'dark'
                      ? 'bg-slate-900/40 border-white/[0.08] shadow-xl'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Petunjuk Format</h3>
                      <p className="text-[11px] text-slate-450 mt-1">Platform CBT mendukung tipe soal Pilihan Ganda (MCQ) & Isian Singkat (Flashcard) dalam format penyatuan JSON/YAML.</p>
                      
                      <div className="space-y-2 mt-4">
                        <div className="flex items-start gap-2 text-[10px] font-semibold text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                          <span>Kunci soal MCQ menggunakan array `mcq_questions` atau `questions`.</span>
                        </div>
                        <div className="flex items-start gap-2 text-[10px] font-semibold text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5" />
                          <span>Kunci flashcard/isian menggunakan `flashcard_questions` atau `cards`.</span>
                        </div>
                        <div className="flex items-start gap-2 text-[10px] font-semibold text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                          <span>Mendukung upload massal folder soal terkompresi.</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 space-y-3">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Unduh Template & Panduan
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <a 
                          href="/template_mcq.json" 
                          download="template_mcq.json"
                          className={`py-2 px-2.5 border rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors text-center block cursor-pointer ${
                            theme === 'dark' ? 'border-slate-800 hover:bg-slate-800 text-indigo-400' : 'border-slate-200 hover:bg-slate-50 text-indigo-600'
                          }`}
                        >
                          📦 Template MCQ (.json)
                        </a>
                        <a 
                          href="/template_flashcard.json" 
                          download="template_flashcard.json"
                          className={`py-2 px-2.5 border rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors text-center block cursor-pointer ${
                            theme === 'dark' ? 'border-slate-800 hover:bg-slate-800 text-purple-400' : 'border-slate-200 hover:bg-slate-50 text-purple-600'
                          }`}
                        >
                          📦 Template Flashcard (.json)
                        </a>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <a 
                          href="/panduan_pembuatan_soal.txt" 
                          download="panduan_pembuatan_soal.txt"
                          className={`py-2 px-1 border rounded-xl text-[8px] font-bold uppercase tracking-wider transition-colors text-center block cursor-pointer ${
                            theme === 'dark' ? 'border-slate-800 hover:bg-slate-800 text-slate-350' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                          title="Panduan Pembuatan Soal MCQ"
                        >
                          📄 Panduan MCQ
                        </a>
                        <a 
                          href="/panduan_flashcard.md" 
                          download="panduan_flashcard.md"
                          className={`py-2 px-1 border rounded-xl text-[8px] font-bold uppercase tracking-wider transition-colors text-center block cursor-pointer ${
                            theme === 'dark' ? 'border-slate-800 hover:bg-slate-800 text-slate-355' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                          title="Panduan Pembuatan Flashcard"
                        >
                          📄 Flashcard
                        </a>
                        <a 
                          href="/aturan_konten.txt" 
                          download="aturan_konten.txt"
                          className={`py-2 px-1 border rounded-xl text-[8px] font-bold uppercase tracking-wider transition-colors text-center block cursor-pointer ${
                            theme === 'dark' ? 'border-slate-800 hover:bg-slate-800 text-slate-355' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                          title="Aturan Konten / Konversi Soal"
                        >
                          📄 Aturan Konten
                        </a>
                      </div>

                      <a 
                        href="/panduan_prompt_ai.txt" 
                        download="panduan_prompt_ai.txt"
                        className={`w-full py-2.5 border rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors text-center block cursor-pointer bg-gradient-to-r from-teal-500/10 to-indigo-500/10 hover:from-teal-500/15 hover:to-indigo-500/15 ${
                          theme === 'dark' ? 'border-slate-800 text-teal-400' : 'border-slate-200 text-indigo-700'
                        }`}
                        title="Panduan Memori Prompt AI untuk Pembuatan Soal"
                      >
                        🤖 Panduan Memori Prompt AI (.txt)
                      </a>
                    </div>
                  </div>
                </div>

                {/* Databases Lists (Folders & Root Items) */}
                <div className={`p-6 rounded-3xl border transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-slate-900/40 border-white/[0.08] shadow-xl'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Pilih Soal yang Ingin Diujikan</h3>
                      {(Object.keys(quizFolderMap).length > 0 || customFolders.length > 0) && (
                        <button 
                          onClick={handleResetPersonal}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors border border-rose-500/20 ml-auto"
                          title="Hapus folder susunan sendiri dan kembali ke susunan Admin"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset Personal
                        </button>
                      )}
                      <button 
                        onClick={handleCreateFolder}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white rounded-lg transition-colors border border-indigo-500/20"
                        title="Buat folder baru untuk mengelompokkan kuis"
                      >
                        <Plus className="w-3 h-3" /> Buat Folder
                      </button>
                    </div>
                    {selectedDatabases.length > 0 && (
                      <button 
                        onClick={() => setSelectedDatabases([])}
                        className="text-[10px] font-black text-rose-500 hover:underline bg-transparent"
                      >
                        Batal Pilih Semua ({selectedDatabases.length})
                      </button>
                    )}
                  </div>

                  {Object.keys(questionDatabase).length === 0 ? (
                    <div className="text-center p-12">
                      <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Tidak ada bank soal tersedia</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Unggah berkas soal JSON/YAML terlebih dahulu atau gunakan bank soal bawaan.</p>
                    </div>
                  ) : (
                    <div className="flex gap-6 overflow-x-auto pb-6 items-start snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                      {/* Foldered databases */}
                      {Object.entries(filteredDatabases.folders).map(([folderPath, files]) => {
                        const filesTyped = files as any[];
                        
                        // Count selected items in this folder
                        const selectedInFolder = filesTyped.filter(f => selectedDatabases.includes(f.key)).length;
                        const totalQuestionsInFolder = filesTyped.reduce((acc, f) => acc + (f.questions?.length || 0), 0);

                        return (
                          <div 
                            key={folderPath} 
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const quizKey = e.dataTransfer.getData('quizKey');
                              if (quizKey) handleMoveQuiz(quizKey, folderPath);
                            }}
                            className={`w-80 sm:w-88 flex-shrink-0 flex flex-col gap-4 rounded-[24px] p-5 border snap-start ${
                              theme === 'dark' ? 'bg-slate-900/40 border-white/[0.08]' : 'bg-slate-50/50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1 px-1">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-slate-800/50 dark:bg-slate-950/50 flex items-center justify-center flex-shrink-0 text-sm">
                                  {folderPath.toLowerCase().includes('digestif') ? '🫀' : 
                                   folderPath.toLowerCase().includes('kardiorespi') ? '🫁' :
                                   folderPath.toLowerCase().includes('muskulo') ? '🦴' :
                                   folderPath.toLowerCase().includes('neuro') ? '🧠' :
                                   folderPath.toLowerCase().includes('urogenital') ? '🩸' : '📁'}
                                </div>
                                <span className="font-extrabold text-xs uppercase tracking-wider truncate text-amber-500">{folderPath}</span>
                              </div>
                              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black whitespace-nowrap border border-amber-500/20">
                                {totalQuestionsInFolder} soal
                              </span>
                            </div>

                            <div className="flex flex-col gap-3">
                              {filesTyped.map(({ key, displayName, questions }) => {
                                const isSelected = selectedDatabases.includes(key);
                                const relatedHistory = quizHistory.filter((h) => h.files && h.files.includes(key));
                                const personalBest = relatedHistory.length > 0 ? Math.max(...relatedHistory.map((h) => h.score)) : null;
                                const progressCount = personalBest !== null ? Math.round((personalBest / 100) * questions.length) : 0;
                                const progressPercent = personalBest !== null ? personalBest : 0;

                                return (
                                  <div
                                    key={key}
                                    draggable
                                    onDragStart={(e) => e.dataTransfer.setData('quizKey', key)}
                                    onClick={() => {
                                      setSelectedDatabases((prev) =>
                                        prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
                                      );
                                    }}
                                    className={`relative group flex flex-col p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                                      isSelected
                                        ? theme === 'dark' ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-indigo-50 border-indigo-500/30'
                                        : theme === 'dark' ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                                  >
                                    <div className="flex justify-between items-start mb-4 gap-3 relative z-10">
                                      <h4 className={`font-bold text-sm leading-snug flex-1 pr-2 break-words ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                        {displayName}
                                      </h4>
                                      <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${
                                        isSelected 
                                          ? 'bg-amber-400 border-amber-400 text-slate-900' 
                                          : theme === 'dark' ? 'border-slate-600 bg-slate-900/50' : 'border-slate-300 bg-slate-50'
                                      }`}>
                                        {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={4} />}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-end justify-between mt-auto relative z-10">
                                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
                                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                                      }`}>
                                        {questions.length} soal
                                      </span>
                                      <span className="text-[10px] font-semibold text-slate-500">
                                        Progres: {progressCount}/{questions.length}
                                      </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200/50 dark:bg-slate-800/50 z-0">
                                      <div 
                                        className="h-full bg-amber-400 transition-all duration-500" 
                                        style={{ width: `${progressPercent}%` }}
                                      />
                                    </div>

                                    {/* Hover overlay for actions */}
                                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-20">
                                      <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          min="1"
                                          max={questions.length}
                                          placeholder="Batas"
                                          value={questionLimits[key] || ''}
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setQuestionLimits((prev) => ({
                                              ...prev,
                                              [key]: isNaN(val) ? 0 : Math.min(val, questions.length)
                                            }));
                                          }}
                                          title="Batasi jumlah soal yang diujikan"
                                          className={`w-16 px-2 py-1.5 rounded-lg text-center border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500`}
                                        />
                                        
                                        {profileUsername === 'collector' && (
                                          <button
                                            onClick={(e) => downloadDatabase(key, questions, e)}
                                            className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-colors"
                                            title="Unduh bank soal"
                                          >
                                            <Download className="w-4 h-4" />
                                          </button>
                                        )}
                                        
                                        {!globalDatabases.includes(key) && (
                                          <button
                                            onClick={(e) => removeDatabase(key, e)}
                                            className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors"
                                            title="Hapus bank soal"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {/* Loose / Root items */}
                      {true && (
                        <div 
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const quizKey = e.dataTransfer.getData('quizKey');
                            if (quizKey) handleMoveQuiz(quizKey, 'root');
                          }}
                          className={`w-80 sm:w-88 flex-shrink-0 flex flex-col gap-4 rounded-[24px] p-5 border snap-start ${
                          theme === 'dark' ? 'bg-slate-900/40 border-white/[0.08]' : 'bg-slate-50/50 border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between mb-1 px-1">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-800/50 dark:bg-slate-950/50 flex items-center justify-center flex-shrink-0 text-sm">
                                📁
                              </div>
                              <span className="font-extrabold text-xs uppercase tracking-wider truncate text-slate-400">LAINNYA</span>
                            </div>
                            <span className="px-2.5 py-1 bg-slate-500/10 text-slate-500 rounded-full text-[10px] font-black whitespace-nowrap border border-slate-500/20">
                              {filteredDatabases.rootItems.reduce((acc, f) => acc + (f.questions?.length || 0), 0)} soal
                            </span>
                          </div>

                          <div className="flex flex-col gap-3">
                            {filteredDatabases.rootItems.map(({ key, displayName, questions }) => {
                              const isSelected = selectedDatabases.includes(key);
                              const relatedHistory = quizHistory.filter((h) => h.files && h.files.includes(key));
                              const personalBest = relatedHistory.length > 0 ? Math.max(...relatedHistory.map((h) => h.score)) : null;
                              const progressCount = personalBest !== null ? Math.round((personalBest / 100) * questions.length) : 0;
                              const progressPercent = personalBest !== null ? personalBest : 0;

                              return (
                                <div
                                  key={key}
                                  draggable
                                  onDragStart={(e) => e.dataTransfer.setData('quizKey', key)}
                                  onClick={() => {
                                    setSelectedDatabases((prev) =>
                                      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
                                    );
                                  }}
                                  className={`relative group flex flex-col p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                                    isSelected
                                      ? theme === 'dark' ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-indigo-50 border-indigo-500/30'
                                      : theme === 'dark' ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-4 gap-3 relative z-10">
                                    <h4 className={`font-bold text-sm leading-snug flex-1 pr-2 break-words ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                      {displayName}
                                    </h4>
                                    <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${
                                      isSelected 
                                        ? 'bg-amber-400 border-amber-400 text-slate-900' 
                                        : theme === 'dark' ? 'border-slate-600 bg-slate-900/50' : 'border-slate-300 bg-slate-50'
                                    }`}>
                                      {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={4} />}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-end justify-between mt-auto relative z-10">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
                                      theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                                    }`}>
                                      {questions.length} soal
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-500">
                                      Progres: {progressCount}/{questions.length}
                                    </span>
                                  </div>

                                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200/50 dark:bg-slate-800/50 z-0">
                                    <div 
                                      className="h-full bg-amber-400 transition-all duration-500" 
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>

                                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-20">
                                    <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        min="1"
                                        max={questions.length}
                                        placeholder="Batas"
                                        value={questionLimits[key] || ''}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value);
                                          setQuestionLimits((prev) => ({
                                            ...prev,
                                            [key]: isNaN(val) ? 0 : Math.min(val, questions.length)
                                          }));
                                        }}
                                        title="Batasi jumlah soal yang diujikan"
                                        className={`w-16 px-2 py-1.5 rounded-lg text-center border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500`}
                                      />
                                      
                                      {profileUsername === 'collector' && (
                                        <button
                                          onClick={(e) => downloadDatabase(key, questions, e)}
                                          className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-colors"
                                          title="Unduh bank soal"
                                        >
                                          <Download className="w-4 h-4" />
                                        </button>
                                      )}
                                      
                                      {!globalDatabases.includes(key) && (
                                        <button
                                          onClick={(e) => removeDatabase(key, e)}
                                          className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors"
                                          title="Hapus bank soal"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedDatabases.length > 0 && (
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => setDashboardTab('new')}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/10 transition-all cursor-pointer"
                      >
                        Lanjutkan ke Pengaturan Kuis ({selectedDatabases.length} Terpilih) <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* 🎯 TAB 3: BARU (QUIZ CONFIGURATION) */}
            {dashboardTab === 'new' && (
              <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
                <div className={`p-6 rounded-3xl border transition-all duration-300 space-y-6 ${
                  theme === 'dark'
                    ? 'bg-slate-900/40 border-white/[0.08] shadow-2xl'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div>
                    <h2 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      Konfigurasi Kuis CBT Baru
                    </h2>
                    <p className="text-xs text-slate-450 mt-1">
                      Atur cara penyajian soal dan mulailah simulasi try-out Anda.
                    </p>
                  </div>

                  {selectedDatabases.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                      <p className="text-xs font-extrabold text-slate-500">Anda belum memilih bank soal untuk diujikan.</p>
                      <button
                        onClick={() => setDashboardTab('banks')}
                        className="px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl mt-4 cursor-pointer"
                      >
                        Pilih Bank Soal Terlebih Dahulu
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Selected Databases Summary list */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Bank Soal Terpilih ({selectedDatabases.length})
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {selectedDatabases.map((key) => (
                            <span 
                              key={key} 
                              className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/15 flex items-center gap-1.5"
                            >
                              <span>{key.split('/').pop()}</span>
                              <button 
                                onClick={() => setSelectedDatabases(prev => prev.filter(d => d !== key))}
                                className="text-slate-450 hover:text-rose-500 font-extrabold"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Mode selection (Utuh/Simulasi) if multiple databases are selected */}
                      {selectedDatabases.length > 1 && (
                        <div className="space-y-2.5">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Metode Integrasi Soal
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => setQuizMode('utuh')}
                              className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                                quizMode === 'utuh'
                                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500 dark:text-indigo-400 font-bold'
                                  : 'bg-slate-950/20 dark:bg-slate-900/10 border-slate-200/60 dark:border-slate-800/80 text-slate-500'
                              }`}
                            >
                              <span className="text-xs font-extrabold uppercase">Sequential</span>
                              <span className="text-[10px] opacity-70 mt-0.5 leading-relaxed">Soal diuji per file secara berurutan</span>
                            </button>
                            <button
                              onClick={() => setQuizMode('simulasi')}
                              className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                                quizMode === 'simulasi'
                                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500 dark:text-indigo-400 font-bold'
                                  : 'bg-slate-950/20 dark:bg-slate-900/10 border-slate-200/60 dark:border-slate-800/80 text-slate-500'
                              }`}
                            >
                              <span className="text-xs font-extrabold uppercase">Simulasi Acak</span>
                              <span className="text-[10px] opacity-70 mt-0.5 leading-relaxed">Gabung seluruh bank soal & acak merata</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Checkbox configs */}
                      <div className="flex flex-col gap-3.5 pt-2">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={shuffleQuestions}
                            onChange={(e) => setShuffleQuestions(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <span>Acak urutan kemunculan soal</span>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={shuffleOptions}
                            onChange={(e) => setShuffleOptions(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <span>Acak opsi jawaban (Pilihan Ganda)</span>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={keyboardNavEnabled}
                            onChange={(e) => setKeyboardNavEnabled(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <span>Aktifkan Navigasi Keyboard (1-5, Panah, R, M)</span>
                        </label>
                        
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={isAdaptiveMode}
                            onChange={(e) => setIsAdaptiveMode(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <span>Mode Adaptif (Kecerdasan Buatan menyesuaikan level kesulitan)</span>
                        </label>
                      </div>

                      <hr className={`border-t my-2 ${theme === 'dark' ? 'border-slate-800/80' : 'border-slate-200/60'}`} />

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          onClick={startQuiz}
                          disabled={selectedDatabases.length === 0}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/10 hover:scale-[1.01] transition-all disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          Mulai Simulasi Kuis
                        </button>
                        
                        <button
                          onClick={() => setDashboardTab('banks')}
                          className={`px-5 py-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border ${
                            theme === 'dark'
                              ? 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Kembali Ke Bank Soal
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 👤 TAB 5: PROFIL */}
            {dashboardTab === 'profile' && (
              <div className="space-y-6 max-w-md mx-auto animate-fade-in">
                <div className={`p-6 rounded-3xl border transition-all duration-300 space-y-6 ${
                  theme === 'dark'
                    ? 'bg-slate-900/40 border-white/[0.08] shadow-2xl'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-teal-500 p-1 mb-4 shadow-xl">
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-black text-xl text-white">
                        {profileUsername.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <h2 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      {profileUsername}
                    </h2>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mt-1.5">
                      Gelar: {getLevelInfo(userXP).rank}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-2xl border text-center ${
                      theme === 'dark' ? 'bg-slate-950/30 border-slate-850' : 'bg-slate-50 border-slate-150'
                    }`}>
                      <div className="text-lg font-extrabold text-indigo-500">
                        {getLevelInfo(userXP).level}
                      </div>
                      <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mt-1">
                        Kultivator Level
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-2xl border text-center ${
                      theme === 'dark' ? 'bg-slate-950/30 border-slate-855' : 'bg-slate-50 border-slate-155'
                    }`}>
                      <div className="text-lg font-extrabold text-teal-500">
                        {userXP}
                      </div>
                      <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mt-1">
                        Total XP
                      </div>
                    </div>
                  </div>

                  <div className={`divide-y text-xs ${theme === 'dark' ? 'divide-slate-850' : 'divide-slate-100'}`}>
                    <div className="py-3 flex justify-between">
                      <span className="font-semibold text-slate-400">Total Soal Terjawab Benar</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-200">{currentUser?.total_questions_answered || 0} Soal</span>
                    </div>
                    <div className="py-3 flex justify-between">
                      <span className="font-semibold text-slate-400">Streak Belajar Saat Ini</span>
                      <span className="font-extrabold text-amber-500">{currentStreak} Hari</span>
                    </div>
                    <div className="py-3 flex justify-between">
                      <span className="font-semibold text-slate-400">Streak Tertinggi</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-200">{longestStreak} Hari</span>
                    </div>
                    <div className="py-3 flex justify-between">
                      <span className="font-semibold text-slate-400">Streak Freeze (❄️)</span>
                      <span className="font-extrabold text-sky-500">{streakFreezeLeft} Tersisa</span>
                    </div>
                    <div className="py-3 flex justify-between">
                      <span className="font-semibold text-slate-400">Tipe Akun</span>
                      <span className="font-extrabold text-teal-500 uppercase tracking-widest text-[9px] bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">Pro</span>
                    </div>
                  </div>

                  <hr className={`border-t ${theme === 'dark' ? 'border-slate-850' : 'border-slate-150'}`} />

                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      triggerToast('Sampai jumpa lagi!', '👋');
                    }}
                    className="w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/15 transition-all cursor-pointer"
                  >
                    Logout Akun
                  </button>
                </div>
              </div>
            )}

            {/* Box 3: History & Leaderboard (Beranda) */}
            {dashboardTab === 'home' && (
              <div className={`lg:col-span-12 p-6 rounded-2xl transition-all duration-300 border ${
                theme === 'dark'
                  ? 'bg-slate-900/45 border-white/[0.08] shadow-2xl backdrop-blur-md'
                  : 'bg-white/70 border-slate-200/60 shadow-sm backdrop-blur-md'
              }`}>
                <div className="flex items-center justify-between gap-4 mb-6 flex-wrap border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setActiveDashboardTab('riwayat')}
                      className={`text-xs sm:text-sm font-extrabold uppercase tracking-wider pb-1 transition-all border-b-2 cursor-pointer ${
                        activeDashboardTab === 'riwayat'
                          ? 'text-indigo-500 border-indigo-500'
                          : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-350'
                      }`}
                    >
                      Riwayat Percobaan
                    </button>
                    <button
                      onClick={async () => {
                        setActiveDashboardTab('leaderboard');
                        await fetchGlobalLeaderboard();
                        if (selectedLeaderboardFile) {
                          await fetchFileLeaderboard(selectedLeaderboardFile);
                        } else if (Object.keys(questionDatabase).length > 0) {
                          const firstFile = Object.keys(questionDatabase)[0];
                          setSelectedLeaderboardFile(firstFile);
                          await fetchFileLeaderboard(firstFile);
                        }
                      }}
                      className={`text-xs sm:text-sm font-extrabold uppercase tracking-wider pb-1 transition-all border-b-2 cursor-pointer ${
                        activeDashboardTab === 'leaderboard'
                          ? 'text-indigo-500 border-indigo-500'
                          : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-350'
                      }`}
                    >
                      🏆 Leaderboard CBT
                    </button>
                  </div>

                  {activeDashboardTab === 'riwayat' && quizHistory.length > 0 && (
                    <button
                      onClick={clearAllHistory}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 active:scale-105 active:translate-y-0 hover:scale-[1.02] hover:-translate-y-0.5 ${
                        theme === 'dark'
                          ? 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/80 text-rose-400'
                          : 'bg-rose-50 hover:bg-rose-100 border-rose-200/60 text-rose-600'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Kosongkan Riwayat
                    </button>
                  )}
                </div>

                {activeDashboardTab === 'riwayat' ? (
                  quizHistory.length === 0 ? (
                    <div className="text-center p-12">
                      <Award className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Belum ada riwayat pengerjaan kuis.
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[420px] mx-auto">
                        Selesaikan minimal satu kali try-out kuis CBT untuk mencatat riwayat skor beserta hasil analisis sub-kompetensi detail di sini.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Top Stats Overview */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className={`p-4 rounded-xl border text-center ${
                          theme === 'dark' ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-100/50 border-slate-200/60'
                        }`}>
                          <div className="text-2xl font-extrabold text-indigo-500">
                            {quizHistory.length}
                          </div>
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                            Jumlah Percobaan
                          </div>
                        </div>

                        <div className={`p-4 rounded-xl border text-center ${
                          theme === 'dark' ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-100/50 border-slate-200/60'
                        }`}>
                          <div className="text-2xl font-extrabold text-emerald-500">
                            {Math.round(quizHistory.reduce((a, b) => a + b.score, 0) / quizHistory.length)}
                          </div>
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                            Rata-rata Skor
                          </div>
                        </div>

                        <div className={`p-4 rounded-xl border text-center ${
                          theme === 'dark' ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-100/50 border-slate-200/60'
                        }`}>
                          <div className="text-2xl font-extrabold text-amber-500">
                            {Math.max(...quizHistory.map((h) => h.score))}
                          </div>
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                            Skor Tertinggi
                          </div>
                        </div>
                      </div>

                      {/* Detailed List */}
                      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                        {quizHistory.map((item, index) => {
                          const scoreColor = item.score >= 80 
                            ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
                            : item.score >= 65 
                            ? 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' 
                            : item.score >= 40 
                            ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' 
                            : 'text-rose-500 bg-rose-500/10 border-rose-500/20';

                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                setSelectedHistoryDetail(item);
                                setOpenHistoryReviewIndices({});
                              }}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border gap-4 transition-all hover:translate-x-1 cursor-pointer group/history ${
                                theme === 'dark'
                                  ? 'bg-slate-800/20 hover:bg-slate-800/40 border-slate-800'
                                  : 'bg-white hover:bg-slate-100 border-slate-200/60 shadow-sm'
                              }`}
                              title="Klik untuk membuka detail soal & pembahasan"
                            >
                              <div className="flex items-center gap-3.5">
                                <div className={`w-12 h-12 rounded-full border flex flex-col items-center justify-center font-extrabold text-sm ${scoreColor}`}>
                                  <span>{item.score}</span>
                                  <span className="text-[7px] opacity-75 uppercase">Skor</span>
                                </div>

                                <div className="min-w-0">
                                  <div className="font-bold text-xs truncate max-w-[280px] sm:max-w-md group-hover/history:text-indigo-500 transition-colors">
                                    {item.files.join(', ')}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 dark:text-slate-400 flex-wrap">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(item.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </span>
                                    <span>•</span>
                                    <span>{item.total} Soal</span>
                                    <span>•</span>
                                    <span className="text-emerald-500 font-bold">✔ {item.correct}</span>
                                    <span className="text-rose-500 font-bold">✘ {item.wrong}</span>
                                    <span className="text-slate-400 font-bold">∅ {item.empty}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <span className="text-[10px] font-extrabold text-indigo-500 group-hover/history:translate-x-1 transition-transform flex items-center gap-0.5">
                                  Lihat Pembahasan →
                                </span>

                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-500 capitalize">
                                  {item.mode === 'simulasi' ? 'Simulasi' : 'Sequential'}
                                </span>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteHistoryItem(item.id);
                                  }}
                                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus riwayat"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="space-y-6">
                    {/* Leaderboard Type Toggles */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/60 p-1 border border-slate-200/40 dark:border-slate-700/30">
                        <button
                          onClick={() => setLeaderboardType('global')}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            leaderboardType === 'global'
                              ? 'bg-indigo-50 text-white shadow-sm'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          Global (Total Soal)
                        </button>
                        <button
                          onClick={() => {
                            setLeaderboardType('file');
                            if (!selectedLeaderboardFile && Object.keys(questionDatabase).length > 0) {
                              const firstFile = Object.keys(questionDatabase)[0];
                              setSelectedLeaderboardFile(firstFile);
                              fetchFileLeaderboard(firstFile);
                            }
                          }}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            leaderboardType === 'file'
                              ? 'bg-indigo-50 text-white shadow-sm'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          Per File Soal
                        </button>
                      </div>

                      {leaderboardType === 'file' && Object.keys(questionDatabase).length > 0 && (
                        <div className="w-full sm:w-64">
                          <select
                            value={selectedLeaderboardFile}
                            onChange={(e) => setSelectedLeaderboardFile(e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                              theme === 'dark'
                                ? 'bg-slate-800 border-slate-700 text-slate-200'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          >
                            {Object.keys(questionDatabase).map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Time Filter Tabs for Global Leaderboard */}
                    {leaderboardType === 'global' && (
                      <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100/50 dark:bg-slate-800/35 border border-slate-200/40 dark:border-slate-700/20 w-max">
                        {[
                          { key: 'all', label: 'Semua Waktu' },
                          { key: '1', label: 'Hari Ini' },
                          { key: '7', label: 'Minggu Ini' },
                          { key: '30', label: 'Bulan Ini' }
                        ].map((filter) => (
                          <button
                            key={filter.key}
                            onClick={() => setGlobalTimeFilter(filter.key as any)}
                            className={`px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                              globalTimeFilter === filter.key
                                ? 'bg-indigo-500 text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Loader */}
                    {isLeaderboardLoading ? (
                      <div className="text-center py-12">
                        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
                        <p className="text-xs text-slate-500 dark:text-slate-400">Memuat peringkat terbaru...</p>
                      </div>
                    ) : (
                      <div className={`overflow-hidden rounded-xl border ${
                        theme === 'dark' ? 'bg-slate-900/35 border-slate-800' : 'bg-slate-50/50 border-slate-200/50'
                      }`}>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className={`border-b text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 ${
                                theme === 'dark' ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-100/50 border-slate-200/50'
                              }`}>
                                <th className="py-3 px-4 w-16 text-center">Rank</th>
                                <th className="py-3 px-4">Peserta</th>
                                {leaderboardType === 'global' ? (
                                  <th className="py-3 px-4 text-center">Total Soal Terjawab</th>
                                ) : (
                                  <>
                                    <th className="py-3 px-4 text-center">Skor Terbaik</th>
                                    <th className="py-3 px-4 text-center">Jumlah Soal</th>
                                    <th className="py-3 px-4">Tanggal Diunggah</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {leaderboardType === 'global' ? (
                                globalLeaderboard.length === 0 ? (
                                  <tr>
                                    <td colSpan={3} className="py-8 text-center text-slate-400">Belum ada data peringkat global.</td>
                                  </tr>
                                ) : (
                                  globalLeaderboard.map((row, index) => {
                                    const isCurrent = row.username === profileUsername;
                                    const rankNum = row.isCurrentUserOutOfTop10 ? row.actualRank : index + 1;
                                    return (
                                    <tr key={index} className={`border-b last:border-0 ${
                                      isCurrent 
                                        ? (theme === 'dark' ? 'bg-indigo-900/40 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200')
                                        : (theme === 'dark' ? 'border-slate-800/50 hover:bg-slate-800/10' : 'border-slate-200/30 hover:bg-slate-100/30')
                                    }`}>
                                      <td className="py-3.5 px-4 text-center font-bold">
                                        {rankNum === 1 ? '👑' : rankNum === 2 ? '🥈' : rankNum === 3 ? '🥉' : rankNum}
                                      </td>
                                      <td className="py-3.5 px-4 font-extrabold flex items-center gap-2">
                                        <span className={`${isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                          {row.username} {isCurrent && '(Anda)'}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded text-[8px] bg-indigo-500/10 text-indigo-500 font-black uppercase">
                                          LV {row.level || 1}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4 text-center font-extrabold text-indigo-500">
                                        {row.total_questions_answered || 0} Soal
                                      </td>
                                    </tr>
                                  )})
                                )
                              ) : (
                                fileLeaderboard.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-400">Belum ada data peringkat untuk file ini.</td>
                                  </tr>
                                ) : (
                                  fileLeaderboard.map((row, index) => {
                                    const isCurrent = row.username === profileUsername;
                                    const rankNum = row.isCurrentUserOutOfTop10 ? row.actualRank : index + 1;
                                    return (
                                    <tr key={index} className={`border-b last:border-0 ${
                                      isCurrent 
                                        ? (theme === 'dark' ? 'bg-indigo-900/40 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200')
                                        : (theme === 'dark' ? 'border-slate-800/50 hover:bg-slate-800/10' : 'border-slate-200/30 hover:bg-slate-100/30')
                                    }`}>
                                      <td className="py-3.5 px-4 text-center font-bold">
                                        {rankNum === 1 ? '👑' : rankNum === 2 ? '🥈' : rankNum === 3 ? '🥉' : rankNum}
                                      </td>
                                      <td className="py-3.5 px-4 font-extrabold flex items-center gap-2">
                                        <span className={`${isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                          {row.username} {isCurrent && '(Anda)'}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded text-[8px] bg-indigo-500/10 text-indigo-500 font-black uppercase">
                                          LV {row.level || 1}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4 text-center font-extrabold text-emerald-500 text-sm">
                                        {row.score}%
                                      </td>
                                      <td className="py-3.5 px-4 text-center font-semibold text-slate-500">
                                        {row.questions_count} Soal
                                      </td>
                                      <td className="py-3.5 px-4 text-slate-400 font-medium">
                                        {new Date(row.created_at).toLocaleDateString('id-ID')}
                                      </td>
                                    </tr>
                                  )})
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Box 4: Analysis Dashboard */}
            {dashboardTab === 'analysis' && (
              <div className={`lg:col-span-12 p-6 rounded-2xl transition-all duration-300 border ${
                theme === 'dark'
                  ? 'bg-slate-900/45 border-white/[0.08] shadow-2xl backdrop-blur-md'
                  : 'bg-white/70 border-slate-200/60 shadow-sm backdrop-blur-md'
              }`}>
                <div className="flex items-center justify-between gap-4 mb-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-indigo-500">
                    📊 Analisis Performa Belajar
                  </h2>
                </div>
                
                <DashboardCharts quizHistory={quizHistory} theme={theme} />
              </div>
            )}
          </div>
        )}

        {/* === ACTIVE CBT SIMULATOR SCREEN === */}
        {screen === 'quiz' && currentQuiz.length > 0 && (
          <div className="relative min-h-screen pb-24">

            {/* Sticky Header (Fixed Top) */}
            <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${
              theme === 'dark' ? 'bg-slate-950/85 border-slate-900 text-white' : 'bg-white/85 border-slate-200 text-slate-900'
            }`}>
              <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between relative">
                <button
                  onClick={exitQuiz}
                  className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>

                <div className="flex items-center gap-4">
                  <span className="text-xs sm:text-sm font-extrabold tracking-wider text-slate-500 dark:text-slate-400">
                    Soal {currentIndex + 1} {isAdaptiveMode ? '' : `dari ${currentQuiz.length}`}
                  </span>
                  
                  {isAdaptiveMode && (
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${
                      currentDifficulty === 'mudah' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      currentDifficulty === 'sedang' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    }`}>
                      Level: {currentDifficulty}
                    </span>
                  )}
                  
                  {/* Timer display */}
                  <span className={`flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1 rounded-full border transition-all ${
                    quizSecondsLeft < 300
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 font-black animate-pulse'
                      : quizSecondsLeft < 600
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 font-extrabold'
                        : theme === 'dark'
                          ? 'bg-slate-900 border-slate-800 text-slate-300 font-bold'
                          : 'bg-slate-100 border-slate-200 text-slate-750 font-bold'
                  }`}>
                    ⏱️ {formatTimer(quizSecondsLeft)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleFullscreen}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                    }`}
                    title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setMobileQuizNavOpen(true)}
                    className={`lg:hidden p-2 rounded-xl border transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-slate-900 border-slate-800 text-slate-450 hover:bg-slate-800'
                        : 'bg-slate-100 border-slate-200 text-slate-655 hover:bg-slate-200'
                    }`}
                    title="Peta Soal"
                  >
                    <Menu className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Smooth 4px progress bar at the bottom of the header */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200/50 dark:bg-slate-800/50">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / currentQuiz.length) * 100}%` }}
                />
              </div>
            </header>

            {/* Keyboard Hint Panel */}
            {keyboardNavEnabled && (
              <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-4 hidden sm:flex justify-center animate-fade-in">
                <div className={`text-[10px] sm:text-xs font-bold px-4 py-2 rounded-full border shadow-sm flex items-center gap-4 ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                }`}>
                  <span><kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[9px] mr-1">1</kbd>-<kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[9px] ml-1 mr-1.5">5</kbd> Pilih Jawaban</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                  <span><kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[9px] mr-1.5">←→</kbd> Navigasi</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                  <span><kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[9px] mr-1.5">R</kbd> Ragu</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                  <span><kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[9px] mr-1.5">M</kbd> Peta Soal</span>
                </div>
              </div>
            )}

            {/* Split View Content Layout */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Side: Active Question Card Panel */}
                <div className="lg:col-span-8 space-y-6 w-full max-w-[800px] mx-auto">
                  
                  {/* Main Question Card with Rounded-2xl */}
                  <div className={`p-6 rounded-2xl transition-all duration-300 border ${
                    theme === 'dark'
                      ? 'bg-slate-900/45 border-white/[0.08] shadow-2xl backdrop-blur-md'
                      : 'bg-white/70 border-slate-200/60 shadow-sm backdrop-blur-md'
                  }`}>
                    
                    {/* Sub-kompetensi & Kesulitan tag */}
                    <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <span>🏷️</span>
                        <span className="truncate">
                          {currentQuiz[currentIndex].metadata?.sub_kompetensi_klinis || 'Sains Medis'}
                        </span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-extrabold ${
                          currentQuiz[currentIndex].metadata?.tingkat_kesulitan === 'Sulit'
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            : currentQuiz[currentIndex].metadata?.tingkat_kesulitan === 'Mudah'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {currentQuiz[currentIndex].metadata?.tingkat_kesulitan || 'Sedang'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={copyQuestionToClipboard}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer ${
                            theme === 'dark'
                              ? 'bg-slate-800/80 hover:bg-slate-850 text-slate-300 border-slate-700/50'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-655 border-slate-200'
                          }`}
                          title="Salin Soal & Opsi ke Clipboard"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Salin Soal</span>
                        </button>
                      </div>
                    </div>

                    {/* Question text block */}
                    <div className="text-sm sm:text-base font-semibold leading-relaxed text-slate-800 dark:text-slate-100 mb-6">
                      {renderHtmlText(currentQuiz[currentIndex].pertanyaan)}
                    </div>

                    {/* Clinical Image with max-height 200px, object-fit cover, tap for fullscreen */}
                    {(() => {
                      const imageUrl = getQuestionImage(currentQuiz[currentIndex]);
                      if (!imageUrl) return null;
                      return (
                        <div className="my-5 relative group max-w-2xl mx-auto overflow-hidden rounded-xl border border-slate-250 dark:border-slate-800">
                          <img 
                            src={imageUrl} 
                            alt="Visual Klinis" 
                            referrerPolicy="no-referrer"
                            className="w-full h-[200px] object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-102"
                            onClick={() => setLightboxImage(imageUrl)}
                          />
                          <div 
                            className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 cursor-pointer backdrop-blur-sm transition-all"
                            onClick={() => setLightboxImage(imageUrl)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Perbesar Gambar
                          </div>
                        </div>
                      );
                    })()}

                    {/* Answer Options List (pilihan) OR Short Answer Input (isian) */}
                    {currentQuiz[currentIndex].pilihan && currentQuiz[currentIndex].pilihan.length > 0 ? (
                      <div className="space-y-3">
                        {currentQuiz[currentIndex].pilihan.map((opt, i) => {
                          const letters = ['A', 'B', 'C', 'D', 'E'];
                          const isSelected = userAnswers[currentIndex] === opt;
                          const isCorrect = i === ['A', 'B', 'C', 'D', 'E'].indexOf(getCorrectLetterForQuestion(currentQuiz[currentIndex]));
                          const revealed = isRevealed[currentIndex];

                          let tileClass = theme === 'dark'
                            ? 'bg-slate-900/30 border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/50 text-slate-350'
                            : 'bg-white border-slate-250/60 hover:border-indigo-500/30 hover:bg-slate-50/50 text-slate-655';

                          let bubbleClass = theme === 'dark'
                            ? 'border-slate-800 bg-slate-950 text-slate-500'
                            : 'border-slate-200 bg-slate-50 text-slate-400';

                          if (revealed) {
                            if (isCorrect) {
                              tileClass = 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/5';
                              bubbleClass = 'bg-emerald-500 border-emerald-500 text-white';
                            } else if (isSelected) {
                              tileClass = 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 shadow-sm shadow-rose-500/5 animate-shake';
                              bubbleClass = 'bg-rose-500 border-rose-500 text-white';
                            } else {
                              tileClass = 'opacity-50 cursor-default ' + (theme === 'dark' ? 'bg-slate-900/10 border-slate-850' : 'bg-slate-50/30 border-slate-100');
                            }
                          } else if (isSelected) {
                            tileClass = 'bg-indigo-500/15 border-indigo-500 text-indigo-500 dark:text-indigo-400 ring-1 ring-indigo-500/20';
                            bubbleClass = 'bg-indigo-500 border-indigo-500 text-white shadow-sm';
                          }

                          return (
                            <button
                              key={i}
                              disabled={revealed}
                              onClick={() => selectAnswer(opt)}
                              className={`w-full flex items-start gap-3.5 p-4 rounded-xl border text-left text-xs sm:text-sm font-semibold cursor-pointer transition-all duration-150 min-h-[48px] active:scale-[0.98] hover:translate-x-1 ${tileClass}`}
                            >
                              <div className={`w-7 h-7 rounded-full border flex items-center justify-center font-extrabold text-xs flex-shrink-0 transition-all ${bubbleClass}`}>
                                {letters[i]}
                              </div>
                              <div className="flex-1 mt-0.5 text-xs sm:text-sm font-semibold leading-relaxed">
                                {renderHtmlText(opt)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-905/20 border-slate-800' : 'bg-white border-slate-200'}`}>
                          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            Jawaban Isian Singkat:
                          </label>
                          <input
                            type="text"
                            disabled={isRevealed[currentIndex]}
                            value={userAnswers[currentIndex] || ''}
                            onChange={(e) => {
                              const updated = [...userAnswers];
                              updated[currentIndex] = e.target.value;
                              setUserAnswers(updated);
                            }}
                            placeholder="Ketik jawaban Anda disini..."
                            className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold outline-none transition-all duration-200 ${
                              isRevealed[currentIndex]
                                ? theme === 'dark'
                                  ? 'bg-slate-900 border-slate-805 text-slate-400 cursor-not-allowed'
                                  : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                                : theme === 'dark'
                                ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
                                : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
                            }`}
                          />
                        </div>

                        {/* Hints Section */}
                        {currentQuiz[currentIndex].hints && currentQuiz[currentIndex].hints.length > 0 && currentQuiz[currentIndex].featureFlags?.showHints !== false && (
                          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/10 border-slate-800/60' : 'bg-slate-50 border-slate-200/60'}`}>
                            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-350">
                                  Bantuan Petunjuk ({unlockedHints[currentIndex] || 0}/{currentQuiz[currentIndex].hints.length})
                                </span>
                              </div>
                              
                              {!isRevealed[currentIndex] && (unlockedHints[currentIndex] || 0) < currentQuiz[currentIndex].hints.length && (
                                <button
                                  onClick={() => {
                                    const currentUnlocked = unlockedHints[currentIndex] || 0;
                                    const maxAllowed = currentQuiz[currentIndex].featureFlags?.maxHintsAllowed || 3;
                                    
                                    if (currentUnlocked >= maxAllowed) {
                                      triggerToast(`Batas maksimal petunjuk terpakai (${maxAllowed})!`, '⚠️');
                                      return;
                                    }
                                    
                                    const penaltyRate = currentQuiz[currentIndex].featureFlags?.hintPenalty !== undefined 
                                      ? currentQuiz[currentIndex].featureFlags.hintPenalty 
                                      : 0.25;
                                    
                                    const confirmUnlock = () => {
                                      setUnlockedHints((prev) => ({
                                        ...prev,
                                        [currentIndex]: currentUnlocked + 1
                                      }));
                                      triggerToast('Petunjuk baru terbuka!', '💡');
                                    };
                                    
                                    if (penaltyRate > 0) {
                                      setModalTitle('Buka Petunjuk?');
                                      setModalDesc(`Membuka petunjuk akan mengurangi skor XP sebesar ${penaltyRate * 100}% untuk soal ini jika dijawab benar. Apakah Anda yakin?`);
                                      setModalAction(() => () => confirmUnlock());
                                      setModalOpen(true);
                                    } else {
                                      confirmUnlock();
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-colors cursor-pointer"
                                >
                                  💡 Tampilkan Petunjuk
                                </button>
                              )}
                            </div>

                            {(unlockedHints[currentIndex] || 0) > 0 ? (
                              <div className="space-y-1.5">
                                {currentQuiz[currentIndex].hints!.slice(0, unlockedHints[currentIndex] || 0).map((hint: string, hIdx: number) => (
                                  <div 
                                    key={hIdx}
                                    className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 bg-amber-500/[0.02] border border-amber-500/10 rounded-lg p-2.5"
                                  >
                                    <span className="font-extrabold text-amber-500">#{hIdx + 1}:</span>
                                    <span>{hint}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-2 text-xs text-slate-400 dark:text-slate-500 italic">
                                Belum ada petunjuk yang dibuka. Gunakan tombol petunjuk jika Anda kesulitan!
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Question explanation/Pembahasan */}
                    {isRevealed[currentIndex] && (() => {
                      const isAnswerCorrect = isUserAnswerCorrect(userAnswers[currentIndex], currentQuiz[currentIndex]);
                      const correctLetter = getCorrectLetterForQuestion(currentQuiz[currentIndex]);
                      const correctOptionText = currentQuiz[currentIndex].pilihan[['A', 'B', 'C', 'D', 'E'].indexOf(correctLetter)] || currentQuiz[currentIndex].jawaban_benar;

                      return (
                        <div className="mt-6 border-t border-slate-200/50 dark:border-slate-800/50 pt-6 animate-slide-down">
                          <div className={`rounded-xl border overflow-hidden ${
                            isAnswerCorrect
                              ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
                              : 'border-rose-500/30 bg-rose-500/[0.02]'
                          }`}>
                            <div className={`flex items-center gap-2 px-4 py-3 font-extrabold text-xs uppercase tracking-wider ${
                              isAnswerCorrect
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-b border-emerald-500/10'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-b border-rose-500/10'
                            }`}>
                              {isAnswerCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-500" />
                              )}
                              <span>
                                {isAnswerCorrect ? 'Jawaban Benar!' : 'Jawaban Salah'}
                              </span>
                            </div>

                            <div className="p-5 space-y-4">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                {currentQuiz[currentIndex].pilihan && currentQuiz[currentIndex].pilihan.length > 0 ? (
                                  <span>Kunci Jawaban: {correctLetter}. {correctOptionText}</span>
                                ) : (
                                  <span>Kunci Jawaban: {currentQuiz[currentIndex].jawaban_benar}</span>
                                )}
                              </div>

                              <div>
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                                  💡 Pembahasan Detail:
                                </h4>
                                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                  {currentQuiz[currentIndex].pembahasan ? renderHtmlText(currentQuiz[currentIndex].pembahasan) : 'Tidak ada uraian penjelasan untuk soal ini.'}
                                </p>
                              </div>

                              {currentQuiz[currentIndex].eliminasi_opsi && Object.keys(currentQuiz[currentIndex].eliminasi_opsi!).length > 0 && (
                                <div className="border-t border-slate-200/40 dark:border-slate-800/40 pt-4">
                                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                    🔍 Eliminasi Opsi & Rationale:
                                  </h4>
                                  <div className="grid grid-cols-1 gap-2">
                                    {Object.entries(currentQuiz[currentIndex].eliminasi_opsi!).map(([key, desc]) => {
                                      const isKunci = key === correctLetter;
                                      return (
                                        <div
                                          key={key}
                                          className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs leading-relaxed ${
                                            isKunci
                                              ? 'bg-emerald-500/5 border-emerald-500/25 text-slate-700 dark:text-slate-300'
                                              : 'bg-slate-500/[0.02] border-slate-200/50 dark:border-slate-800/80 text-slate-500 dark:text-slate-400'
                                          }`}
                                        >
                                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                                            isKunci
                                              ? 'bg-emerald-500 text-white'
                                              : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                          }`}>
                                            {key}
                                          </span>
                                          <span>{renderHtmlText(desc)}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Navigation Buttons inside card */}
                    <div className="hidden lg:flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
                      <button
                        onClick={() => navigateQuestion(-1)}
                        disabled={currentIndex === 0}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 active:scale-105 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-white'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        ← Sebelumnya
                      </button>

                      <div className="flex items-center gap-2">
                        {!isRevealed[currentIndex] ? (
                          <button
                            onClick={checkAnswerNow}
                            disabled={userAnswers[currentIndex] === null}
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/10 transition-all duration-200 active:scale-105 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            Cek Jawaban
                          </button>
                        ) : (
                          <span className="text-[11px] font-extrabold text-indigo-500 flex items-center gap-1 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/10">
                            <Lock className="w-3 h-3" />
                            Terkunci
                          </span>
                        )}

                        <button
                          onClick={toggleDoubt}
                          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 active:scale-105 cursor-pointer ${
                            doubtStatus[currentIndex]
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 font-extrabold shadow-sm'
                              : theme === 'dark'
                              ? 'bg-slate-850 hover:bg-slate-850 border-slate-700 text-slate-400'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${doubtStatus[currentIndex] ? 'bg-amber-500 shadow-sm shadow-amber-500' : 'bg-slate-400'}`} />
                          <span>Ragu-ragu</span>
                        </button>
                      </div>

                      {(isAdaptiveMode && currentIndex === currentQuiz.length - 1 && currentQuiz.length < 30) ? (
                        <button
                          onClick={handleNextQuestion}
                          disabled={userAnswers[currentIndex] === null}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-500 text-white shadow-md shadow-indigo-500/10 transition-all duration-200 active:scale-105 cursor-pointer hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Selanjutnya →
                        </button>
                      ) : currentIndex < currentQuiz.length - 1 ? (
                        <button
                          onClick={handleNextQuestion}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-500 text-white shadow-md shadow-indigo-500/10 transition-all duration-200 active:scale-105 cursor-pointer hover:bg-indigo-600"
                        >
                          Selanjutnya →
                        </button>
                      ) : (
                        <button
                          onClick={handleNextQuestion}
                          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/10 transition-all duration-200 active:scale-105 cursor-pointer"
                        >
                          🏁 Selesai & Kirim
                        </button>
                      )}
                    </div>

                  </div>
                </div>

                {/* Right Side: Sticky Peta Soal Panel (Desktop only) */}
                <aside className="hidden lg:block lg:col-span-4 sticky top-24 w-full max-w-[320px] space-y-6">
                  
                  {/* Gamification Level stats */}
                  <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                    theme === 'dark'
                      ? 'bg-slate-900/40 border-white/[0.08] shadow-2xl backdrop-blur-md'
                      : 'bg-white/50 border-slate-200/60 shadow-sm backdrop-blur-md'
                  }`}>
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-emerald-400 to-amber-400" />
                    
                    <div className="flex items-center justify-between mb-3 mt-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-extrabold tracking-widest text-indigo-500 uppercase font-mono">
                          Level {getLevelInfo(userXP).level}
                        </span>
                        <span className="text-sm font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
                          {getLevelInfo(userXP).rank}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/10 px-2 py-0.5 rounded-full">
                        <Flame className="w-3.5 h-3.5 animate-bounce text-amber-500" />
                        <span>Streak: <strong className="text-amber-500">{currentStreak}</strong></span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500" 
                        style={{ width: `${getLevelInfo(userXP).progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-500 mt-1.5">
                      <span>XP: {userXP}</span>
                      <span>Target: {getLevelInfo(userXP).nextXP}</span>
                    </div>
                  </div>

                  {/* Question navigation grid sidebar */}
                  <div className={`p-5 rounded-2xl border transition-all duration-300 ${
                    theme === 'dark' ? 'bg-slate-900/45 border-white/[0.08] shadow-2xl' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-4 flex items-center justify-between">
                      <span>Peta Soal</span>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-bold">
                        {userAnswers.filter(a => a !== null).length} / {currentQuiz.length} Terjawab
                      </span>
                    </h3>

                    <div className="grid grid-cols-5 gap-2 max-h-[350px] overflow-y-auto pr-1">
                      {currentQuiz.map((_, idx) => {
                        const isAnswered = userAnswers[idx] !== null;
                        const isDoubt = doubtStatus[idx];
                        const isActive = idx === currentIndex;
                        
                        let btnClass = "";
                        if (isActive) {
                          btnClass = "border-indigo-500 text-indigo-500 border-2 font-black shadow-sm ring-1 ring-indigo-500/20";
                        } else if (isDoubt) {
                          btnClass = "bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-500/10";
                        } else if (isAnswered) {
                          btnClass = "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/10";
                        } else {
                          btnClass = theme === 'dark' 
                            ? 'bg-slate-800/40 border-slate-850 hover:bg-slate-800 text-slate-400' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-655 border-slate-200/60';
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-10 rounded-xl border text-xs font-bold transition-all hover:scale-[1.08] active:scale-95 flex items-center justify-center cursor-pointer ${btnClass}`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 text-[10px] font-bold text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Terjawab</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span>Ragu-ragu</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        <span>Aktif</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${theme === 'dark' ? 'bg-slate-850' : 'bg-slate-200'}`} />
                        <span>Belum Dijawab</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                      <button
                        onClick={openFinishModal}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-extrabold bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-md shadow-rose-500/15 transition-all duration-200 active:scale-95 cursor-pointer"
                      >
                        🏁 Selesai Ujian
                      </button>
                    </div>
                  </div>

                </aside>

              </div>
            </div>

            {/* Mobile Navigasi Grid Drawer/Modal Overlay */}
            {mobileQuizNavOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl relative animate-scale-up ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                }`}>
                  <button
                    onClick={() => setMobileQuizNavOpen(false)}
                    className="absolute top-4 right-4 p-2 rounded-xl text-slate-455 hover:text-slate-205 hover:bg-slate-800/50 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-4 pr-8">
                    Peta Soal Ujian
                  </h3>

                  <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {currentQuiz.map((_, idx) => {
                      const isAnswered = userAnswers[idx] !== null;
                      const isDoubt = doubtStatus[idx];
                      const isActive = idx === currentIndex;
                      
                      let btnClass = "";
                      if (isActive) {
                        btnClass = "border-indigo-500 text-indigo-500 border-2 font-black shadow-sm ring-1 ring-indigo-500/20";
                      } else if (isDoubt) {
                        btnClass = "bg-amber-500 border-amber-500 text-white shadow-sm";
                      } else if (isAnswered) {
                        btnClass = "bg-emerald-500 border-emerald-500 text-white shadow-sm";
                      } else {
                        btnClass = theme === 'dark' 
                          ? 'bg-slate-800 border-slate-750 text-slate-450' 
                          : 'bg-slate-100 text-slate-600 border-slate-200/60';
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentIndex(idx);
                            setMobileQuizNavOpen(false);
                          }}
                          className={`h-10 rounded-xl border text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${btnClass}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 text-[10px] font-bold text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 rounded-full h-2 bg-emerald-500" />
                      <span>Terjawab</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 rounded-full h-2 bg-amber-500" />
                      <span>Ragu-ragu</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 rounded-full h-2 bg-indigo-500" />
                      <span>Aktif</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 rounded-full h-2 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`} />
                      <span>Belum Dijawab</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fixed Bottom Action Bar for Mobile/Tablet */}
            <div className={`fixed bottom-0 left-0 right-0 z-30 lg:hidden p-4 border-t backdrop-blur-md transition-colors ${
              theme === 'dark' ? 'bg-slate-950/90 border-slate-900/80' : 'bg-slate-50/90 border-slate-200/60'
            }`}>
              <div className="flex items-center gap-2 max-w-md mx-auto">
                <button
                  onClick={() => setDoubtStatus(prev => {
                    const updated = [...prev];
                    updated[currentIndex] = !updated[currentIndex];
                    return updated;
                  })}
                  className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    doubtStatus[currentIndex]
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                      : theme === 'dark'
                        ? 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🤔 Ragu
                </button>

                <button
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className={`w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl border text-xs font-bold transition-all disabled:opacity-40 cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  ←
                </button>

                {!isRevealed[currentIndex] && (
                  <button
                    onClick={checkAnswerNow}
                    disabled={userAnswers[currentIndex] === null}
                    className="flex-1 py-3 px-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/15 transition-all duration-200 active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer text-center"
                  >
                    ✓ Cek
                  </button>
                )}

                {currentIndex === currentQuiz.length - 1 ? (
                  <button
                    onClick={finishQuiz}
                    className="flex-1 py-3 px-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/10 transition-all cursor-pointer text-center"
                  >
                    Selesai
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentIndex(prev => Math.min(currentQuiz.length - 1, prev + 1))}
                    className="flex-1 py-3 px-2 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/10 transition-all duration-200 cursor-pointer text-center"
                  >
                    Lanjut →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* === RESULT & ANALYTICS SUMMARY SCREEN === */}
        {screen === 'result' && currentQuiz.length > 0 && (
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            
            {/* Main Score Ring card */}
            <div className={`p-8 rounded-2xl transition-all duration-300 border text-center relative overflow-hidden ${
              theme === 'dark'
                ? 'bg-slate-900/45 border-white/[0.08] shadow-2xl backdrop-blur-md'
                : 'bg-white/70 border-slate-200/60 shadow-sm backdrop-blur-md'
            }`}>
              
              {/* Radial Animated Circular meter */}
              <div className="relative w-44 h-44 mx-auto mb-6 flex items-center justify-between flex-col">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 160 160">
                  <circle 
                    cx="80" 
                    cy="80" 
                    r="70" 
                    fill="none" 
                    stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} 
                    strokeWidth="8"
                  />
                  <circle 
                    cx="80" 
                    cy="80" 
                    r="70" 
                    fill="none" 
                    stroke="rgb(99, 102, 241)" 
                    strokeWidth="8"
                    strokeDasharray="439.6"
                    strokeDashoffset={439.6 - (Math.round((userAnswers.filter((a, i) => isUserAnswerCorrect(a, currentQuiz[i])).length / currentQuiz.length) * 100) / 100) * 439.6}
                    strokeLinecap="round"
                    className="transition-all duration-[1200ms] ease-out-sine"
                  />
                </svg>

                <div className="flex flex-col items-center justify-center h-full pt-1.5">
                  <span className="text-4xl font-extrabold tracking-tight text-indigo-500">
                    {Math.round((userAnswers.filter((a, i) => isUserAnswerCorrect(a, currentQuiz[i])).length / currentQuiz.length) * 100)}
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mt-1">
                    Dari 100 poin
                  </span>
                </div>
              </div>

              {/* Roasting Feedback header block */}
              {(() => {
                const total = currentQuiz.length;
                const correct = userAnswers.filter((a, i) => isUserAnswerCorrect(a, currentQuiz[i])).length;
                const score = Math.round((correct / total) * 100);
                const feedbackText = getFeedbackForScore(score);

                let titleText = "🔴 Zona Darurat Klinis";
                let badgeColor = "bg-rose-500/10 text-rose-500 border-rose-500/20";
                
                if (score >= 86) {
                  titleText = "🌟 Zona Dewa Akademis!";
                  badgeColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                } else if (score >= 65) {
                  titleText = "🟢 Zona Aman & Lulus";
                  badgeColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                } else if (score >= 40) {
                  titleText = "🟠 Zona Kritis Remedial";
                  badgeColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                }

                return (
                  <div className="space-y-4">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase border ${badgeColor}`}>
                      {titleText}
                    </span>

                    <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 max-w-xl mx-auto leading-relaxed">
                      &quot;{feedbackText}&quot;
                    </h2>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      (Anda menjawab benar <strong className="text-slate-700 dark:text-slate-200">{correct}</strong> dari total <strong className="text-slate-700 dark:text-slate-200">{total}</strong> soal tryout)
                    </p>
                  </div>
                );
              })()}

              <div className="grid grid-cols-3 gap-2 mt-8 max-w-md mx-auto">
                <div className={`p-3.5 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-100/50 border-slate-200/60'
                }`}>
                  <div className="text-xl font-extrabold text-emerald-500">
                    {userAnswers.filter((a, i) => isUserAnswerCorrect(a, currentQuiz[i])).length}
                  </div>
                  <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mt-1">
                    Benar
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-100/50 border-slate-200/60'
                }`}>
                  <div className="text-xl font-extrabold text-rose-500">
                    {userAnswers.filter((a, i) => a !== null && !isUserAnswerCorrect(a, currentQuiz[i])).length}
                  </div>
                  <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mt-1">
                    Salah
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-100/50 border-slate-200/60'
                }`}>
                  <div className="text-xl font-extrabold text-slate-400 dark:text-slate-500">
                    {userAnswers.filter((a) => a === null).length}
                  </div>
                  <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mt-1">
                    Kosong
                    </div>
                </div>
              </div>

              <div className="flex gap-2 justify-center mt-8">
                <button
                  onClick={() => setScreen('setup')}
                  className={`flex items-center gap-1.5 px-5 py-3 rounded-xl text-xs font-bold border transition-all duration-200 active:scale-105 active:translate-y-0 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-slate-800 hover:bg-slate-800 border-slate-700 text-slate-300'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Home className="w-4 h-4 text-indigo-500" />
                  Kembali ke Menu Utama
                </button>

                <button
                  onClick={() => startQuiz()}
                  className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-xs font-bold bg-indigo-500 text-white shadow-md shadow-indigo-500/10 transition-all duration-200 active:scale-105 active:translate-y-0 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer hover:bg-indigo-600"
                >
                  <RotateCcw className="w-4 h-4 fill-current" />
                  Mulai Ulang Tryout
                </button>
              </div>

            </div>

            {/* Leaderboard Submission Box */}
            {currentUser && selectedDatabases.length === 1 && (
              <div className={`p-6 rounded-2xl transition-all duration-300 border ${
                theme === 'dark'
                  ? 'bg-slate-900/45 border-white/[0.08] shadow-2xl backdrop-blur-md'
                  : 'bg-white/70 border-slate-200/60 shadow-sm backdrop-blur-md'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Award className="w-8 h-8 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-wider">🏆 LEADERBOARD FILE SOAL</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Apakah Anda ingin mempublikasikan skor Anda ({lastQuizScore}%) ke papan peringkat untuk file <strong>{selectedDatabases[0]}</strong>?
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasSubmittedLeaderboard ? (
                      <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Skor Terkirim!
                      </span>
                    ) : (
                      <button
                        onClick={submitScoreToLeaderboard}
                        disabled={isLeaderboardLoading}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white transition-all cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                      >
                        {isLeaderboardLoading ? 'Mengirim...' : 'Kirim Skor'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Battle Report / Analytics dashboard */}
            {analytics.hasMetadata && (
              <div className={`p-6 rounded-2xl transition-all duration-300 border space-y-6 ${
                theme === 'dark'
                  ? 'bg-slate-900/45 border-white/[0.08] shadow-2xl backdrop-blur-md'
                  : 'bg-white/70 border-slate-200/60 shadow-sm backdrop-blur-md'
              }`}>
                <div className="flex items-center gap-2 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-500">
                    BATTLE REPORT & METADATA PERFORMA
                  </h3>
                </div>

                {/* Sub-competencies progress list */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                      ⚔️ Analisis Sub-Kompetensi
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(analytics.competencies).map(([name, data]) => {
                        const pct = Math.round((data.correct / data.total) * 100);
                        const progressColor = pct >= 80 
                          ? 'bg-emerald-500' 
                          : pct >= 65 
                          ? 'bg-indigo-500' 
                          : 'bg-rose-500';

                        return (
                          <div key={name} className="flex items-center gap-4 text-xs font-semibold">
                            <span className="w-32 truncate" title={name}>{name}</span>
                            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full ${progressColor} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-10 text-right font-extrabold">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cognitives list */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                      🧠 Analisis Kemampuan Kognitif
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(analytics.cognitives).map(([name, data]) => {
                        const pct = Math.round((data.correct / data.total) * 100);
                        const progressColor = pct >= 80 
                          ? 'bg-emerald-500' 
                          : pct >= 65 
                          ? 'bg-indigo-500' 
                          : 'bg-rose-500';

                        return (
                          <div key={name} className="flex items-center gap-4 text-xs font-semibold">
                            <span className="w-32 truncate">{name}</span>
                            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full ${progressColor} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-10 text-right font-extrabold">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Difficulties progress list */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                      🛡️ Performa Tingkat Kesulitan
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(analytics.difficulties).map(([name, data]) => {
                        const pct = Math.round((data.correct / data.total) * 100);
                        const progressColor = pct >= 80 
                          ? 'bg-emerald-500' 
                          : pct >= 65 
                          ? 'bg-indigo-500' 
                          : 'bg-rose-500';

                        return (
                          <div key={name} className="flex items-center gap-4 text-xs font-semibold">
                            <span className="w-32 truncate">{name}</span>
                            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full ${progressColor} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-10 text-right font-extrabold">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Quest log: remedial lists */}
                <div className="border-t border-slate-200/40 dark:border-slate-800/40 pt-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-500 mb-3 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    📜 Quest Log: Misi Remedial Khusus
                  </h4>
                  
                  {weaknessesList.length > 0 ? (
                    <div className="space-y-3">
                      {weaknessesList.map((w) => (
                        <div
                          key={w.name}
                          className="flex items-start gap-3 p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.02]"
                        >
                          <div className="w-5 h-5 rounded-full flex items-center justify-center bg-rose-500 text-white font-extrabold text-[10px] mt-0.5 flex-shrink-0">
                            !
                          </div>
                          <div className="space-y-1">
                            <h5 className="font-extrabold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                              Misi Remedial: {w.name}
                            </h5>
                            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                              Akurasi diagnosis Anda pada topik ini hanya <strong>{w.percentage}%</strong> ({w.correct} dari {w.total} benar). Kami merekomendasikan membaca ulang jurnal dan panduan literatur referensi klinis terkait.
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02]">
                      <div className="w-6 h-6 rounded-xl flex items-center justify-center bg-emerald-500 text-white font-extrabold text-xs flex-shrink-0">
                        🏆
                      </div>
                      <div className="space-y-0.5">
                        <h5 className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                          Misi Selesai Tanpa Cela!
                        </h5>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          Tidak ditemukan kelemahan mayor dengan akurasi di bawah 70% pada sesi tryout ini. Pertahankan ketajaman klinis diagnosis Anda!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Accordion Review Section per question */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-500" />
                Daftar Pembahasan & Kunci Jawaban Soal
              </h3>

              <div className="space-y-3">
                {currentQuiz.map((q, idx) => {
                  const userAnswer = userAnswers[idx];
                  const isCorrect = isUserAnswerCorrect(userAnswer, q);
                  const isOpen = !!openReviewIndices[idx];

                  let statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                      Kosong
                    </span>
                  );

                  if (userAnswer !== null) {
                    statusBadge = isCorrect ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Benar
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        Salah
                      </span>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border overflow-hidden transition-all ${
                        theme === 'dark' ? 'bg-slate-900/30 border-slate-850' : 'bg-white border-slate-200/60 shadow-sm'
                      }`}
                    >
                      {/* Accordion Header */}
                      <div
                        onClick={() => toggleReviewAccordion(idx)}
                        className={`flex items-center justify-between gap-4 p-4 cursor-pointer transition-all ${
                          theme === 'dark' ? 'hover:bg-slate-800/15' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="text-xs font-extrabold text-slate-400 flex-shrink-0">
                            Soal {idx + 1}
                          </span>
                          {statusBadge}
                          <p className="text-xs font-semibold truncate text-slate-700 dark:text-slate-300">
                            {q.pertanyaan.replace(/<[^>]*>/g, '').slice(0, 80)}...
                          </p>
                        </div>

                        <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-indigo-500' : ''
                        }`} />
                      </div>

                      {/* Accordion Body */}
                      {isOpen && (
                        <div className="p-5 border-t border-slate-200/50 dark:border-slate-850/60 bg-slate-500/[0.01] space-y-4 animate-slide-down">
                          <div className="text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-100">
                            {renderHtmlText(q.pertanyaan)}
                            {renderQuestionImage(q, setLightboxImage, theme)}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const correctLetter = getCorrectLetterForQuestion(q);
                              const correctOptionText = q.pilihan[['A', 'B', 'C', 'D', 'E'].indexOf(correctLetter)] || q.jawaban_benar;

                              return userAnswer === null ? (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                  — Tidak Dijawab
                                </span>
                              ) : isCorrect ? (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                  ✔ Pilihan Anda: {userAnswer}
                                </span>
                              ) : (
                                <>
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                    ✘ Pilihan Anda: {userAnswer}
                                  </span>
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    ✔ Kunci: {correctLetter}. {correctOptionText}
                                  </span>
                                </>
                              );
                            })()}
                          </div>

                          <div className="pt-3 border-t border-slate-200/40 dark:border-slate-850/50">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-500 mb-1.5">
                              💡 Pembahasan:
                            </h4>
                            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                              {q.pembahasan ? renderHtmlText(q.pembahasan) : 'Tidak ada uraian penjelasan.'}
                            </p>
                          </div>

                          {q.eliminasi_opsi && Object.keys(q.eliminasi_opsi).length > 0 && (
                            <div className="pt-2">
                              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                🔍 Analisis Pilihan Jawaban:
                              </h4>
                              <div className="grid grid-cols-1 gap-1.5">
                                {Object.entries(q.eliminasi_opsi).map(([letter, rationale]) => {
                                  const matchesKey = letter === getCorrectLetterForQuestion(q);
                                  return (
                                    <div
                                      key={letter}
                                      className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${
                                        matchesKey
                                          ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-700 dark:text-slate-300 font-medium'
                                          : 'bg-slate-500/[0.01] border-slate-100 dark:border-slate-850 text-slate-500 dark:text-slate-400'
                                      }`}
                                    >
                                      <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold text-[9px] flex-shrink-0 ${
                                        matchesKey ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                      }`}>
                                        {letter}
                                      </span>
                                      <span>{renderHtmlText(rationale)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Floating XP Gain/Loss Indicator */}
      {floatingXP && (
        <div
          className={`fixed pointer-events-none z-50 font-mono font-extrabold text-sm sm:text-base animate-ping transition-all transform -translate-x-1/2 -translate-y-1/2 ${
            floatingXP.isBenar ? 'text-emerald-500 shadow-emerald-500/20' : 'text-rose-500 shadow-rose-500/20'
          }`}
          style={{ left: floatingXP.x, top: floatingXP.y }}
        >
          {floatingXP.text}
        </div>
      )}

      {/* Dynamic Toast alerts */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full px-4 animate-slide-up">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-full px-5 py-3 shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            <span className="text-base flex-shrink-0">{toastMessage.icon}</span>
            <p className="flex-1 text-slate-100">{toastMessage.text}</p>
          </div>
        </div>
      )}

      {/* Confirmation Modal overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl animate-pop-up ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-base sm:text-lg font-extrabold">
              {modalTitle}
            </h3>
            <p className={`mt-2 text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              {modalDesc}
            </p>

            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-105 active:translate-y-0 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-750 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-150 text-slate-600'
                }`}
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setModalOpen(false);
                  if (modalAction) modalAction();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/10 transition-all duration-200 active:scale-105 active:translate-y-0 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Riwayat Modal overlay */}
      {selectedHistoryDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border shadow-2xl animate-pop-up overflow-hidden ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200/50 dark:border-slate-800/50 flex-shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-2">
                  <span>🏆 Detail Evaluasi Kuis</span>
                  <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2 py-0.5 rounded-full capitalize">
                    {selectedHistoryDetail.mode === 'simulasi' ? 'Simulasi' : 'Sequential'}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  Dikerjakan pada {new Date(selectedHistoryDetail.date).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                </p>
              </div>
              <button
                onClick={() => setSelectedHistoryDetail(null)}
                className={`p-1.5 rounded-lg border transition-all hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                  theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Score & Accuracies Box */}
              <div className={`grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-2xl border ${
                theme === 'dark' ? 'bg-slate-950/30 border-slate-800/80' : 'bg-slate-50 border-slate-200/60'
              }`}>
                {/* Score Circle */}
                <div className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
                  <span className="text-3xl font-black text-indigo-500">{selectedHistoryDetail.score}</span>
                  <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest mt-1">Skor Akhir</span>
                </div>

                <div className="text-center p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <span className="block text-xl font-black text-emerald-500">✔ {selectedHistoryDetail.correct}</span>
                  <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Jawaban Benar</span>
                </div>

                <div className="text-center p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <span className="block text-xl font-black text-rose-500">✘ {selectedHistoryDetail.wrong}</span>
                  <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Jawaban Salah</span>
                </div>

                <div className="text-center p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <span className="block text-xl font-black text-slate-400">∅ {selectedHistoryDetail.empty}</span>
                  <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Tidak Dijawab</span>
                </div>

                <div className="col-span-2 sm:col-span-1 text-center p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <span className="block text-xl font-black text-indigo-500">{selectedHistoryDetail.total}</span>
                  <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Total Soal</span>
                </div>
              </div>

              {/* Roasting Feedback */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                theme === 'dark' ? 'bg-amber-500/5 border-amber-500/10' : 'bg-amber-500/5 border-amber-500/20'
              }`}>
                <span className="text-xl flex-shrink-0">💬</span>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">Evaluasi Akademis:</h4>
                  <p className="text-xs italic font-semibold text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                    "{getFeedbackForScore(selectedHistoryDetail.score)}"
                  </p>
                </div>
              </div>

              {/* Question list section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    Review Soal & Pembahasan Lengkap
                  </h3>

                  {selectedHistoryDetail.questions && selectedHistoryDetail.questions.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const allOpen: Record<number, boolean> = {};
                          selectedHistoryDetail.questions?.forEach((_, i) => {
                            allOpen[i] = true;
                          });
                          setOpenHistoryReviewIndices(allOpen);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                          theme === 'dark' ? 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                        }`}
                      >
                        Buka Semua
                      </button>
                      <button
                        onClick={() => setOpenHistoryReviewIndices({})}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                          theme === 'dark' ? 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                        }`}
                      >
                        Tutup Semua
                      </button>
                    </div>
                  )}
                </div>

                {!selectedHistoryDetail.questions || selectedHistoryDetail.questions.length === 0 ? (
                  <div className="text-center p-8 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/20">
                    <HelpCircle className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Detail Kunci & Pembahasan Tidak Tersedia
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[480px] mx-auto leading-relaxed">
                      Catatan ini berasal dari sesi terdahulu sebelum pembaruan sistem. Riwayat di masa mendatang akan mencatat dan menyimpan soal-soal secara utuh agar bisa Anda pelajari kembali di sini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedHistoryDetail.questions.map((q, idx) => {
                      const userAns = selectedHistoryDetail.userAnswers ? selectedHistoryDetail.userAnswers[idx] : null;
                      const isCorrect = isUserAnswerCorrect(userAns, q);
                      const isOpen = !!openHistoryReviewIndices[idx];

                      let statusBadge = (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                          Tidak Dijawab
                        </span>
                      );

                      if (userAns !== null && userAns !== undefined) {
                        statusBadge = isCorrect ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Benar
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            Salah
                          </span>
                        );
                      }

                      return (
                        <div
                          key={idx}
                          className={`rounded-xl border overflow-hidden transition-all ${
                            theme === 'dark' ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-200/80 shadow-sm'
                          }`}
                        >
                          {/* Accordion Header */}
                          <div
                            onClick={() => {
                              setOpenHistoryReviewIndices((prev) => ({
                                ...prev,
                                [idx]: !prev[idx]
                              }));
                            }}
                            className={`flex items-center justify-between gap-4 p-4 cursor-pointer transition-colors ${
                              theme === 'dark' ? 'hover:bg-slate-800/15' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs font-bold text-slate-400 flex-shrink-0">
                                Soal {idx + 1}
                              </span>
                              {statusBadge}
                              <p className="text-xs font-semibold truncate text-slate-700 dark:text-slate-300">
                                {q.pertanyaan.replace(/<[^>]*>/g, '').slice(0, 80)}...
                              </p>
                            </div>

                            <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                              isOpen ? 'rotate-180 text-indigo-500' : ''
                            }`} />
                          </div>

                          {/* Accordion Body */}
                          {isOpen && (
                            <div className="p-5 border-t border-slate-200/50 dark:border-slate-850/60 bg-slate-500/[0.01] space-y-4 animate-slide-down">
                              <div className="text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-100">
                                {renderHtmlText(q.pertanyaan)}
                                {renderQuestionImage(q, setLightboxImage, theme)}
                              </div>

                              {/* Question options visual list OR Short Answer Review */}
                              {q.pilihan && q.pilihan.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2.5">
                                  {q.pilihan.map((opt, oIdx) => {
                                    const letters = ['A', 'B', 'C', 'D', 'E'];
                                    const isCorrectOption = oIdx === ['A', 'B', 'C', 'D', 'E'].indexOf(getCorrectLetterForQuestion(q));
                                    const isUserSelected = opt === userAns;

                                    let optClass = theme === 'dark' ? 'bg-slate-900/10 border-slate-800/50 text-slate-400' : 'bg-slate-50/50 border-slate-200/60 text-slate-500';
                                    let letterBadgeClass = theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500';

                                    if (isCorrectOption) {
                                      optClass = 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 font-bold';
                                      letterBadgeClass = 'bg-emerald-500 border-emerald-500 text-white';
                                    } else if (isUserSelected && !isCorrect) {
                                      optClass = 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 font-bold';
                                      letterBadgeClass = 'bg-rose-500 border-rose-500 text-white';
                                    }

                                    return (
                                      <div
                                        key={oIdx}
                                        className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${optClass}`}
                                      >
                                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center font-black text-xs flex-shrink-0 ${letterBadgeClass}`}>
                                          {letters[oIdx]}
                                        </div>
                                        <div className="flex-1 mt-0.5 text-xs font-semibold leading-relaxed">
                                          {renderHtmlText(opt)}
                                        </div>
                                        {isCorrectOption && (
                                          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded-full bg-emerald-500/5 flex-shrink-0">
                                            Kunci
                                          </span>
                                        )}
                                        {isUserSelected && (
                                          <span className={`text-[9px] font-black uppercase tracking-wider border px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                            isCorrect ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 'text-rose-500 border-rose-500/20 bg-rose-500/5'
                                          }`}>
                                            Pilihan Anda
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className={`p-3 rounded-xl border flex flex-col gap-1 text-xs ${
                                    isCorrect 
                                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400'
                                  }`}>
                                    <span className="font-extrabold uppercase text-[10px] tracking-wider opacity-80">Jawaban Anda:</span>
                                    <span className="font-semibold">{userAns || <span className="italic">Tidak menjawab</span>}</span>
                                  </div>
                                  <div className="p-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.02] flex flex-col gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                    <span className="font-extrabold uppercase text-[10px] tracking-wider opacity-80">Jawaban Benar:</span>
                                    <span className="font-bold">{q.jawaban_benar}</span>
                                  </div>
                                </div>
                              )}

                              {/* Explanation block */}
                              <div className="pt-3 border-t border-slate-200/40 dark:border-slate-850/50">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-500 mb-1.5 flex items-center gap-1">
                                  <span>💡 Pembahasan Lengkap:</span>
                                </h4>
                                <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                  {q.pembahasan ? renderHtmlText(q.pembahasan) : 'Tidak ada penjelasan khusus.'}
                                </p>
                              </div>

                              {/* Question metadata (competencies, etc) */}
                              {q.metadata && (
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                                  {q.metadata.sub_kompetensi_klinis && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                      Topic: {q.metadata.sub_kompetensi_klinis}
                                    </span>
                                  )}
                                  {q.metadata.tingkat_kognitif && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                      Kognitif: {q.metadata.tingkat_kognitif}
                                    </span>
                                  )}
                                  {q.metadata.tingkat_kesulitan && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                      Kesulitan: {q.metadata.tingkat_kesulitan}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-end flex-shrink-0 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={() => setSelectedHistoryDetail(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/10 hover:scale-[1.02] active:scale-95 cursor-pointer transition-all"
              >
                Tutup Evaluasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS PWA Installation Guide Modal */}
      {showIosInstallModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl relative animate-scale-up ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => setShowIosInstallModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-500/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-505 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-indigo-500" />
              </div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-indigo-505">
                Instal di iOS (Safari PWA)
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              Akses AuraMed PRO secara instan langsung dari Home Screen perangkat iOS Anda. Ikuti petunjuk sederhana ini menggunakan browser **Safari**:
            </p>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-550 dark:text-slate-350 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed">
                  Buka situs ini di browser **Safari** pada iPhone/iPad Anda.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-550 dark:text-slate-350 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <p className="text-xs text-slate-655 dark:text-slate-300 leading-relaxed flex items-center flex-wrap gap-1">
                  Ketuk tombol **Bagikan (Share)**
                  <span className="inline-flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded text-slate-550 dark:text-slate-300 mx-1">
                    <Share2 className="w-3 h-3 text-indigo-500" />
                  </span>
                  pada bar menu Safari.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-550 dark:text-slate-350 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </div>
                <p className="text-xs text-slate-655 dark:text-slate-300 leading-relaxed">
                  Gulir menu ke bawah lalu ketuk opsi **"Tambah ke Layar Utama" (Add to Home Screen)**.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-550 dark:text-slate-350 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  4
                </div>
                <p className="text-xs text-slate-655 dark:text-slate-300 leading-relaxed">
                  Ketuk **"Tambah" (Add)** di pojok kanan atas untuk menyelesaikan instalasi.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIosInstallModal(false)}
              className="w-full mt-6 py-3 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/15 transition-all cursor-pointer text-center"
            >
              Mengerti & Tutup
            </button>
          </div>
        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md transition-opacity duration-300"
          onClick={() => setLightboxImage(null)}
        >
          {/* Close button top-right */}
          <button 
            className="absolute top-4 right-4 p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition-colors cursor-pointer"
            onClick={() => setLightboxImage(null)}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image container */}
          <div 
            className="relative max-w-4xl max-h-[85vh] flex flex-col justify-center items-center bg-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={lightboxImage} 
              alt="Detail Gambar" 
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-slate-800/80 bg-slate-900/40 p-2"
            />
            <p className="mt-4 text-xs font-semibold text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
              Klik di luar gambar atau tombol close untuk kembali
            </p>
          </div>
        </div>
      )}

      {/* Paste JSON Modal */}
      {pasteModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-2xl rounded-2xl shadow-2xl p-6 ${theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-500" />
              Tempel Kode JSON / YAML
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nama File Kuis <span className="text-rose-500">*</span></label>
                <input 
                  type="text"
                  value={pasteFileName}
                  onChange={(e) => setPasteFileName(e.target.value)}
                  placeholder="Misal: bank_soal_kardiologi"
                  className={`w-full p-3 text-sm rounded-xl outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-950/50 border border-slate-800 text-slate-200 focus:bg-slate-900'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Kode Soal Mentah <span className="text-rose-500">*</span></label>
                <textarea 
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder="[\n  {\n    &#34;pertanyaan&#34;: &#34;...&#34;,\n    &#34;pilihan&#34;: [...],\n    &#34;jawaban_benar&#34;: &#34;...&#34;\n  }\n]"
                  rows={10}
                  className={`w-full p-3 text-xs font-mono rounded-xl outline-none focus:ring-2 focus:ring-amber-500/50 transition-all custom-scrollbar ${
                    theme === 'dark'
                      ? 'bg-slate-950/50 border border-slate-800 text-slate-300 focus:bg-slate-900'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white'
                  }`}
                />
              </div>

              {pasteError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2 text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p className="text-[11px] font-medium">{pasteError}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setPasteModalOpen(false)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Batal
              </button>
              <button
                onClick={handlePasteSubmit}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-colors"
              >
                Simpan Kuis
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    )}
    </div>
  );
}
