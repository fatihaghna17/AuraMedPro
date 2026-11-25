import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';
import {
  Activity,
  Home,
  BookOpen,
  PlusCircle,
  Brain,
  StickyNote,
  BarChart2,
  AlertCircle,
  Flame,
  LogOut,
  Users,
  Layers,
  Search,
  ChevronLeft,
  Plus,
  Snowflake,
  Sun,
  Moon,
  X,
  Sparkles,
  Play,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  CultivatorAvatar,
  getEffectiveCultivatorTier,
  getSavedCultivatorGender,
  CultivatorGender,
} from '../utils/cultivatorAvatars';
import { AVATAR_FRAMES, getSavedAvatarFrame, AvatarFrameId } from '../utils/avatarFrames';
import { getStreakFlameStyle } from '../utils/appHelpers';

interface PrimaryNavItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  badge?: number;
}

interface WorkspaceNavItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  dotColor: string;
  dotGlow: string;
}

export interface SidebarNavProps {
  theme: 'light' | 'dark';
  activeTab: string;
  srsDueCount: number;
  currentStreak: number;
  streakFreezeLeft: number;
  username: string;
  userLevel: number;
  isAdmin: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onToggleTheme?: () => void;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const EXPANDED_WIDTH = 296;
const COLLAPSED_WIDTH = 72;
const RAIL_PAD = 6;
const RAIL_WIDTH = 46;
const TAB_LEFT_INSET = 12;

/**
 * Generates a single unified C1-continuous SVG path combining the right vertical
 * porcelain-white rail and the horizontal active-item bridge with concave liquid fillets.
 */
function buildLiquidRailPath(
  width: number,
  height: number,
  rawTop: number,
  rawH: number,
  extend: number
): string {
  const safeH = Math.max(height, 320);
  const railRight = width - RAIL_PAD;
  const railLeft = railRight - RAIL_WIDTH;
  const railR = RAIL_WIDTH / 2;

  const maxProtrusion = railLeft - TAB_LEFT_INSET;
  const protrusion = Math.max(0, Math.min(maxProtrusion, maxProtrusion * extend));

  // Pure vertical stadium pill when tongue is retracted (e.g. Profile tab active)
  if (protrusion < 2) {
    return [
      `M ${railLeft + railR} ${RAIL_PAD}`,
      `A ${railR} ${railR} 0 0 1 ${railRight} ${RAIL_PAD + railR}`,
      `L ${railRight} ${safeH - RAIL_PAD - railR}`,
      `A ${railR} ${railR} 0 0 1 ${railLeft} ${safeH - RAIL_PAD - railR}`,
      `L ${railLeft} ${RAIL_PAD + railR}`,
      `A ${railR} ${railR} 0 0 1 ${railLeft + railR} ${RAIL_PAD}`,
      'Z',
    ].join(' ');
  }

  const h = Math.max(32, rawH);
  const filletR = Math.min(14, protrusion * 0.35);
  const tabR = Math.min(h / 2, Math.max(2, protrusion - filletR));
  const tabLeft = railLeft - protrusion;

  const minTop = RAIL_PAD + railR + filletR + 4;
  const maxTop = Math.max(minTop, safeH - RAIL_PAD - railR - filletR - h - 4);
  const tabTop = Math.max(minTop, Math.min(maxTop, rawTop));
  const tabBottom = tabTop + h;

  return [
    `M ${railLeft + railR} ${RAIL_PAD}`,
    `A ${railR} ${railR} 0 0 1 ${railRight} ${RAIL_PAD + railR}`,
    `L ${railRight} ${safeH - RAIL_PAD - railR}`,
    `A ${railR} ${railR} 0 0 1 ${railLeft} ${safeH - RAIL_PAD - railR}`,
    `L ${railLeft} ${tabBottom + filletR}`,
    `A ${filletR} ${filletR} 0 0 0 ${railLeft - filletR} ${tabBottom}`,
    `L ${tabLeft + tabR} ${tabBottom}`,
    `A ${tabR} ${tabR} 0 0 1 ${tabLeft + tabR} ${tabTop}`,
    `L ${railLeft - filletR} ${tabTop}`,
    `A ${filletR} ${filletR} 0 0 0 ${railLeft} ${tabTop - filletR}`,
    `L ${railLeft} ${RAIL_PAD + railR}`,
    `A ${railR} ${railR} 0 0 1 ${railLeft + railR} ${RAIL_PAD}`,
    'Z',
  ].join(' ');
}

interface DockOrbProps {
  mouseY: MotionValue<number>;
  isActive?: boolean;
  onClick: () => void;
  label: string;
  badge?: number;
  children: React.ReactNode;
}

const DockOrb: React.FC<DockOrbProps> = ({
  mouseY,
  isActive,
  onClick,
  label,
  badge,
  children,
}) => {
  const ref = useRef<HTMLButtonElement>(null);

  const distance = useTransform(mouseY, (val) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds || val === Infinity) return 160;
    return val - bounds.y - bounds.height / 2;
  });

  const sizeSync = useTransform(distance, [-105, 0, 105], [40, 50, 40]);
  const size = useSpring(sizeSync, { mass: 0.1, stiffness: 240, damping: 17 });

  return (
    <motion.button
      ref={ref}
      type="button"
      style={{ width: size, height: size }}
      onClick={onClick}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      title={label}
      className={`relative rounded-full flex items-center justify-center shrink-0 cursor-pointer group hover:scale-100 hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-sky-300 ${
        isActive
          ? 'bg-white text-[#0f172a] shadow-[0_8px_22px_-4px_rgba(255,255,255,0.45)]'
          : 'bg-white/[0.10] hover:bg-white/[0.18] text-white/90 hover:text-white border border-white/[0.16] shadow-[inset_0_1px_1px_rgba(255,255,255,0.28)]'
      }`}
    >
      {children}
      {typeof badge === 'number' && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#fbbf24] text-[#0f172a] text-[9px] font-extrabold tabular-nums flex items-center justify-center ring-2 ring-[#111c38] shadow-sm">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </motion.button>
  );
}

