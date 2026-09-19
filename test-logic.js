const profile = { prodi: 'Kedokteran', angkatan: 24, trial_ends_at: '2026-09-14T05:00:00Z', role: 'user', username: 'jidan' };
const now = new Date();
const isKedokteran2425 = profile.prodi?.toLowerCase() === 'kedokteran' && (String(profile.angkatan) === '24' || String(profile.angkatan) === '25');
console.log("isKedokteran:", isKedokteran2425);
