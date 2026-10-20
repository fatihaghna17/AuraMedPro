export interface RadiologyChecklistItem {
  id: string;
  label: string;
  weight: number;
}

export interface RadiologyChecklistCategory {
  category: string;
  items: RadiologyChecklistItem[];
}

export interface RadiologyQuestion {
  id: string;
  nomor: number;
  region: 'thorax' | 'abdomen';
  metadata?: {
    blok?: string;
    kasus?: string;
    tingkat_kesulitan?: string;
    xp?: number;
  };
  identitas_pasien?: {
    nama: string;
    tanggal_lahir: string;
    jenis_kelamin: string;
    no_rm: string;
  };
  vignette: string;
  image_url: string;
  pertanyaan: string;
  kunci_interpretasi: {
    data_demografi?: string;
    kualitas_foto?: string;
    interpretasi?: string;
    abnormalitas?: string;
    kesimpulan?: string;
  };
}

export interface RadiologyPacket {
  id: string;
  group_id: string;
  title: string;
  description: string;
  admin_id: string; // 1 admin penanggung jawab koreksi
  admin_name: string;
  created_at: string;
  questions: RadiologyQuestion[];
}

export interface RadiologySubmission {
  id: string;
  packet_id: string;
  group_id: string;
  user_id: string;
  username: string;
  answers: Record<string, string>; // questionId -> essay text
  checklist: {
    thorax: Record<string, boolean>;
    abdomen: Record<string, boolean>;
  };
  score: number;
  feedback: string;
  status: 'pending' | 'graded';
  graded_by?: string;
  graded_at?: string;
  created_at: string;
}

export const THORAX_CHECKLIST_ITEMS: RadiologyChecklistCategory[] = [
  {
    category: 'Data demografi pasien',
    items: [
      { id: 'thx_demo_nama', label: 'Nama', weight: 2.5 },
      { id: 'thx_demo_ttl', label: 'Tanggal lahir', weight: 2.5 },
      { id: 'thx_demo_jk', label: 'Jenis Kelamin', weight: 2.5 },
      { id: 'thx_demo_norm', label: 'No RM', weight: 2.5 },
    ]
  },
  {
    category: 'Penilaian gambar/Detail foto',
    items: [
      { id: 'thx_det_tgl', label: 'Tanggal', weight: 2 },
      { id: 'thx_det_posisi', label: 'Posisi', weight: 3 },
      { id: 'thx_det_proyeksi', label: 'Proyeksi (PA/AP)', weight: 3 },
      { id: 'thx_det_area', label: 'Keadekuatan: Area (terpotong/tidak)', weight: 3 },
      { id: 'thx_det_inspirasi', label: 'Keadekuatan: Inspirasi (kosta posterior 9-10)', weight: 3 },
      { id: 'thx_det_simetris', label: 'Keadekuatan: Simetrisitas (jarak clavicula)', weight: 3 },
      { id: 'thx_det_eksposure', label: 'Keadekuatan: Eksposure (vertebra Th IV-V)', weight: 3 },
    ]
  },
  {
    category: 'Interpretasi foto',
    items: [
      { id: 'thx_inter_cor', label: 'Jantung dan mediastinum (pengukuran CTR)', weight: 10 },
      { id: 'thx_inter_pulmo', label: 'Paru (corakan bronkovaskular, infiltrat/avaskular)', weight: 12 },
      { id: 'thx_inter_sinus', label: 'Sinus kostofrenikus & kardiofrenikus', weight: 6 },
      { id: 'thx_inter_diafragma', label: 'Hemidiafragma (kontur & kubah)', weight: 6 },
      { id: 'thx_inter_trakhea', label: 'Trakhea (posisi lurus / deviasi)', weight: 6 },
      { id: 'thx_inter_tulang', label: 'Tulang & dinding dada (kosta, klavikula, fraktur)', weight: 6 },
      { id: 'thx_inter_devices', label: 'Identifikasi medical devices (ETT, CVC, chest tube)', weight: 4 },
    ]
  },
  {
    category: 'Abnormalitas & Kesimpulan',
    items: [
      { id: 'thx_abnormalitas', label: 'Abnormalitas yang didapat (sintesis temuan utama)', weight: 13 },
      { id: 'thx_kesimpulan', label: 'Kesimpulan / Kesan radiologis & Diagnosis banding', weight: 13 },
    ]
  }
];

export const ABDOMEN_CHECKLIST_ITEMS: RadiologyChecklistCategory[] = [
  {
    category: 'Data demografi pasien',
    items: [
      { id: 'abd_demo_nama', label: 'Nama', weight: 2.5 },
      { id: 'abd_demo_ttl', label: 'Tanggal lahir', weight: 2.5 },
      { id: 'abd_demo_jk', label: 'Jenis Kelamin', weight: 2.5 },
      { id: 'abd_demo_norm', label: 'No RM', weight: 2.5 },
    ]
  },
  {
    category: 'Penilaian gambar/Detail foto',
    items: [
      { id: 'abd_det_tgl', label: 'Tanggal', weight: 2 },
      { id: 'abd_det_posisi', label: 'Posisi (Supine / Erect / LLD)', weight: 4 },
      { id: 'abd_det_proyeksi', label: 'Proyeksi (AP)', weight: 3 },
      { id: 'abd_det_area', label: 'Keadekuatan: Area (diafragma s.d. simfisis)', weight: 4 },
      { id: 'abd_det_eksposure', label: 'Keadekuatan: Eksposure', weight: 3 },
      { id: 'abd_det_simetris', label: 'Keadekuatan: Simetrisitas', weight: 2 },
    ]
  },
  {
    category: 'Interpretasi foto',
    items: [
      { id: 'abd_inter_fatline', label: 'Preperitoneal fat line', weight: 6 },
      { id: 'abd_inter_psoas', label: 'Psoas line & kontur ginjal', weight: 8 },
      { id: 'abd_inter_gas', label: 'Distribusi udara usus & fecal material', weight: 10 },
      { id: 'abd_inter_freeair', label: 'Udara bebas intraperitoneal (pneumoperitoneum/subdiafragma)', weight: 12 },
      { id: 'abd_inter_airfluid', label: 'Distensi lumen usus / Air-fluid level (step ladder / inverted U)', weight: 10 },
      { id: 'abd_inter_kalsifikasi', label: 'Kalsifikasi / bayangan radiopak abnormal (batu urinarius/empedu)', weight: 6 },
      { id: 'abd_inter_tulang', label: 'Skelet / tulang (vertebra lumbalis, pelvis, sakrum)', weight: 5 },
    ]
  },
  {
    category: 'Abnormalitas & Kesimpulan',
    items: [
      { id: 'abd_abnormalitas', label: 'Abnormalitas yang didapat (sintesis temuan utama)', weight: 12 },
      { id: 'abd_kesimpulan', label: 'Kesimpulan / Kesan radiologis & Diagnosis', weight: 13 },
    ]
  }
];
