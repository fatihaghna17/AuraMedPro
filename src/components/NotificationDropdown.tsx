import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Clock, BookOpen } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'srs' | 'new_quiz';
  text: string;
  time: string;
  bankName?: string;
}

interface NotificationDropdownProps {
  theme: 'light' | 'dark';
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  notifList: NotificationItem[];
  notifCount: number;
  onMarkAllRead: () => void;
}

export default function NotificationDropdown({
  theme, isOpen, onClose, onToggle, notifList, notifCount, onMarkAllRead,
}: NotificationDropdownProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={panelRef}>
      <button 
        onClick={onToggle}
        className={`p-2 rounded-xl border relative transition-all ${
          theme === 'dark' 
            ? 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200' 
            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
        }`}
      >
        <Bell className="w-4 h-4" />
        {notifCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-black px-1 leading-none">
            {notifCount > 9 ? '9+' : notifCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 top-full mt-2 w-80 rounded-2xl border shadow-2xl z-50 overflow-hidden ${
              theme === 'dark'
                ? 'bg-slate-900 border-slate-700/50 shadow-black/50'
                : 'bg-white border-slate-200 shadow-slate-200/80'
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${
              theme === 'dark' ? 'border-slate-700/50' : 'border-slate-100'
            }`}>
              <h3 className={`text-xs font-black uppercase tracking-wider ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}>Notifikasi</h3>
              {notifCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="text-[10px] font-bold text-indigo-500 hover:text-indigo-400 transition-colors"
                >
                  Tandai sudah dibaca
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto">
              {notifList.length === 0 ? (
                <div className={`px-4 py-8 text-center text-xs ${
                  theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
                  Tidak ada notifikasi baru
                </div>
              ) : (
                notifList.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b last:border-b-0 transition-colors cursor-default ${
                      theme === 'dark'
                        ? 'border-slate-800/50 hover:bg-slate-800/30'
                        : 'border-slate-50 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      notif.type === 'srs'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-indigo-500/10 text-indigo-500'
                    }`}>
                      {notif.type === 'srs' ? <Clock className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold leading-snug ${
                        theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                      }`}>{notif.text}</p>
                      <p className={`text-[10px] mt-0.5 ${
                        theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                      }`}>{notif.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}