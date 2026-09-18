import React from 'react';
import { X, Volume2, Music, Eye, Gauge, Smartphone } from 'lucide-react';
import { GameSettings } from '../types';
import { audioManager } from '../audio/audioManager';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const toggleSound = () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    onUpdateSettings(updated);
    audioManager.playClick();
  };

  const toggleMusic = () => {
    const updated = { ...settings, musicEnabled: !settings.musicEnabled };
    onUpdateSettings(updated);
    audioManager.playClick();
  };

  const toggleReducedMotion = () => {
    const updated = { ...settings, reducedMotion: !settings.reducedMotion };
    onUpdateSettings(updated);
    audioManager.playClick();
  };

  const setDifficulty = (diff: 'EASY' | 'NORMAL' | 'HARD') => {
    const updated = { ...settings, difficulty: diff };
    onUpdateSettings(updated);
    audioManager.playClick();
  };

  const toggleTouchControls = () => {
    const updated = { ...settings, showTouchControls: !settings.showTouchControls };
    onUpdateSettings(updated);
    audioManager.playClick();
  };

  return (
    <div 
      id="settings-modal"
      className="absolute inset-0 flex items-center justify-center z-50 pointer-events-auto bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 sm:p-7 max-w-md w-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
          <h2 className="text-xl font-black font-orbitron text-white tracking-wider uppercase">
            SETTINGS
          </h2>
          <button
            onClick={() => {
              audioManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="py-4 space-y-3.5">
          {/* Sound FX */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-5 h-5 text-red-400" />
              <div>
                <div className="text-sm font-orbitron font-bold text-white">SOUND EFFECTS</div>
                <div className="text-[11px] text-zinc-400">Jumps, slides, power-ups, collisions</div>
              </div>
            </div>
            <button
              onClick={toggleSound}
              className={`px-3 py-1.5 rounded-lg font-orbitron text-xs font-bold transition-all cursor-pointer ${
                settings.soundEnabled
                  ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                  : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {settings.soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Synth Music */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center gap-2.5">
              <Music className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="text-sm font-orbitron font-bold text-white">SYNTH BEATS</div>
                <div className="text-[11px] text-zinc-400">Atmospheric cyberpunk music</div>
              </div>
            </div>
            <button
              onClick={toggleMusic}
              className={`px-3 py-1.5 rounded-lg font-orbitron text-xs font-bold transition-all cursor-pointer ${
                settings.musicEnabled
                  ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                  : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {settings.musicEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center gap-2.5">
              <Eye className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-sm font-orbitron font-bold text-white">REDUCED MOTION</div>
                <div className="text-[11px] text-zinc-400">Disable screen shake & flashing</div>
              </div>
            </div>
            <button
              onClick={toggleReducedMotion}
              className={`px-3 py-1.5 rounded-lg font-orbitron text-xs font-bold transition-all cursor-pointer ${
                settings.reducedMotion
                  ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                  : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {settings.reducedMotion ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Difficulty */}
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <Gauge className="w-5 h-5 text-yellow-400" />
              <div className="text-sm font-orbitron font-bold text-white">DIFFICULTY</div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {(['EASY', 'NORMAL', 'HARD'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`py-2 rounded-lg font-orbitron text-xs font-bold transition-all cursor-pointer ${
                    settings.difficulty === diff
                      ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Touch Controls Override */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-sm font-orbitron font-bold text-white">ON-SCREEN BUTTONS</div>
                <div className="text-[11px] text-zinc-400">Always show touch control buttons</div>
              </div>
            </div>
            <button
              onClick={toggleTouchControls}
              className={`px-3 py-1.5 rounded-lg font-orbitron text-xs font-bold transition-all cursor-pointer ${
                settings.showTouchControls
                  ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                  : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {settings.showTouchControls ? 'ON' : 'AUTO'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={() => {
              audioManager.playClick();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-orbitron text-xs font-bold tracking-wider cursor-pointer active:scale-95 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)]"
          >
            SAVE & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
