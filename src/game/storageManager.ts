import { GameSettings, LeaderboardEntry } from '../types';

const STORAGE_KEYS = {
  HIGH_SCORE: 'srn_neon_run_high_score',
  LEADERBOARD: 'srn_neon_run_leaderboard',
  SETTINGS: 'srn_neon_run_settings',
  PLAYER_NAME: 'srn_neon_run_player_name',
};

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  reducedMotion: false,
  difficulty: 'NORMAL',
  showTouchControls: false,
};

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', name: 'SARANG', score: 18920, distance: 2840, date: '2026-09-01' },
  { id: '2', name: 'PLAYER', score: 15420, distance: 2310, date: '2026-09-02' },
  { id: '3', name: 'NEON', score: 12890, distance: 1980, date: '2026-09-05' },
  { id: '4', name: 'CINEMA', score: 10450, distance: 1650, date: '2026-09-08' },
  { id: '5', name: 'RUNNER', score: 8720, distance: 1420, date: '2026-09-10' },
  { id: '6', name: 'MATRIX', score: 7150, distance: 1190, date: '2026-09-11' },
  { id: '7', name: 'BLADE', score: 5900, distance: 980, date: '2026-09-12' },
  { id: '8', name: 'RETRO', score: 4320, distance: 750, date: '2026-09-14' },
  { id: '9', name: 'CYBER', score: 3210, distance: 580, date: '2026-09-15' },
  { id: '10', name: 'VIP', score: 2050, distance: 410, date: '2026-09-16' },
];

export class StorageManager {
  public static getBestScore(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
      if (stored) {
        return parseInt(stored, 10) || 18920;
      }
    } catch {
      // Fallback
    }
    return 18920;
  }

  public static setBestScore(score: number): void {
    try {
      const currentBest = this.getBestScore();
      if (score > currentBest) {
        localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, score.toString());
      }
    } catch {
      // Ignore
    }
  }

  public static getLeaderboard(): LeaderboardEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    return DEFAULT_LEADERBOARD;
  }

  public static saveScore(name: string, score: number, distance: number): boolean {
    try {
      const cleanName = (name.trim().toUpperCase().slice(0, 12) || 'RUNNER');
      const list = this.getLeaderboard();
      const newEntry: LeaderboardEntry = {
        id: Date.now().toString(),
        name: cleanName,
        score,
        distance,
        date: new Date().toISOString().split('T')[0],
      };

      list.push(newEntry);
      list.sort((a, b) => b.score - a.score);
      const top10 = list.slice(0, 10);

      localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(top10));
      this.setBestScore(score);
      this.savePlayerName(cleanName);

      return top10.some(entry => entry.id === newEntry.id);
    } catch {
      return false;
    }
  }

  public static getPlayerName(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || 'PLAYER';
    } catch {
      return 'PLAYER';
    }
  }

  public static savePlayerName(name: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name);
    } catch {
      // Ignore
    }
  }

  public static getSettings(): GameSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore
    }
    return DEFAULT_SETTINGS;
  }

  public static saveSettings(settings: GameSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }

  public static resetLeaderboard(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(DEFAULT_LEADERBOARD));
      localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, '18920');
    } catch {
      // Ignore
    }
  }
}
