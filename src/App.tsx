import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { ActivePowerUp, GameSettings, GameState, GameStats } from './types';
import { StartScreen } from './components/StartScreen';
import { CountdownOverlay } from './components/CountdownOverlay';
import { GameHud } from './components/GameHud';
import { PauseOverlay } from './components/PauseOverlay';
import { GameOverModal } from './components/GameOverModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { SettingsModal } from './components/SettingsModal';
import { StorageManager } from './game/storageManager';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // React UI States
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    distance: 0,
    collectiblesCount: 0,
    filmReels: 0,
    popcorn: 0,
    stars: 0,
    tickets: 0,
  });
  const [lives, setLives] = useState<number>(3);
  const [bestScore, setBestScore] = useState<number>(18920);
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
  const [isHighScore, setIsHighScore] = useState<boolean>(false);
  const [settings, setSettings] = useState<GameSettings>(() => StorageManager.getSettings());

  // Modals on top of menu
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Initialize Game Engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;

    // Connect callbacks
    engine.onStateChange = (newState) => {
      setGameState(newState);
    };

    engine.onStatsUpdate = (newStats, currentLives, currentPowerUps) => {
      setStats({ ...newStats });
      setLives(currentLives);
      setActivePowerUps([...currentPowerUps]);
      setBestScore(engine.bestScore);
    };

    engine.onGameOver = (finalStats, highScoreAchieved) => {
      setStats({ ...finalStats });
      setIsHighScore(highScoreAchieved);
      setBestScore(StorageManager.getBestScore());
    };

    setBestScore(engine.bestScore);

    const handleWindowResize = () => {
      engine.handleResize();
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      engine.destroy();
    };
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      // Handle Pause toggle
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        if (engine.gameState === 'PLAYING') {
          engine.pauseGame();
        } else if (engine.gameState === 'PAUSED') {
          engine.resumeGame();
        }
        return;
      }

      if (engine.gameState !== 'PLAYING') return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          engine.moveLeft();
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          engine.moveRight();
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          e.preventDefault();
          engine.jump();
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          engine.slide();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Mobile Touch Swipe Handling
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current || e.changedTouches.length === 0) return;
    const engine = engineRef.current;
    if (!engine || engine.gameState !== 'PLAYING') return;

    const dx = e.changedTouches[0].clientX - touchStartPos.current.x;
    const dy = e.changedTouches[0].clientY - touchStartPos.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    const threshold = 25; // minimum swipe distance

    if (absDx > absDy && absDx > threshold) {
      // Horizontal swipe
      if (dx < 0) {
        engine.moveLeft();
      } else {
        engine.moveRight();
      }
    } else if (absDy > absDx && absDy > threshold) {
      // Vertical swipe
      if (dy < 0) {
        engine.jump();
      } else {
        engine.slide();
      }
    }

    touchStartPos.current = null;
  };

  // Actions
  const handleStartCountdown = useCallback(() => {
    setShowLeaderboard(false);
    setShowSettings(false);
    setGameState('COUNTDOWN');
  }, []);

  const handleCountdownFinished = useCallback(() => {
    const engine = engineRef.current;
    if (engine) {
      engine.startGame();
    }
  }, []);

  const handleResume = useCallback(() => {
    const engine = engineRef.current;
    if (engine) {
      engine.resumeGame();
    }
  }, []);

  const handleRestart = useCallback(() => {
    setGameState('COUNTDOWN');
  }, []);

  const handleMainMenu = useCallback(() => {
    const engine = engineRef.current;
    if (engine) {
      engine.setGameState('MENU');
      setBestScore(StorageManager.getBestScore());
    }
  }, []);

  const handleToggleSound = useCallback(() => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    setSettings(updated);
    if (engineRef.current) {
      engineRef.current.updateSettings(updated);
    }
  }, [settings]);

  const handleUpdateSettings = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
    if (engineRef.current) {
      engineRef.current.updateSettings(newSettings);
    }
  }, []);

  return (
    <main 
      className="relative w-screen h-screen overflow-hidden bg-black select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Primary Pseudo-3D Canvas */}
      <canvas
        id="game-canvas"
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block touch-none"
      />

      {/* 1. Start Screen */}
      {gameState === 'MENU' && !showLeaderboard && !showSettings && (
        <StartScreen
          bestScore={bestScore}
          onPlay={handleStartCountdown}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* 2. Cinematic Countdown Slate */}
      {gameState === 'COUNTDOWN' && (
        <CountdownOverlay onComplete={handleCountdownFinished} />
      )}

      {/* 3. In-Game HUD (Visible during Playing, Paused, and Game Over background) */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <GameHud
          stats={stats}
          lives={lives}
          maxLives={3}
          bestScore={bestScore}
          activePowerUps={activePowerUps}
          soundEnabled={settings.soundEnabled}
          onToggleSound={handleToggleSound}
          onPause={() => {
            if (engineRef.current) engineRef.current.pauseGame();
          }}
          onMoveLeft={() => {
            if (engineRef.current) engineRef.current.moveLeft();
          }}
          onMoveRight={() => {
            if (engineRef.current) engineRef.current.moveRight();
          }}
          onJump={() => {
            if (engineRef.current) engineRef.current.jump();
          }}
          onSlide={() => {
            if (engineRef.current) engineRef.current.slide();
          }}
          showTouchControls={settings.showTouchControls}
        />
      )}

      {/* 4. Pause Screen Overlay */}
      {gameState === 'PAUSED' && (
        <PauseOverlay
          onResume={handleResume}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* 5. Game Over Modal */}
      {gameState === 'GAMEOVER' && (
        <GameOverModal
          stats={stats}
          bestScore={bestScore}
          isHighScore={isHighScore}
          onPlayAgain={handleRestart}
          onMainMenu={handleMainMenu}
          onViewLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {/* 6. Leaderboard Modal */}
      {showLeaderboard && (
        <LeaderboardModal
          onClose={() => {
            setShowLeaderboard(false);
          }}
        />
      )}

      {/* 7. Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </main>
  );
}
