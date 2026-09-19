import React, { useState, useEffect } from 'react';

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
  onJoinGroup?: (groupId: string, groupName: string) => void;
}

export const SetupGroupsTab: React.FC<SetupGroupsTabProps> = ({ currentUser, onJoinGroup }) => {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);

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
      <div className="p-4">
        <button onClick={() => setSelectedGroup(null)} className="mb-4 text-blue-500 hover:underline">
          &larr; Kembali ke Daftar Grup
        </button>
        <h2 className="text-2xl font-bold">{selectedGroup.name}</h2>
        <p className="text-gray-600 mb-4">{selectedGroup.description}</p>
        
        <div className="mb-6 p-4 bg-gray-50 rounded shadow">
          <h3 className="font-semibold mb-2">Kode Undangan: <span className="text-blue-600 tracking-wider">{selectedGroup.invite_code}</span></h3>
          <button 
            onClick={() => handleInviteWA(selectedGroup.invite_code)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            Undang via WhatsApp
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-bold text-lg mb-2">Anggota Grup ({groupMembers.length})</h3>
          <ul className="list-disc pl-5">
            {groupMembers.map(m => (
              <li key={m.user_id}>{m.username || 'Tanpa Nama'}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-2">Folder Soal Khusus Grup</h3>
          {/* Nanti di sini kita bisa render komponen SetupBanksTab yang dimodifikasi atau button navigasi */}
          <p className="text-gray-500 mb-2">Soal yang diunggah ke grup ini hanya bisa diakses oleh anggota grup.</p>
          <button 
             onClick={() => onJoinGroup && onJoinGroup(selectedGroup.id, selectedGroup.name)}
             className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Buka Bank Soal Grup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Grup Belajar</h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          + Buat Grup
        </button>
      </div>

      {loading ? (
        <p>Memuat grup...</p>
      ) : groups.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded">
          <p className="text-gray-500">Anda belum bergabung dengan grup apapun.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(group => (
            <div 
              key={group.id} 
              className="p-4 border rounded shadow hover:shadow-md cursor-pointer transition bg-white"
              onClick={() => loadGroupDetails(group)}
            >
              <h3 className="text-xl font-bold mb-1">{group.name}</h3>
              <p className="text-gray-600 text-sm mb-2">{group.description}</p>
              <div className="text-xs text-gray-400">Dibuat oleh: {group.creator_name}</div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Buat Grup Baru</h3>
            <form onSubmit={handleCreateGroup}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">Nama Grup</label>
                <input 
                  type="text" 
                  className="w-full border rounded p-2" 
                  value={newGroupName} 
                  onChange={e => setNewGroupName(e.target.value)}
                  required 
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">Deskripsi (opsional)</label>
                <textarea 
                  className="w-full border rounded p-2" 
                  value={newGroupDesc} 
                  onChange={e => setNewGroupDesc(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Buat</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
