import React, { useMemo, useState } from 'react';
import {
  Trophy,
  Crown,
  Globe,
  FileText,
  GraduationCap,
  Stethoscope,
  Shield,
  ChevronDown,
  ChevronUp,
  Info,
  Skull,
  Zap,
  Flame,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  AVATAR_FRAMES,
  AvatarFrame,
  AvatarFrameId,
} from '../utils/avatarFrames';
import {
  CultivatorAvatar,
  CultivatorGender,
  getCultivatorTier,
} from '../utils/cultivatorAvatars';

export interface LeaderboardCardProps {
  theme: string;
  currentUser?: any;
  profileUsername: string;
  cultivatorTier: number;
  cultivatorGender: CultivatorGender;
  currentFrame: AvatarFrame;
  userBestSuddenDeath: number;
  leaderboardType: 'global' | 'file';
  setLeaderboardType: (type: 'global' | 'file') => void;
  globalLeaderboard: any[];
  fileLeaderboard: any[];
  isLeaderboardLoading: boolean;
  globalTimeFilter: 'all' | '1' | '7' | '30';
  setGlobalTimeFilter: (filter: 'all' | '1' | '7' | '30') => void;
  fileTimeFilter: 'all' | '1' | '7' | '30';
  setFileTimeFilter: (filter: 'all' | '1' | '7' | '30') => void;
  selectedLeaderboardFile: string;
  setSelectedLeaderboardFile: (file: string) => void;
  fetchFileLeaderboard: (file: string) => void;
  questionDatabase: Record<string, any>;
  isSuperAdmin?: boolean;
  isAdminAngkatan?: boolean;
  adminAngkatanFilter?: 'all' | '23' | '24' | '25' | '26';
  setAdminAngkatanFilter?: (filter: 'all' | '23' | '24' | '25' | '26') => void;
  userAngkatan?: string;
  userProdi?: string | null;
  leaderboardScope?: 'my' | 'all';
  setLeaderboardScope?: (scope: 'my' | 'all') => void;
  leaderboardProdiFilter?: string;
  setLeaderboardProdiFilter?: (filter: string) => void;
}

interface ResolvedPrestige {
  userLvl: number;
  userQuestions: number;
  ringClass: string;
  auraTitle: string | null;
  auraChipClass: string;
  AuraIcon: LucideIcon | null;
}

const PRESTIGE_LEGEND: Array<{
  key: string;
  title: string;
  requirement: string;
  chipClass: string;
  Icon: LucideIcon;
}> = [
  {
    key: 'demon',
    title: 'Raja Iblis',
    requirement: '100+ streak Sudden Death',
    chipClass: 'lb-chip-crimson',
    Icon: Skull,
  },
  {
    key: 'sultan',
    title: 'Aura Sultan',
    requirement: 'Kultivator Level 95+',
    chipClass: 'lb-chip-gold',
    Icon: Crown,
  },
  {
    key: 'survivor',
    title: 'Survivor',
    requirement: '20+ streak Sudden Death',
    chipClass: 'lb-chip-crimson',
    Icon: Skull,
  },
  {
    key: 'veteran',
    title: 'Veteran',
    requirement: '3.000+ total soal',
    chipClass: 'lb-chip-teal',
    Icon: Zap,
  },
  {
    key: 'maraton',
    title: 'Maraton',
    requirement: '500 soal dalam sehari',
    chipClass: 'lb-chip-peach',
    Icon: Flame,
  },
];

function formatProdiLabel(rawProdi?: string | null): string {
  const normalized = (rawProdi || 'kedokteran').toLowerCase();
  if (normalized === 'farmasi') return 'Farmasi';
  if (normalized === 'kebidanan') return 'Kebidanan';
  return 'Kedokteran';
}

