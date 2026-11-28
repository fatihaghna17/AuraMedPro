import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  CloudUpload,
  Download,
  FileJson,
  FileUp,
  ImagePlus,
  Link2,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { RadiologyPacket, RadiologyQuestion } from '../../types/radiology';
import { DEFAULT_SAMPLE_RADIOLOGY_PACKET } from '../../data/sampleRadiology';
import {
  getQuestionImages,
  getUserDisplayName,
  parseRadiologyPacketJson,
  radiologyApi,
  uploadRadiologyImageToCloud,
} from '../../services/radiologyApi';

interface RadiologyPacketModalProps {
  isOpen: boolean;
  groupId: string;
  currentUser: any;
  profileUsername?: string;
  groupCreatorId: string;
  groupMembers: any[];
  editingPacket?: RadiologyPacket | null;
  theme?: 'light' | 'dark';
  onClose: () => void;
  onSaved: (packet: RadiologyPacket, synced: boolean, syncError?: string) => void;
  onToast?: (msg: string, icon?: string) => void;
}

function createEmptyQuestion(nomor: number): RadiologyQuestion {
  return {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    nomor,
    region: 'thorax',
    metadata: {
      blok: '',
      kasus: '',
      tingkat_kesulitan: 'Sedang',
    },
    identitas_pasien: {
      nama: '',
      tanggal_lahir: '',
      jenis_kelamin: '',
      no_rm: '',
    },
    vignette: '',
    image_url: '',
    image_urls: [],
    pertanyaan:
      'Lakukan pembacaan dan interpretasi sistematis foto radiologi di atas (data demografi, kualitas foto, interpretasi anatomi sistematis, abnormalitas, serta kesimpulan dan diagnosis banding)!',
    kunci_interpretasi: {
      data_demografi: '',
      kualitas_foto: '',
      interpretasi: '',
      abnormalitas: '',
      kesimpulan: '',
    },
  };
}

