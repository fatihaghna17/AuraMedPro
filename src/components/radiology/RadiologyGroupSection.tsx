import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, BookOpen, Clock, CheckCircle2, Award, 
  Trash2, User, Sparkles, FileText, UploadCloud, ChevronRight, X, AlertCircle
} from 'lucide-react';
import { RadiologyPacket, RadiologySubmission } from '../../types/radiology';
import { radiologyApi } from '../../services/radiologyApi';
import { DEFAULT_SAMPLE_RADIOLOGY_PACKET } from '../../data/sampleRadiology';
import { RadiologyExamModal } from './RadiologyExamModal';
import { RadiologyAdminGradingModal } from './RadiologyAdminGradingModal';

interface RadiologyGroupSectionProps {
  groupId: string;
  groupName: string;
  currentUser: any;
  groupCreatorId: string;
  groupMembers: any[];
  theme?: 'light' | 'dark';
}

export const RadiologyGroupSection: React.FC<RadiologyGroupSectionProps> = ({
  groupId,
  groupName,
  currentUser,
  groupCreatorId,
  groupMembers,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';
  const [packets, setPackets] = useState<RadiologyPacket[]>([]);
  const [submissions, setSubmissions] = useState<RadiologySubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [activeExamPacket, setActiveExamPacket] = useState<RadiologyPacket | null>(null);
  const [gradingModalData, setGradingModalData] = useState<{ packet: RadiologyPacket; submission: RadiologySubmission } | null>(null);
  const [showSubmissionsListModal, setShowSubmissionsListModal] = useState<RadiologyPacket | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Import form state
  const [importJson, setImportJson] = useState('');
  const [importAdminId, setImportAdminId] = useState(currentUser?.id || groupCreatorId);

  useEffect(() => {
    loadData();
  }, [groupId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [packetsData, submissionsData] = await Promise.all([
        radiologyApi.getPackets(groupId),
        radiologyApi.getSubmissions(groupId)
      ]);
      setPackets(packetsData);
      setSubmissions(submissionsData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleImportPacket = async () => {
    try {
      let parsed: any;
      if (!importJson.trim()) {
        // Gunakan sampel default jika kosong
        parsed = DEFAULT_SAMPLE_RADIOLOGY_PACKET;
      } else {
        parsed = JSON.parse(importJson);
      }

      const assignedMember = groupMembers.find(m => m.user_id === importAdminId) || currentUser;
      const assignedName = assignedMember?.username || currentUser?.username || 'Admin Korektor';

      const questionsList = parsed.daftar_soal || parsed.questions || [];
      if (!Array.isArray(questionsList) || questionsList.length === 0) {
        alert('Format JSON tidak memiliki daftar soal radiologi yang valid.');
        return;
      }

      const newPacket: RadiologyPacket = {
        id: `rad-packet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        group_id: groupId,
        title: parsed.judul || parsed.title || 'Paket Latihan CBT Radiologi Baru',
        description: parsed.deskripsi || parsed.description || 'Latihan interpretasi foto rontgen dengan rubrik checklist.',
        admin_id: importAdminId,
        admin_name: assignedName,
        created_at: new Date().toISOString(),
        questions: questionsList.map((q: any, idx: number) => ({
          id: q.id || `q-${idx + 1}-${Date.now()}`,
          nomor: q.nomor || idx + 1,
          region: (q.region === 'abdomen' || q.region === 'thorax') ? q.region : 'thorax',
          metadata: q.metadata,
          identitas_pasien: q.identitas_pasien,
          vignette: q.vignette || q.pertanyaan || '',
          image_url: q.image_url || q.gambar_url || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1000&q=80',
          pertanyaan: q.pertanyaan || 'Lakukan pembacaan sistematis foto radiologi di atas!',
          kunci_interpretasi: q.kunci_interpretasi || {}
        }))
      };

      await radiologyApi.savePacket(newPacket);
      setShowImportModal(false);
      setImportJson('');
      loadData();
    } catch (err: any) {
      alert(`Gagal memproses JSON: ${err.message}`);
    }
  };

  const handleDeletePacket = async (packetId: string) => {
    if (!confirm('Hapus paket soal radiologi ini?')) return;
    await radiologyApi.deletePacket(packetId, groupId);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'
      } shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-teal-400 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-500/20 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black">Latihan CBT Radiologi (Essay)</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/25">
                Koreksi Manual Admin
              </span>
            </div>
            <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Soal essay kasus klinis foto Thorax & Abdomen dengan rubrik checklist standar Skills Lab FK UNS.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition text-sm whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" /> Buat / Upload Paket Soal
        </button>
      </div>

      {/* LIST PAKET SOAL */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className={`h-48 rounded-2xl animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
          ))}
        </div>
      ) : packets.length === 0 ? (
        <div className={`p-10 text-center rounded-3xl border-2 border-dashed ${
          isDark ? 'border-slate-700 bg-slate-800/40 text-slate-400' : 'border-slate-300 bg-slate-50 text-slate-500'
        }`}>
          <BookOpen className="w-12 h-12 mx-auto text-indigo-500 mb-3 opacity-60" />
          <h4 className="text-base font-bold mb-1">Belum Ada Paket Soal Radiologi</h4>
          <p className="text-xs max-w-md mx-auto mb-4">
            Mulai buat paket soal essay untuk latihan interpretasi rontgen anggota grup belajar Anda.
          </p>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
          >
            Tambah Paket Contoh Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {packets.map(packet => {
            const mySubmission = submissions.find(
              s => s.packet_id === packet.id && s.user_id === currentUser?.id
            );
            const isAssignedAdmin = (currentUser?.id && currentUser.id === packet.admin_id) || (currentUser?.id === groupCreatorId);
            const packetSubmissions = submissions.filter(s => s.packet_id === packet.id);
            const pendingCount = packetSubmissions.filter(s => s.status === 'pending').length;

            return (
              <div
                key={packet.id}
                className={`p-6 rounded-3xl border transition flex flex-col justify-between ${
                  isDark
                    ? 'bg-slate-800/90 border-slate-700 shadow-xl shadow-slate-950/30'
                    : 'bg-white border-slate-200 shadow-md shadow-slate-200/50'
                }`}
              >
                <div>
                  {/* TOP CARD BAR */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h4 className="text-lg font-black line-clamp-1">{packet.title}</h4>
                      <p className={`text-xs line-clamp-2 mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {packet.description}
                      </p>
                    </div>

                    {isAssignedAdmin && (
                      <button
                        onClick={() => handleDeletePacket(packet.id)}
                        className={`p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                        title="Hapus Paket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* BADGES & INFO */}
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-500">
                      {packet.questions?.length || 0} Soal Essay
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                      isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      Korektor: <strong className="text-indigo-600 dark:text-indigo-400">{packet.admin_name}</strong>
                    </span>

                    {/* STATUS PENGERJAAN USER */}
                    {mySubmission ? (
                      mySubmission.status === 'graded' ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/25 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Skor: {mySubmission.score}/100
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center gap-1 animate-pulse">
                          <Clock className="w-3.5 h-3.5" /> Menunggu Koreksi
                        </span>
                      )
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-500/10 text-slate-500">
                        Belum Dikerjakan
                      </span>
                    )}
                  </div>
                </div>

                {/* BOTTOM ACTION BUTTONS */}
                <div className={`pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
                  isDark ? 'border-slate-700/80' : 'border-slate-100'
                }`}>
                  {/* TOMBOL KERJAKAN BAGI PESERTA */}
                  <button
                    onClick={() => setActiveExamPacket(packet)}
                    className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                      mySubmission?.status === 'graded'
                        ? 'bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-600/20'
                        : mySubmission?.status === 'pending'
                        ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-md shadow-amber-600/20'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20'
                    }`}
                  >
                    {mySubmission?.status === 'graded'
                      ? 'Lihat Hasil & Pembahasan'
                      : mySubmission?.status === 'pending'
                      ? 'Cek Status Koreksi Ujian'
                      : 'Mulai Ujian Radiologi'}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {/* TOMBOL KOREKSI ADMIN BAGI KOREKTOR YANG DITUGASKAN */}
                  {isAssignedAdmin && (
                    <button
                      onClick={() => setShowSubmissionsListModal(packet)}
                      className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 border ${
                        pendingCount > 0
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25'
                          : isDark
                          ? 'border-slate-700 text-slate-300 hover:bg-slate-700'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>Ruang Koreksi Admin</span>
                      {pendingCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-black animate-pulse">
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
          theme={theme}
          onClose={() => setActiveExamPacket(null)}
          onSubmitted={() => {
            loadData();
          }}
        />
      )}

      {/* MODAL RUANG KOREKSI ADMIN (DAFTAR SUBMISSION MAHASISWA) */}
      {showSubmissionsListModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`p-5 flex items-center justify-between border-b ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <h3 className="font-black text-lg">Daftar Pengumpulan Ujian</h3>
                <p className="text-xs opacity-70">{showSubmissionsListModal.title}</p>
              </div>
              <button
                onClick={() => setShowSubmissionsListModal(null)}
                className={`p-2 rounded-xl transition ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {(() => {
                const subs = submissions.filter(s => s.packet_id === showSubmissionsListModal.id);
                if (subs.length === 0) {
                  return (
                    <div className="py-16 text-center opacity-60">
                      <Clock className="w-10 h-10 mx-auto mb-2 text-indigo-500" />
                      <p className="font-bold text-sm">Belum ada peserta yang mengumpulkan jawaban.</p>
                    </div>
                  );
                }

                return subs.map(sub => (
                  <div
                    key={sub.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition ${
                      isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm">{sub.username}</span>
                        {sub.status === 'graded' ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-green-500/15 text-green-600 dark:text-green-400">
                            Dinilai ({sub.score}/100)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 animate-pulse">
                            Menunggu Koreksi
                          </span>
                        )}
                      </div>
                      <p className="text-xs opacity-60 mt-0.5">
                        Dikumpulkan: {new Date(sub.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setGradingModalData({ packet: showSubmissionsListModal, submission: sub });
                        setShowSubmissionsListModal(null);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-md shadow-indigo-500/20 whitespace-nowrap"
                    >
                      {sub.status === 'graded' ? 'Ubah Penilaian' : 'Koreksi Lembar Jawaban'}
                    </button>
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
          theme={theme}
          onClose={() => setGradingModalData(null)}
          onGraded={() => {
            loadData();
          }}
        />
      )}

      {/* MODAL IMPORT PAKET SOAL RADIOLOGI */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in zoom-in-95 duration-200">
          <div className={`w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`p-5 flex items-center justify-between border-b ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <UploadCloud className="w-5 h-5 text-indigo-500" />
                <h3 className="font-black text-lg">Buat / Import Paket Soal Radiologi</h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className={`p-2 rounded-xl transition ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* PILIH ADMIN KOREKTOR UNTUK PAKET INI */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1.5 opacity-80">
                  Tugaskan 1 Admin Korektor Paket Soal Ini:
                </label>
                <select
                  value={importAdminId}
                  onChange={(e) => setImportAdminId(e.target.value)}
                  className={`w-full p-3 rounded-xl text-sm font-semibold border transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  {groupMembers.length > 0 ? (
                    groupMembers.map(m => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.username || 'Anggota'} {m.user_id === currentUser?.id ? '(Anda)' : ''}
                      </option>
                    ))
                  ) : (
                    <option value={currentUser?.id || 'admin'}>
                      {currentUser?.username || 'Admin'} (Anda)
                    </option>
                  )}
                </select>
                <p className="text-[11px] opacity-60 mt-1">
                  Admin yang ditugaskan akan bertanggung jawab mencentang checklist dan memberikan feedback untuk paket soal ini.
                </p>
              </div>

              {/* INPUT JSON */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black uppercase tracking-wider opacity-80">
                    Paste Kode JSON Soal Radiologi:
                  </label>
                  <button
                    type="button"
                    onClick={() => setImportJson(JSON.stringify(DEFAULT_SAMPLE_RADIOLOGY_PACKET, null, 2))}
                    className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Pakai Template Kasus Default
                  </button>
                </div>

                <textarea
                  rows={9}
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder={`Tempelkan format JSON hasil generator AI di sini...\nAtau klik tombol "Pakai Template Kasus Default" di atas untuk membuat paket simulasi otomatis.`}
                  className={`w-full p-3 font-mono text-xs rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                💡 <strong>Tips:</strong> Anda bisa menyalin prompt generator di <strong>public/panduan_soal_radiologi.txt</strong> lalu memintanya di ChatGPT / Gemini untuk membuat ragam kasus lain (misal: Efusi Pleura, TB Milier, Pneumoperitoneum, dsb).
              </div>
            </div>

            <div className={`p-4 sm:p-5 flex justify-end gap-3 border-t ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleImportPacket}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition"
              >
                Simpan & Rilis Paket Soal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
