import React, { useEffect, useState } from 'react';
import { audioManager } from '../audio/audioManager';

interface CountdownOverlayProps {
  onComplete: () => void;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ onComplete }) => {
  const [count, setCount] = useState<number>(3);
  const [isGo, setIsGo] = useState<boolean>(false);

  useEffect(() => {
    audioManager.playCountdownTick(false);

    const timer1 = setTimeout(() => {
      setCount(2);
      audioManager.playCountdownTick(false);
    }, 850);

    const timer2 = setTimeout(() => {
      setCount(1);
      audioManager.playCountdownTick(false);
    }, 1700);

    const timer3 = setTimeout(() => {
      setIsGo(true);
      audioManager.playCountdownTick(true);
    }, 2550);

    const timer4 = setTimeout(() => {
      onComplete();
    }, 3250);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <div 
      id="countdown-overlay"
      className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none bg-black/40 backdrop-blur-[2px]"
    >
      {/* Film slate reticle */}
      <div className="relative flex items-center justify-center w-64 h-64 border-2 border-red-500/30 rounded-full animate-spin [animation-duration:8s]">
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-red-500/30" />
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-red-500/30" />
      </div>

      <div className="absolute flex flex-col items-center">
        {!isGo ? (
          <div className="text-8xl sm:text-9xl font-black font-orbitron text-white tracking-widest drop-shadow-[0_0_30px_rgba(239,68,68,0.9)] animate-pulse">
            {count}
          </div>
        ) : (
          <div className="text-7xl sm:text-8xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-cyan-400 tracking-wider drop-shadow-[0_0_40px_rgba(6,182,212,0.9)] scale-110 transition-transform">
            ACTION!
          </div>
        )}
        <div className="text-sm font-orbitron font-semibold text-zinc-400 tracking-widest mt-2 uppercase">
          {!isGo ? 'GET READY' : 'LIGHTS. CAMERA. RUN!'}
        </div>
      </div>
    </div>
  );
};
