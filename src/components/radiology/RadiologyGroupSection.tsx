import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusCircle,
  BookOpen,
  Clock,
  CheckCircle2,
  Trash2,
  User,
  ChevronRight,
  X,
  Cloud,
  CloudOff,
  CloudUpload,
  RefreshCw,
  Pencil,
  Download,
  Loader2,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { RadiologyPacket, RadiologySubmission } from '../../types/radiology';
import { getUserDisplayName, radiologyApi } from '../../services/radiologyApi';
import { DEFAULT_SAMPLE_RADIOLOGY_PACKET } from '../../data/sampleRadiology';
import { RadiologyExamModal } from './RadiologyExamModal';
import { RadiologyAdminGradingModal } from './RadiologyAdminGradingModal';
import { RadiologyPacketModal } from './RadiologyPacketModal';

interface RadiologyGroupSectionProps {
  groupId: string;
  groupName: string;
  currentUser: any;
  profileUsername?: string;
  groupCreatorId: string;
  groupMembers: any[];
  theme?: 'light' | 'dark';
  onToast?: (msg: string, icon?: string) => void;
}

export const RadiologyGroupSection: React.FC<RadiologyGroupSectionProps> = ({
  groupId,
  currentUser,
  profileUsername,
  groupCreatorId,
  groupMembers,
  theme = 'light',
  onToast,
}) => {
  const isDark = theme === 'dark';
  const [packets, setPackets] = useState<RadiologyPacket[]>([]);
  const [submissions, setSubmissions] = useState<RadiologySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fromCloud, setFromCloud] = useState(true);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingPacketId, setSyncingPacketId] = useState<string | null>(null);
  const [syncProgressMsg, setSyncProgressMsg] = useState<string | null>(null);
  const [addingSample, setAddingSample] = useState(false);

  // Modals
  const [activeExamPacket, setActiveExamPacket] = useState<RadiologyPacket | null>(null);
  const [gradingModalData, setGradingModalData] = useState<{
    packet: RadiologyPacket;
    submission: RadiologySubmission;
  } | null>(null);
  const [showSubmissionsListModal, setShowSubmissionsListModal] = useState<RadiologyPacket | null>(null);
  const [packetModalOpen, setPacketModalOpen] = useState(false);
  const [editingPacket, setEditingPacket] = useState<RadiologyPacket | null>(null);
  const [confirmDeletePacket, setConfirmDeletePacket] = useState<RadiologyPacket | null>(null);
  const [deletingPacket, setDeletingPacket] = useState(false);
  const [resettingSubmissionId, setResettingSubmissionId] = useState<string | null>(null);

  const loadData = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const [packetsRes, submissionsRes] = await Promise.all([
          radiologyApi.getPackets(groupId),
          radiologyApi.getSubmissions(groupId),
        ]);
        setPackets(packetsRes.packets);
        setFromCloud(packetsRes.fromCloud);
        setCloudError(packetsRes.error || null);
        setUnsyncedCount(packetsRes.unsyncedCount);
        setSubmissions(submissionsRes.submissions);
      } catch (e: any) {
        console.error('[Radiology] loadData error:', e);
        setFromCloud(false);
        setCloudError(e?.message || 'Gagal memuat data dari server.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [groupId]
  );

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const handleSyncAllLocal = async () => {
    setSyncingAll(true);
    setSyncProgressMsg('Menyinkronkan paket soal lokal ke cloud...');
    try {
      const res = await radiologyApi.syncLocalPackets(groupId, {
        onProgress: (msg) => setSyncProgressMsg(msg),
      });
      await loadData(true);
      if (res.syncedCount > 0 && res.failedCount === 0) {
        onToast?.(`${res.syncedCount} paket soal berhasil diunggah ke cloud & muncul di semua perangkat!`, '☁️');
      } else if (res.syncedCount > 0) {
        onToast?.(`${res.syncedCount} paket tersinkron, ${res.failedCount} gagal: ${res.lastError || ''}`, '⚠️');
      } else if (res.failedCount > 0) {
        onToast?.(`Gagal menyinkronkan ke cloud: ${res.lastError || 'Periksa koneksi.'}`, '❌');
      }
    } finally {
      setSyncingAll(false);
      setSyncProgressMsg(null);
    }
  };

  const handleSyncSinglePacket = async (pkt: RadiologyPacket) => {
    setSyncingPacketId(pkt.id);
    setSyncProgressMsg(`Mengunggah "${pkt.title}" ke cloud...`);
    try {
      const res = await radiologyApi.savePacket(pkt, {
        onProgress: (msg) => setSyncProgressMsg(msg),
      });
      await loadData(true);
      if (res.synced) {
        onToast?.(`"${pkt.title}" berhasil tersinkron ke cloud!`, '☁️');
      } else {
        onToast?.(`Gagal sinkron: ${res.error || 'Server tidak merespons.'}`, '❌');
      }
    } finally {
      setSyncingPacketId(null);
      setSyncProgressMsg(null);
    }
  };

  const handleAddSampleToCloud = async () => {
    setAddingSample(true);
    try {
      const samplePacket: RadiologyPacket = {
        ...DEFAULT_SAMPLE_RADIOLOGY_PACKET,
        id: `rad-sample-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        group_id: groupId,
        admin_id: currentUser?.id || groupCreatorId || 'admin',
        admin_name: getUserDisplayName(currentUser, profileUsername, 'Admin Radiologi'),
        created_at: new Date().toISOString(),
      };
      const res = await radiologyApi.savePacket(samplePacket);
      await loadData(true);
      if (res.synced) {
        onToast?.('Paket contoh berhasil ditambahkan ke cloud & tersedia untuk semua anggota grup.', '✅');
      } else {
        onToast?.(`Paket contoh tersimpan lokal (gagal sinkron: ${res.error || 'offline'}).`, '⚠️');
      }
    } finally {
      setAddingSample(false);
    }
  };

  const handleConfirmDeletePacket = async () => {
    if (!confirmDeletePacket) return;
    setDeletingPacket(true);
    try {
      const res = await radiologyApi.deletePacket(
        confirmDeletePacket.id,
        groupId,
        confirmDeletePacket.synced !== false
      );
      if (!res.success) {
        onToast?.(res.error || 'Gagal menghapus paket soal di server.', '❌');
      } else {
        onToast?.(`Paket "${confirmDeletePacket.title}" telah dihapus.`, '🗑️');
        setConfirmDeletePacket(null);
        await loadData(true);
      }
    } finally {
      setDeletingPacket(false);
    }
  };

  const handleExportPacketJson = (pkt: RadiologyPacket) => {
    const payload = {
      tipe_paket: 'radiologi_essay',
      judul: pkt.title,
      deskripsi: pkt.description,
      daftar_soal: pkt.questions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (pkt.title || 'paket_radiologi').replace(/[^a-zA-Z0-9\-_]+/g, '_').slice(0, 60);
    a.download = `${safeName}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast?.('File JSON paket soal berhasil diunduh.', '📥');
  };

  const handleResetSubmission = async (sub: RadiologySubmission) => {
    setResettingSubmissionId(sub.id);
    try {
      const res = await radiologyApi.deleteSubmission(sub.id, groupId);
      if (!res.success) {
        onToast?.(res.error || 'Gagal mereset jawaban peserta.', '❌');
      } else {
        onToast?.(`Jawaban ${sub.username} direset. Peserta dapat mengerjakan ulang.`, '🔄');
        await loadData(true);
      }
    } finally {
      setResettingSubmissionId(null);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* HEADER SECTION */}
      <div
        className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border liquid-glass-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
          isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/20 shrink-0">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="text-lg sm:text-xl font-black tracking-tight">Latihan CBT Radiologi (Essay)</h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 border shrink-0 ${
                  fromCloud
                    ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                    : 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25'
                }`}
              >
                {fromCloud ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
                {fromCloud ? 'Sinkron Cloud Aktif' : 'Mode Offline'}
              </span>
            </div>
            <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Soal essay interpretasi Thorax & Abdomen dengan rubrik checklist FK UNS. Semua paket tersimpan online di cloud grup.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <button
            type="button"
            disabled={refreshing || loading}
            onClick={() => loadData(true)}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              isDark
                ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
            title="Muat ulang paket soal terbaru dari cloud"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sinkronkan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingPacket(null);
              setPacketModalOpen(true);
            }}
            className="flex-1 md:flex-none justify-center flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-indigo-600 text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 active:scale-[0.98] transition text-xs sm:text-sm whitespace-nowrap cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Buat / Upload Paket Soal</span>
          </button>
        </div>
      </div>

      {/* BANNER PENYELAMATAN PAKET LOKAL (BELUM SINKRON KE CLOUD) */}
      {unsyncedCount > 0 && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDark
              ? 'bg-amber-950/35 border-amber-500/35 text-amber-200'
              : 'bg-amber-50 border-amber-300/80 text-amber-900'
          }`}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-bold">
                Ada {unsyncedCount} paket soal yang masih tersimpan lokal di perangkat ini.
              </p>
              <p className="opacity-85 mt-0.5">
                {syncProgressMsg ||
                  'Unggah ke cloud agar paket soal ini langsung muncul saat dibuka di perangkat lain dan anggota grup.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={syncingAll}
            onClick={handleSyncAllLocal}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition shrink-0 cursor-pointer disabled:opacity-50"
          >
            {syncingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
            <span>{syncingAll ? 'Mengunggah...' : 'Upload Semua ke Cloud'}</span>
          </button>
        </div>
      )}

      {/* BANNER OFFLINE / SERVER ERROR */}
      {!fromCloud && cloudError && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
            isDark
              ? 'bg-slate-800/80 border-slate-700 text-slate-300'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <CloudOff className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">Menampilkan cache lokal: {cloudError}</span>
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            className="px-3 py-1.5 rounded-lg font-bold bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600/25 transition shrink-0 cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* LIST PAKET SOAL */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className={`h-48 rounded-2xl animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}
            />
          ))}
        </div>
      ) : packets.length === 0 ? (
        <div
          className={`p-8 sm:p-10 text-center rounded-2xl sm:rounded-3xl border-2 border-dashed ${
            isDark
              ? 'border-slate-700 bg-slate-800/40 text-slate-400'
              : 'border-slate-300 bg-slate-50 text-slate-500'
          }`}
        >
          <BookOpen className="w-12 h-12 mx-auto text-indigo-500 mb-3 opacity-60" />
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
            Belum Ada Paket Soal Radiologi di Grup Ini
          </h4>
          <p className="text-xs max-w-md mx-auto mb-5 leading-relaxed">
            Unggah file <code className="font-mono">.json</code>, buat kasus manual beserta foto rontgen, atau tambahkan paket contoh langsung ke cloud grup.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setEditingPacket(null);
                setPacketModalOpen(true);
              }}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition inline-flex items-center gap-2 cursor-pointer"
            >
              <CloudUpload className="w-4 h-4" />
              Upload / Buat Paket Soal
            </button>
            <button
              type="button"
              disabled={addingSample}
              onClick={handleAddSampleToCloud}
              className="px-4 py-2.5 rounded-xl text-xs font-bold liquid-glass-subtle-interactive text-slate-700 dark:text-slate-200 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {addingSample ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
              {addingSample ? 'Menyimpan...' : 'Tambahkan Paket Contoh ke Cloud'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {packets.map((packet) => {
            const mySubmission = submissions.find(
              (s) => s.packet_id === packet.id && s.user_id === currentUser?.id
            );
            const isAssignedAdmin =
              (currentUser?.id && currentUser.id === packet.admin_id) ||
              (currentUser?.id && currentUser.id === groupCreatorId);
            const packetSubmissions = submissions.filter((s) => s.packet_id === packet.id);
            const pendingCount = packetSubmissions.filter((s) => s.status === 'pending').length;
            const thoraxCount = (packet.questions || []).filter((q) => q.region === 'thorax').length;
            const abdomenCount = (packet.questions || []).filter((q) => q.region === 'abdomen').length;
            const isLocalOnly = packet.synced === false;
            const isSyncingThis = syncingPacketId === packet.id;

            return (
              <div
                key={packet.id}
                className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border transition flex flex-col justify-between liquid-glass-card ${
                  isDark
                    ? 'bg-slate-800/90 border-slate-700 shadow-lg shadow-slate-950/30'
                    : 'bg-white border-slate-200 shadow-sm shadow-slate-200/60'
                }`}
              >
                <div>
                  {/* TOP CARD BAR */}
                  <div className="flex items-start justify-between gap-2.5 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-1.5 mb-1">
                        {isLocalOnly ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/25">
                            <CloudOff className="w-3 h-3" /> Lokal • Belum Sinkron
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            <Cloud className="w-3 h-3" /> Tersimpan Cloud
                          </span>
                        )}
                      </div>
                      <h4 className="text-base sm:text-lg font-black line-clamp-1">{packet.title}</h4>
                      <p className={`text-xs line-clamp-2 mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {packet.description}
                      </p>
                    </div>

                    {/* ACTION ICONS */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleExportPacketJson(packet)}
                        className={`p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 transition cursor-pointer ${
                          isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                        }`}
                        title="Unduh file JSON paket ini"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {isAssignedAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPacket(packet);
                              setPacketModalOpen(true);
                            }}
                            className={`p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 transition cursor-pointer ${
                              isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                            }`}
                            title="Edit paket & foto rontgen"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeletePacket(packet)}
                            className={`p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition cursor-pointer ${
                              isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                            }`}
                            title="Hapus paket"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* BADGES & INFO */}
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/12 text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {packet.questions?.length || 0} Soal
                      {thoraxCount > 0 && abdomenCount > 0
                        ? ` (${thoraxCount} Thorax, ${abdomenCount} Abdomen)`
                        : thoraxCount > 0
                        ? ' • Thorax'
                        : abdomenCount > 0
                        ? ' • Abdomen'
                        : ''}
                    </span>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                        isDark ? 'bg-slate-700/80 text-slate-300' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>
                        Korektor:{' '}
                        <strong className="text-indigo-600 dark:text-indigo-400">{packet.admin_name}</strong>
                      </span>
                    </span>

                    {/* STATUS PENGERJAAN USER */}
                    {mySubmission ? (
                      mySubmission.status === 'graded' ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 flex items-center gap-1 tabular-nums">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Skor: {mySubmission.score}/100
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Menunggu Koreksi
                        </span>
                      )
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-500/10 text-slate-500 dark:text-slate-400">
                        Belum Dikerjakan
                      </span>
                    )}
                  </div>
                </div>

                {/* BOTTOM ACTION BUTTONS */}
                <div
                  className={`pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2.5 ${
                    isDark ? 'border-slate-700/80' : 'border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setActiveExamPacket(packet)}
                      className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                        mySubmission?.status === 'graded'
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20'
                          : mySubmission?.status === 'pending'
                          ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm shadow-amber-600/20'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20'
                      }`}
                    >
                      {mySubmission?.status === 'graded'
                        ? 'Lihat Hasil & Pembahasan'
                        : mySubmission?.status === 'pending'
                        ? 'Cek Status Koreksi'
                        : 'Mulai Ujian Radiologi'}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {isLocalOnly && (
                      <button
                        type="button"
                        disabled={isSyncingThis}
                        onClick={() => handleSyncSinglePacket(packet)}
                        className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                        title="Unggah paket lokal ini ke server cloud"
                      >
                        {isSyncingThis ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CloudUpload className="w-3.5 h-3.5" />
                        )}
                        <span>{isSyncingThis ? 'Mengunggah...' : 'Sync Cloud'}</span>
                      </button>
                    )}
                  </div>

                  {/* TOMBOL KOREKSI ADMIN BAGI KOREKTOR YANG DITUGASKAN */}
                  {isAssignedAdmin && (
                    <button
                      type="button"
                      onClick={() => setShowSubmissionsListModal(packet)}
                      className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer tabular-nums ${
                        pendingCount > 0
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25'
                          : isDark
                          ? 'border-slate-700 text-slate-300 hover:bg-slate-700'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>Ruang Koreksi ({packetSubmissions.length})</span>
                      {pendingCount > 0 && (
                        <span className="px-1.5 min-w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-black">
                          {pendingCount}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL UJIAN PESERTA */}
      {activeExamPacket && (
        <RadiologyExamModal
          packet={activeExamPacket}
          groupId={groupId}
          currentUser={currentUser}
          profileUsername={profileUsername}
          theme={theme}
          onClose={() => setActiveExamPacket(null)}
          onSubmitted={() => {
            loadData(true);
            onToast?.('Jawaban ujian berhasil dikirim ke cloud & masuk antrean koreksi.', '✅');
          }}
        />
      )}

      {/* MODAL RUANG KOREKSI ADMIN (DAFTAR SUBMISSION MAHASISWA) */}
      {showSubmissionsListModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5 animate-fade-in"
          onClick={() => setShowSubmissionsListModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-3xl max-h-[90dvh] flex flex-col rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden border liquid-glass-card ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div
              className={`p-4 sm:p-5 flex items-center justify-between gap-3 border-b ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="min-w-0">
                <h3 className="font-black text-base sm:text-lg">Daftar Pengumpulan Ujian</h3>
                <p className="text-xs opacity-70 truncate">{showSubmissionsListModal.title}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => loadData(true)}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-200 text-slate-600'
                  }`}
                  title="Refresh daftar pengumpulan"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowSubmissionsListModal(null)}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-200'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-5 space-y-3">
              {(() => {
                const subs = submissions.filter((s) => s.packet_id === showSubmissionsListModal.id);
                if (subs.length === 0) {
                  return (
                    <div className="py-16 text-center opacity-60">
                      <Clock className="w-10 h-10 mx-auto mb-2 text-indigo-500" />
                      <p className="font-bold text-sm">Belum ada peserta yang mengumpulkan jawaban.</p>
                    </div>
                  );
                }

                return subs.map((sub) => (
                  <div
                    key={sub.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition ${
                      isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-black text-sm truncate">{sub.username}</span>
                        {sub.status === 'graded' ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 tabular-nums">
                            Dinilai ({sub.score}/100)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            Menunggu Koreksi
                          </span>
                        )}
                      </div>
                      <p className="text-xs opacity-60 mt-0.5">
                        Dikumpulkan: {new Date(sub.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        disabled={resettingSubmissionId === sub.id}
                        onClick={() => handleResetSubmission(sub)}
                        className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer disabled:opacity-40 ${
                          isDark
                            ? 'border-slate-700 text-slate-400 hover:text-rose-400 hover:bg-slate-700'
                            : 'border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title="Reset jawaban agar peserta bisa mengulang"
                      >
                        {resettingSubmissionId === sub.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setGradingModalData({ packet: showSubmissionsListModal, submission: sub });
                          setShowSubmissionsListModal(null);
                        }}
                        className="flex-1 sm:flex-none text-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm shadow-indigo-500/20 whitespace-nowrap cursor-pointer"
                      >
                        {sub.status === 'graded' ? 'Ubah Penilaian' : 'Koreksi Lembar Jawaban'}
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL KOREKSI CHECKLIST ADMIN */}
      {gradingModalData && (
        <RadiologyAdminGradingModal
          packet={gradingModalData.packet}
          submission={gradingModalData.submission}
          currentUser={currentUser}
          profileUsername={profileUsername}
          theme={theme}
          onClose={() => setGradingModalData(null)}
          onGraded={() => {
            loadData(true);
            onToast?.('Penilaian checklist & feedback berhasil disimpan ke cloud.', '✅');
          }}
        />
      )}

      {/* MODAL BUAT / UPLOAD / EDIT PAKET SOAL */}
      <RadiologyPacketModal
        isOpen={packetModalOpen}
        groupId={groupId}
        currentUser={currentUser}
        profileUsername={profileUsername}
        groupCreatorId={groupCreatorId}
        groupMembers={groupMembers}
        editingPacket={editingPacket}
        theme={theme}
        onClose={() => {
          setPacketModalOpen(false);
          setEditingPacket(null);
        }}
        onSaved={(savedPkt, synced, syncErr) => {
          loadData(true);
          if (synced) {
            onToast?.(
              `Paket "${savedPkt.title}" (${savedPkt.questions.length} soal) tersimpan di cloud & muncul di semua perangkat!`,
              '☁️'
            );
          } else {
            onToast?.(`Tersimpan lokal (${syncErr || 'offline'}). Klik Sync Cloud saat online.`, '⚠️');
          }
        }}
        onToast={onToast}
      />

      {/* MODAL KONFIRMASI HAPUS PAKET */}
      {confirmDeletePacket && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => !deletingPacket && setConfirmDeletePacket(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-md p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 rounded-t-[28px] sm:rounded-3xl border shadow-2xl liquid-glass-card ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <h3 className="text-base sm:text-lg font-black mb-2">Hapus Paket Soal Radiologi?</h3>
            <p className={`text-xs sm:text-sm leading-relaxed mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Paket <strong className="text-slate-900 dark:text-white">"{confirmDeletePacket.title}"</strong> beserta seluruh pengumpulan jawaban dan foto rontgennya akan dihapus dari cloud dan semua perangkat anggota grup.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                disabled={deletingPacket}
                onClick={() => setConfirmDeletePacket(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold liquid-glass-subtle-interactive cursor-pointer disabled:opacity-40"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingPacket}
                onClick={handleConfirmDeletePacket}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deletingPacket && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deletingPacket ? 'Menghapus...' : 'Ya, Hapus Permanen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
