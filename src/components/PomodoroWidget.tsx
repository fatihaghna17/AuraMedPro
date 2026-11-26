import React from 'react';
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';

export type PomodoroMode = 'focus' | 'break' | 'long_break';

interface PomodoroWidgetProps {
  theme: 'light' | 'dark';
  mode: PomodoroMode;
  secondsLeft: number;
  isActive: boolean;
  completedSessions: number;
  onToggle: () => void;
  onReset: () => void;
  onSelectMode?: (mode: PomodoroMode) => void;
  onAddMinutes?: (mins: number) => void;
}

export default function PomodoroWidget({
  theme,
  mode,
  secondsLeft,
  isActive,
  completedSessions,
  onToggle,
  onReset,
  onSelectMode,
  onAddMinutes,
}: PomodoroWidgetProps) {
  const totalTime = mode === 'focus' ? 25 * 60 : mode === 'long_break' ? 15 * 60 : 5 * 60;
  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const seconds = (secondsLeft % 60).toString().padStart(2, '0');
  const progress = totalTime > 0 ? 364.4 - (364.4 * (secondsLeft / totalTime)) : 0;

  const modeThemes = {
    focus: {
      label: 'Fokus',
      duration: '25m',
      icon: '🧠',
      stroke: 'stroke-indigo-600',
      activeBadge: 'bg-indigo-600 text-white',
      badgeColor: 'text-indigo-600 dark:text-indigo-400',
    },
    break: {
      label: 'Istirahat',
      duration: '5m',
      icon: '☕',
      stroke: 'stroke-emerald-500',
      activeBadge: 'bg-emerald-600 text-white',
      badgeColor: 'text-emerald-600 dark:text-emerald-400',
    },
    long_break: {
      label: 'Istirahat Panjang',
      duration: '15m',
      icon: '🌴',
      stroke: 'stroke-amber-500',
      activeBadge: 'bg-amber-600 text-white',
      badgeColor: 'text-amber-600 dark:text-amber-400',
    },
  };

  const currentMeta = modeThemes[mode] || modeThemes.focus;

  return (
    <div className="p-4 sm:p-6 rounded-2xl liquid-glass-card flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Pomodoro Timer</h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
            isActive ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 animate-pulse' : 'liquid-glass-subtle text-slate-600 dark:text-slate-400'
          }`}>
            {isActive ? 'Berjalan' : 'Jeda'}
          </span>
        </div>
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 tabular-nums" title="Total sesi fokus yang diselesaikan">
          <Coffee className="w-3.5 h-3.5 text-amber-500" />
          <span>{completedSessions} Selesai</span>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      {onSelectMode && (
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5 p-1 rounded-xl liquid-glass-subtle mb-4">
          {(['focus', 'break', 'long_break'] as PomodoroMode[]).map((m) => {
            const isSelected = mode === m;
            const meta = modeThemes[m];
            return (
              <button
                key={m}
                type="button"
                onClick={() => onSelectMode(m)}
                className={`py-1.5 px-1.5 sm:px-2 rounded-lg text-[10px] sm:text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer truncate ${
                  isSelected
                    ? meta.activeBadge + ' shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/10'
                }`}
              >
                <span className="shrink-0">{meta.icon}</span>
                {m === 'long_break' ? (
                  <>
                    <span className="truncate sm:hidden">Panjang</span>
                    <span className="truncate hidden sm:inline">{meta.label}</span>
                  </>
                ) : (
                  <span className="truncate">{meta.label}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Circular Clock Graphic */}
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r="58"
              className="fill-none stroke-slate-200/80 dark:stroke-slate-800/80"
              strokeWidth="8"
            />
            <circle
              cx="64"
              cy="64"
              r="58"
              className={`fill-none ${currentMeta.stroke} transition-all duration-300`}
              strokeWidth="8"
              strokeDasharray="364.4"
              strokeDashoffset={progress}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {minutes}:{seconds}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 tabular-nums ${currentMeta.badgeColor}`}>
              {currentMeta.label} ({Math.round(totalTime / 60)}m)
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={onToggle}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
              isActive
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20'
            }`}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            {isActive ? 'Jeda' : 'Mulai'}
          </button>

          {onAddMinutes && (
            <button
              type="button"
              onClick={() => onAddMinutes(5)}
              className="px-3 py-2.5 rounded-xl liquid-glass-subtle-interactive text-slate-700 dark:text-slate-300 text-xs font-bold tabular-nums cursor-pointer"
              title="Tambah 5 Menit (+5m)"
            >
              +5m
            </button>
          )}

          <button
            type="button"
            onClick={onReset}
            className="p-2.5 rounded-xl liquid-glass-subtle-interactive text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}


