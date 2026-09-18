import React, { useState } from 'react';
import { RotateCcw, Home, Trophy, Sparkles, Check } from 'lucide-react';
import { GameStats } from '../types';
import { StorageManager } from '../game/storageManager';
import { audioManager } from '../audio/audioManager';

interface GameOverModalProps {
  stats: GameStats;
  bestScore: number;
  isHighScore: boolean;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  onViewLeaderboard: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  bestScore,
  isHighScore,
  onPlayAgain,
  onMainMenu,
  onViewLeaderboard,
}) => {
  const [playerName, setPlayerName] = useState<string>(StorageManager.getPlayerName());
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    StorageManager.saveScore(playerName, stats.score, Math.floor(stats.distance));
    setSubmitted(true);
    audioManager.playClick();
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.floor(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <div 
      id="game-over-modal"
      className="absolute inset-0 flex items-center justify-center z-40 pointer-events-auto bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300"
    >
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center flex flex-col items-center">
        {/* Game Over Title */}
        <h2 className="text-3xl sm:text-4xl font-black font-orbitron tracking-widest text-red-500 uppercase drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] mb-1">
          GAME OVER
        </h2>
        <div className="text-xs font-orbitron tracking-widest text-zinc-400 uppercase mb-4">
          SRN CINEMAS: NEON RUN
        </div>

        {/* High Score Celebration Badge */}
        {isHighScore && (
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/60 text-yellow-400 font-orbitron text-xs font-bold tracking-widest mb-4 animate-pulse">
            <Sparkles className="w-4 h-4" />
            <span>NEW HIGH SCORE!</span>
            <Sparkles className="w-4 h-4" />
          </div>
        )}

        {/* Primary Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-2.5 mb-4">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex flex-col items-center">
            <span className="text-[11px] font-orbitron font-semibold text-zinc-400 tracking-wider">
              FINAL SCORE
            </span>
            <span className="text-2xl sm:text-3xl font-orbitron font-black text-white tracking-wider mt-0.5">
              {stats.score.toLocaleString()}
            </span>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex flex-col items-center">
            <span className="text-[11px] font-orbitron font-semibold text-zinc-400 tracking-wider">
              DISTANCE
            </span>
            <span className="text-2xl sm:text-3xl font-orbitron font-black text-cyan-400 tracking-wider mt-0.5">
              {formatDistance(stats.distance)}
            </span>
          </div>
        </div>

        {/* Secondary Details: Collectibles breakdown & Best */}
        <div className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3 mb-5 flex justify-between items-center text-xs font-orbitron">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">COLLECTIBLES:</span>
            <span className="text-white font-bold">{stats.collectiblesCount}</span>
            <span className="text-zinc-500 text-[10px]">
              (🎬{stats.filmReels} 🍿{stats.popcorn} ⭐{stats.stars} 🎟{stats.tickets})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">BEST:</span>
            <span className="text-yellow-400 font-bold">{bestScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Submit to Leaderboard Form */}
        {!submitted ? (
          <form onSubmit={handleSaveScore} className="w-full flex gap-2 mb-5">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.toUpperCase().slice(0, 12))}
              placeholder="ENTER RUNNER NAME"
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white font-orbitron text-sm font-semibold tracking-wider placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
              maxLength={12}
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-xs tracking-wider transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
            >
              SAVE
            </button>
          </form>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 py-2 mb-4 text-emerald-400 font-orbitron text-xs font-semibold">
            <Check className="w-4 h-4" />
            <span>RECORDED TO LEADERBOARD!</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            id="btn-play-again"
            onClick={() => {
              audioManager.playClick();
              onPlayAgain();
            }}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-orbitron font-bold text-base tracking-wider transition-all duration-150 shadow-[0_0_20px_rgba(239,68,68,0.5)] active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-red-400/40"
          >
            <RotateCcw className="w-4 h-4" />
            PLAY AGAIN
          </button>

          <div className="flex gap-2 w-full">
            <button
              id="btn-view-leaderboard-from-over"
              onClick={() => {
                audioManager.playClick();
                onViewLeaderboard();
              }}
              className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 font-orbitron text-xs font-semibold tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              LEADERBOARD
            </button>

            <button
              id="btn-main-menu-from-over"
              onClick={() => {
                audioManager.playClick();
                onMainMenu();
              }}
              className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 font-orbitron text-xs font-semibold tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              MAIN MENU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
