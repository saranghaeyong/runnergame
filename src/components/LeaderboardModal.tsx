import React, { useEffect, useState } from 'react';
import { Trophy, X, RotateCcw } from 'lucide-react';
import { LeaderboardEntry } from '../types';
import { StorageManager } from '../game/storageManager';
import { audioManager } from '../audio/audioManager';

interface LeaderboardModalProps {
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setEntries(StorageManager.getLeaderboard());
  }, []);

  const handleReset = () => {
    if (window.confirm('Reset leaderboard to default hall of fame?')) {
      StorageManager.resetLeaderboard();
      setEntries(StorageManager.getLeaderboard());
      audioManager.playClick();
    }
  };

  return (
    <div 
      id="leaderboard-modal"
      className="absolute inset-0 flex items-center justify-center z-50 pointer-events-auto bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 sm:p-7 max-w-md w-full shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.7)]" />
            <div>
              <h2 className="text-lg sm:text-xl font-black font-orbitron text-white tracking-wide">
                SRN CINEMAS LEADERBOARD
              </h2>
              <div className="text-[10px] font-orbitron text-zinc-400 tracking-widest uppercase">
                TOP RUNNERS HALL OF FAME
              </div>
            </div>
          </div>
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

        {/* Scores List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-1.5 pr-1">
          {entries.map((entry, idx) => {
            const isTop3 = idx < 3;
            let rankBadge = `${idx + 1}`;
            let badgeStyle = 'text-zinc-400 border-zinc-800 bg-zinc-900/50';

            if (idx === 0) {
              badgeStyle = 'text-yellow-400 border-yellow-500/50 bg-yellow-950/30';
              rankBadge = '🥇';
            } else if (idx === 1) {
              badgeStyle = 'text-zinc-300 border-zinc-400/50 bg-zinc-800/40';
              rankBadge = '🥈';
            } else if (idx === 2) {
              badgeStyle = 'text-amber-500 border-amber-600/50 bg-amber-950/30';
              rankBadge = '🥉';
            }

            return (
              <div
                key={entry.id || idx}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  isTop3
                    ? 'border-zinc-800 bg-zinc-900/80 shadow-sm'
                    : 'border-zinc-900 bg-zinc-950/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-orbitron font-bold text-xs border ${badgeStyle}`}>
                    {rankBadge}
                  </div>
                  <div>
                    <div className="text-sm font-orbitron font-bold text-white tracking-wider">
                      {entry.name}
                    </div>
                    {entry.distance && (
                      <div className="text-[10px] font-orbitron text-zinc-500">
                        {entry.distance >= 1000 ? `${(entry.distance / 1000).toFixed(1)} km` : `${entry.distance} m`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right font-orbitron">
                  <div className={`text-base font-black tracking-wider ${idx === 0 ? 'text-yellow-400' : 'text-zinc-100'}`}>
                    {entry.score.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-zinc-500">{entry.date || '2026'}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-zinc-800/80 flex justify-between items-center">
          <button
            onClick={handleReset}
            className="text-[11px] font-orbitron text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET SCORES</span>
          </button>

          <button
            onClick={() => {
              audioManager.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-orbitron text-xs font-bold tracking-wider border border-zinc-700 cursor-pointer active:scale-95 transition-all"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
