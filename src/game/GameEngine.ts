import {
  ActivePowerUp,
  Collectible,
  CollectibleType,
  FloatingText,
  GameSettings,
  GameState,
  GameStats,
  Lane,
  Obstacle,
  ObstacleType,
  Particle,
  PlayerState,
  PowerUpItem,
  PowerUpType,
} from '../types';
import { audioManager } from '../audio/audioManager';
import { GameRenderer } from './Renderer';
import { StorageManager } from './storageManager';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: GameRenderer;

  // Game loop
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  // Game state
  public gameState: GameState = 'MENU';
  public settings: GameSettings;
  public stats: GameStats = {
    score: 0,
    distance: 0,
    collectiblesCount: 0,
    filmReels: 0,
    popcorn: 0,
    stars: 0,
    tickets: 0,
  };
  public bestScore: number = 18920;

  // World physics
  private baseSpeed: number = 380;
  private currentSpeed: number = 380;
  private maxSpeed: number = 820;
  private screenShake: number = 0;
  private nextObstacleZ: number = 900;
  private nextCollectibleZ: number = 500;
  private nextPowerUpZ: number = 1400;
  private obstacleIdCounter: number = 1;
  private collectibleIdCounter: number = 1;
  private powerUpIdCounter: number = 1;
  private floatTextIdCounter: number = 1;

  // Entities
  public player: PlayerState;
  private obstacles: Obstacle[] = [];
  private collectibles: Collectible[] = [];
  private powerUps: PowerUpItem[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  // Milestone Banner
  private lastMilestoneDistance: number = 0;
  private milestoneTimer: number = 0;

  // State Change Callbacks for React HUD
  public onStateChange?: (state: GameState) => void;
  public onStatsUpdate?: (stats: GameStats, lives: number, activePowerUps: ActivePowerUp[]) => void;
  public onGameOver?: (finalStats: GameStats, isHighScore: boolean) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context not supported');
    }
    this.ctx = context;
    this.renderer = new GameRenderer(this.ctx);

    this.settings = StorageManager.getSettings();
    this.bestScore = StorageManager.getBestScore();
    audioManager.setSoundEnabled(this.settings.soundEnabled);
    audioManager.setMusicEnabled(this.settings.musicEnabled);

    this.player = this.createDefaultPlayer();
    this.handleResize();
  }

  private createDefaultPlayer(): PlayerState {
    return {
      lane: 0,
      targetLane: 0,
      lanePositionX: 0,
      jumpHeight: 0,
      jumpVelocity: 0,
      isJumping: false,
      isSliding: false,
      slideTimer: 0,
      lives: 3,
      maxLives: 3,
      invincibleTimer: 0,
      hasShield: false,
      activePowerUps: {
        MAGNET: 0,
        SHIELD: 0,
        DOUBLE_SCORE: 0,
        SLOW_MO: 0,
      },
      runCycle: 0,
    };
  }

  public handleResize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;

    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    this.renderer.resize(w, h);
  }

  // --- Game Lifecycle ---

  public startGame() {
    this.player = this.createDefaultPlayer();
    this.obstacles = [];
    this.collectibles = [];
    this.powerUps = [];
    this.particles = [];
    this.floatingTexts = [];
    this.stats = {
      score: 0,
      distance: 0,
      collectiblesCount: 0,
      filmReels: 0,
      popcorn: 0,
      stars: 0,
      tickets: 0,
    };

    // Difficulty settings
    if (this.settings.difficulty === 'EASY') {
      this.baseSpeed = 320;
      this.maxSpeed = 650;
    } else if (this.settings.difficulty === 'HARD') {
      this.baseSpeed = 440;
      this.maxSpeed = 950;
    } else {
      this.baseSpeed = 380;
      this.maxSpeed = 820;
    }

    this.currentSpeed = this.baseSpeed;
    this.nextObstacleZ = 800;
    this.nextCollectibleZ = 450;
    this.nextPowerUpZ = 1200;
    this.lastMilestoneDistance = 0;
    this.milestoneTimer = 0;
    this.screenShake = 0;

    this.setGameState('PLAYING');

    if (this.settings.musicEnabled) {
      audioManager.startMusic();
    }

    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
  }

  public pauseGame() {
    if (this.gameState === 'PLAYING') {
      this.setGameState('PAUSED');
      audioManager.stopMusic();
    }
  }

  public resumeGame() {
    if (this.gameState === 'PAUSED') {
      this.setGameState('PLAYING');
      if (this.settings.musicEnabled) {
        audioManager.startMusic();
      }
      this.lastTime = performance.now();
    }
  }

  public setGameState(state: GameState) {
    this.gameState = state;
    if (this.onStateChange) {
      this.onStateChange(state);
    }
  }

  // --- Controls Input Handling ---

  public moveLeft() {
    if (this.gameState !== 'PLAYING') return;
    if (this.player.targetLane > -1) {
      this.player.targetLane = (this.player.targetLane - 1) as Lane;
      this.player.lane = this.player.targetLane;
      audioManager.playClick();
    }
  }

  public moveRight() {
    if (this.gameState !== 'PLAYING') return;
    if (this.player.targetLane < 1) {
      this.player.targetLane = (this.player.targetLane + 1) as Lane;
      this.player.lane = this.player.targetLane;
      audioManager.playClick();
    }
  }

  public jump() {
    if (this.gameState !== 'PLAYING') return;
    if (!this.player.isJumping && !this.player.isSliding) {
      this.player.isJumping = true;
      this.player.jumpVelocity = 4.2;
      audioManager.playJump();
    }
  }

  public slide() {
    if (this.gameState !== 'PLAYING') return;
    if (!this.player.isSliding) {
      // If jumping, cancel jump into fast dive
      if (this.player.isJumping) {
        this.player.isJumping = false;
        this.player.jumpHeight = 0;
      }
      this.player.isSliding = true;
      this.player.slideTimer = 0.75; // seconds
      audioManager.playSlide();

      // Emit slide sparks
      for (let i = 0; i < 6; i++) {
        this.addSparkParticle(
          this.canvas.width / 2 + this.player.lanePositionX * 100,
          this.canvas.height * 0.9
        );
      }
    }
  }

  // --- Main Game Loop ---

  private gameLoop = (timestamp: number) => {
    if (!this.isRunning) return;

    let dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    // Cap dt to avoid huge jumps on background tab resume
    if (dt > 0.1) dt = 0.1;
    if (dt < 0.001) dt = 0.001;

    if (this.gameState === 'PLAYING') {
      this.update(dt);
    }

    // Render current frame
    this.renderer.render(
      this.player,
      this.obstacles,
      this.collectibles,
      this.powerUps,
      this.particles,
      this.floatingTexts,
      this.stats.distance,
      this.settings,
      this.screenShake,
      dt
    );

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  // --- World Update & Logic ---

  private update(dt: number) {
    // 1. Calculate effective speed (slow motion factor)
    const slowMoFactor = this.player.activePowerUps.SLOW_MO > 0 ? 0.55 : 1.0;
    const speed = this.currentSpeed * slowMoFactor;

    // Distance progression
    const distanceDelta = (speed * dt) * 0.12;
    this.stats.distance += distanceDelta;

    // Gradual difficulty speed increase
    const targetSpeed = Math.min(this.maxSpeed, this.baseSpeed + (this.stats.distance * 0.35));
    this.currentSpeed += (targetSpeed - this.currentSpeed) * dt * 0.5;

    // Score from distance (+1 pt per meter, doubled if 2X)
    const scoreMult = this.player.activePowerUps.DOUBLE_SCORE > 0 ? 2 : 1;
    this.stats.score += Math.floor(distanceDelta * scoreMult);

    // Screen Shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 3.5);
    }

    // 2. In-game Milestone Marquee every 350 meters
    if (this.stats.distance - this.lastMilestoneDistance > 350) {
      this.lastMilestoneDistance = this.stats.distance;
      this.milestoneTimer = 3.0; // Show for 3 seconds
    }
    if (this.milestoneTimer > 0) {
      this.milestoneTimer -= dt;
      const alpha = Math.min(1, this.milestoneTimer * 1.5);
      this.renderer.setMilestone('SRN CINEMAS ★ VIP RUN ★', alpha);
    } else {
      this.renderer.setMilestone('', 0);
    }

    // 3. Update Player State
    this.updatePlayer(dt);

    // 4. Spawn & Update Obstacles
    this.updateObstacles(dt, speed);

    // 5. Spawn & Update Collectibles (including Magnet pulling)
    this.updateCollectibles(dt, speed);

    // 6. Spawn & Update PowerUps
    this.updatePowerUps(dt, speed);

    // 7. Check Collisions
    this.checkCollisions();

    // 8. Update Particles & Floating Text
    this.updateEffects(dt);

    // 9. Update UI Callbacks
    this.notifyUI();
  }

  private updatePlayer(dt: number) {
    const player = this.player;

    // Smooth horizontal lane transition (lerp)
    const targetX = player.targetLane;
    player.lanePositionX += (targetX - player.lanePositionX) * Math.min(1, dt * 14);

    // Run cycle animation
    player.runCycle += dt * (this.currentSpeed / 45);

    // Jump physics
    if (player.isJumping) {
      player.jumpHeight += player.jumpVelocity * dt;
      player.jumpVelocity -= 11.5 * dt; // Gravity

      if (player.jumpHeight <= 0) {
        player.jumpHeight = 0;
        player.jumpVelocity = 0;
        player.isJumping = false;
      }
    }

    // Slide timer
    if (player.isSliding) {
      player.slideTimer -= dt;
      if (player.slideTimer <= 0) {
        player.isSliding = false;
      }
    }

    // Invincibility flicker timer
    if (player.invincibleTimer > 0) {
      player.invincibleTimer -= dt;
    }

    // Power-up durations
    for (const key of Object.keys(player.activePowerUps) as PowerUpType[]) {
      if (player.activePowerUps[key] > 0) {
        player.activePowerUps[key] = Math.max(0, player.activePowerUps[key] - dt);
        if (key === 'SHIELD') {
          player.hasShield = player.activePowerUps.SHIELD > 0;
        }
      }
    }
  }

  private updateObstacles(dt: number, speed: number) {
    // Move obstacles toward player (decreasing Z)
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const ob = this.obstacles[i];
      ob.z -= speed * dt;

      // Remove obstacles that have passed far behind player
      if (ob.z < 20) {
        this.obstacles.splice(i, 1);
      }
    }

    // Spawning new obstacles
    this.nextObstacleZ -= speed * dt;
    if (this.nextObstacleZ <= 0) {
      this.spawnObstaclePattern();
      // Distance to next obstacle pattern decreases as speed increases, but keeps minimum safe gap
      const minGap = Math.max(260, 480 - (this.currentSpeed * 0.2));
      this.nextObstacleZ = minGap + Math.random() * 200;
    }
  }

  private spawnObstaclePattern() {
    const lanes: Lane[] = [-1, 0, 1];
    const types: ObstacleType[] = ['LOW_BARRIER', 'HIGH_SIGN', 'LANE_CAR', 'CINEMA_BARRICADE'];

    // At low distance, single obstacle. At higher distance (>500m), sometimes double lane block (leaving 1 escape lane!)
    const isDouble = this.stats.distance > 450 && Math.random() < 0.38;

    if (!isDouble) {
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      this.obstacles.push({
        id: this.obstacleIdCounter++,
        type,
        lane,
        z: 1800,
        speed: this.currentSpeed,
        width: 1,
        height: 1,
        cleared: false,
      });
    } else {
      // Pick 2 distinct lanes
      const openLane = lanes[Math.floor(Math.random() * lanes.length)];
      const blockedLanes = lanes.filter(l => l !== openLane);

      for (const lane of blockedLanes) {
        // Can be a low barrier or high sign so jumping or sliding is also viable!
        const type = Math.random() < 0.5 ? 'LOW_BARRIER' : 'HIGH_SIGN';
        this.obstacles.push({
          id: this.obstacleIdCounter++,
          type,
          lane,
          z: 1800,
          speed: this.currentSpeed,
          width: 1,
          height: 1,
          cleared: false,
        });
      }
    }
  }

  private updateCollectibles(dt: number, speed: number) {
    const magnetActive = this.player.activePowerUps.MAGNET > 0;
    const playerZ = 100;

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      c.z -= speed * dt;

      // Magnet pull: if magnet active and item is within 450 units, smoothly pull toward player!
      if (magnetActive && Math.abs(c.z - playerZ) < 550) {
        const laneDiff = this.player.lanePositionX - c.lane;
        c.lane += laneDiff * Math.min(1, dt * 7) as Lane;
      }

      // Check collection proximity
      if (!c.collected && Math.abs(c.z - playerZ) < 45) {
        // If in same lane (or close enough during magnet pull)
        const laneDist = Math.abs(c.lane - this.player.lanePositionX);
        if (laneDist < 0.45) {
          this.collectItem(c);
        }
      }

      // Remove items passed behind player
      if (c.z < 20 || c.collected) {
        this.collectibles.splice(i, 1);
      }
    }

    // Spawn new collectible waves
    this.nextCollectibleZ -= speed * dt;
    if (this.nextCollectibleZ <= 0) {
      this.spawnCollectibleWave();
      this.nextCollectibleZ = 220 + Math.random() * 180;
    }
  }

  private spawnCollectibleWave() {
    const lanes: Lane[] = [-1, 0, 1];
    const chosenLane = lanes[Math.floor(Math.random() * lanes.length)];

    // Type of collectible
    const rand = Math.random();
    let type: CollectibleType = 'FILM_REEL';
    let count = 4;

    if (rand < 0.55) {
      type = 'FILM_REEL'; // 55%
      count = 4;
    } else if (rand < 0.8) {
      type = 'POPCORN';   // 25%
      count = 3;
    } else if (rand < 0.94) {
      type = 'GOLDEN_STAR'; // 14%
      count = 2;
    } else {
      type = 'TICKET';    // 6% rare VIP ticket
      count = 1;
    }

    // Spawn row of items along the chosen lane
    for (let i = 0; i < count; i++) {
      this.collectibles.push({
        id: this.collectibleIdCounter++,
        type,
        lane: chosenLane,
        z: 1800 + i * 85,
        yOffset: 25,
        speed: this.currentSpeed,
        rotation: 0,
        collected: false,
      });
    }
  }

  private collectItem(c: Collectible) {
    c.collected = true;
    this.stats.collectiblesCount++;

    const multiplier = this.player.activePowerUps.DOUBLE_SCORE > 0 ? 2 : 1;
    let pts = 10;
    let label = '+10';
    let color = '#06b6d4';

    if (c.type === 'FILM_REEL') {
      pts = 10 * multiplier;
      label = `+${pts}`;
      color = '#06b6d4';
      this.stats.filmReels++;
      audioManager.playCollect('FILM_REEL');
    } else if (c.type === 'POPCORN') {
      pts = 25 * multiplier;
      label = `+${pts}`;
      color = '#facc15';
      this.stats.popcorn++;
      audioManager.playCollect('POPCORN');
    } else if (c.type === 'GOLDEN_STAR') {
      pts = 50 * multiplier;
      label = `+${pts}`;
      color = '#eab308';
      this.stats.stars++;
      audioManager.playCollect('GOLDEN_STAR');
    } else if (c.type === 'TICKET') {
      pts = 100 * multiplier;
      label = `VIP +${pts}`;
      color = '#f59e0b';
      this.stats.tickets++;
      audioManager.playCollect('TICKET');
    }

    this.stats.score += pts;

    // Floating text
    const proj = this.renderer.project(c.lane, 100, 45);
    this.addFloatingText(proj.x, proj.y - 15, label, color, 14);

    // Particle sparkle burst
    for (let i = 0; i < 8; i++) {
      this.addSparkParticle(proj.x, proj.y, color);
    }
  }

  private updatePowerUps(dt: number, speed: number) {
    const playerZ = 100;

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      p.z -= speed * dt;

      // Check pickup
      if (!p.collected && Math.abs(p.z - playerZ) < 50) {
        if (Math.abs(p.lane - this.player.lanePositionX) < 0.45) {
          this.collectPowerUp(p);
        }
      }

      if (p.z < 20 || p.collected) {
        this.powerUps.splice(i, 1);
      }
    }

    // Spawn power-up
    this.nextPowerUpZ -= speed * dt;
    if (this.nextPowerUpZ <= 0) {
      const lanes: Lane[] = [-1, 0, 1];
      const types: PowerUpType[] = ['MAGNET', 'SHIELD', 'DOUBLE_SCORE', 'SLOW_MO'];
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      const type = types[Math.floor(Math.random() * types.length)];

      this.powerUps.push({
        id: this.powerUpIdCounter++,
        type,
        lane,
        z: 1800,
        speed: this.currentSpeed,
        rotation: 0,
        collected: false,
      });

      // Frequency between power-ups (every 14-22 seconds equivalent distance)
      this.nextPowerUpZ = 1500 + Math.random() * 800;
    }
  }

  private collectPowerUp(p: PowerUpItem) {
    p.collected = true;
    audioManager.playPowerUp();

    let label = 'POWER UP!';
    let color = '#06b6d4';

    if (p.type === 'MAGNET') {
      this.player.activePowerUps.MAGNET = 12; // 12s
      label = '🧲 MAGNET!';
      color = '#06b6d4';
    } else if (p.type === 'SHIELD') {
      this.player.activePowerUps.SHIELD = 30; // Lasts 30s or until hit
      this.player.hasShield = true;
      label = '🛡 SHIELD UP!';
      color = '#10b981';
    } else if (p.type === 'DOUBLE_SCORE') {
      this.player.activePowerUps.DOUBLE_SCORE = 15; // 15s
      label = '⚡ 2X SCORE!';
      color = '#f59e0b';
    } else if (p.type === 'SLOW_MO') {
      this.player.activePowerUps.SLOW_MO = 8; // 8s
      label = '⏱ SLOW MOTION!';
      color = '#8b5cf6';
    }

    const proj = this.renderer.project(p.lane, 100, 50);
    this.addFloatingText(proj.x, proj.y - 25, label, color, 16);

    for (let i = 0; i < 14; i++) {
      this.addSparkParticle(proj.x, proj.y, color);
    }
  }

  // --- Collision Detection ---

  private checkCollisions() {
    if (this.player.invincibleTimer > 0) return; // Currently invulnerable

    const playerZ = 100;
    const playerLaneX = this.player.lanePositionX;

    for (const ob of this.obstacles) {
      if (ob.cleared) continue;

      // Check depth intersection (near player Z)
      if (Math.abs(ob.z - playerZ) < 35) {
        // Check lane alignment
        if (Math.abs(ob.lane - playerLaneX) < 0.42) {
          // Check obstacle clearance rules:
          let hit = true;

          if (ob.type === 'LOW_BARRIER') {
            // Player can jump over low barriers!
            if (this.player.isJumping && this.player.jumpHeight > 0.32) {
              hit = false; // Successfully cleared over
            }
          } else if (ob.type === 'HIGH_SIGN') {
            // Player can slide under high signs!
            if (this.player.isSliding) {
              hit = false; // Successfully cleared underneath
            }
          }

          if (hit) {
            ob.cleared = true;
            this.handlePlayerCollision();
            break;
          }
        }
      }
    }
  }

  private handlePlayerCollision() {
    // 1. If shield is active, shield absorbs it!
    if (this.player.hasShield || this.player.activePowerUps.SHIELD > 0) {
      this.player.hasShield = false;
      this.player.activePowerUps.SHIELD = 0;
      this.player.invincibleTimer = 1.6; // brief safe window
      this.screenShake = 0.5;

      audioManager.playShieldBreak();

      const proj = this.renderer.project(this.player.lanePositionX, 100, 40);
      this.addFloatingText(proj.x, proj.y - 30, 'SHIELD BROKE!', '#10b981', 16);

      for (let i = 0; i < 20; i++) {
        this.addSparkParticle(proj.x, proj.y, '#10b981');
      }
      return;
    }

    // 2. Normal collision: lose life
    this.player.lives--;
    this.player.invincibleTimer = 2.0; // 2s invulnerability
    this.screenShake = 1.0;

    audioManager.playCollision();

    const proj = this.renderer.project(this.player.lanePositionX, 100, 30);
    this.addFloatingText(proj.x, proj.y - 30, 'HIT! -1 LIFE', '#ef4444', 18);

    for (let i = 0; i < 24; i++) {
      this.addSparkParticle(proj.x, proj.y, '#ef4444');
    }

    // Check game over
    if (this.player.lives <= 0) {
      this.handleGameOver();
    }
  }

  private handleGameOver() {
    this.setGameState('GAMEOVER');
    audioManager.stopMusic();
    audioManager.playGameOver();

    // Check high score
    const isHighScore = this.stats.score > this.bestScore;
    if (isHighScore) {
      this.bestScore = this.stats.score;
      StorageManager.setBestScore(this.stats.score);
    }

    if (this.onGameOver) {
      this.onGameOver(this.stats, isHighScore);
    }
  }

  // --- Particles & Effects ---

  private addSparkParticle(x: number, y: number, color: string = '#facc15') {
    if (this.settings.reducedMotion) return;
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 120;
    this.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      size: 2 + Math.random() * 3,
      alpha: 1,
      life: 0,
      maxLife: 0.35 + Math.random() * 0.25,
    });
  }

  private addFloatingText(x: number, y: number, text: string, color: string, size: number) {
    this.floatingTexts.push({
      id: this.floatTextIdCounter++,
      x,
      y,
      text,
      color,
      alpha: 1,
      life: 0,
      maxLife: 0.85,
      size,
    });
  }

  private updateEffects(dt: number) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += dt;
      ft.y -= 38 * dt; // Float upwards
      ft.alpha = Math.max(0, 1 - ft.life / ft.maxLife);

      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private notifyUI() {
    if (!this.onStatsUpdate) return;

    const activeList: ActivePowerUp[] = [];
    const durations: Record<PowerUpType, number> = {
      MAGNET: 12,
      SHIELD: 30,
      DOUBLE_SCORE: 15,
      SLOW_MO: 8,
    };

    for (const key of Object.keys(this.player.activePowerUps) as PowerUpType[]) {
      const rem = this.player.activePowerUps[key];
      if (rem > 0) {
        activeList.push({
          type: key,
          remainingTime: rem,
          totalDuration: durations[key],
        });
      }
    }

    this.onStatsUpdate(this.stats, this.player.lives, activeList);
  }

  public updateSettings(newSettings: GameSettings) {
    this.settings = newSettings;
    StorageManager.saveSettings(newSettings);
    audioManager.setSoundEnabled(newSettings.soundEnabled);
    audioManager.setMusicEnabled(newSettings.musicEnabled);
  }

  public destroy() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    audioManager.stopMusic();
  }
}
