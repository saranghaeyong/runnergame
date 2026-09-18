import React from 'react';
import { Heart, Volume2, VolumeX, Pause, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import { ActivePowerUp, GameStats } from '../types';

interface GameHudProps {
  stats: GameStats;
  lives: number;
  maxLives: number;
  bestScore: number;
  activePowerUps: ActivePowerUp[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onPause: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
  onSlide: () => void;
  showTouchControls: boolean;
}

export const GameHud: React.FC<GameHudProps> = ({
  stats,
  lives,
  maxLives,
  bestScore,
  activePowerUps,
  soundEnabled,
  onToggleSound,
  onPause,
  onMoveLeft,
  onMoveRight,
  onJump,
  onSlide,
  showTouchControls,
}) => {
  // Format score with leading zeroes (6 digits)
  const formattedScore = stats.score.toString().padStart(6, '0');
  const formattedBest = bestScore.toString().padStart(6, '0');

  // Format distance (m or km)
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.floor(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <div id="game-hud" className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-10 select-none">
      {/* Top Header Row */}
      <div className="flex justify-between items-start w-full">
        {/* Top-Left: Score & Best */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-md rounded-xl p-2.5 sm:px-4 sm:py-3 shadow-lg flex flex-col">
          <div className="text-[10px] sm:text-xs font-orbitron font-semibold text-zinc-400 tracking-widest">
            SCORE
          </div>
          <div className="text-xl sm:text-3xl font-orbitron font-black text-white tracking-widest leading-none my-0.5 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
            {formattedScore}
          </div>
          <div className="text-[10px] sm:text-xs font-orbitron text-zinc-400 flex items-center gap-1.5 mt-0.5">
            <span>BEST:</span>
            <span className="text-yellow-400 font-bold">{formattedBest}</span>
          </div>
        </div>

        {/* Top-Center: Distance */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-md rounded-xl px-3 py-2 sm:px-5 sm:py-2.5 shadow-lg flex flex-col items-center">
          <div className="text-[10px] sm:text-xs font-orbitron font-semibold text-red-400 tracking-widest">
            DISTANCE
          </div>
          <div className="text-lg sm:text-2xl font-orbitron font-black text-white tracking-wider leading-none mt-0.5">
            {formatDistance(stats.distance)}
          </div>
        </div>

        {/* Top-Right: Lives & Controls */}
        <div className="flex items-center gap-2">
          {/* Lives Counter */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-md rounded-xl px-3 py-2.5 shadow-lg flex items-center gap-1.5">
            {Array.from({ length: maxLives }).map((_, idx) => (
              <Heart
                key={idx}
                className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${
                  idx < lives
                    ? 'text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] scale-100'
                    : 'text-zinc-700 fill-zinc-900/50 scale-90'
                }`}
              />
            ))}
          </div>

          {/* Sound Mute/Unmute */}
          <button
            id="hud-toggle-sound"
            onClick={onToggleSound}
            className="pointer-events-auto bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 p-2.5 sm:p-3 rounded-xl backdrop-blur-md text-zinc-300 hover:text-white transition-all active:scale-95 cursor-pointer shadow-lg"
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-500" />}
          </button>

          {/* Pause Button */}
          <button
            id="hud-pause-btn"
            onClick={onPause}
            className="pointer-events-auto bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 p-2.5 sm:p-3 rounded-xl backdrop-blur-md text-zinc-300 hover:text-white transition-all active:scale-95 cursor-pointer shadow-lg"
            title="Pause (ESC)"
          >
            <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Active Power-Ups Row (Below Header) */}
      <div className="flex flex-wrap gap-2 mt-2">
        {activePowerUps.map((p) => {
          const pct = Math.max(0, Math.min(100, (p.remainingTime / p.totalDuration) * 100));
          let name = 'MAGNET';
          let icon = '🧲';
          let barColor = 'bg-cyan-500';

          if (p.type === 'SHIELD') {
            name = 'SHIELD';
            icon = '🛡';
            barColor = 'bg-emerald-500';
          } else if (p.type === 'DOUBLE_SCORE') {
            name = '2X SCORE';
            icon = '⚡';
            barColor = 'bg-amber-500';
          } else if (p.type === 'SLOW_MO') {
            name = 'SLOW-MO';
            icon = '⏱';
            barColor = 'bg-purple-500';
          }

          return (
            <div
              key={p.type}
              className="bg-zinc-950/90 border border-zinc-800/90 rounded-lg px-2.5 py-1.5 flex flex-col gap-1 min-w-[100px] backdrop-blur-md shadow-md"
            >
              <div className="flex items-center justify-between text-[11px] font-orbitron font-bold text-white">
                <span className="flex items-center gap-1">
                  <span>{icon}</span>
                  <span>{name}</span>
                </span>
                <span className="text-[10px] text-zinc-400">{Math.ceil(p.remainingTime)}s</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} transition-all duration-100 rounded-full`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Spacer for 3D Viewport */}
      <div className="flex-1" />

      {/* Mobile Touch Controls (Thumb friendly buttons) */}
      <div className={`w-full pointer-events-none flex justify-between items-end pb-2 sm:pb-4 ${showTouchControls ? 'flex' : 'flex md:hidden'}`}>
        {/* Left / Right Thumb Controls */}
        <div className="flex gap-2.5 pointer-events-auto">
          <button
            id="touch-btn-left"
            onClick={onMoveLeft}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center backdrop-blur-md active:bg-cyan-950/60 active:scale-90 active:border-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] touch-manipulation cursor-pointer"
            aria-label="Move Left"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>

          <button
            id="touch-btn-right"
            onClick={onMoveRight}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center backdrop-blur-md active:bg-cyan-950/60 active:scale-90 active:border-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] touch-manipulation cursor-pointer"
            aria-label="Move Right"
          >
            <ArrowRight className="w-7 h-7" />
          </button>
        </div>

        {/* Jump / Slide Thumb Controls */}
        <div className="flex gap-2.5 pointer-events-auto">
          <button
            id="touch-btn-jump"
            onClick={onJump}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-950/80 border border-yellow-500/40 text-yellow-400 flex items-center justify-center backdrop-blur-md active:bg-yellow-950/60 active:scale-90 active:border-yellow-400 transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)] touch-manipulation cursor-pointer"
            aria-label="Jump"
          >
            <ArrowUp className="w-7 h-7" />
          </button>

          <button
            id="touch-btn-slide"
            onClick={onSlide}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-950/80 border border-red-500/40 text-red-400 flex items-center justify-center backdrop-blur-md active:bg-red-950/60 active:scale-90 active:border-red-400 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] touch-manipulation cursor-pointer"
            aria-label="Slide"
          >
            <ArrowDown className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};
