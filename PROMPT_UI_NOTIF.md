# Prompt: UI Enhancement & Tombol Notifikasi Dropdown

## KONTEKS PROYEK

AuraMedPro adalah aplikasi CBT (Computer-Based Test) untuk mahasiswa kedokteran yang mempersiapkan UKMPPD. Teknologi: React 19 + TypeScript + Tailwind CSS 4 + Vite 6 + motion (framer-motion) + Supabase + Cloudflare Pages. File utama: `src/App.tsx` (~7934 baris, monolit). Deploy otomatis dari GitHub main ke Cloudflare Pages.

## ARSITEKTUR SAAT INI

- **Satu file monolit** `src/App.tsx` berisi semua state (155+ useState), fungsi, dan JSX
- **Navigasi sidebar (desktop)**: daftar array inline di baris ~3165-3173, 7 tab: Beranda, Bank Soal, Baru, SRS, Study Room, Analisis, Profil (+ Laporan untuk admin)
- **Navigasi bottom nav (mobile)**: daftar array inline di baris ~3252-3260, 7 tab sama
- **Header**: baris ~3293-3341, berisi logo, XP badge, tombol Bell (placeholder), tombol toggle tema
- **Sistem toast saat ini**: `triggerToast(text, icon)` → menampilkan `toastMessage` state → render div fixed bottom-center, auto-dismiss 3 detik, hanya bisa 1 toast aktif
- **Tema**: dark/light via `theme` state, menggunakan conditional className di setiap elemen
- **Animasi CSS custom**: `animate-fade-in`, `animate-slide-down`, `animate-float-orb` (didefinisikan di `src/index.css`)
- **motion/react**: sudah terinstall tapi nyaris tidak dipakai di App.tsx (hanya di OnboardingTour dan DashboardCharts)

## STATE & DATA YANG RELEVAN

```typescript
// State yang sudah ada di App.tsx:
const [theme, setTheme] = useState<'light' | 'dark'>(...)
const [dashboardTab, setDashboardTab] = useState<'home'|'banks'|'new'|'srs'|'notes'|'analysis'|'profile'|'reports'>('home')
const [showSidebar, setShowSidebar] = useState(true) // desktop sidebar
const [toastMessage, setToastMessage] = useState<{text: string; icon?: string} | null>(null)
const [quizHistory, setQuizHistory] = useState<HistoryEntry[]>(...)
const [userXP, setUserXP] = useState(0)
const [currentStreak, setCurrentStreak] = useState(0)
const [streakFreezeLeft, setStreakFreezeLeft] = useState(0)
const [srs, setSrs] = useSRS(currentUser?.id || null) // { stats: { dueCount }, cards: [...] }
const [achievements, setAchievements] = useState(...)
const [pendingSessions, setPendingSessions] = useState(...)
const [currentUser, setCurrentUser] = useState<any>(null)
const [questionDatabase, setQuestionDatabase] = useState<Record<string, Question[]>>({})
```

## REFERENSI UI/DESAIN

- **Style**: Glassmorphism dengan backdrop-blur, border semi-transparan, rounded-2xl/3xl, shadow halus
- **Warna utama**: Indigo (active/primary), Teal (accent/brand), Amber (XP/streak), Rose (badge/alert)
- **Tipografi**: font-extrabold/black untuk heading, text-xs/sm untuk body, tracking-tight
- **Pattern tombol**: `rounded-xl`, `transition-all`, `hover:scale-[1.02]`, `active:scale-[0.98]`, border + bg semi-transparan
- **Dark mode**: bg-slate-900/950, border-slate-800, text-slate-200/400
- **Light mode**: bg-white/slate-50, border-slate-200, text-slate-900/600

---

# TUGAS 1: NOTIFICATION DROPDOWN

## Deskripsi

Tombol Bell di header saat ini hanya placeholder (`onClick={() => triggerToast('Anda memiliki notifikasi modul baru!', '🔔')}`). Ubah menjadi dropdown notifikasi yang fungsional dengan data real-time dari state yang sudah ada.

## Spesifikasi Detail

### 1.1 State Notifikasi

Buat interface dan state baru di App.tsx:

