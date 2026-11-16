import React, { useState, useEffect } from 'react';
import { X, Users, Link as LinkIcon, PlusCircle, BookOpen, Stethoscope, Folder } from 'lucide-react';
import { RadiologyGroupSection } from '../radiology/RadiologyGroupSection';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  invite_code: string;
  creator_id: string;
  creator_name: string;
  created_at: string;
}

interface SetupGroupsTabProps {
  currentUser: any;
  theme?: 'light' | 'dark';
  onJoinGroup?: (groupId: string, groupName: string) => void;
}

export const SetupGroupsTab: React.FC<SetupGroupsTabProps> = ({ currentUser, theme = 'light', onJoinGroup }) => {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [activeGroupViewTab, setActiveGroupViewTab] = useState<'radiology' | 'regular'>('radiology');

  const isDark = theme === 'dark';

  useEffect(() => {
    if (currentUser?.id) {
      loadGroups();
    }
  }, [currentUser]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/study-groups?user_id=${currentUser.id}`);
      const json = await res.json();
      setGroups(json.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;
    try {
      await fetch(`${API_BASE}/study-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: newGroupName,
          description: newGroupDesc,
          user_id: currentUser.id
        })
      });
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      loadGroups();
    } catch (e) {
      console.error(e);
      alert('Gagal membuat grup');
    }
  };

  const loadGroupDetails = async (group: StudyGroup) => {
    setSelectedGroup(group);
    try {
      const res = await fetch(`${API_BASE}/study-groups/${group.id}`);
      const json = await res.json();
      setGroupMembers(json.members || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInviteWA = (inviteCode: string) => {
    const link = `${window.location.origin}/?invite_code=${inviteCode}`;
    const text = `Ayo bergabung ke grup belajar saya di AuraMedPro! Klik link ini: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (selectedGroup) {
    return (
      <div className={`animate-fade-in space-y-6 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
        <button
          onClick={() => setSelectedGroup(null)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl liquid-glass-subtle-interactive text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer"
        >
          &larr; Kembali ke Daftar Grup
        </button>
        
        {/* HEADER GRUP */}
        <div className="p-6 rounded-2xl liquid-glass-card">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">{selectedGroup.name}</h2>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
                  Grup Belajar
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{selectedGroup.description || 'Tidak ada deskripsi.'}</p>
            </div>
            
            <div className="flex flex-col items-end gap-2 p-4 rounded-xl liquid-glass-subtle">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kode Undangan</div>
              <div className="text-xl font-mono font-extrabold text-indigo-600 dark:text-indigo-400 tracking-widest bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                {selectedGroup.invite_code}
              </div>
              <button 
                onClick={() => handleInviteWA(selectedGroup.invite_code)}
                className="mt-1 flex items-center gap-2 bg-emerald-600 text-white px-3.5 py-2 rounded-xl font-bold hover:bg-emerald-700 transition active:scale-95 text-xs shadow-sm shadow-emerald-600/20 cursor-pointer"
              >
                <LinkIcon className="w-3.5 h-3.5" /> Undang via WhatsApp
              </button>
            </div>
          </div>

          {/* TAB SWITCHER DI DALAM GRUP */}
          <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-200/60 dark:border-white/10">
            <button
              onClick={() => setActiveGroupViewTab('radiology')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                activeGroupViewTab === 'radiology'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'liquid-glass-subtle-interactive text-slate-600 dark:text-slate-300'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Latihan CBT Radiologi (Essay)</span>
            </button>

            <button
              onClick={() => setActiveGroupViewTab('regular')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer tabular-nums ${
                activeGroupViewTab === 'regular'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'liquid-glass-subtle-interactive text-slate-600 dark:text-slate-300'
              }`}
            >
              <Folder className="w-4 h-4" />
              <span>Bank Soal Reguler & Anggota ({groupMembers.length})</span>
            </button>
          </div>
        </div>

        {/* TAB CONTENT 1: LATIHAN CBT RADIOLOGI */}
        {activeGroupViewTab === 'radiology' && (
          <div className="animate-fade-in">
            <RadiologyGroupSection
              groupId={selectedGroup.id}
              groupName={selectedGroup.name}
              currentUser={currentUser}
              groupCreatorId={selectedGroup.creator_id}
              groupMembers={groupMembers}
              theme={theme}
            />
          </div>
        )}

        {/* TAB CONTENT 2: BANK SOAL REGULER & ANGGOTA */}
        {activeGroupViewTab === 'regular' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="lg:col-span-1 p-6 rounded-2xl liquid-glass-card">
              <div className="flex items-center gap-2.5 mb-4">
                <Users className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-base tabular-nums text-slate-900 dark:text-slate-100">Anggota ({groupMembers.length})</h3>
              </div>
              <ul className="space-y-2.5">
                {groupMembers.map(m => (
                  <li key={m.user_id} className="flex items-center gap-3 p-3 rounded-xl liquid-glass-subtle">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                      {(m.username || 'U')[0].toUpperCase()}
                    </div>
                    <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">{m.username || 'Tanpa Nama'}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2 p-6 rounded-2xl liquid-glass-card flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-indigo-500/15 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-slate-100 mb-2">Folder Soal Khusus Grup</h3>
              <p className="text-xs sm:text-sm mb-6 max-w-md text-slate-500 dark:text-slate-400 leading-relaxed">
                Soal yang diunggah ke grup ini terpisah dari Bank Soal utama dan hanya bisa diakses oleh sesama anggota grup.
              </p>
              <button 
                onClick={() => onJoinGroup && onJoinGroup(selectedGroup.id, selectedGroup.name)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-indigo-700 transition active:scale-95 shadow-md shadow-indigo-600/25 cursor-pointer"
              >
                Buka Bank Soal Grup
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 animate-fade-in ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      <div className="p-5 sm:p-6 rounded-2xl liquid-glass-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">Grup Belajar</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Berkumpul, berbagi soal klinis, dan latihan radiologi bersama sejawat.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> Buat Grup Baru
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 rounded-2xl liquid-glass-card animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 px-6 rounded-2xl liquid-glass-card">
          <div className="w-16 h-16 mx-auto bg-indigo-500/15 border border-indigo-500/25 text-indigo-500 rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5">Belum ada grup belajar</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">Anda belum bergabung dengan grup apa pun. Buat grup baru sekarang atau minta tautan undangan ke teman sejawat Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map(group => (
            <div 
              key={group.id} 
              className="p-5 sm:p-6 rounded-2xl liquid-glass-interactive cursor-pointer flex flex-col justify-between"
              onClick={() => loadGroupDetails(group)}
            >
              <div>
                <div className="flex justify-between items-start gap-3 mb-3">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 line-clamp-1">{group.name}</h3>
                  <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs line-clamp-2 mb-4 min-h-[2.25rem] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {group.description || 'Tidak ada deskripsi'}
                </p>
              </div>
              <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-200/50 dark:border-white/10">
                Dibuat oleh <span className="font-bold text-slate-700 dark:text-slate-300">{group.creator_name}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl liquid-glass-card overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-200/60 dark:border-white/10">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Buat Grup Belajar</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg liquid-glass-subtle-interactive text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateGroup} className="p-5 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Nama Grup</label>
                  <input 
                    type="text" 
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                    placeholder="Contoh: Pejuang Medis 2026"
                    value={newGroupName} 
                    onChange={e => setNewGroupName(e.target.value)}
                    required 
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Deskripsi <span className="opacity-60 font-normal normal-case">(opsional)</span></label>
                  <textarea 
                    className="w-full rounded-xl p-3.5 text-xs font-medium liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none min-h-[96px] resize-none"
                    placeholder="Deskripsikan tujuan grup ini..."
                    value={newGroupDesc} 
                    onChange={e => setNewGroupDesc(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2.5 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)} 
                  className="px-4 py-2.5 rounded-xl text-xs font-bold liquid-glass-subtle-interactive text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={!newGroupName.trim()}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  Buat Grup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

