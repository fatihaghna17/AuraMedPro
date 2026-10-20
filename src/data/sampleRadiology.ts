import { RadiologyPacket } from '../types/radiology';

export const DEFAULT_SAMPLE_RADIOLOGY_PACKET: RadiologyPacket = {
  id: 'packet-rad-sample-1',
  group_id: 'default',
  title: 'Latihan CBT Radiologi: Kasus Kegawatdaruratan Thorax & Abdomen',
  description: 'Paket simulasi pembacaan foto polos radiologi (Thorax & Abdomen) dengan rubrik checklist standar Skills Lab FK UNS dan koreksi manual oleh admin.',
  admin_id: 'admin',
  admin_name: 'Admin Radiologi',
  created_at: new Date().toISOString(),
  questions: [
    {
      id: 'rad-q-1',
      nomor: 1,
      region: 'thorax',
      metadata: {
        blok: 'Respirologi & Kegawatdaruratan',
        kasus: 'Tension Pneumothorax Dextra',
        tingkat_kesulitan: 'Sedang',
        xp: 35
      },
      identitas_pasien: {
        nama: 'Tn. Budi Santoso',
        tanggal_lahir: '15 Agustus 1994 (32 tahun)',
        jenis_kelamin: 'Laki-laki',
        no_rm: 'RM-2026-0814'
      },
      vignette: 'Seorang laki-laki berusia 32 tahun dibawa ke IGD RS setelah mengalami kecelakaan lalu lintas 1 jam SMRS (terbentur stang motor pada dada kanan). Pasien mengeluh sesak napas berat yang memberat cepat dan nyeri dada kanan tajam. Pada pemeriksaan fisik: Tampak gelisah, sianosis, TD 85/55 mmHg, HR 125 x/m (takikardia), RR 34 x/m, SpO2 88% dengan masker NRM. Deviasi trakea tampak terdorong ke arah kiri. Dada kanan tertinggal pada pernapasan, perkusi hemitoraks kanan hipersonor, suara napas vesikuler paru kanan menghilang. Dilakukan pemeriksaan foto rontgen toraks cito di tempat tidur pasien.',
      image_url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
      pertanyaan: 'Lakukan pembacaan dan interpretasi sistematis foto radiologi di atas! Tuliskan: 1) Data demografi pasien, 2) Kualitas dan detail keadekuatan foto, 3) Uraian interpretasi anatomi sistematis (Cor, Pulmo, Trakhea, Sinus, Diafragma, Tulang), 4) Abnormalitas yang didapat, serta 5) Kesimpulan dan diagnosis kerja klinis.',
      kunci_interpretasi: {
        data_demografi: 'Nama: Tn. Budi Santoso, Tanggal Lahir: 15 Agustus 1994 (32 th), Jenis Kelamin: Laki-laki, No RM: RM-2026-0814.',
        kualitas_foto: 'Foto rontgen thorax AP (supine/semi-erect cito di IGD), marker R terbaca. Area foto mencakup apeks hingga sinus kostofrenikus tanpa terpotong. Simetrisitas cukup, inspirasi agak dangkal (pasien sesak), eksposure adekuat.',
        interpretasi: 'Trakhea: Tampak deviasi trakea nyata terdorong ke sisi kiri (kontralateral). Cor & Mediastinum: Jantung dan struktur mediastinum tergeser/terdorong ke hemitoraks kiri (pendesakan mediastinum). Pulmo: Tampak area hiperlusen avaskular yang sangat luas pada hemitoraks dekstra disertai garis kolaps paru (pleural white line). Corakan bronkovaskular paru kanan kolaps total ke arah hilus medial. Paru kiri tertekan sekunder. Sinus & Diafragma: Hemidiafragma dekstra tampak mendatar dan tertekan ke inferior; sinus kostofrenikus kanan tervisualisasi. Tulang & Jaringan lunak: Tampak fraktur kosta 4 dan 5 lateral dekstra. Tidak tampak emfisema subkutan masif. Tidak ada medical device terpasang.',
        abnormalitas: 'Hiperlusen avaskular masif hemitoraks dekstra dengan pleural white line, kolaps total paru kanan, deviasi trakea dan mediastinum ke kontralateral (kiri), hemidiafragma kanan mendatar/tertekan, fraktur kosta 4-5 lateral dekstra.',
        kesimpulan: 'Kesan Radiologi: Tension Pneumothorax Dextra et causa trauma tumpul toraks disertai fraktur kosta 4-5 dekstra. (Kegawatdaruratan: Indikasi cito dekompresi jarum / Needle Thoracocentesis dilanjutkan pemasangan Chest Tube/WSD).'
      }
    },
    {
      id: 'rad-q-2',
      nomor: 2,
      region: 'abdomen',
      metadata: {
        blok: 'Gastroenterologi & Digestif',
        kasus: 'Ileus Obstruktif Letak Tinggi (Mechanical Small Bowel Obstruction)',
        tingkat_kesulitan: 'Sedang',
        xp: 35
      },
      identitas_pasien: {
        nama: 'Ny. Siti Rahmawati',
        tanggal_lahir: '04 Mei 1978 (48 tahun)',
        jenis_kelamin: 'Perempuan',
        no_rm: 'RM-2026-1102'
      },
      vignette: 'Seorang wanita berusia 48 tahun datang ke IGD dengan keluhan nyeri perut hilang timbul (kolik) sejak 2 hari terakhir, disertai muntah kehijauan berulang dan perut dirasakan semakin kembung. Pasien belum BAB dan flatus sejak 36 jam lalu. Pasien memiliki riwayat operasi apendisektomi perforasi 5 tahun yang lalu. Pada pemeriksaan fisik: TD 110/70 mmHg, HR 98 x/m, RR 22 x/m, afebris. Abdomen distensi, tampak darm contour dan darm steifung (+), bising usus meningkat disertai metallic sound (borborygmi). Colok dubur: ampula rekti kolaps. Dilakukan pemeriksaan Foto Polos Abdomen 3 posisi (Supine, Erect, LLD).',
      image_url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80',
      pertanyaan: 'Lakukan interpretasi sistematis foto polos abdomen di atas! Tuliskan secara berurutan: 1) Data demografi pasien, 2) Kualitas foto dan proyeksi, 3) Interpretasi sistematik (Fat line, Psoas line, distribusi gas, tanda udara bebas/pneumoperitoneum, air-fluid level, bayangan radiopak, tulang), 4) Abnormalitas yang ditemukan, serta 5) Kesimpulan dan diagnosis kerja.',
      kunci_interpretasi: {
        data_demografi: 'Nama: Ny. Siti Rahmawati, Tanggal Lahir: 04 Mei 1978 (48 th), Jenis Kelamin: Perempuan, No RM: RM-2026-1102.',
        kualitas_foto: 'Foto Polos Abdomen (BNO) posisi Supine dan Erect. Cakupan foto adekuat mencakup kubah diafragma di kranial hingga simfisis pubis di kaudal. Eksposure dan kontras foto baik.',
        interpretasi: 'Preperitoneal fat line: Tampak tegas dan intak bilateral. Psoas line & Kontur Ginjal: Garis psoas kanan dan kiri simetris, kontur ginjal bilateral samar dalam batas normal tertutup gas usus. Distribusi Gas Usus: Tampak dilatasi berlebihan pada loop usus halus (jejunum/ileum) di kuadran sentral abdomen dengan gambaran valvulae conniventes (herring bone appearance). Gas di colon dan rektum tampak minimal hingga menghilang (kolaps). Air-Fluid Level: Pada posisi erect/LLD tampak gambaran multiple air-fluid levels bertingkat membentuk step-ladder pattern berjarak pendek. Udara Bebas (Free Air): Tidak tampak bayangan udara bebas subdiafragma (pneumoperitoneum (-) / sickle sign (-)). Bayangan Radiopak: Tidak tampak bayangan konkremen atau kalsifikasi patologis di proyeksi traktus urinarius maupun traktus biliaris. Skelet: Tulang vertebra lumbosakral dan pelvis intak.',
        abnormalitas: 'Dilatasi multipel loop usus halus sentral dengan herring bone appearance, multiple air-fluid level pendek bertingkat (step-ladder appearance), kolaps gas kolon/rektum, tanpa tanda pneumoperitoneum.',
        kesimpulan: 'Kesan Radiologis: Ileus Obstruktif Letak Tinggi (Small Bowel Obstruction / SBO) kemungkinan besar et causa adhesi pasca operasi apendisektomi. Tidak tampak tanda perforasi organ berongga saat ini.'
      }
    }
  ]
};