export const RadiologyPacketModal: React.FC<RadiologyPacketModalProps> = ({
  isOpen,
  groupId,
  currentUser,
  profileUsername,
  groupCreatorId,
  groupMembers,
  editingPacket,
  theme = 'light',
  onClose,
  onSaved,
  onToast,
}) => {
  const isDark = theme === 'dark';
  const isEditMode = Boolean(editingPacket);

  const [mode, setMode] = useState<'json' | 'manual'>(isEditMode ? 'manual' : 'json');
  const [packetId, setPacketId] = useState<string>('');
  const [adminId, setAdminId] = useState<string>(currentUser?.id || groupCreatorId || '');

  // JSON tab state
  const [rawJson, setRawJson] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileTitle, setFileTitle] = useState<string | undefined>(undefined);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Manual / Edit tab state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<RadiologyQuestion[]>([createEmptyQuestion(1)]);
  const [expandedKeyIdx, setExpandedKeyIdx] = useState<Record<number, boolean>>({});
  const [urlDrafts, setUrlDrafts] = useState<Record<string, string>>({});
  const [uploadingImageForQ, setUploadingImageForQ] = useState<string | null>(null);

  // Submission state
  const [saving, setSaving] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Inisialisasi state saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;
    setSubmitError(null);
    setProgressText(null);
    setSaving(false);

    if (editingPacket) {
      setMode('manual');
      setPacketId(editingPacket.id);
      setAdminId(editingPacket.admin_id || currentUser?.id || groupCreatorId || '');
      setTitle(editingPacket.title || '');
      setDescription(editingPacket.description || '');
      setQuestions(
        editingPacket.questions?.length
          ? editingPacket.questions.map((q, idx) => ({
              ...q,
              nomor: q.nomor || idx + 1,
              image_urls: getQuestionImages(q),
              image_url: getQuestionImages(q)[0] || '',
              identitas_pasien: q.identitas_pasien || { nama: '', tanggal_lahir: '', jenis_kelamin: '', no_rm: '' },
              metadata: q.metadata || { blok: '', kasus: '', tingkat_kesulitan: 'Sedang' },
              kunci_interpretasi: q.kunci_interpretasi || {},
            }))
          : [createEmptyQuestion(1)]
      );
      setRawJson('');
      setFileName(null);
      setFileTitle(undefined);
    } else {
      const newId = `rad-packet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setMode('json');
      setPacketId(newId);
      setAdminId(currentUser?.id || groupCreatorId || groupMembers[0]?.user_id || '');
      setTitle('');
      setDescription('');
      setQuestions([createEmptyQuestion(1)]);
      setRawJson('');
      setFileName(null);
      setFileTitle(undefined);
    }
    setExpandedKeyIdx({});
    setUrlDrafts({});
  }, [isOpen, editingPacket, currentUser?.id, groupCreatorId]);

  // Sinkronkan default adminId jika daftar anggota baru selesai dimuat
  useEffect(() => {
    if (!isOpen || adminId) return;
    const fallback = currentUser?.id || groupCreatorId || groupMembers[0]?.user_id || '';
    if (fallback) setAdminId(fallback);
  }, [isOpen, adminId, currentUser?.id, groupCreatorId, groupMembers]);

  const jsonPreview = useMemo(() => {
    if (!rawJson.trim()) return { status: 'empty' as const };
    try {
      const parsed = parseRadiologyPacketJson(rawJson, fileTitle);
      return { status: 'valid' as const, parsed };
    } catch (err: any) {
      return { status: 'error' as const, message: err?.message || 'Format JSON belum valid.' };
    }
  }, [rawJson, fileTitle]);

  if (!isOpen || typeof document === 'undefined') return null;

  const resolveAdminName = (targetId: string): string => {
    const member = groupMembers.find((m) => m.user_id === targetId);
    if (member?.username) return member.username;
    if (targetId === currentUser?.id) {
      return getUserDisplayName(currentUser, profileUsername, 'Admin Korektor');
    }
    return 'Admin Korektor';
  };

  const handleJsonFileSelect = (file?: File | null) => {
    if (!file) return;
    setSubmitError(null);
    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      setSubmitError('Pilih berkas berformat .json.');
      return;
    }
    setFileName(file.name);
    const cleanedTitle = file.name.replace(/\.json$/i, '').replace(/[_-]+/g, ' ').trim();
    setFileTitle(cleanedTitle || undefined);

    const reader = new FileReader();
    reader.onload = () => setRawJson(String(reader.result || ''));
    reader.onerror = () => setSubmitError('Gagal membaca file JSON. Pastikan file tidak rusak.');
    reader.readAsText(file);
  };

  const handleCopyAiPrompt = async () => {
    try {
      const res = await fetch('/panduan_soal_radiologi.txt');
      if (!res.ok) throw new Error('Panduan tidak ditemukan');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(true);
      onToast?.('Prompt AI Radiologi disalin! Tempel di ChatGPT atau Gemini.', '✨');
      setTimeout(() => setCopiedPrompt(false), 2200);
    } catch {
      onToast?.('Gagal menyalin otomatis. Buka /panduan_soal_radiologi.txt.', '⚠️');
    }
  };

  const handleDownloadTemplate = () => {
    const templateObj = {
      tipe_paket: 'radiologi_essay',
      judul: DEFAULT_SAMPLE_RADIOLOGY_PACKET.title,
      deskripsi: DEFAULT_SAMPLE_RADIOLOGY_PACKET.description,
      daftar_soal: DEFAULT_SAMPLE_RADIOLOGY_PACKET.questions,
    };
    const blob = new Blob([JSON.stringify(templateObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_soal_radiologi.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMoveJsonToManualEditor = () => {
    if (jsonPreview.status !== 'valid') return;
    setTitle(jsonPreview.parsed.title);
    setDescription(jsonPreview.parsed.description);
    setQuestions(
      jsonPreview.parsed.questions.map((q, idx) => ({
        ...q,
        nomor: idx + 1,
        image_urls: getQuestionImages(q),
        image_url: getQuestionImages(q)[0] || '',
        identitas_pasien: q.identitas_pasien || { nama: '', tanggal_lahir: '', jenis_kelamin: '', no_rm: '' },
        metadata: q.metadata || { blok: '', kasus: '', tingkat_kesulitan: 'Sedang' },
        kunci_interpretasi: q.kunci_interpretasi || {},
      }))
    );
    setMode('manual');
    setSubmitError(null);
  };

  const updateQuestion = (idx: number, patch: Partial<RadiologyQuestion>) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const handleUploadXrayFiles = async (qIdx: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const targetQ = questions[qIdx];
    if (!targetQ) return;

    setSubmitError(null);
    setUploadingImageForQ(targetQ.id);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (!f.type.startsWith('image/')) continue;
        const url = await uploadRadiologyImageToCloud(f, groupId, packetId);
        uploadedUrls.push(url);
      }

      if (uploadedUrls.length > 0) {
        const existing = getQuestionImages(targetQ);
        const merged = Array.from(new Set([...existing, ...uploadedUrls]));
        updateQuestion(qIdx, {
          image_url: merged[0] || '',
          image_urls: merged,
        });
        onToast?.(`${uploadedUrls.length} foto rontgen berhasil diunggah ke cloud.`, '🩻');
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Gagal mengunggah foto rontgen ke cloud.');
    } finally {
      setUploadingImageForQ(null);
    }
  };

  const handleAddImageUrl = (qIdx: number) => {
    const targetQ = questions[qIdx];
    if (!targetQ) return;
    const draft = (urlDrafts[targetQ.id] || '').trim();
    if (!draft) return;

    const existing = getQuestionImages(targetQ);
    const merged = Array.from(new Set([...existing, draft]));
    updateQuestion(qIdx, {
      image_url: merged[0] || '',
      image_urls: merged,
    });
    setUrlDrafts((prev) => ({ ...prev, [targetQ.id]: '' }));
  };

  const handleRemoveImage = (qIdx: number, imgUrl: string) => {
    const targetQ = questions[qIdx];
    if (!targetQ) return;
    const next = getQuestionImages(targetQ).filter((u) => u !== imgUrl);
    updateQuestion(qIdx, {
      image_url: next[0] || '',
      image_urls: next,
    });
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    let finalTitle = '';
    let finalDescription = '';
    let finalQuestions: RadiologyQuestion[] = [];

    if (mode === 'json') {
      if (jsonPreview.status !== 'valid') {
        setSubmitError(
          jsonPreview.status === 'error'
            ? jsonPreview.message
            : 'Pilih file .json atau tempel kode JSON soal radiologi terlebih dahulu.'
        );
        return;
      }
      finalTitle = jsonPreview.parsed.title;
      finalDescription = jsonPreview.parsed.description;
      finalQuestions = jsonPreview.parsed.questions;
    } else {
      finalTitle = title.trim();
      finalDescription = description.trim() || 'Latihan interpretasi foto rontgen dengan rubrik checklist standar.';
      if (!finalTitle) {
        setSubmitError('Judul paket soal wajib diisi.');
        return;
      }
      const cleanedQuestions = questions
        .map((q, idx) => {
          const imgs = getQuestionImages(q);
          return {
            ...q,
            nomor: idx + 1,
            vignette: q.vignette.trim(),
            pertanyaan: q.pertanyaan.trim() || 'Lakukan pembacaan sistematis foto radiologi di atas!',
            image_url: imgs[0] || '',
            image_urls: imgs.length > 0 ? imgs : undefined,
          };
        })
        .filter((q) => q.vignette.length > 0 || (q.image_urls && q.image_urls.length > 0));

      if (cleanedQuestions.length === 0) {
        setSubmitError('Minimal 1 soal wajib memiliki skenario klinis atau foto rontgen.');
        return;
      }
      finalQuestions = cleanedQuestions;
    }

    const effectiveAdminId = adminId || currentUser?.id || groupCreatorId || 'admin';
    const packetPayload: RadiologyPacket = {
      id: packetId || `rad-packet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      group_id: groupId,
      title: finalTitle,
      description: finalDescription,
      admin_id: effectiveAdminId,
      admin_name: resolveAdminName(effectiveAdminId),
      created_at: editingPacket?.created_at || new Date().toISOString(),
      questions: finalQuestions,
    };

    setSaving(true);
    setProgressText('Menyiapkan paket soal untuk diunggah ke cloud...');

    try {
      const result = await radiologyApi.savePacket(packetPayload, {
        onProgress: (msg) => setProgressText(msg),
      });

      if (!result.synced) {
        setSubmitError(
          `Gagal sinkron ke server cloud: ${result.error || 'Koneksi terputus'}. Paket disimpan sementara secara lokal di perangkat ini — klik "Sinkronkan ke Cloud" saat koneksi siap.`
        );
        onSaved(result.packet, false, result.error);
        setSaving(false);
        setProgressText(null);
        return;
      }

      onSaved(result.packet, true);
      onClose();
    } catch (err: any) {
      setSubmitError(err?.message || 'Terjadi kesalahan saat menyimpan paket soal.');
    } finally {
      setSaving(false);
      setProgressText(null);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={() => !saving && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rad-packet-modal-title"
        onClick={(e) => e.stopPropagation()}
        className={`w-full sm:max-w-3xl max-h-[93dvh] flex flex-col rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden border liquid-glass-card ${
          isDark ? 'bg-slate-900/95 border-slate-700/80 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-900'
        }`}
      >
        {/* HEADER */}
        <div
          className={`px-4 sm:px-6 py-4 flex items-center justify-between gap-3 border-b shrink-0 ${
            isDark ? 'bg-slate-800/70 border-slate-700/80' : 'bg-slate-50/80 border-slate-200/80'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/15 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 id="rad-packet-modal-title" className="font-black text-base sm:text-lg truncate">
                {isEditMode ? 'Edit Paket Soal Radiologi' : 'Upload & Buat Paket Soal Radiologi'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Tersimpan otomatis di cloud (D1 & R2) — langsung muncul di semua perangkat anggota grup.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            aria-label="Tutup modal"
            className={`p-2 rounded-xl transition shrink-0 cursor-pointer disabled:opacity-40 ${
              isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200/80 text-slate-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* MODE SWITCHER (khusus pembuatan paket baru) */}
          {!isEditMode && (
            <div
              className={`p-1 rounded-2xl grid grid-cols-2 gap-1 border ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setMode('json');
                  setSubmitError(null);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  mode === 'json'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileJson className="w-4 h-4 shrink-0" />
                <span>Upload File / Paste JSON</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('manual');
                  setSubmitError(null);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  mode === 'manual'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ImagePlus className="w-4 h-4 shrink-0" />
                <span>Editor Manual & Upload Foto</span>
              </button>
            </div>
          )}

          {/* PILIH ADMIN KOREKTOR */}
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">
              Admin Korektor Paket Soal
            </label>
            <select
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              disabled={saving}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40 liquid-glass-input ${
                isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              {groupMembers.length > 0 ? (
                groupMembers.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.username || 'Anggota'} {m.user_id === currentUser?.id ? '(Anda)' : ''}
                  </option>
                ))
              ) : (
                <option value={currentUser?.id || 'admin'}>
                  {getUserDisplayName(currentUser, profileUsername, 'Admin')} (Anda)
                </option>
              )}
            </select>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Korektor yang dipilih (dan pembuat grup) dapat menilai jawaban essay serta membuka pembahasan bagi peserta.
            </p>
          </div>

          {/* ================================================================ */}
          {/* TAB 1: UPLOAD FILE .JSON / PASTE JSON                           */}
          {/* ================================================================ */}
          {mode === 'json' && (
            <div className="space-y-4">
              {/* DROPZONE FILE .JSON */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleJsonFileSelect(e.dataTransfer.files?.[0]);
                }}
                onClick={() => jsonFileInputRef.current?.click()}
                className={`p-5 sm:p-6 rounded-2xl border-2 border-dashed text-center transition cursor-pointer ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : isDark
                    ? 'border-slate-700 bg-slate-800/40 hover:border-indigo-500/60 hover:bg-slate-800/70'
                    : 'border-slate-300 bg-slate-50/80 hover:border-indigo-400 hover:bg-indigo-50/40'
                }`}
              >
                <FileUp className="w-7 h-7 mx-auto text-indigo-500 mb-2" />
                <p className="text-xs sm:text-sm font-bold">
                  {fileName ? `File dipilih: ${fileName}` : 'Pilih atau seret file soal (.json) ke sini'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Mendukung gambar URL maupun gambar base64 (otomatis dikompres & diunggah ke Cloudflare R2).
                </p>
                <input
                  ref={jsonFileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="sr-only"
                  onChange={(e) => {
                    handleJsonFileSelect(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </div>

              {/* UTILITY BAR */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold liquid-glass-subtle-interactive text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Template .json
                </button>
                <button
                  type="button"
                  onClick={handleCopyAiPrompt}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold liquid-glass-subtle-interactive text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  {copiedPrompt ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  )}
                  {copiedPrompt ? 'Prompt AI Tersalin' : 'Salin Prompt AI Generator'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFileName(null);
                    setFileTitle(DEFAULT_SAMPLE_RADIOLOGY_PACKET.title);
                    setRawJson(
                      JSON.stringify(
                        {
                          judul: DEFAULT_SAMPLE_RADIOLOGY_PACKET.title,
                          deskripsi: DEFAULT_SAMPLE_RADIOLOGY_PACKET.description,
                          daftar_soal: DEFAULT_SAMPLE_RADIOLOGY_PACKET.questions,
                        },
                        null,
                        2
                      )
                    );
                    setSubmitError(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold liquid-glass-subtle-interactive text-indigo-600 dark:text-indigo-400 cursor-pointer"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  Muat Paket Contoh
                </button>
              </div>

              {/* TEXTAREA PASTE JSON */}
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                  Atau Tempel Kode JSON Soal di Sini
                </label>
                <textarea
                  rows={7}
                  value={rawJson}
                  disabled={saving}
                  onChange={(e) => {
                    setSubmitError(null);
                    setRawJson(e.target.value);
                  }}
                  placeholder={`Tempel JSON soal radiologi dari file atau hasil generate ChatGPT/Gemini...\nFormat markdown \`\`\`json ... \`\`\` otomatis dibersihkan.`}
                  className={`w-full p-3 font-mono text-xs rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-y liquid-glass-input ${
                    isDark
                      ? 'bg-slate-800/80 border-slate-700 text-slate-100 placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* LIVE VALIDATION PREVIEW */}
              {jsonPreview.status === 'error' && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{jsonPreview.message}</span>
                </div>
              )}

              {jsonPreview.status === 'valid' && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-start gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                      <Check className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black">Siap diunggah ke cloud: "{jsonPreview.parsed.title}"</p>
                        <p className="text-[11px] font-medium opacity-85 mt-0.5 tabular-nums">
                          {jsonPreview.parsed.stats.total} soal ({jsonPreview.parsed.stats.thoraxCount} Thorax,{' '}
                          {jsonPreview.parsed.stats.abdomenCount} Abdomen) • {jsonPreview.parsed.stats.imageCount} foto
                          rontgen
                          {jsonPreview.parsed.stats.base64Count > 0 &&
                            ` (${jsonPreview.parsed.stats.base64Count} base64 akan otomatis diunggah ke R2)`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleMoveJsonToManualEditor}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600/25 transition cursor-pointer shrink-0"
                    >
                      Edit / Ganti Foto Rontgen
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: EDITOR MANUAL & UPLOAD FOTO RONTGEN KE R2                */}
          {/* ================================================================ */}
          {mode === 'manual' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Judul Paket Soal
                  </label>
                  <input
                    type="text"
                    value={title}
                    disabled={saving}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Latihan OSCE Radiologi Blok Respirologi"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-indigo-500/40 liquid-glass-input ${
                      isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Deskripsi Singkat
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    disabled={saving}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Deskripsi paket soal atau fokus kasus klinis..."
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none liquid-glass-input ${
                      isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* DAFTAR SOAL */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 tabular-nums">
                    Daftar Kasus ({questions.length} Soal)
                  </h4>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setQuestions((prev) => [...prev, createEmptyQuestion(prev.length + 1)])}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600/25 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Soal
                  </button>
                </div>

                {questions.map((q, idx) => {
                  const imgs = getQuestionImages(q);
                  const isUploadingThis = uploadingImageForQ === q.id;
                  const isKeyOpen = Boolean(expandedKeyIdx[idx]);

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-2xl border space-y-3.5 ${
                        isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50/90 border-slate-200'
                      }`}
                    >
                      {/* BARIS ATAS SOAL */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-600 text-white tabular-nums">
                            Soal #{idx + 1}
                          </span>
                          <div
                            className={`inline-flex p-0.5 rounded-lg border text-[11px] font-bold ${
                              isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => updateQuestion(idx, { region: 'thorax' })}
                              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                                q.region === 'thorax'
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                              }`}
                            >
                              Thorax
                            </button>
                            <button
                              type="button"
                              onClick={() => updateQuestion(idx, { region: 'abdomen' })}
                              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                                q.region === 'abdomen'
                                  ? 'bg-teal-600 text-white'
                                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                              }`}
                            >
                              Abdomen
                            </button>
                          </div>
                        </div>

                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Hapus soal ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* IDENTITAS PASIEN & KASUS */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <input
                          type="text"
                          value={q.identitas_pasien?.nama || ''}
                          onChange={(e) =>
                            updateQuestion(idx, {
                              identitas_pasien: {
                                nama: e.target.value,
                                tanggal_lahir: q.identitas_pasien?.tanggal_lahir || '',
                                jenis_kelamin: q.identitas_pasien?.jenis_kelamin || '',
                                no_rm: q.identitas_pasien?.no_rm || '',
                              },
                            })
                          }
                          placeholder="Nama Pasien"
                          className={`px-2.5 py-2 rounded-lg text-xs border ${
                            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                          }`}
                        />
                        <input
                          type="text"
                          value={q.identitas_pasien?.tanggal_lahir || ''}
                          onChange={(e) =>
                            updateQuestion(idx, {
                              identitas_pasien: {
                                nama: q.identitas_pasien?.nama || '',
                                tanggal_lahir: e.target.value,
                                jenis_kelamin: q.identitas_pasien?.jenis_kelamin || '',
                                no_rm: q.identitas_pasien?.no_rm || '',
                              },
                            })
                          }
                          placeholder="Tgl Lahir / Usia"
                          className={`px-2.5 py-2 rounded-lg text-xs border ${
                            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                          }`}
                        />
                        <input
                          type="text"
                          value={q.identitas_pasien?.jenis_kelamin || ''}
                          onChange={(e) =>
                            updateQuestion(idx, {
                              identitas_pasien: {
                                nama: q.identitas_pasien?.nama || '',
                                tanggal_lahir: q.identitas_pasien?.tanggal_lahir || '',
                                jenis_kelamin: e.target.value,
                                no_rm: q.identitas_pasien?.no_rm || '',
                              },
                            })
                          }
                          placeholder="Jenis Kelamin"
                          className={`px-2.5 py-2 rounded-lg text-xs border ${
                            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                          }`}
                        />
                        <input
                          type="text"
                          value={q.identitas_pasien?.no_rm || ''}
                          onChange={(e) =>
                            updateQuestion(idx, {
                              identitas_pasien: {
                                nama: q.identitas_pasien?.nama || '',
                                tanggal_lahir: q.identitas_pasien?.tanggal_lahir || '',
                                jenis_kelamin: q.identitas_pasien?.jenis_kelamin || '',
                                no_rm: e.target.value,
                              },
                            })
                          }
                          placeholder="No RM"
                          className={`px-2.5 py-2 rounded-lg text-xs border ${
                            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                          }`}
                        />
                      </div>

                      {/* VIGNETTE */}
                      <textarea
                        rows={3}
                        value={q.vignette}
                        onChange={(e) => updateQuestion(idx, { vignette: e.target.value })}
                        placeholder="Tuliskan skenario klinis / vignette pasien..."
                        className={`w-full p-2.5 rounded-xl text-xs leading-relaxed border resize-y ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      />

                      {/* UPLOAD / URL FOTO RONTGEN */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            Foto Rontgen ({imgs.length} citra)
                          </span>
                          <label
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer ${
                              isUploadingThis ? 'opacity-60 pointer-events-none' : ''
                            }`}
                          >
                            {isUploadingThis ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ImagePlus className="w-3.5 h-3.5" />
                            )}
                            <span>{isUploadingThis ? 'Mengunggah...' : 'Upload Foto Rontgen (Cloud)'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="sr-only"
                              onChange={(e) => {
                                handleUploadXrayFiles(idx, e.target.files);
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>

                        {/* Tambah via URL */}
                        <div className="flex gap-1.5">
                          <div className="relative flex-1">
                            <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="url"
                              value={urlDrafts[q.id] || ''}
                              onChange={(e) => setUrlDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddImageUrl(idx);
                                }
                              }}
                              placeholder="Atau tempel URL gambar rontgen (https://...)"
                              className={`w-full pl-8 pr-2.5 py-1.5 rounded-lg text-xs border ${
                                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                              }`}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddImageUrl(idx)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold liquid-glass-subtle-interactive cursor-pointer"
                          >
                            Tambah
                          </button>
                        </div>

                        {/* Preview Thumbnail */}
                        {imgs.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {imgs.map((url, imgIdx) => (
                              <div
                                key={`${q.id}-img-${imgIdx}`}
                                className="relative w-20 h-20 rounded-xl overflow-hidden bg-black border border-slate-700 group"
                              >
                                <img
                                  src={url}
                                  alt={`Rontgen ${idx + 1}-${imgIdx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(idx, url)}
                                  className="absolute top-1 right-1 p-1 rounded-full bg-black/75 text-white hover:bg-rose-600 transition cursor-pointer"
                                  title="Hapus gambar"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* KUNCI INTERPRETASI (COLLAPSIBLE) */}
                      <div className="pt-1 border-t border-slate-200/70 dark:border-slate-700/70">
                        <button
                          type="button"
                          onClick={() => setExpandedKeyIdx((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                          className="w-full flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 py-1 cursor-pointer"
                        >
                          <span>Kunci Interpretasi & Pembahasan Resmi</span>
                          {isKeyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {isKeyOpen && (
                          <div className="mt-2 space-y-2">
                            <input
                              type="text"
                              value={q.kunci_interpretasi?.kualitas_foto || ''}
                              onChange={(e) =>
                                updateQuestion(idx, {
                                  kunci_interpretasi: { ...q.kunci_interpretasi, kualitas_foto: e.target.value },
                                })
                              }
                              placeholder="1. Kualitas & keadekuatan foto..."
                              className={`w-full px-2.5 py-2 rounded-lg text-xs border ${
                                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                              }`}
                            />
                            <textarea
                              rows={2}
                              value={q.kunci_interpretasi?.interpretasi || ''}
                              onChange={(e) =>
                                updateQuestion(idx, {
                                  kunci_interpretasi: { ...q.kunci_interpretasi, interpretasi: e.target.value },
                                })
                              }
                              placeholder="2. Interpretasi sistematis organ..."
                              className={`w-full px-2.5 py-2 rounded-lg text-xs border resize-y ${
                                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                              }`}
                            />
                            <textarea
                              rows={2}
                              value={q.kunci_interpretasi?.abnormalitas || ''}
                              onChange={(e) =>
                                updateQuestion(idx, {
                                  kunci_interpretasi: { ...q.kunci_interpretasi, abnormalitas: e.target.value },
                                })
                              }
                              placeholder="3. Abnormalitas yang ditemukan..."
                              className={`w-full px-2.5 py-2 rounded-lg text-xs border resize-y ${
                                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                              }`}
                            />
                            <input
                              type="text"
                              value={q.kunci_interpretasi?.kesimpulan || ''}
                              onChange={(e) =>
                                updateQuestion(idx, {
                                  kunci_interpretasi: { ...q.kunci_interpretasi, kesimpulan: e.target.value },
                                })
                              }
                              placeholder="4. Kesimpulan radiologis & diagnosis kerja..."
                              className={`w-full px-2.5 py-2 rounded-lg text-xs border ${
                                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ERROR / PROGRESS FEEDBACK */}
          {submitError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {progressText && (
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-xs font-semibold text-indigo-600 dark:text-indigo-300 flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{progressText}</span>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          className={`px-4 sm:px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:py-4 flex items-center justify-end gap-2.5 border-t shrink-0 ${
            isDark ? 'bg-slate-800/70 border-slate-700/80' : 'bg-slate-50/80 border-slate-200/80'
          }`}
        >
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold liquid-glass-subtle-interactive text-slate-700 dark:text-slate-300 cursor-pointer disabled:opacity-40"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={saving || Boolean(uploadingImageForQ) || (mode === 'json' && jsonPreview.status !== 'valid')}
            onClick={handleSubmit}
            className="px-5 sm:px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 active:scale-[0.98] transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-45 disabled:pointer-events-none"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
            <span>{saving ? 'Menyimpan ke Cloud...' : isEditMode ? 'Simpan Perubahan ke Cloud' : 'Upload & Simpan ke Cloud'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