export default function SidebarNav({
  theme,
  activeTab,
  srsDueCount,
  currentStreak,
  streakFreezeLeft,
  username,
  userLevel,
  isAdmin,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  onToggleTheme,
  onTabChange,
  onLogout,
}: SidebarNavProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed ?? internalCollapsed;
  const setCollapsed = useCallback(
    (next: boolean) => {
      if (onCollapsedChange) onCollapsedChange(next);
      else setInternalCollapsed(next);
    },
    [onCollapsedChange]
  );

  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [sidebarHeight, setSidebarHeight] = useState(760);

  const [savedFrameId, setSavedFrameId] = useState<AvatarFrameId>(getSavedAvatarFrame());
  const [cultivatorGender, setCultivatorGender] = useState<CultivatorGender>(
    getSavedCultivatorGender()
  );
  const streakFlame = getStreakFlameStyle(currentStreak);
  const dockMouseY = useMotionValue(Infinity);

  useEffect(() => {
    const handleUpdate = () => {
      setSavedFrameId(getSavedAvatarFrame());
      setCultivatorGender(getSavedCultivatorGender());
    };
    handleUpdate();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('auramedpro_frame_changed', handleUpdate);
    window.addEventListener('auramedpro_avatar_gender_changed', handleUpdate);
    window.addEventListener('auramedpro_avatar_tier_changed', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('auramedpro_frame_changed', handleUpdate);
      window.removeEventListener('auramedpro_avatar_gender_changed', handleUpdate);
      window.removeEventListener('auramedpro_avatar_tier_changed', handleUpdate);
    };
  }, []);

  // Global Cmd/Ctrl + K shortcut to open & focus sidebar search on desktop
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (window.innerWidth >= 1024) {
          e.preventDefault();
          if (isCollapsed) {
            setCollapsed(false);
            setTimeout(() => searchInputRef.current?.focus(), 220);
          } else {
            searchInputRef.current?.focus();
          }
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCollapsed, setCollapsed]);

  const activeFrame = AVATAR_FRAMES.find((f) => f.id === savedFrameId) || AVATAR_FRAMES[0];
  const tier = getEffectiveCultivatorTier(userLevel);

  const primaryItems: PrimaryNavItem[] = useMemo(
    () => [
      { id: 'home', label: 'Beranda', shortLabel: 'BERANDA', icon: Home },
      { id: 'banks', label: 'Bank Soal', shortLabel: 'BANK SOAL', icon: BookOpen },
      { id: 'new', label: 'Mulai Kuis', shortLabel: 'MULAI KUIS', icon: PlusCircle },
      { id: 'flashcard', label: 'Flashcard 3D', shortLabel: 'FLASHCARD', icon: Layers },
      {
        id: 'srs',
        label: 'Spaced Repetition',
        shortLabel: 'REPETISI',
        icon: Brain,
        badge: srsDueCount,
      },
    ],
    [srsDueCount]
  );

  const workspaceItems: WorkspaceNavItem[] = useMemo(
    () => [
      {
        id: 'notes',
        label: 'Study Room',
        shortLabel: 'STUDY ROOM',
        icon: StickyNote,
        dotColor: '#fbbf24',
        dotGlow: 'rgba(251, 191, 36, 0.55)',
      },
      {
        id: 'groups',
        label: 'Grup Belajar',
        shortLabel: 'GRUP BELAJAR',
        icon: Users,
        dotColor: '#34d399',
        dotGlow: 'rgba(52, 211, 153, 0.55)',
      },
      {
        id: 'analysis',
        label: 'Analisis',
        shortLabel: 'ANALISIS',
        icon: BarChart2,
        dotColor: '#f472b6',
        dotGlow: 'rgba(244, 114, 182, 0.55)',
      },
      ...(isAdmin
        ? [
            {
              id: 'reports',
              label: 'Laporan Soal',
              shortLabel: 'LAPORAN',
              icon: AlertCircle,
              dotColor: '#fb7185',
              dotGlow: 'rgba(251, 113, 133, 0.55)',
            },
          ]
        : []),
    ],
    [isAdmin]
  );

  const normalizedQuery = searchTerm.trim().toLowerCase();
  const filteredPrimary = useMemo(
    () =>
      normalizedQuery
        ? primaryItems.filter((i) => i.label.toLowerCase().includes(normalizedQuery))
        : primaryItems,
    [primaryItems, normalizedQuery]
  );
  const filteredWorkspace = useMemo(
    () =>
      normalizedQuery
        ? workspaceItems.filter((i) => i.label.toLowerCase().includes(normalizedQuery))
        : workspaceItems,
    [workspaceItems, normalizedQuery]
  );

  const activeVerticalLabel = useMemo(() => {
    if (activeTab === 'profile') return 'PROFIL';
    const foundPrimary = primaryItems.find((i) => i.id === activeTab);
    if (foundPrimary) return foundPrimary.shortLabel;
    const foundWork = workspaceItems.find((i) => i.id === activeTab);
    if (foundWork) return foundWork.shortLabel;
    return 'AURAMED';
  }, [activeTab, primaryItems, workspaceItems]);

  // Liquid SVG bridge springs
  const springCfg = { stiffness: 390, damping: 33, mass: 0.65 };
  const bridgeTop = useSpring(136, springCfg);
  const bridgeHeight = useSpring(40, springCfg);
  const bridgeExtend = useSpring(1, { stiffness: 340, damping: 30, mass: 0.6 });

  const syncBridgeGeometry = useCallback(() => {
    const asideEl = asideRef.current;
    if (!asideEl) return;
    const asideRect = asideEl.getBoundingClientRect();
    if (asideRect.height > 0) {
      setSidebarHeight(asideRect.height);
    }

    if (isCollapsed || activeTab === 'profile') {
      bridgeExtend.set(0);
      return;
    }

    const activeBtn = itemRefs.current[activeTab];
    if (!activeBtn) {
      bridgeExtend.set(0);
      return;
    }

    const btnRect = activeBtn.getBoundingClientRect();
    const relTop = btnRect.top - asideRect.top;
    bridgeTop.set(relTop);
    bridgeHeight.set(btnRect.height);
    bridgeExtend.set(1);
  }, [activeTab, isCollapsed, bridgeTop, bridgeHeight, bridgeExtend]);

  useEffect(() => {
    syncBridgeGeometry();
    const raf = requestAnimationFrame(syncBridgeGeometry);
    const timer = setTimeout(syncBridgeGeometry, 260);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [syncBridgeGeometry, normalizedQuery, isAdmin]);

  useEffect(() => {
    const asideEl = asideRef.current;
    if (!asideEl) return;
    const ro = new ResizeObserver(() => syncBridgeGeometry());
    ro.observe(asideEl);
    window.addEventListener('resize', syncBridgeGeometry);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', syncBridgeGeometry);
    };
  }, [syncBridgeGeometry]);

  const railPath = useTransform(
    [bridgeTop, bridgeHeight, bridgeExtend],
    ([top, h, ext]) =>
      buildLiquidRailPath(
        EXPANDED_WIDTH,
        sidebarHeight,
        top as number,
        h as number,
        ext as number
      )
  );

  const handlePillMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  // Streak progress ring toward next milestone (7, 14, 30, 60, 100 days)
  const streakTarget =
    currentStreak < 7
      ? 7
      : currentStreak < 14
      ? 14
      : currentStreak < 30
      ? 30
      : currentStreak < 60
      ? 60
      : 100;
  const streakPct = Math.min(100, Math.max(12, Math.round((currentStreak / streakTarget) * 100)));
  const ringCircumference = 2 * Math.PI * 15;
  const ringDashOffset = ringCircumference * (1 - streakPct / 100);

  // Contextual quick actions on the right white rail
  const railContextSecondary = useMemo(() => {
    if (activeTab === 'srs') {
      return { id: 'flashcard', label: 'Buka Flashcard 3D', icon: Layers };
    }
    if (activeTab === 'analysis') {
      return { id: 'banks', label: 'Buka Bank Soal', icon: BookOpen };
    }
    return { id: 'srs', label: 'Review Spaced Repetition', icon: Brain };
  }, [activeTab]);

  const SecondaryContextIcon = railContextSecondary.icon;

  // Sapphire-to-midnight optical glass shell
  const shellBackground =
    theme === 'dark'
      ? 'linear-gradient(180deg, rgba(72, 130, 226, 0.62) 0%, rgba(34, 60, 118, 0.78) 28%, rgba(15, 23, 46, 0.90) 64%, rgba(9, 13, 26, 0.96) 100%)'
      : 'linear-gradient(180deg, rgba(82, 144, 238, 0.88) 0%, rgba(46, 86, 170, 0.91) 36%, rgba(24, 44, 96, 0.95) 74%, rgba(15, 28, 66, 0.97) 100%)';

  return (
    <motion.aside
      ref={asideRef}
      initial={false}
      animate={{
        width: isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        borderRadius: isCollapsed ? 36 : 32,
      }}
      transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.8 }}
      style={{
        background: shellBackground,
        backdropFilter: 'blur(32px) saturate(190%)',
        WebkitBackdropFilter: 'blur(32px) saturate(190%)',
        boxShadow:
          theme === 'dark'
            ? 'inset 0 1.5px 1px rgba(255, 255, 255, 0.42), inset 0 -1px 1px rgba(255, 255, 255, 0.08), 0 24px 54px -12px rgba(2, 6, 23, 0.72), 0 6px 18px -4px rgba(2, 6, 23, 0.45)'
            : 'inset 0 1.5px 1.5px rgba(255, 255, 255, 0.58), inset 0 -1px 1px rgba(255, 255, 255, 0.14), 0 22px 48px -10px rgba(15, 28, 66, 0.38), 0 6px 16px -4px rgba(15, 28, 66, 0.22)',
      }}
      className="fixed top-3 bottom-3 left-3 z-30 hidden lg:flex overflow-hidden border border-sky-200/30 select-none text-white"
    >
      {/* Ambient top radial refraction sheen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 left-4 w-52 h-44 rounded-full bg-sky-300/25 blur-2xl"
      />

      <AnimatePresence mode="wait" initial={false}>
        {isCollapsed ? (
          /* ================================================================
             COLLAPSED DOCK CAPSULE MODE (V10)
             ================================================================ */
          <motion.div
            key="collapsed-dock"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onMouseMove={(e) => dockMouseY.set(e.clientY)}
            onMouseLeave={() => dockMouseY.set(Infinity)}
            className="relative z-10 w-full h-full py-3.5 flex flex-col items-center justify-between"
          >
            {/* Top Brand & Search + Primary Orbs */}
            <div className="flex flex-col items-center gap-2 w-full">
              <DockOrb
                mouseY={dockMouseY}
                onClick={() => setCollapsed(false)}
                label="Perluas Menu AuraMed PRO"
              >
                <Activity className="w-4.5 h-4.5 text-white drop-shadow-xs" />
              </DockOrb>

              <DockOrb
                mouseY={dockMouseY}
                onClick={() => {
                  setCollapsed(false);
                  setTimeout(() => searchInputRef.current?.focus(), 220);
                }}
                label="Cari Menu (⌘K)"
              >
                <Search className="w-4 h-4" />
              </DockOrb>

              <div className="w-6 h-px bg-white/15 my-0.5" />

              {primaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <DockOrb
                    key={item.id}
                    mouseY={dockMouseY}
                    isActive={isActive}
                    onClick={() => onTabChange(item.id)}
                    label={item.label}
                    badge={item.badge}
                  >
                    <Icon className="w-4 h-4" />
                  </DockOrb>
                );
              })}

              <div className="w-6 h-px bg-white/15 my-1" />

              {/* Workspace Colored Jewel Indicators */}
              <div className="flex flex-col items-center gap-2">
                {workspaceItems.map((ws) => {
                  const isActive = activeTab === ws.id;
                  return (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => onTabChange(ws.id)}
                      title={ws.label}
                      aria-label={ws.label}
                      aria-current={isActive ? 'page' : undefined}
                      className={`relative w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-white/20 border border-white/35 shadow-sm'
                          : 'hover:bg-white/10'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute -left-2 w-1 h-1 rounded-full bg-white shadow-[0_0_6px_#fff]" />
                      )}
                      <span
                        style={{
                          backgroundColor: ws.dotColor,
                          boxShadow: `0 0 10px ${ws.dotGlow}`,
                        }}
                        className="w-2.5 h-2.5 rounded-[4px]"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Streak Progress Ring & Avatar */}
            <div className="flex flex-col items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => onTabChange('home')}
                title={`Streak Belajar: ${currentStreak} Hari (${streakFlame.tierName}) • ${streakFreezeLeft} Beku`}
                aria-label={`Streak Belajar ${currentStreak} Hari`}
                className="relative w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center cursor-pointer"
              >
                <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="2.4"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringDashOffset}
                  />
                </svg>
                <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300 absolute" />
              </button>

              <button
                type="button"
                onClick={() => onTabChange('profile')}
                title={`${username || 'Profil'} • Lv ${userLevel}`}
                aria-label="Buka Profil"
                className={`relative w-10 h-10 rounded-full p-0.5 cursor-pointer transition-transform ${
                  activeTab === 'profile'
                    ? 'ring-2 ring-white shadow-[0_0_16px_rgba(255,255,255,0.45)]'
                    : 'hover:ring-2 hover:ring-white/50'
                }`}
              >
                <div
                  className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center ${activeFrame.ringClass}`}
                >
                  <CultivatorAvatar
                    tier={tier}
                    gender={cultivatorGender}
                    className="w-full h-full"
                    uid="sidebar_dock_avatar"
                  />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0b1226]" />
              </button>
            </div>
          </motion.div>
        ) : (
          /* ================================================================
             EXPANDED LIQUID GLASS SIDEBAR MODE (V10)
             ================================================================ */
          <motion.div
            key="expanded-sidebar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full h-full flex"
          >
            {/* Unified Porcelain-White Liquid Rail + Active Tab Bridge */}
            <svg
              aria-hidden="true"
              width={EXPANDED_WIDTH}
              height={sidebarHeight}
              viewBox={`0 0 ${EXPANDED_WIDTH} ${sidebarHeight}`}
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                filter: 'drop-shadow(-4px 6px 18px rgba(6, 12, 30, 0.24))',
              }}
            >
              <motion.path d={railPath} fill="#ffffff" />
            </svg>

            {/* LEFT COLUMN: Header, Search, Nav Pills, Workspace, Streak & Profile */}
            <div
              style={{ width: EXPANDED_WIDTH - RAIL_PAD - RAIL_WIDTH }}
              className="relative z-10 h-full flex flex-col justify-between pl-3.5 pr-2.5 py-3.5"
            >
              {/* Brand Header + Search */}
              <div className="space-y-3 shrink-0">
                <div className="flex items-center justify-between gap-2 pl-0.5 pr-0.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => onTabChange('home')}
                      title="Ke Beranda"
                      className="w-10 h-10 rounded-full bg-gradient-to-b from-white/30 to-white/10 border border-white/35 shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.55),0_6px_16px_rgba(8,15,35,0.25)] flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <Activity className="w-4.5 h-4.5 text-white drop-shadow-xs" />
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-[15px] tracking-tight text-white leading-none">
                          AuraMed
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider bg-white/18 border border-white/25 text-sky-100 leading-none">
                          PRO
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-sky-100/80 tracking-tight leading-tight mt-1 truncate">
                        Clinical workspace
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCollapsed(true)}
                    title="Ciutkan Sidebar"
                    aria-label="Ciutkan Sidebar"
                    className="w-7 h-7 rounded-full bg-white/[0.12] hover:bg-white/[0.22] border border-white/20 flex items-center justify-center text-sky-50 shrink-0 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Frosted Search Input */}
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-sky-100/75 absolute left-3.5 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const firstMatch = filteredPrimary[0] || filteredWorkspace[0];
                        if (firstMatch) {
                          onTabChange(firstMatch.id);
                          setSearchTerm('');
                        }
                      } else if (e.key === 'Escape') {
                        setSearchTerm('');
                        searchInputRef.current?.blur();
                      }
                    }}
                    placeholder="Cari menu..."
                    aria-label="Cari menu navigasi"
                    className="w-full h-9 pl-9 pr-12 rounded-full text-xs font-medium text-white placeholder:text-sky-100/75 bg-white/[0.12] hover:bg-white/[0.16] focus:bg-white/[0.20] border border-white/[0.18] focus:border-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.22)] focus:outline-none transition-colors"
                  />
                  {searchTerm ? (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      aria-label="Bersihkan pencarian"
                      className="absolute right-2.5 p-1 rounded-full hover:bg-white/15 text-sky-100 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  ) : (
                    <span className="absolute right-2.5 px-1.5 py-0.5 rounded-full bg-white/[0.12] text-[9px] font-bold text-sky-100/85 tracking-tight pointer-events-none">
                      ⌘K
                    </span>
                  )}
                </div>
              </div>

              {/* Scrollable Middle Navigation */}
              <div
                ref={scrollAreaRef}
                onScroll={syncBridgeGeometry}
                className="flex-1 min-h-0 overflow-y-auto py-2.5 space-y-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {/* Primary Pill Navigation */}
                {filteredPrimary.length > 0 && (
                  <nav aria-label="Menu Utama" className="space-y-1.5">
                    {filteredPrimary.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          ref={(el) => {
                            itemRefs.current[item.id] = el;
                          }}
                          type="button"
                          onMouseMove={handlePillMouseMove}
                          onClick={() => onTabChange(item.id)}
                          aria-current={isActive ? 'page' : undefined}
                          className={`w-full h-[40px] px-3.5 rounded-full flex items-center justify-between text-[12.5px] tracking-tight cursor-pointer relative overflow-hidden group hover:scale-100 hover:translate-y-0 active:scale-[0.99] transition-colors duration-150 ${
                            isActive
                              ? 'text-[#0f172a] font-bold bg-transparent border border-transparent'
                              : 'text-white/95 font-semibold bg-white/[0.09] hover:bg-white/[0.15] border border-white/[0.14] hover:border-white/[0.26] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.22)]'
                          }`}
                        >
                          {!isActive && (
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              style={{
                                background:
                                  'radial-gradient(100px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.22), transparent 70%)',
                              }}
                            />
                          )}
                          <span className="relative z-10 flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive ? 'text-[#0f172a] stroke-[2.25]' : 'text-white/90'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </span>
                          {typeof item.badge === 'number' && item.badge > 0 && (
                            <span
                              className={`relative z-10 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-extrabold tabular-nums flex items-center justify-center ${
                                isActive
                                  ? 'bg-[#0f172a] text-white'
                                  : 'bg-[#fbbf24] text-[#0f172a] shadow-xs'
                              }`}
                            >
                              {item.badge > 99 ? '99+' : item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                )}

                {/* Secondary Workspace Section */}
                {filteredWorkspace.length > 0 && (
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/70">
                        Ruang Belajar
                      </span>
                      <button
                        type="button"
                        onClick={() => onTabChange('new')}
                        title="Mulai Kuis Baru"
                        aria-label="Mulai Kuis Baru"
                        className="w-5 h-5 rounded-full bg-white/[0.08] hover:bg-white/[0.18] border border-white/15 flex items-center justify-center text-white/90 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <nav aria-label="Ruang Belajar" className="space-y-1">
                      {filteredWorkspace.map((ws) => {
                        const isActive = activeTab === ws.id;
                        const Icon = ws.icon;
                        return (
                          <button
                            key={ws.id}
                            ref={(el) => {
                              itemRefs.current[ws.id] = el;
                            }}
                            type="button"
                            onClick={() => onTabChange(ws.id)}
                            aria-current={isActive ? 'page' : undefined}
                            className={`w-full h-[36px] px-3 rounded-full flex items-center justify-between text-xs cursor-pointer hover:scale-100 hover:translate-y-0 active:scale-[0.99] transition-colors duration-150 ${
                              isActive
                                ? 'text-[#0f172a] font-bold bg-transparent'
                                : 'text-white/90 hover:text-white font-medium bg-white/[0.04] hover:bg-white/[0.10] border border-white/[0.06] hover:border-white/[0.14]'
                            }`}
                          >
                            <span className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                                  isActive ? 'bg-[#0f172a]/10' : 'bg-white/[0.06]'
                                }`}
                              >
                                <span
                                  style={{
                                    backgroundColor: ws.dotColor,
                                    boxShadow: `0 0 8px ${ws.dotGlow}`,
                                  }}
                                  className="w-2 h-2 rounded-[3px]"
                                />
                              </span>
                              <span className="truncate">{ws.label}</span>
                            </span>
                            <Icon
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isActive ? 'text-[#334155]' : 'text-white/60'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                )}

                {filteredPrimary.length === 0 && filteredWorkspace.length === 0 && (
                  <div className="px-3 py-6 text-center text-xs text-white/80">
                    Menu &ldquo;{searchTerm}&rdquo; tidak ditemukan.
                  </div>
                )}
              </div>

              {/* Bottom Streak Progress Ring Card & User Profile Row */}
              <div className="space-y-2.5 pt-2 shrink-0">
                <div
                  className="p-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.12] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.16)] flex items-center justify-between gap-2"
                  title={`Streak Belajar: ${currentStreak} Hari • ${streakFlame.tierName}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                      <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="15"
                          fill="none"
                          stroke="rgba(255,255,255,0.12)"
                          strokeWidth="2.5"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15"
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeDasharray={ringCircumference}
                          strokeDashoffset={ringDashOffset}
                        />
                      </svg>
                      <Flame className="w-3.5 h-3.5 text-[#fcd34d] fill-[#fcd34d] absolute" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white tabular-nums leading-tight truncate">
                        {currentStreak} Hari Streak
                      </p>
                      <p className="text-[10.5px] font-medium text-[#fde68a]/85 leading-tight truncate mt-0.5">
                        {streakFlame.tierName}
                      </p>
                    </div>
                  </div>

                  <div
                    title={`${streakFreezeLeft} Streak Freeze Tersedia`}
                    style={{
                      background: 'linear-gradient(180deg, #fde68a 0%, #f59e0b 100%)',
                      color: '#0f172a',
                    }}
                    className="px-2.5 py-1 rounded-full text-[10.5px] font-extrabold tabular-nums flex items-center gap-1 shrink-0 shadow-xs"
                  >
                    <Snowflake className="w-3 h-3 stroke-[2.5]" />
                    <span>{streakFreezeLeft}</span>
                  </div>
                </div>

                {/* User Profile Footer */}
                <div
                  className={`flex items-center justify-between gap-2 px-1.5 py-1 rounded-2xl transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-white/[0.16] ring-1 ring-white/35'
                      : 'hover:bg-white/[0.08]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onTabChange('profile')}
                    title="Buka Profil & Kustomisasi Avatar"
                    className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer hover:scale-100 hover:translate-y-0"
                  >
                    <div className="relative shrink-0">
                      <div
                        className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center ${activeFrame.ringClass}`}
                      >
                        <CultivatorAvatar
                          tier={tier}
                          gender={cultivatorGender}
                          className="w-full h-full"
                          uid="sidebar_avatar"
                        />
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#34d399] ring-2 ring-[#0b1226]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate leading-tight">
                        {username || 'Mahasiswa'}
                      </p>
                      <p className="text-[10.5px] font-medium text-white/75 tabular-nums truncate leading-tight mt-0.5">
                        Tier {tier} • Level {userLevel}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={onLogout}
                    title="Keluar Sesi"
                    aria-label="Keluar Sesi"
                    className="w-7 h-7 rounded-full hover:bg-rose-500/20 text-white/75 hover:text-rose-200 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Porcelain-White Rail Quick Actions & Vertical Label */}
            <div
              style={{ width: RAIL_WIDTH, marginRight: RAIL_PAD }}
              className="relative z-10 h-full py-3.5 flex flex-col items-center justify-between text-[#1e293b] shrink-0"
            >
              <div className="flex flex-col items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => onTabChange(activeTab === 'new' ? 'banks' : 'new')}
                  title={activeTab === 'new' ? 'Pilih Bank Soal' : 'Mulai Latihan Kuis'}
                  aria-label={activeTab === 'new' ? 'Pilih Bank Soal' : 'Mulai Latihan Kuis'}
                  style={{
                    background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    boxShadow:
                      '0 6px 14px -2px rgba(29, 78, 216, 0.48), inset 0 1px 1px rgba(255, 255, 255, 0.42)',
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
                >
                  {activeTab === 'new' ? (
                    <BookOpen className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 fill-current translate-x-[0.5px]" />
                  )}
                </button>

                <div className="flex flex-col items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onTabChange('banks')}
                    title="Tambah / Kelola Bank Soal"
                    aria-label="Tambah atau Kelola Bank Soal"
                    className="w-8 h-8 rounded-full bg-[#0f172a]/[0.05] hover:bg-[#0f172a]/[0.11] text-[#475569] hover:text-[#0f172a] flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.25]" />
                  </button>

                  <AnimatePresence mode="wait" initial={false}>
                    <motion.button
                      key={railContextSecondary.id}
                      type="button"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.16 }}
                      onClick={() => onTabChange(railContextSecondary.id)}
                      title={railContextSecondary.label}
                      aria-label={railContextSecondary.label}
                      className="w-8 h-8 rounded-full bg-[#0f172a]/[0.05] hover:bg-[#0f172a]/[0.11] text-[#475569] hover:text-[#0f172a] flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <SecondaryContextIcon className="w-3.5 h-3.5" />
                    </motion.button>
                  </AnimatePresence>

                  {onToggleTheme ? (
                    <button
                      type="button"
                      onClick={onToggleTheme}
                      title={
                        theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'
                      }
                      aria-label={
                        theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'
                      }
                      className="w-8 h-8 rounded-full bg-[#0f172a]/[0.05] hover:bg-[#0f172a]/[0.11] text-[#475569] hover:text-[#0f172a] flex items-center justify-center cursor-pointer transition-colors"
                    >
                      {theme === 'dark' ? (
                        <Sun className="w-3.5 h-3.5" />
                      ) : (
                        <Moon className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onTabChange('analysis')}
                      title="Analisis Performa"
                      aria-label="Analisis Performa"
                      className="w-8 h-8 rounded-full bg-[#0f172a]/[0.05] hover:bg-[#0f172a]/[0.11] text-[#475569] hover:text-[#0f172a] flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="pb-3 flex items-center justify-center">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={activeVerticalLabel}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.16 }}
                    style={{
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                    }}
                    className="text-[9px] font-extrabold tracking-[0.24em] text-[#64748b] uppercase whitespace-nowrap"
                  >
                    {activeVerticalLabel}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
