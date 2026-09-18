import React from 'react';
import { Play, RotateCcw, Home } from 'lucide-react';
import { audioManager } from '../audio/audioManager';

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({
  onResume,
  onRestart,
  onMainMenu,
}) => {
  return (
    <div 
      id="pause-overlay"
      className="absolute inset-0 flex items-center justify-center z-30 pointer-events-auto bg-black/75 backdrop-blur-sm p-4"
    >
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center flex flex-col items-center">
        <h2 className="text-3xl font-black font-orbitron tracking-widest text-white uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] mb-1">
          PAUSED
        </h2>
        <p className="text-xs text-zinc-400 font-orbitron tracking-widest uppercase mb-6">
          SRN CINEMAS: NEON RUN
        </p>

        <div className="flex flex-col gap-3 w-full">
          <button
            id="btn-resume-game"
            onClick={() => {
              audioManager.playClick();
              onResume();
            }}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-orbitron font-bold tracking-wider transition-all duration-150 shadow-[0_0_20px_rgba(239,68,68,0.5)] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            RESUME
          </button>

          <button
            id="btn-restart-from-pause"
            onClick={() => {
              audioManager.playClick();
              onRestart();
            }}
            className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-orbitron font-semibold tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            RESTART
          </button>

          <button
            id="btn-main-menu-from-pause"
            onClick={() => {
              audioManager.playClick();
              onMainMenu();
            }}
            className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-orbitron font-semibold tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
