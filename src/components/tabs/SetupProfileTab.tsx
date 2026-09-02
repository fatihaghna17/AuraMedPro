import React from 'react';
import { Download, Upload, LogOut } from 'lucide-react';
import { getRarityColor, getRarityBg } from '../../utils/achievements';
import { getLevelInfo } from '../../utils/appHelpers';



import { supabase } from '../../supabaseClient';

interface SetupProfileTabProps {
  theme: string;
  currentUser: any;
  profileUsername: string;
  userXP: number;
  currentStreak: number;
  longestStreak: number;
  totalQuestionsAnswered: number;
  streakFreezeLeft: number;
  lastActiveDate: string | null;
  exportData: any;
  importData: any;
  triggerToast: any;
  achievementFilter: string;
  setAchievementFilter: any;
  achievements: any[];
}

export const SetupProfileTab: React.FC<SetupProfileTabProps> = ({
  theme, currentUser, profileUsername, userXP, currentStreak, longestStreak,
  totalQuestionsAnswered, streakFreezeLeft, lastActiveDate, exportData,
  importData, triggerToast, achievementFilter, setAchievementFilter, achievements
}) => {
  return (
    <div className="space-y-6 max-w-md mx-auto animate-fade-in">
              
                <div className={`p-6 rounded-3xl border transition-all duration-300 space-y-6 ${
                  theme === 'dark'
                    ? 'bg-slate-900/40 border-white/[0.08] shadow-2xl'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-teal-500 p-1 mb-4 shadow-xl">
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-black text-xl text-white">
                        {profileUsername.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <h2 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      {profileUsername}
                    </h2>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mt-1.5">
                      Gelar: {getLevelInfo(userXP).rank}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-2xl border text-center ${
                      theme === 'dark' ? 'bg-slate-950/30 border-slate-850' : 'bg-slate-50 border-slate-150'
                    }`}>
                      <div className="text-lg font-extrabold text-indigo-500">
                        {getLevelInfo(userXP).level}
                      </div>
                      <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mt-1">
                        Kultivator Level
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-2xl border text-center ${
                      theme === 'dark' ? 'bg-slate-950/30 border-slate-855' : 'bg-slate-50 border-slate-155'
                    }`}>
                      <div className="text-lg font-extrabold text-teal-500">
                        {userXP}
                      </div>
                      <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mt-1">
                        Total XP
                      </div>
                    </div>
                  </div>

                  <div className={`divide-y text-xs ${theme === 'dark' ? 'divide-slate-850' : 'divide-slate-100'}`}>
                    <div className="py-3 flex justify-between">
                      <span className="font-semibold text-slate-400">Total Soal Terjawab Benar</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-200">{currentUser?.total_questions_answered || 0} Soal</span>
                    </div>
                    <div className="py-3 flex justify-between">
                      <span className="font-semibold text-slate-400">Streak Belajar Saat Ini</span>
                      <span className="font-extrabold text-amber-500">{currentStreak} Hari</span>
                    </div>
                    <div className="py-3 flex justify-between">
                      <span className="font-semibold text-slate-400">Streak Tertinggi</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-200">{longestStreak} Hari</span>
                    </div>
                    <div className="py-3 flex justify-between">
                      <span className="font-semibold text-slate-400">Streak Freeze (❄️)</span>
                      <span className="font-extrabold text-sky-500">{streakFreezeLeft} Tersisa</span>
                    </div>
                    <div className="py-3 flex justify-between">
                      <span className="font-semibold text-slate-400">Tipe Akun</span>
                      <span className="font-extrabold text-teal-500 uppercase tracking-widest text-[9px] bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">Pro</span>
                    </div>
                  </div>

                  <hr className={`border-t ${theme === 'dark' ? 'border-slate-850' : 'border-slate-150'}`} />

                  {/* Achievements Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        Achievements 🏆
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {achievements.unlockedIds.length} / {achievements.getAllAchievements().length} Unlocked
                      </span>
                    </div>
                    
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
                      {['all', 'quiz', 'streak', 'mastery'].map(filter => (
                        <button
                          key={filter}
                          onClick={() => setAchievementFilter(filter as any)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition ${
                            achievementFilter === filter 
                              ? 'bg-indigo-500 text-white' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {filter === 'all' ? 'Semua' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {achievements.getAllAchievements()
                        .filter(a => achievementFilter === 'all' || a.category === achievementFilter)
                        .map(ach => (
                        <div 
                          key={ach.id}
                          title={ach.description}
                          className={`relative p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                            ach.isUnlocked 
                              ? `${getRarityBg(ach.rarity, theme === 'dark')} opacity-100 transform hover:scale-105` 
                              : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/50 opacity-40 grayscale'
                          }`}
                        >
                          {!ach.isUnlocked && (
                            <div className="absolute top-1.5 right-1.5">
                              <span className="text-[10px]">🔒</span>
                            </div>
                          )}
                          <div className="text-2xl mb-1">{ach.icon}</div>
                          <div className={`text-[9px] font-black leading-tight ${ach.isUnlocked ? getRarityColor(ach.rarity, theme === 'dark') : 'text-slate-500'}`}>
                            {ach.title}
                          </div>
                          {ach.isUnlocked && (
                            <div className="mt-1 text-[8px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                              +{ach.xpReward} XP
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <hr className={`border-t ${theme === 'dark' ? 'border-slate-850' : 'border-slate-150'}`} />

                  {/* Data Management Section */}
                  <div>
                    <h3 className={`text-sm font-black mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      <Download className="w-4 h-4 text-indigo-500" /> Ekspor & Impor Data
                    </h3>
                    <p className={`text-xs mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      Backup data riwayat kuis, catatan (Study Room), dan progress SRS Anda, atau pulihkan dari file backup sebelumnya.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={exportData}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border-2 border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:bg-indigo-500/20 transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        Ekspor JSON
                      </button>
                      
                      <label className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer">
                        <Upload className="w-4 h-4" />
                        Impor JSON
                        <input 
                          type="file" 
                          accept=".json" 
                          className="hidden" 
                          onChange={importData}
                        />
                      </label>
                    </div>
                  </div>

                  <hr className={`border-t ${theme === 'dark' ? 'border-slate-850' : 'border-slate-150'}`} />

                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      triggerToast('Sampai jumpa lagi!', '👋');
                    }}
                    className="w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/15 transition-all cursor-pointer"
                  >
                    Logout Akun
                  </button>
                </div>
              
    </div>
  );
};
