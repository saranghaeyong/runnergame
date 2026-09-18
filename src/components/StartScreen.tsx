import React from 'react';
import { Play, Trophy, Settings, Film, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { audioManager } from '../audio/audioManager';

interface StartScreenProps {
  bestScore: number;
  onPlay: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  bestScore,
  onPlay,
  onOpenLeaderboard,
  onOpenSettings,
}) => {
  return (
    <div 
      id="start-screen"
      className="absolute inset-0 flex flex-col items-center justify-between p-6 z-20 pointer-events-auto bg-black/60 backdrop-blur-[2px]"
    >
      {/* Top Bar Branding */}
      <div className="w-full flex justify-between items-center max-w-4xl pt-2">
        <div className="flex items-center gap-2 text-xs tracking-widest text-red-500 font-orbitron font-semibold uppercase">
          <Film className="w-4 h-4 text-red-500 animate-pulse" />
          <span>SRN CINEMAS STUDIOS</span>
        </div>
        <div className="text-xs text-zinc-400 font-orbitron">
          BEST: <span className="text-yellow-400 font-bold tracking-wider">{bestScore.toLocaleString()}</span>
        </div>
      </div>

      {/* Hero Title Marquee */}
      <div className="text-center my-auto flex flex-col items-center max-w-lg">
        <div className="inline-block px-3 py-1 mb-3 rounded-full border border-red-500/40 bg-red-950/40 text-red-400 text-xs font-semibold tracking-widest uppercase">
          OFFICIAL THEATRICAL GAME
        </div>

        <h1 className="text-4xl sm:text-6xl font-black font-orbitron tracking-tight text-white uppercase drop-shadow-[0_0_20px_rgba(239,68,68,0.7)]">
          SRN CINEMAS
        </h1>
        <h2 className="text-3xl sm:text-5xl font-black font-orbitron tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-cyan-400 mt-1 mb-3 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]">
          NEON RUN
        </h2>

        <p className="text-base sm:text-lg text-zinc-300 font-rajdhani font-semibold tracking-wider italic mb-8 text-shadow">
          &ldquo;Lights. Camera. RUN!&rdquo;
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto min-w-[280px]">
          <button
            id="btn-play-game"
            onClick={() => {
              audioManager.playClick();
              onPlay();
            }}
            className="flex-1 px-8 py-3.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-orbitron font-bold text-lg tracking-wider transition-all duration-200 shadow-[0_0_25px_rgba(220,38,38,0.6)] hover:shadow-[0_0_35px_rgba(239,68,68,0.8)] active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-red-400/40"
          >
            <Play className="w-5 h-5 fill-white" />
            PLAY
          </button>

          <div className="flex gap-2">
            <button
              id="btn-open-leaderboard"
              onClick={() => {
                audioManager.playClick();
                onOpenLeaderboard();
              }}
              className="flex-1 sm:flex-none px-4 py-3 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-orbitron text-sm font-semibold tracking-wider transition-all hover:border-yellow-500/50 hover:text-yellow-400 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              title="Leaderboard"
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="sm:inline">SCORES</span>
            </button>

            <button
              id="btn-open-settings"
              onClick={() => {
                audioManager.playClick();
                onOpenSettings();
              }}
              className="px-4 py-3 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-orbitron text-sm font-semibold tracking-wider transition-all hover:border-cyan-500/50 hover:text-cyan-400 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Controls Quick Guide */}
      <div className="w-full max-w-xl bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3.5 backdrop-blur-sm">
        <div className="text-[11px] font-orbitron tracking-widest text-zinc-400 uppercase text-center mb-2.5">
          HOW TO PLAY
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs font-rajdhani">
          <div className="bg-zinc-900/60 rounded-lg p-2 border border-zinc-800 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 text-cyan-400 font-orbitron font-bold text-xs mb-1">
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>A / D</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
            <span className="text-zinc-300 font-semibold">Change Lane</span>
          </div>

          <div className="bg-zinc-900/60 rounded-lg p-2 border border-zinc-800 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 text-yellow-400 font-orbitron font-bold text-xs mb-1">
              <ArrowUp className="w-3.5 h-3.5" />
              <span>SPACE / W</span>
            </div>
            <span className="text-zinc-300 font-semibold">Jump Over Barriers</span>
          </div>

          <div className="bg-zinc-900/60 rounded-lg p-2 border border-zinc-800 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 text-red-400 font-orbitron font-bold text-xs mb-1">
              <ArrowDown className="w-3.5 h-3.5" />
              <span>S / DOWN</span>
            </div>
            <span className="text-zinc-300 font-semibold">Slide Under Signs</span>
          </div>
        </div>

        <div className="text-center text-[11px] text-zinc-500 mt-2 font-rajdhani font-semibold">
          Mobile: Swipe or tap on-screen touch buttons to maneuver
        </div>
      </div>
    </div>
  );
};