function formatCompactDate(rawDate?: string): string {
  if (!rawDate) return '';
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  currentUser,
  profileUsername,
  cultivatorTier,
  cultivatorGender,
  currentFrame,
  userBestSuddenDeath,
  leaderboardType,
  setLeaderboardType,
  globalLeaderboard,
  fileLeaderboard,
  isLeaderboardLoading,
  globalTimeFilter,
  setGlobalTimeFilter,
  fileTimeFilter,
  setFileTimeFilter,
  selectedLeaderboardFile,
  setSelectedLeaderboardFile,
  fetchFileLeaderboard,
  questionDatabase,
  isSuperAdmin = false,
  isAdminAngkatan = false,
  adminAngkatanFilter = 'all',
  setAdminAngkatanFilter,
  userAngkatan,
  userProdi,
  leaderboardScope = 'my',
  setLeaderboardScope,
  leaderboardProdiFilter = 'all',
  setLeaderboardProdiFilter,
}) => {
  const [showPrestigeInfo, setShowPrestigeInfo] = useState(false);
  const [expandAllMobile, setExpandAllMobile] = useState(false);

  const fileNames = useMemo(() => Object.keys(questionDatabase || {}), [questionDatabase]);
  const activeRows = leaderboardType === 'global' ? globalLeaderboard : fileLeaderboard;
  const totalParticipants =
    activeRows.length > 0
      ? Number(activeRows[0]?.total_participants) || activeRows.length
      : 0;
  const activeTimeFilter = leaderboardType === 'global' ? globalTimeFilter : fileTimeFilter;

  const checkIsCurrentUser = (row: any): boolean => {
    if (!row) return false;
    if (currentUser?.id && (row.id === currentUser.id || row.user_id === currentUser.id)) {
      return true;
    }
    if (
      row.username &&
      profileUsername &&
      row.username.trim().toLowerCase() === profileUsername.trim().toLowerCase()
    ) {
      return true;
    }
    if (
      currentUser?.user_metadata?.username &&
      row.username &&
      row.username.trim().toLowerCase() === currentUser.user_metadata.username.trim().toLowerCase()
    ) {
      return true;
    }
    if (
      currentUser?.email &&
      row.username &&
      row.username.trim().toLowerCase() === currentUser.email.split('@')[0].trim().toLowerCase()
    ) {
      return true;
    }
    return false;
  };

  const resolvePrestige = (row: any, isCurrent: boolean): ResolvedPrestige => {
    const userLvl = Number(row.level) || 1;
    const userQuestions = Number(row.total_questions_answered) || 0;
    const lifetimeQuestions =
      Number(row.lifetime_questions_answered ?? row.total_questions_answered) || 0;
    const isLevel95 = userLvl >= 95;
    const isOver3000 = !isLevel95 && lifetimeQuestions >= 3000;

    const rawFrameId = isCurrent ? currentFrame.id : (row.avatar_frame || 'default');
    const rowFrame = AVATAR_FRAMES.find((f) => f.id === rawFrameId) || AVATAR_FRAMES[0];
    const rowBestSuddenDeath = isCurrent
      ? Math.max(userBestSuddenDeath, Number(row.sudden_death_best) || 0)
      : Number(row.sudden_death_best) || 0;

    const explicitAuraIds: AvatarFrameId[] = [
      'demon_king_100',
      'sudden_death_master',
      'caduceus_mythic',
      'veteran_3000',
      'quest_500_today',
    ];
    const hasExplicitAura = explicitAuraIds.includes(rowFrame.id);
    const hasExplicitNonAuraFrame = rowFrame.id !== 'default' && !hasExplicitAura;

    const hasDemonKing = hasExplicitAura
      ? rowFrame.id === 'demon_king_100'
      : !hasExplicitNonAuraFrame && rowBestSuddenDeath >= 100;

    const hasSurvivor = hasExplicitAura
      ? rowFrame.id === 'sudden_death_master'
      : !hasExplicitNonAuraFrame && !hasDemonKing && rowBestSuddenDeath >= 20;

    const hasSultan = hasExplicitAura
      ? rowFrame.id === 'caduceus_mythic'
      : !hasExplicitNonAuraFrame && !hasDemonKing && !hasSurvivor && isLevel95;

    const hasVeteran = hasExplicitAura
      ? rowFrame.id === 'veteran_3000'
      : !hasExplicitNonAuraFrame && !hasDemonKing && !hasSurvivor && !hasSultan && isOver3000;

    const hasQuest = rowFrame.id === 'quest_500_today';

    if (hasDemonKing) {
      return {
        userLvl,
        userQuestions,
        ringClass: 'p-[2px] bg-gradient-to-tr from-zinc-900 via-red-700 to-rose-500',
        auraTitle: 'Raja Iblis',
        auraChipClass: 'lb-chip-crimson',
        AuraIcon: Skull,
      };
    }
    if (hasSultan) {
      return {
        userLvl,
        userQuestions,
        ringClass: 'p-[2px] bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-300',
        auraTitle: 'Sultan',
        auraChipClass: 'lb-chip-gold',
        AuraIcon: Crown,
      };
    }
    if (hasSurvivor) {
      return {
        userLvl,
        userQuestions,
        ringClass: 'p-[2px] bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500',
        auraTitle: 'Survivor',
        auraChipClass: 'lb-chip-crimson',
        AuraIcon: Skull,
      };
    }
    if (hasVeteran) {
      return {
        userLvl,
        userQuestions,
        ringClass: 'p-[2px] bg-gradient-to-tr from-teal-600 to-emerald-400',
        auraTitle: 'Veteran',
        auraChipClass: 'lb-chip-teal',
        AuraIcon: Zap,
      };
    }
    if (hasQuest) {
      return {
        userLvl,
        userQuestions,
        ringClass: 'p-[2px] bg-gradient-to-tr from-orange-600 to-amber-400',
        auraTitle: 'Maraton',
        auraChipClass: 'lb-chip-peach',
        AuraIcon: Flame,
      };
    }

    const fallbackRing =
      rowFrame.id !== 'default'
        ? rowFrame.ringClass
        : isCurrent && currentFrame.id !== 'default'
        ? currentFrame.ringClass
        : 'p-[1.5px] bg-slate-300/80 dark:bg-slate-700';

    return {
      userLvl,
      userQuestions,
      ringClass: fallbackRing,
      auraTitle: null,
      auraChipClass: '',
      AuraIcon: null,
    };
  };

  const myRankInfo = useMemo(() => {
    for (let i = 0; i < activeRows.length; i++) {
      const row = activeRows[i];
      if (checkIsCurrentUser(row)) {
        const rank = row.isCurrentUserOutOfTop10 ? row.actualRank : i + 1;
        return { rank, row };
      }
    }
    return null;
  }, [activeRows, currentUser, profileUsername]);

  const showPodium = !isLeaderboardLoading && activeRows.length >= 3;
  const podiumEntries = useMemo(() => {
    if (!showPodium) return [];
    // Order: #2 (left), #1 (center elevated), #3 (right)
    return [
      { row: activeRows[1], rank: 2 },
      { row: activeRows[0], rank: 1 },
      { row: activeRows[2], rank: 3 },
    ];
  }, [showPodium, activeRows]);

  const listEntries = useMemo(() => {
    const startIdx = showPodium ? 3 : 0;
    return activeRows.slice(startIdx).map((row, idx) => {
      const originalIndex = startIdx + idx;
      const rank = row.isCurrentUserOutOfTop10 ? row.actualRank : originalIndex + 1;
      return { row, rank, originalIndex };
    });
  }, [activeRows, showPodium]);

  const MOBILE_INITIAL_LIMIT = 12;
  const hasCollapsibleList = listEntries.length > MOBILE_INITIAL_LIMIT;

  const userActiveAuraName = useMemo(() => {
    if (currentFrame.id === 'demon_king_100' || (currentFrame.id === 'default' && userBestSuddenDeath >= 100)) {
      return 'Raja Iblis';
    }
    if (currentFrame.id === 'sudden_death_master' || (currentFrame.id === 'default' && userBestSuddenDeath >= 20)) {
      return 'Survivor';
    }
    if (currentFrame.auraClass) {
      return currentFrame.name;
    }
    return null;
  }, [currentFrame, userBestSuddenDeath]);

  return (
    <div className="p-4 sm:p-6 rounded-2xl liquid-glass-card flex flex-col min-w-0">
      {/* ================================================================= */}
      {/* HEADER: Title, Meta Badges & Primary Mode Switch                  */}
      {/* ================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/60 dark:border-white/10">
        <div className="flex items-start sm:items-center justify-between sm:justify-start gap-2 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
            <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Leaderboard CBT
            </h3>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold tabular-nums text-slate-600 dark:text-slate-300 bg-slate-500/10 dark:bg-white/[0.06]">
              {totalParticipants} peserta
            </span>
            {myRankInfo && !isLeaderboardLoading && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold tabular-nums lb-chip-self">
                Anda #{myRankInfo.rank}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowPrestigeInfo((prev) => !prev)}
            aria-expanded={showPrestigeInfo}
            aria-label="Informasi gelar dan aura peringkat"
            title="Informasi gelar dan aura peringkat"
            className={`lb-touch-control shrink-0 inline-flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-lg text-xs transition-colors cursor-pointer ${
              showPrestigeInfo
                ? 'lb-chip-self'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-500/10 dark:hover:bg-white/10'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mode Segmented Control: Global vs Per File */}
        <div
          role="tablist"
          aria-label="Tipe papan peringkat"
          className="fc3d-segment p-1 rounded-xl grid grid-cols-2 sm:inline-flex w-full sm:w-auto shrink-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={leaderboardType === 'global'}
            onClick={() => setLeaderboardType('global')}
            className={`lb-seg-btn lb-touch-control px-3 py-1.5 sm:py-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
              leaderboardType === 'global'
                ? 'fc3d-segment-pill text-slate-900 dark:text-slate-50'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span>Global</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={leaderboardType === 'file'}
            onClick={() => {
              setLeaderboardType('file');
              if (!selectedLeaderboardFile && fileNames.length > 0) {
                const firstFile = fileNames[0];
                setSelectedLeaderboardFile(firstFile);
                fetchFileLeaderboard(firstFile);
              }
            }}
            className={`lb-seg-btn lb-touch-control px-3 py-1.5 sm:py-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
              leaderboardType === 'file'
                ? 'fc3d-segment-pill text-slate-900 dark:text-slate-50'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>Per File</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* COLLAPSIBLE PRESTIGE LEGEND (Progressive Disclosure)              */}
      {/* ================================================================= */}
      {showPrestigeInfo && (
        <div className="mt-3 p-3 rounded-xl liquid-glass-subtle animate-fade-in">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Gelar Prestasi Papan Peringkat
            </span>
            <button
              type="button"
              onClick={() => setShowPrestigeInfo(false)}
              aria-label="Tutup informasi gelar"
              className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
            {PRESTIGE_LEGEND.map(({ key, title, requirement, chipClass, Icon }) => (
              <div key={key} className="flex items-center justify-between gap-2 py-1 px-2 rounded-lg bg-white/40 dark:bg-white/[0.03]">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${chipClass}`}>
                  <Icon className="w-3 h-3 shrink-0" />
                  <span>{title}</span>
                </span>
                <span className="text-slate-600 dark:text-slate-300 text-right">{requirement}</span>
              </div>
            ))}
          </div>
          {userActiveAuraName && (
            <p className="mt-2 pt-2 border-t border-slate-200/60 dark:border-white/10 text-[11px] text-slate-600 dark:text-slate-300">
              Gelar aktif Anda saat ini:{' '}
              <strong className="font-bold text-slate-900 dark:text-slate-100">
                {userActiveAuraName}
              </strong>
            </p>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* COMPACT FILTER TOOLBAR                                            */}
      {/* ================================================================= */}
      <div className="pt-3.5 pb-3 space-y-2">
        {/* Conditional File Picker (Per File Mode) */}
        {leaderboardType === 'file' && (
          fileNames.length > 0 ? (
            <div className="relative w-full">
              <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                aria-label="Pilih file bank soal"
                value={selectedLeaderboardFile}
                onChange={(e) => setSelectedLeaderboardFile(e.target.value)}
                className="lb-touch-control w-full pl-9 pr-8 py-2 rounded-xl liquid-glass-input text-xs font-semibold text-slate-800 dark:text-slate-100 appearance-none focus:outline-none cursor-pointer truncate"
              >
                {fileNames.map((name) => (
                  <option key={name} value={name} className="dark:bg-slate-900">
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            <div className="px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 bg-slate-500/[0.06] dark:bg-white/[0.04]">
              Belum ada file bank soal yang tersedia untuk ditampilkan.
            </div>
          )
        )}

        {/* Row 1: Time Horizon Segmented Strip (4 balanced segments) */}
        <div
          role="group"
          aria-label="Filter rentang waktu"
          className="fc3d-segment p-1 rounded-xl grid grid-cols-4 w-full"
        >
          {(
            [
              { key: 'all', label: 'Semua' },
              { key: '1', label: 'Hari Ini' },
              { key: '7', label: '7 Hari' },
              { key: '30', label: '30 Hari' },
            ] as const
          ).map((filter) => {
            const isActive = activeTimeFilter === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => {
                  if (leaderboardType === 'global') {
                    setGlobalTimeFilter(filter.key);
                  } else {
                    setFileTimeFilter(filter.key);
                  }
                }}
                className={`lb-seg-btn lb-touch-control px-2 sm:px-3 py-1.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-semibold text-center whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'fc3d-segment-pill text-slate-900 dark:text-slate-50'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Row 2: Symmetrical 2-Column Cohort (Angkatan) + Program Studi Pair */}
        <div className="grid grid-cols-2 gap-2 w-full min-w-0">
          {/* Angkatan Control */}
          {isSuperAdmin ? (
            <div className="relative min-w-0">
              <GraduationCap className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                aria-label="Filter angkatan (Super Admin)"
                value={adminAngkatanFilter || 'all'}
                onChange={(e) =>
                  setAdminAngkatanFilter && setAdminAngkatanFilter(e.target.value as any)
                }
                className="lb-touch-control w-full pl-8 pr-6 sm:pr-7 py-1.5 rounded-xl liquid-glass-input text-xs font-semibold text-slate-800 dark:text-slate-100 appearance-none focus:outline-none cursor-pointer truncate"
              >
                <option value="all" className="dark:bg-slate-900">
                  Semua Angkatan
                </option>
                <option value="23" className="dark:bg-slate-900">
                  Angkatan 2023
                </option>
                <option value="24" className="dark:bg-slate-900">
                  Angkatan 2024
                </option>
                <option value="25" className="dark:bg-slate-900">
                  Angkatan 2025
                </option>
                <option value="26" className="dark:bg-slate-900">
                  Angkatan 2026
                </option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : isAdminAngkatan ? (
            <div className="lb-touch-control px-3 py-1.5 rounded-xl lb-chip-teal text-xs font-semibold flex items-center justify-center sm:justify-start gap-1.5 truncate">
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                Angkatan {userAngkatan ? `20${userAngkatan}` : 'Saya'}
              </span>
            </div>
          ) : (
            <div className="relative min-w-0">
              <GraduationCap className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                aria-label="Cakupan angkatan"
                value={leaderboardScope}
                onChange={(e) =>
                  setLeaderboardScope && setLeaderboardScope(e.target.value as 'my' | 'all')
                }
                className="lb-touch-control w-full pl-8 pr-6 sm:pr-7 py-1.5 rounded-xl liquid-glass-input text-xs font-semibold text-slate-800 dark:text-slate-100 appearance-none focus:outline-none cursor-pointer truncate"
              >
                <option value="my" className="dark:bg-slate-900">
                  Angkatan {userAngkatan ? `20${userAngkatan}` : 'Saya'}
                </option>
                <option value="all" className="dark:bg-slate-900">
                  Lintas Angkatan
                </option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Program Studi Control */}
          <div className="relative min-w-0">
            <Stethoscope className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              aria-label="Filter program studi"
              value={leaderboardProdiFilter || 'all'}
              onChange={(e) =>
                setLeaderboardProdiFilter && setLeaderboardProdiFilter(e.target.value)
              }
              className="lb-touch-control w-full pl-8 pr-6 sm:pr-7 py-1.5 rounded-xl liquid-glass-input text-xs font-semibold text-slate-800 dark:text-slate-100 appearance-none focus:outline-none cursor-pointer truncate"
            >
              {[
                { key: 'all', label: 'Semua Prodi' },
                { key: 'kedokteran', label: 'Kedokteran' },
                { key: 'farmasi', label: 'Farmasi' },
                { key: 'kebidanan', label: 'Kebidanan' },
              ].map((item) => (
                <option key={item.key} value={item.key} className="dark:bg-slate-900">
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* RANKINGS BODY: Loading Skeleton / Empty State / Podium + List     */}
      {/* ================================================================= */}
      {isLeaderboardLoading ? (
        <div className="space-y-3 pt-1" aria-busy="true" aria-label="Memuat papan peringkat">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end">
            {[0, 1, 2].map((slot) => (
              <div
                key={slot}
                className={`rounded-xl lb-podium-slot flex flex-col items-center px-2 ${
                  slot === 1 ? 'py-4' : 'py-3'
                }`}
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-300/60 dark:bg-slate-700/60 animate-pulse" />
                <div className="w-16 h-3 rounded bg-slate-300/60 dark:bg-slate-700/60 animate-pulse mt-2.5" />
                <div className="w-12 h-3.5 rounded bg-slate-300/50 dark:bg-slate-700/50 animate-pulse mt-1.5" />
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200/60 dark:border-white/10 divide-y divide-slate-200/55 dark:divide-white/[0.07]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3 px-2">
                <div className="w-5 h-3.5 rounded bg-slate-300/50 dark:bg-slate-700/50 animate-pulse shrink-0" />
                <div className="w-9 h-9 rounded-full bg-slate-300/60 dark:bg-slate-700/60 animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="w-28 h-3.5 rounded bg-slate-300/60 dark:bg-slate-700/60 animate-pulse" />
                  <div className="w-20 h-2.5 rounded bg-slate-300/40 dark:bg-slate-700/40 animate-pulse" />
                </div>
                <div className="w-12 h-4 rounded bg-slate-300/60 dark:bg-slate-700/60 animate-pulse shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ) : activeRows.length === 0 ? (
        <div className="py-10 px-4 text-center border-t border-slate-200/60 dark:border-white/10 mt-1">
          <Trophy className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {leaderboardType === 'global'
              ? 'Belum ada data peringkat global'
              : 'Belum ada peringkat untuk file ini'}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xs mx-auto">
            {activeTimeFilter !== 'all'
              ? 'Belum ada peserta yang tercatat pada rentang waktu ini. Coba ubah filter ke Semua.'
              : 'Selesaikan latihan soal untuk mencatatkan skor Anda di papan peringkat.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {/* --------------------------------------------------------------- */}
          {/* TOP 3 PODIUM (Shown when >= 3 participants)                     */}
          {/* --------------------------------------------------------------- */}
          {showPodium && (
            <div
              aria-label="Tiga peringkat teratas"
              className="grid grid-cols-3 gap-2 sm:gap-3 items-end"
            >
              {podiumEntries.map(({ row, rank }) => {
                const isCurrent = checkIsCurrentUser(row);
                const prestige = resolvePrestige(row, isCurrent);
                const isFirst = rank === 1;
                const medalClass =
                  rank === 1 ? 'lb-medal-1' : rank === 2 ? 'lb-medal-2' : 'lb-medal-3';

                return (
                  <div
                    key={`podium_${rank}_${row.id || row.username}`}
                    className={`rounded-xl flex flex-col items-center text-center min-w-0 px-2 sm:px-3 ${
                      isFirst
                        ? 'lb-podium-gold pt-3.5 pb-3 sm:pt-4 sm:pb-3.5'
                        : 'lb-podium-slot pt-2.5 pb-2.5 sm:pt-3 sm:pb-3'
                    } ${isCurrent ? 'lb-podium-current' : ''}`}
                  >
                    <div className="relative mb-2">
                      <div
                        className={`rounded-full flex items-center justify-center ${
                          isFirst ? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-10 h-10 sm:w-12 sm:h-12'
                        } ${prestige.ringClass}`}
                      >
                        <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                          <CultivatorAvatar
                            tier={
                              isCurrent
                                ? cultivatorTier
                                : getCultivatorTier(Number(row.level) || 1)
                            }
                            gender={isCurrent ? cultivatorGender : 'pria'}
                            className="w-full h-full"
                            uid={`lb_pod_${rank}_${row.username}`}
                          />
                        </div>
                      </div>
                      <span
                        className={`-bottom-1.5 left-1/2 -translate-x-1/2 absolute inline-flex items-center gap-0.5 px-1.5 py-0.5 leading-none rounded-full text-[10px] font-extrabold tabular-nums shadow-xs ${medalClass}`}
                      >
                        {isFirst && <Crown className="w-2.5 h-2.5 shrink-0" />}
                        <span>#{rank}</span>
                      </span>
                    </div>

                    <div className="w-full min-w-0 mt-1">
                      <div className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate">
                        {row.username}
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate tabular-nums mt-0.5">
                        {isCurrent ? (
                          <span className="font-bold text-indigo-800 dark:text-indigo-300">
                            Anda · Lv {prestige.userLvl}
                          </span>
                        ) : (
                          <>
                            Lv {prestige.userLvl}
                            {row.angkatan ? ` · '${row.angkatan}` : ''}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-1.5 tabular-nums">
                      {leaderboardType === 'global' ? (
                        <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-50">
                          {prestige.userQuestions.toLocaleString('id-ID')}{' '}
                          <span className="text-[10px] sm:text-[11px] font-medium text-slate-600 dark:text-slate-300">
                            soal
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center leading-tight">
                          <span className="text-xs sm:text-sm font-extrabold lb-score-emerald">
                            {row.score}%
                          </span>
                          <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">
                            {row.questions_count} soal
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* SEAMLESS RANKING LIST (#4+ when podium shown, #1+ otherwise)    */}
          {/* --------------------------------------------------------------- */}
          {listEntries.length > 0 && (
            <div className="border-t border-slate-200/60 dark:border-white/10 pt-1">
              <div className="lg:max-h-[400px] lg:overflow-y-auto fc3d-scroll divide-y divide-slate-200/50 dark:divide-white/[0.06]">
                {listEntries.map(({ row, rank, originalIndex }, idx) => {
                  const isHiddenOnMobile =
                    hasCollapsibleList &&
                    !expandAllMobile &&
                    idx >= MOBILE_INITIAL_LIMIT &&
                    !row.isCurrentUserOutOfTop10;

                  const isCurrent = checkIsCurrentUser(row);
                  const prestige = resolvePrestige(row, isCurrent);
                  const AuraIcon = prestige.AuraIcon;
                  const prodiLabel = formatProdiLabel(row.prodi);
                  const shortDate =
                    leaderboardType === 'file' ? formatCompactDate(row.created_at) : '';

                  return (
                    <React.Fragment
                      key={`row_${originalIndex}_${row.id || row.user_id || row.username}`}
                    >
                      {row.isCurrentUserOutOfTop10 && (
                        <div className="py-2 px-2 flex items-center gap-2">
                          <div className="h-px flex-1 border-t border-dashed border-slate-300 dark:border-white/15" />
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                            Posisi Anda di luar Top 10
                          </span>
                          <div className="h-px flex-1 border-t border-dashed border-slate-300 dark:border-white/15" />
                        </div>
                      )}

                      <div
                        className={`lb-row rounded-xl flex items-center gap-2.5 sm:gap-3.5 py-2.5 sm:py-3 px-2 sm:px-3 ${
                          isCurrent ? 'lb-row-current' : ''
                        } ${isHiddenOnMobile ? 'hidden lg:flex' : 'flex'}`}
                      >
                        {/* Rank Number */}
                        <div className="w-7 sm:w-8 shrink-0 text-center tabular-nums">
                          {rank <= 3 ? (
                            <span
                              className={`inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                                rank === 1
                                  ? 'lb-medal-1'
                                  : rank === 2
                                  ? 'lb-medal-2'
                                  : 'lb-medal-3'
                              }`}
                            >
                              {rank}
                            </span>
                          ) : (
                            <span
                              className={`text-xs sm:text-[13px] font-bold ${
                                isCurrent
                                  ? 'text-indigo-800 dark:text-indigo-300 font-extrabold'
                                  : 'text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {rank}
                            </span>
                          )}
                        </div>

                        {/* Cultivator Avatar */}
                        <div
                          className={`relative shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${prestige.ringClass}`}
                        >
                          <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                            <CultivatorAvatar
                              tier={
                                isCurrent
                                  ? cultivatorTier
                                  : getCultivatorTier(Number(row.level) || 1)
                              }
                              gender={isCurrent ? cultivatorGender : 'pria'}
                              className="w-full h-full"
                              uid={`lb_row_${originalIndex}_${row.username}`}
                            />
                          </div>
                        </div>

                        {/* Identity & Compact Metadata */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[13px] sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                              {row.username}
                            </span>
                            {isCurrent && (
                              <span className="shrink-0 px-1.5 py-0.5 leading-none rounded text-[10px] font-bold lb-chip-self">
                                Anda
                              </span>
                            )}
                            {prestige.auraTitle && AuraIcon && (
                              <span
                                className={`shrink-0 items-center gap-1 px-1.5 py-0.5 leading-none rounded text-[10px] font-bold ${
                                  isCurrent ? 'hidden sm:inline-flex' : 'inline-flex'
                                } ${prestige.auraChipClass}`}
                              >
                                <AuraIcon className="w-2.5 h-2.5 shrink-0" />
                                <span>{prestige.auraTitle}</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 tabular-nums truncate mt-0.5">
                            <span>Lv {prestige.userLvl}</span>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{prodiLabel}</span>
                            {row.angkatan && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>&apos;{row.angkatan}</span>
                              </>
                            )}
                            {isCurrent && prestige.auraTitle && (
                              <span className="sm:hidden">· {prestige.auraTitle}</span>
                            )}
                            {leaderboardType === 'file' && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{row.questions_count} soal</span>
                                {shortDate && (
                                  <span className="hidden sm:inline">· {shortDate}</span>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right-Aligned Metric (Strict Tabular Nums) */}
                        <div className="shrink-0 text-right tabular-nums pl-1">
                          {leaderboardType === 'global' ? (
                            <>
                              <div className="text-sm sm:text-[15px] font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                                {prestige.userQuestions.toLocaleString('id-ID')}
                              </div>
                              <div className="text-[10px] font-medium text-slate-600 dark:text-slate-300 leading-tight">
                                soal
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-sm sm:text-[15px] font-extrabold lb-score-emerald leading-tight">
                                {row.score}%
                              </div>
                              <div className="text-[10px] font-medium text-slate-600 dark:text-slate-300 leading-tight">
                                <span className="sm:hidden">{shortDate || 'Skor'}</span>
                                <span className="hidden sm:inline">Skor terbaik</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Mobile Progressive Disclosure Toggle for Long Lists (e.g. Admin View) */}
              {hasCollapsibleList && (
                <button
                  type="button"
                  onClick={() => setExpandAllMobile((prev) => !prev)}
                  className="lg:hidden lb-touch-control w-full mt-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-white/40 dark:hover:bg-white/[0.04]"
                >
                  {expandAllMobile ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Ringkas daftar</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Lihat semua ({activeRows.length} peserta)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeaderboardCard;
