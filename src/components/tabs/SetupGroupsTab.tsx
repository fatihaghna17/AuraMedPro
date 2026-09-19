import React, { useState, useEffect } from 'react';
import { X, Users, Link as LinkIcon, PlusCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  invite_code: string;
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
      <div className={`p-4 md:p-8 animate-fade-in ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
        <button onClick={() => setSelectedGroup(null)} className={`mb-6 flex items-center gap-2 text-sm font-semibold transition ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}>
          &larr; Kembali ke Daftar Grup
        </button>
        
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm mb-6`}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-black mb-2">{selectedGroup.name}</h2>
              <p className={`text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{selectedGroup.description || 'Tidak ada deskripsi.'}</p>
            </div>
            
            <div className={`flex flex-col items-end gap-2 p-4 rounded-xl ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
              <div className="text-sm font-bold opacity-70">Kode Undangan</div>
              <div className="text-2xl font-mono font-black text-indigo-500 tracking-widest bg-indigo-500/10 px-3 py-1 rounded-lg">
                {selectedGroup.invite_code}
              </div>
              <button 
                onClick={() => handleInviteWA(selectedGroup.invite_code)}
                className="mt-2 flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-600 transition hover:scale-105 active:scale-95"
              >
                <LinkIcon className="w-4 h-4" /> Undang via WhatsApp
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-1 p-6 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-indigo-500" />
              <h3 className="font-black text-xl">Anggota ({groupMembers.length})</h3>
            </div>
            <ul className="space-y-3">
              {groupMembers.map(m => (
                <li key={m.user_id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                    {(m.username || 'U')[0].toUpperCase()}
                  </div>
                  <span className="font-semibold">{m.username || 'Tanpa Nama'}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={`lg:col-span-2 p-6 rounded-2xl border flex flex-col items-center justify-center text-center ${isDark ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100'} shadow-sm`}>
            <div className="w-16 h-16 bg-indigo-500/20 text-indigo-500 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="font-black text-2xl mb-2">Folder Soal Khusus Grup</h3>
            <p className={`mb-6 max-w-md ${isDark ? 'text-indigo-200/70' : 'text-indigo-800/70'}`}>
              Soal yang diunggah ke grup ini terpisah dari Bank Soal utama dan hanya bisa diakses oleh sesama anggota grup.
            </p>
            <button 
               onClick={() => onJoinGroup && onJoinGroup(selectedGroup.id, selectedGroup.name)}
               className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30"
            >
              Buka Bank Soal Grup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-8 animate-fade-in ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black">Grup Belajar</h2>
          <p className={`mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Berkumpul, berbagi soal, dan belajar bersama-sama.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition"
        >
          <PlusCircle className="w-5 h-5" /> Buat Grup Baru
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-40 rounded-2xl animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className={`text-center py-20 rounded-3xl border-2 border-dashed ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-300 bg-slate-50'}`}>
          <div className="w-20 h-20 mx-auto bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mb-4">
            <Users className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold mb-2">Belum ada grup</h3>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Anda belum bergabung dengan grup apapun. Buat sekarang atau minta kode undangan ke teman Anda!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <div 
              key={group.id} 
              className={`p-6 rounded-2xl border cursor-pointer transition hover:-translate-y-1 hover:shadow-xl ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 hover:border-indigo-500/50 shadow-slate-900/50' 
                  : 'bg-white border-slate-200 hover:border-indigo-400 shadow-slate-200/50'
              }`}
              onClick={() => loadGroupDetails(group)}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-black line-clamp-1">{group.name}</h3>
                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                  <Users className="w-4 h-4 text-indigo-500" />
                </div>
              </div>
              <p className={`text-sm line-clamp-2 mb-4 h-10 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {group.description || 'Tidak ada deskripsi'}
              </p>
              <div className={`text-xs font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Dibuat oleh <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{group.creator_name}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-white text-slate-900'}`}>
            <div className={`flex justify-between items-center p-6 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <h3 className="text-xl font-black">Buat Grup Belajar</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className={`p-2 rounded-full transition ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateGroup} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold mb-2">Nama Grup</label>
                  <input 
                    type="text" 
                    className={`w-full border rounded-xl p-3 font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                      isDark 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-400'
                    }`}
                    placeholder="Contoh: Pejuang Medis 2026"
                    value={newGroupName} 
                    onChange={e => setNewGroupName(e.target.value)}
                    required 
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Deskripsi <span className="opacity-60 font-normal">(opsional)</span></label>
                  <textarea 
                    className={`w-full border rounded-xl p-3 font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px] resize-none ${
                      isDark 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-400'
                    }`}
                    placeholder="Deskripsikan tujuan grup ini..."
                    value={newGroupDesc} 
                    onChange={e => setNewGroupDesc(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)} 
                  className={`px-5 py-2.5 rounded-xl font-bold transition ${
                    isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={!newGroupName.trim()}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:pointer-events-none disabled:transform-none"
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
