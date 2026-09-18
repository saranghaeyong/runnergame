export type GameState = 
  | 'MENU'
  | 'COUNTDOWN'
  | 'PLAYING'
  | 'PAUSED'
  | 'GAMEOVER'
  | 'LEADERBOARD'
  | 'SETTINGS';

export type Lane = -1 | 0 | 1; // Left, Center, Right

export type ObstacleType = 
  | 'LOW_BARRIER'       // Jump over it (velvet barricade / low road barrier)
  | 'HIGH_SIGN'          // Slide under it (overhead cinema marquee / beam)
  | 'LANE_CAR'           // Move lane (futuristic cinema cyber hovercar)
  | 'CINEMA_BARRICADE'   // Move lane (road barrier with flashing lights)
  | 'CONSTRUCTION_BOT';  // Move lane (lane hazard)

export type CollectibleType = 
  | 'FILM_REEL'    // +10 pts
  | 'POPCORN'      // +25 pts
  | 'GOLDEN_STAR'  // +50 pts
  | 'TICKET';      // +100 pts

export type PowerUpType = 
  | 'MAGNET'       // Attracts nearby collectibles
  | 'SHIELD'       // Protects against 1 collision
  | 'DOUBLE_SCORE' // 2X points temporarily
  | 'SLOW_MO';     // Slows obstacles temporarily

export interface ActivePowerUp {
  type: PowerUpType;
  remainingTime: number; // in seconds
  totalDuration: number;
}

export interface PlayerState {
  lane: Lane;
  targetLane: Lane;
  lanePositionX: number; // smoothly interpolated between -1 and 1
  jumpHeight: number;    // 0 to 1
  jumpVelocity: number;
  isJumping: boolean;
  isSliding: boolean;
  slideTimer: number;
  lives: number;
  maxLives: number;
  invincibleTimer: number;
  hasShield: boolean;
  activePowerUps: Record<PowerUpType, number>; // type -> remaining seconds
  runCycle: number;
}

export interface Obstacle {
  id: number;
  type: ObstacleType;
  lane: Lane;
  z: number;            // Distance from player (0 to ~2000)
  speed: number;
  width: number;
  height: number;
  cleared: boolean;
}

export interface Collectible {
  id: number;
  type: CollectibleType;
  lane: Lane;
  z: number;
  yOffset: number;
  speed: number;
  rotation: number;
  collected: boolean;
  collectedAnimProgress?: number;
}

export interface PowerUpItem {
  id: number;
  type: PowerUpType;
  lane: Lane;
  z: number;
  speed: number;
  rotation: number;
  collected: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  distance: number;
  date: string;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  reducedMotion: boolean;
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  showTouchControls: boolean;
}

export interface GameStats {
  score: number;
  distance: number; // in meters
  collectiblesCount: number;
  filmReels: number;
  popcorn: number;
  stars: number;
  tickets: number;
}
