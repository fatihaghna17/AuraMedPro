import { Question } from '../types';

// === SAMPLE QUESTION BANKS ===
export const SAMPLE_BANKS: Record<string, Question[]> = {
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