```typescript
interface Notification {
  id: string;
  type: 'achievement' | 'streak' | 'srs' | 'session' | 'system';
  title: string;
  description: string;
  timestamp: number; // Date.now()
  read: boolean;
  icon: string; // emoji
  action?: { label: string; tab: string }; // klik → navigate ke tab
}

const [notifications, setNotifications] = useState<Notification[]>([]);
const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
const [notifFilter, setNotifFilter] = useState<'all' | 'achievement' | 'streak' | 'srs' | 'session'>('all');
```

### 1.2 Sumber Data Notifikasi (trigger dari logic yang sudah ada)

Tambahkan `addNotification()` di tempat-tempat berikut di App.tsx (cari kode yang sudah ada, tambahkan 1 baris):

| Trigger | Type | Title | Description | Icon | Action tab |
|---------|------|-------|-------------|------|------------|
| Achievement baru terbuka (baris ~277, setelah triggerToast XP achievement) | `achievement` | "Achievement Baru!" | `"Kamu mendapat: ${achievementTitle}"` | 🏆 | `profile` |
| Streak mencapai kelipatan 7 (baris ~daystreak logic) | `streak` | "Streak Mantap!" | `"${currentStreak} hari berturut-turut!"` | 🔥 | `home` |
| SRS due count > 10 (di useEffect srs) | `srs` | "SRS Menumpuk" | `"${srs.stats.dueCount} kartu perlu di-review"` | 🧠 | `srs` |
| Pending quiz session tersedia (baris ~884) | `session` | "Kuis Tertunda" | `"${session.title} menunggu"` | ⏸️ | `banks` |
| Streak freeze digunakan (jika ada logicnya) | `streak` | "Streak Freeze Aktif" | "Streak dilindungi 1 hari" | ❄️ | `home` |
| Level up (di setelah getLevelInfo berubah) | `achievement` | "Level Up!" | `"Kamu naik ke Level ${newLevel}"` | ⬆️ | `profile` |

Buat helper function:
```typescript
const addNotification = (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
  const newNotif: Notification = {
    ...notif,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    timestamp: Date.now(),
    read: false,
  };
  setNotifications(prev => [newNotif, ...prev].slice(0, 50)); // max 50 notif
};
```

### 1.3 UI Tombol Bell (Header)

Ganti tombol Bell placeholder di baris ~3319-3328:

```
- Tetap di posisi yang sama (header kanan, antara XP badge dan toggle tema)
- Badge count: tampilkan angka unread count (notifications.filter(n => !n.read).length)
  - Jika 0: hilangkan badge
  - Jika 1-9: tampilkan angka dalam circle kecil (rose-500 bg, white text, 8px font)
  - Jika > 9: tampilkan "9+"
- Badge position: top-right corner tombol, mengganti dot merah animate-ping yang lama
- Hover: sedikit scale up, border color berubah ke indigo-500/30
- Active/pressed: scale down sedikit
```

### 1.4 UI Dropdown Panel

Klik Bell → toggle dropdown panel:

```
Posisi: absolute, anchored ke bawah tombol Bell (right-aligned dengan header)
Lebar: w-80 (320px) di desktop, w-[calc(100vw-2rem)] di mobile
Max height: h-[70vh], scrollable
Z-index: z-50
Animasi: gunakan motion/react AnimatePresence + motion.div
  - initial: opacity 0, y -8, scale 0.95
  - animate: opacity 1, y 0, scale 1
  - exit: opacity 0, y -8, scale 0.95
  - transition: spring dengan damping 25, stiffness 300

Struktur panel:
┌─────────────────────────────────┐
│ 🔔 Notifikasi          ✕ Tutup │  ← Header panel
│                                 │
│ [Semua] [Achievement] [SRS]...│  ← Filter chips horizontal scroll
│─────────────────────────────────│
│ 🏆 Achievement Baru!     2m    │  ← Notif item (unread: bg indigo-500/5 + left border)
│    Kamu mendapat: SRS Master   │
│─────────────────────────────────│
│ 🧠 SRS Menumpuk          1j    │  ← Notif item (read: opacity lebih rendah)
│    15 kartu perlu di-review    │
│─────────────────────────────────│
│ 🔥 Streak Mantap!        3j    │
│    7 hari berturut-turut       │
│─────────────────────────────────│
│        Tandai semua dibaca     │  ← Footer: tombol "Mark all read"
└─────────────────────────────────┘
```

### 1.5 Detail Notif Item

```
- Container: flex gap-3, px-4 py-3, cursor-pointer
- Unread state: bg indigo-500/5 (dark) / bg-indigo-50 (light) + border-l-2 border-indigo-500
- Read state: opacity-70
- Hover: bg indigo-500/10
- Klik notif: (1) mark as read, (2) jika ada action → setDashboardTab(action.tab) + tutup dropdown
- Layout:
  - Kiri: icon emoji (w-8 h-8, rounded-lg bg-slate-100 dark:bg-slate-800, centered)
  - Tengah: title (font-bold text-xs), description (text-[11px] text-slate-500 max-line-1 truncate)
  - Kanan: relative time ("2m", "1j", "1h", "Kemarin")
```

### 1.6 Helper: Relative Time

```typescript
const formatRelativeTime = (ts: number): string => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}h`;
  return `${Math.floor(days/7)}mgg`;
};
```

### 1.7 Click Outside untuk Tutup

- Tambahkan useEffect: jika `notifDropdownOpen === true`, listen `mousedown` di document
- Jika klik target BUKAN dropdown panel DAN BUKAN tombol Bell → `setNotifDropdownOpen(false)`
- Cleanup: remove listener

### 1.8 Persistence (Opsional tapi disarankan)

- Simpan notifications ke localStorage key `cbt_notifications`
- Load saat init (seperti pattern quizHistory dan customFolders yang sudah ada)
- Hanya simpan max 20 notif terakhir ke localStorage (untuk hemat space)

---

# TUGAS 2: UI ENHANCEMENT

## 2.1 Animasi Tab Switch dengan AnimatePresence

Saat ini pergantian dashboardTab langsung muncul tanpa animasi. Tambahkan motion/react:

```
Lokasi: bungkus setiap blok {dashboardTab === 'xxx' && (...)} dengan AnimatePresence + motion.div

Pattern:
<AnimatePresence mode="wait">
  {dashboardTab === 'home' && (
    <motion.div
      key="home"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* ... konten tab Beranda ... */}
    </motion.div>
  )}
</AnimatePresence>
```

Lakukan untuk semua 7 tab (home, banks, new, srs, notes, analysis, profile). Tab reports hanya untuk admin, optional.

**PERINGATAN**: JANGAN bungkus kode quiz screen, result screen, atau auth screen dengan AnimatePresence. Hanya konten dashboardTab.

## 2.2 Sidebar Active Indicator Enhancement

Sidebar item saat ini:
- Active: `bg-indigo-500 text-white shadow-md scale-[1.02]`
- Inactive: plain text

Tingkatkan dengan:
- Active: tetap sama, tapi tambahkan left border indicator
  - `before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-5 before:bg-white before:rounded-r-full`
- Tambahkan subtle glow: `shadow-lg shadow-indigo-500/20` (bukan shadow-md)
- Inactive hover: tambahkan `before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-3 before:bg-slate-400 dark:before:bg-slate-600 before:rounded-r-full before:opacity-0 group-hover:before:opacity-100 before:transition-opacity`
  - Butuh tambah `group` dan `relative` pada button

## 2.3 Bottom Nav Enhancement (Mobile)

Bottom nav saat ini: 7 item sama rata, crowding di layar kecil.

Ubah menjadi:
- Tetap 7 item, tapi gunakan `flex-1` bukan `w-14` agar adaptive
- Active indicator: tambahkan dot kecil di bawah icon (bukan hanya warna)
  - `after:content-[''] after:absolute after:bottom-0.5 after:w-1 after:h-1 after:rounded-full after:bg-indigo-500`
- Active: icon sedikit bounce masuk (gunakan motion/react `initial/animate` pada setiap nav item)
- SRS badge: pindahkan posisi dari `absolute top-1 right-2` ke `absolute -top-0.5 right-1` agar tidak terlalu dalam
- Tap feedback: `active:scale-90` (bukan active:scale yang sekarang)

## 2.4 XP Badge Pulse Enhancement

XP badge di header (baris ~3310-3317):
- Saat XP bertambah, tambahkan animasi "pop" singkat
- Tambahkan state `xpJustGained` yang di-set true saat `setUserXP`, lalu reset setelah 500ms
- Jika `xpJustGained`: tambah class `animate-[pulse_0.3s_ease-in-out]` dan `shadow-amber-500/30`

## 2.5 Toast Stack System (Enhancement)

Saat ini hanya 1 toast bisa aktif. Upgrade ke multi-toast:

```typescript
// Ganti state:
const [toasts, setToasts] = useState<Array<{id: number; text: string; icon?: string; exiting?: boolean}>>([]);

// Trigger:
const triggerToast = (text: string, icon = 'ℹ️') => {
  const id = Date.now();
  setToasts(prev => [...prev, { id, text, icon }]);
  setTimeout(() => {
    setToasts(prev => prev.map(t => t.id === id ? {...t, exiting: true} : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300); // exit animation duration
  }, 3000);
};
```

Render (ganti toastMessage render di baris ~6968-6975):
```
<AnimatePresence>
  {toasts.map((toast, i) => (
    <motion.div
      key={toast.id}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4"
      style={{ bottom: `${24 + i * 56}px` }} // stack ke atas
    >
      <div className="bg-slate-900 border border-slate-800 text-white rounded-full px-5 py-3 shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
        <span className="text-base flex-shrink-0">{toast.icon}</span>
        <p className="flex-1 text-slate-100">{toast.text}</p>
      </div>
    </motion.div>
  ))}
</AnimatePresence>
```

## 2.6 Header Shadow on Scroll

Header saat ini: `sticky top-0 z-20 backdrop-blur-md border-b`

Tambahkan shadow saat scroll:
```typescript
const [headerScrolled, setHeaderScrolled] = useState(false);
useEffect(() => {
  const handle = () => setHeaderScrolled(window.scrollY > 10);
  window.addEventListener('scroll', handle, { passive: true });
  return () => window.removeEventListener('scroll', handle);
}, []);
```

Di header className, tambahkan konditional:
- Scrolled: `shadow-sm shadow-slate-900/5 dark:shadow-slate-950/50`
- Transisi: `transition-shadow duration-200`

---

# BATASAN & PERINGATAN

1. **JANGAN buat file baru.** Semua perubahan di dalam `src/App.tsx` saja (kecuali animasi CSS baru di `src/index.css`)
2. **JANGAN ubah struktur data** yang sudah ada (Question, HistoryEntry, dll)
3. **JANGAN hapus atau rename state** yang sudah ada. Boleh tambah state baru.
4. **JANGAN ubah logic bisnis** (quiz flow, SRS algorithm, auth, dll). Hanya ubah UI/UX.
5. **JANGAN gunakan AppContext atau buat component file baru** (belum sekarang, masih monolit).
6. **JANGAN import library baru** selain yang sudah ada (motion/react, lucide-react).
7. **Pastikan production build tetap berfungsi** — setelah selesai, jalankan `npx vite build` untuk verifikasi tidak ada error.
8. **Responsif**: semua perubahan harus bekerja baik di mobile (bottom nav) dan desktop (sidebar)
9. **Dark mode wajib**: setiap elemen baru harus punya dark mode variant
10. **Bahasa UI**: Bahasa Indonesia untuk semua label dan teks yang terlihat user

## VERIFIKASI

Setelah implementasi, pastikan:
- [ ] `npx vite build` sukses tanpa error
- [ ] Tombol Bell menampilkan dropdown saat diklik
- [ ] Badge count menunjukkan angka unread yang benar
- [ ] Notifikasi muncul saat trigger terjadi (achievement, streak, SRS)
- [ ] Filter chips di dropdown berfungsi
- [ ] Klik notif → mark as read + navigate ke tab yang benar
- [ ] Click outside menutup dropdown
- [ ] Animasi tab switch smooth (tidak flicker)
- [ ] Sidebar indicator lebih polished
- [ ] Bottom nav lebih responsif dan punya active dot
- [ ] Multi-toast stack bekerja (bisa tampilkan >1 toast sekaligus)
- [ ] Header shadow muncul saat scroll
- [ ] Dark mode dan light mode keduanya baik
- [ ] Mobile dan desktop keduanya baik
