import { Collectible, Obstacle, Particle, FloatingText, PlayerState, PowerUpItem, GameSettings } from '../types';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number = 800;
  private height: number = 600;
  private horizonY: number = 240;
  private roadBottomY: number = 560;
  private roadTopWidth: number = 140;
  private roadBottomWidth: number = 640;
  private zFar: number = 1800;
  private zNear: number = 40;
  private time: number = 0;
  private searchlightAngles: number[] = [-0.3, 0.2, 0.45, -0.15];
  private milestoneActive: boolean = false;
  private milestoneText: string = 'SRN CINEMAS';
  private milestoneAlpha: number = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.horizonY = height * 0.38;
    this.roadBottomY = height * 0.94;
    this.roadTopWidth = Math.max(80, width * 0.16);
    this.roadBottomWidth = Math.min(width * 0.92, 680);
  }

  public setMilestone(text: string, alpha: number) {
    this.milestoneText = text;
    this.milestoneAlpha = alpha;
    this.milestoneActive = alpha > 0.01;
  }

  // Perspective projection formula
  public project(laneX: number, z: number, yOffset: number = 0): { x: number; y: number; scale: number; visible: boolean } {
    if (z > this.zFar || z < this.zNear) {
      return { x: 0, y: 0, scale: 0, visible: false };
    }

    // Non-linear depth progress for authentic 3D perspective
    const p = Math.max(0, Math.min(1, (this.zFar - z) / (this.zFar - this.zNear)));
    const depthCurve = Math.pow(p, 2.2);

    const scale = 0.12 + 0.88 * depthCurve;
    const currentRoadWidth = this.roadTopWidth + (this.roadBottomWidth - this.roadTopWidth) * depthCurve;
    const laneWidth = currentRoadWidth / 3;

    const centerX = this.width / 2;
    const x = centerX + laneX * laneWidth;
    const groundY = this.horizonY + (this.roadBottomY - this.horizonY) * depthCurve;
    const y = groundY - yOffset * scale;

    return { x, y, scale, visible: true };
  }

  // Main Render Routine
  public render(
    player: PlayerState,
    obstacles: Obstacle[],
    collectibles: Collectible[],
    powerUps: PowerUpItem[],
    particles: Particle[],
    floatingTexts: FloatingText[],
    distance: number,
    settings: GameSettings,
    screenShake: number,
    dt: number
  ) {
    this.time += dt;
    const ctx = this.ctx;

    ctx.save();

    // Apply Screen Shake if any
    if (screenShake > 0 && !settings.reducedMotion) {
      const shakeX = (Math.random() - 0.5) * screenShake * 16;
      const shakeY = (Math.random() - 0.5) * screenShake * 16;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Sky & Celestial Elements
    this.renderSky();

    // 2. Distant Futuristic Skyline & Searchlights
    this.renderSkyline(settings.reducedMotion);

    // 3. Giant Distant "SRN CINEMAS" Billboard
    this.renderDistantMarquee();

    // 4. Futuristic Highway Road with Film-Reel Borders
    this.renderRoad(distance);

    // 5. Roadside Props (Neon signs & light posts in perspective)
    this.renderRoadsideProps(distance);

    // 6. In-Game Cinematic Milestone Banner (overhead arch)
    if (this.milestoneActive) {
      this.renderMilestoneBanner();
    }

    // 7. Sort and Render 3D World Objects (Obstacles, Collectibles, PowerUps) from back (high Z) to front (low Z)
    this.render3DObjects(obstacles, collectibles, powerUps);

    // 8. Player Character
    this.renderPlayer(player, settings.reducedMotion);

    // 9. Particle Effects (sparks, collectible bursts, speed lines)
    this.renderParticles(particles);

    // 10. Floating Score Popups
    this.renderFloatingTexts(floatingTexts);

    // 11. Speed Lines & Cinematic Vignette
    this.renderCinematicVignette(player.activePowerUps.DOUBLE_SCORE > 0, player.activePowerUps.SLOW_MO > 0);

    ctx.restore();
  }

  // --- 1. Sky & Celestial Elements ---
  private renderSky() {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, this.horizonY);
    grad.addColorStop(0, '#040209');
    grad.addColorStop(0.5, '#0b0616');
    grad.addColorStop(0.85, '#1e0514');
    grad.addColorStop(1, '#3b0a1a');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.horizonY);

    // Stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    const seed = 42;
    for (let i = 0; i < 40; i++) {
      const sx = (Math.sin(i * seed) * 10000) % this.width;
      const sy = (Math.cos(i * seed) * 10000) % (this.horizonY * 0.7);
      const size = (i % 3 === 0) ? 1.5 : 1;
      ctx.fillRect(Math.abs(sx), Math.abs(sy), size, size);
    }

    // Glowing Neon Moon
    const moonX = this.width * 0.82;
    const moonY = this.horizonY * 0.32;
    const moonRad = 26;

    const moonGlow = ctx.createRadialGradient(moonX, moonY, moonRad * 0.5, moonX, moonY, moonRad * 2.8);
    moonGlow.addColorStop(0, 'rgba(255, 240, 220, 0.4)');
    moonGlow.addColorStop(0.5, 'rgba(239, 68, 68, 0.15)');
    moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRad * 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fffaed';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRad, 0, Math.PI * 2);
    ctx.fill();

    // Dark cloud over moon
    ctx.fillStyle = 'rgba(15, 6, 25, 0.7)';
    ctx.beginPath();
    ctx.ellipse(moonX + 8, moonY + 4, moonRad * 1.3, moonRad * 0.4, -0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- 2. Futuristic Skyline & Hollywood Searchlights ---
  private renderSkyline(reducedMotion: boolean) {
    const ctx = this.ctx;

    // Hollywood sweeping searchlights
    if (!reducedMotion) {
      for (let i = 0; i < this.searchlightAngles.length; i++) {
        const baseAngle = Math.sin(this.time * 0.8 + i * 1.5) * 0.45;
        const beamOriginX = (this.width * 0.2) + i * (this.width * 0.2);
        const beamOriginY = this.horizonY;

        ctx.save();
        ctx.translate(beamOriginX, beamOriginY);
        ctx.rotate(baseAngle);

        const beamGrad = ctx.createLinearGradient(0, 0, 0, -this.horizonY * 1.4);
        beamGrad.addColorStop(0, 'rgba(255, 230, 200, 0.25)');
        beamGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.12)');
        beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(-75, -this.horizonY * 1.4);
        ctx.lineTo(75, -this.horizonY * 1.4);
        ctx.lineTo(15, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // Skyscraper silhouettes
    const buildings = [
      { x: 0.02, w: 0.09, h: 110, color: '#090514' },
      { x: 0.12, w: 0.08, h: 85, color: '#0d071a' },
      { x: 0.21, w: 0.12, h: 140, color: '#06030e' },
      { x: 0.34, w: 0.07, h: 70, color: '#100820' },
      { x: 0.58, w: 0.08, h: 95, color: '#0b0617' },
      { x: 0.67, w: 0.11, h: 155, color: '#05020c' },
      { x: 0.79, w: 0.09, h: 90, color: '#0e071c' },
      { x: 0.89, w: 0.10, h: 125, color: '#080412' },
    ];

    for (const b of buildings) {
      const bx = b.x * this.width;
      const bw = b.w * this.width;
      const by = this.horizonY - b.h;

      ctx.fillStyle = b.color;
      ctx.fillRect(bx, by, bw, b.h);

      // Skyscraper neon antenna beacon
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx + bw / 2, by);
      ctx.lineTo(bx + bw / 2, by - 22);
      ctx.stroke();

      const pulse = (Math.sin(this.time * 4 + bx) > 0) ? 1 : 0.2;
      ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
      ctx.beginPath();
      ctx.arc(bx + bw / 2, by - 22, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Matrix window lights
      ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
      for (let wy = by + 12; wy < this.horizonY - 8; wy += 14) {
        for (let wx = bx + 6; wx < bx + bw - 6; wx += 10) {
          if ((Math.sin(wx * 11 + wy * 17) > 0.1)) {
            ctx.fillRect(wx, wy, 4, 6);
          }
        }
      }
    }
  }

  // --- 3. Distant "SRN CINEMAS" Billboard ---
  private renderDistantMarquee() {
    const ctx = this.ctx;
    const mbW = Math.min(260, this.width * 0.42);
    const mbH = 46;
    const mbX = (this.width - mbW) / 2;
    const mbY = this.horizonY - mbH - 18;

    // Support pillars
    ctx.strokeStyle = '#181028';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mbX + 30, this.horizonY);
    ctx.lineTo(mbX + 30, mbY + mbH);
    ctx.moveTo(mbX + mbW - 30, this.horizonY);
    ctx.lineTo(mbX + mbW - 30, mbY + mbH);
    ctx.stroke();

    // Billboard plate
    ctx.fillStyle = '#0a0512';
    ctx.fillRect(mbX, mbY, mbW, mbH);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(mbX, mbY, mbW, mbH);

    // Glowing Neon Text: "SRN CINEMAS"
    ctx.save();
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SRN CINEMAS', this.width / 2, mbY + mbH * 0.4);

    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#06b6d4';
    ctx.font = '600 9px Orbitron, sans-serif';
    ctx.fillText('★ PREMIERE PALACE ★', this.width / 2, mbY + mbH * 0.78);
    ctx.restore();
  }

  // --- 4. Futuristic Highway Road with Film-Reel Borders ---
  private renderRoad(distance: number) {
    const ctx = this.ctx;
    const centerX = this.width / 2;

    // Ground horizon fog
    const groundFog = ctx.createLinearGradient(0, this.horizonY, 0, this.height);
    groundFog.addColorStop(0, '#120718');
    groundFog.addColorStop(0.4, '#08050e');
    groundFog.addColorStop(1, '#030206');
    ctx.fillStyle = groundFog;
    ctx.fillRect(0, this.horizonY, this.width, this.height - this.horizonY);

    // Main Road polygon
    const topLeftX = centerX - this.roadTopWidth / 2;
    const topRightX = centerX + this.roadTopWidth / 2;
    const bottomLeftX = centerX - this.roadBottomWidth / 2;
    const bottomRightX = centerX + this.roadBottomWidth / 2;

    const roadGrad = ctx.createLinearGradient(0, this.horizonY, 0, this.roadBottomY);
    roadGrad.addColorStop(0, '#1b0d26');
    roadGrad.addColorStop(0.3, '#100b1a');
    roadGrad.addColorStop(1, '#07050d');

    ctx.fillStyle = roadGrad;
    ctx.beginPath();
    ctx.moveTo(topLeftX, this.horizonY);
    ctx.lineTo(topRightX, this.horizonY);
    ctx.lineTo(bottomRightX, this.roadBottomY);
    ctx.lineTo(bottomLeftX, this.roadBottomY);
    ctx.closePath();
    ctx.fill();

    // Road Outer Neon Rails (Vibrant Crimson Red)
    ctx.save();
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(topLeftX, this.horizonY);
    ctx.lineTo(bottomLeftX, this.roadBottomY);
    ctx.moveTo(topRightX, this.horizonY);
    ctx.lineTo(bottomRightX, this.roadBottomY);
    ctx.stroke();
    ctx.restore();

    // Film-Strip Perforated Shoulder Borders!
    this.renderFilmStripShoulders(topLeftX, bottomLeftX, topRightX, bottomRightX, distance);

    // Animated Lane Dividers (2 inner lines dividing into 3 lanes)
    this.renderLaneDividers(distance);
  }

  private renderFilmStripShoulders(
    tlX: number, blX: number,
    trX: number, brX: number,
    distance: number
  ) {
    const ctx = this.ctx;
    const numSegments = 24;

    for (let i = 0; i < numSegments; i++) {
      // Perspective interpolation
      const p1 = Math.pow(i / numSegments, 2.0);
      const p2 = Math.pow((i + 0.65) / numSegments, 2.0);

      // Left shoulder strip
      const y1 = this.horizonY + (this.roadBottomY - this.horizonY) * p1;
      const y2 = this.horizonY + (this.roadBottomY - this.horizonY) * p2;

      const lx1 = tlX + (blX - tlX) * p1;
      const lx2 = tlX + (blX - tlX) * p2;

      const rx1 = trX + (brX - trX) * p1;
      const rx2 = trX + (brX - trX) * p2;

      // Film tape sprocket hole markers
      const offset = (distance * 0.1) % 1;
      const pulseIndex = (i + Math.floor(offset * 10)) % 2 === 0;

      ctx.fillStyle = pulseIndex ? 'rgba(6, 182, 212, 0.45)' : 'rgba(239, 68, 68, 0.2)';
      const holeSize = 3 + 10 * p2;

      ctx.fillRect(lx2 - holeSize * 1.5, y2 - holeSize / 2, holeSize, holeSize * 0.7);
      ctx.fillRect(rx2 + holeSize * 0.5, y2 - holeSize / 2, holeSize, holeSize * 0.7);
    }
  }

  private renderLaneDividers(distance: number) {
    const ctx = this.ctx;
    const centerX = this.width / 2;
    const numDashes = 18;
    const speedOffset = (distance * 0.12) % 1;

    for (let i = 0; i < numDashes; i++) {
      const p1 = Math.pow(((i + speedOffset) % numDashes) / numDashes, 2.3);
      const p2 = Math.pow(((i + speedOffset + 0.55) % numDashes) / numDashes, 2.3);

      if (p2 < p1) continue; // Wrapped around

      const y1 = this.horizonY + (this.roadBottomY - this.horizonY) * p1;
      const y2 = this.horizonY + (this.roadBottomY - this.horizonY) * p2;

      const w1 = (this.roadTopWidth + (this.roadBottomWidth - this.roadTopWidth) * p1) / 3;
      const w2 = (this.roadTopWidth + (this.roadBottomWidth - this.roadTopWidth) * p2) / 3;

      // Divider line between Lane -1 and Lane 0 (Left line)
      const left1X = centerX - w1 * 0.5;
      const left2X = centerX - w2 * 0.5;

      // Divider line between Lane 0 and Lane 1 (Right line)
      const right1X = centerX + w1 * 0.5;
      const right2X = centerX + w2 * 0.5;

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.75)';
      ctx.lineWidth = 1.2 + 3.5 * p2;
      ctx.beginPath();
      ctx.moveTo(left1X, y1);
      ctx.lineTo(left2X, y2);
      ctx.moveTo(right1X, y1);
      ctx.lineTo(right2X, y2);
      ctx.stroke();
    }
  }

  // --- 5. Roadside Neon Props ---
  private renderRoadsideProps(distance: number) {
    const ctx = this.ctx;
    const props = [
      { zOffset: 0, type: 'SIGN', text: 'SRN POP', side: -1 },
      { zOffset: 450, type: 'LIGHT', side: 1 },
      { zOffset: 900, type: 'SIGN', text: 'NEON RUN', side: 1 },
      { zOffset: 1350, type: 'LIGHT', side: -1 },
    ];

    const cycleLength = 1800;
    const currentProg = (distance * 1.5) % cycleLength;

    for (const prop of props) {
      let z = (prop.zOffset - currentProg + cycleLength) % cycleLength;
      if (z > this.zFar || z < this.zNear + 80) continue;

      const laneOffset = prop.side * 1.8;
      const proj = this.project(laneOffset, z, 0);
      if (!proj.visible) continue;

      if (prop.type === 'LIGHT') {
        // High-tech neon lamp post
        const poleH = 130 * proj.scale;
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = Math.max(1.5, 4 * proj.scale);
        ctx.beginPath();
        ctx.moveTo(proj.x, proj.y);
        ctx.lineTo(proj.x, proj.y - poleH);
        ctx.lineTo(proj.x - prop.side * 22 * proj.scale, proj.y - poleH - 12 * proj.scale);
        ctx.stroke();

        // Neon luminaire
        ctx.save();
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10 * proj.scale;
        ctx.beginPath();
        ctx.arc(proj.x - prop.side * 22 * proj.scale, proj.y - poleH - 12 * proj.scale, 5 * proj.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // Roadside neon billboard poster
        const signW = 90 * proj.scale;
        const signH = 65 * proj.scale;
        const signY = proj.y - signH - 20 * proj.scale;

        // Post
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = Math.max(2, 5 * proj.scale);
        ctx.beginPath();
        ctx.moveTo(proj.x, proj.y);
        ctx.lineTo(proj.x, signY + signH);
        ctx.stroke();

        // Sign board
        ctx.fillStyle = '#090514';
        ctx.fillRect(proj.x - signW / 2, signY, signW, signH);
        ctx.strokeStyle = prop.side > 0 ? '#ef4444' : '#06b6d4';
        ctx.lineWidth = Math.max(1, 2 * proj.scale);
        ctx.strokeRect(proj.x - signW / 2, signY, signW, signH);

        // Poster text
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(7, 11 * proj.scale)}px Orbitron, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(prop.text || 'CINEMA', proj.x, signY + signH * 0.55);
      }
    }
  }

  // --- 6. In-Game Cinematic Milestone Banner ---
  private renderMilestoneBanner() {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = Math.min(1, this.milestoneAlpha);

    const bannerW = Math.min(520, this.width * 0.82);
    const bannerH = 64;
    const bannerX = (this.width - bannerW) / 2;
    const bannerY = this.height * 0.16;

    // Glowing futuristic arch overlay
    const grad = ctx.createLinearGradient(bannerX, 0, bannerX + bannerW, 0);
    grad.addColorStop(0, 'rgba(239, 68, 68, 0.05)');
    grad.addColorStop(0.2, 'rgba(239, 68, 68, 0.85)');
    grad.addColorStop(0.5, 'rgba(220, 38, 38, 0.95)');
    grad.addColorStop(0.8, 'rgba(239, 68, 68, 0.85)');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0.05)');

    ctx.fillStyle = grad;
    ctx.fillRect(bannerX, bannerY, bannerW, bannerH);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(bannerX + 10, bannerY + 4, bannerW - 20, bannerH - 8);

    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.milestoneText, this.width / 2, bannerY + bannerH / 2);
    ctx.restore();
  }

  // --- 7. Sort and Render 3D Objects ---
  private render3DObjects(obstacles: Obstacle[], collectibles: Collectible[], powerUps: PowerUpItem[]) {
    // Combine all 3D items into a single list for correct Z-sorting (back to front)
    type RenderItem = 
      | { kind: 'obstacle'; item: Obstacle; z: number }
      | { kind: 'collectible'; item: Collectible; z: number }
      | { kind: 'powerup'; item: PowerUpItem; z: number };

    const items: RenderItem[] = [];

    for (const ob of obstacles) {
      if (ob.z > this.zNear && ob.z < this.zFar) {
        items.push({ kind: 'obstacle', item: ob, z: ob.z });
      }
    }
    for (const c of collectibles) {
      if (!c.collected && c.z > this.zNear && c.z < this.zFar) {
        items.push({ kind: 'collectible', item: c, z: c.z });
      }
    }
    for (const p of powerUps) {
      if (!p.collected && p.z > this.zNear && p.z < this.zFar) {
        items.push({ kind: 'powerup', item: p, z: p.z });
      }
    }

    // Sort descending by Z: furthest items rendered first
    items.sort((a, b) => b.z - a.z);

    for (const obj of items) {
      if (obj.kind === 'obstacle') {
        this.renderSingleObstacle(obj.item);
      } else if (obj.kind === 'collectible') {
        this.renderSingleCollectible(obj.item);
      } else if (obj.kind === 'powerup') {
        this.renderSinglePowerUp(obj.item);
      }
    }
  }

  private renderSingleObstacle(ob: Obstacle) {
    const ctx = this.ctx;
    const proj = this.project(ob.lane, ob.z, 0);
    if (!proj.visible) return;

    ctx.save();
    ctx.translate(proj.x, proj.y);

    const baseW = 100 * proj.scale;

    switch (ob.type) {
      case 'LOW_BARRIER': {
        // Cinema velvet stanchion barrier (Jump over it!)
        const h = 42 * proj.scale;
        const postW = 8 * proj.scale;

        // Gold stanchion posts
        ctx.fillStyle = '#eab308';
        ctx.fillRect(-baseW / 2, -h, postW, h);
        ctx.fillRect(baseW / 2 - postW, -h, postW, h);

        // Gold post tops
        ctx.beginPath();
        ctx.arc(-baseW / 2 + postW / 2, -h - 3 * proj.scale, 5 * proj.scale, 0, Math.PI * 2);
        ctx.arc(baseW / 2 - postW / 2, -h - 3 * proj.scale, 5 * proj.scale, 0, Math.PI * 2);
        ctx.fill();

        // Velvet crimson rope sagging
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 6 * proj.scale;
        ctx.beginPath();
        ctx.moveTo(-baseW / 2 + postW, -h + 8 * proj.scale);
        ctx.quadraticCurveTo(0, -h + 20 * proj.scale, baseW / 2 - postW, -h + 8 * proj.scale);
        ctx.stroke();

        // Neon warning glow underneath
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.fillRect(-baseW * 0.4, -2 * proj.scale, baseW * 0.8, 3 * proj.scale);
        break;
      }

      case 'HIGH_SIGN': {
        // Overhead Cinema Marquee Truss (Slide under it!)
        const trussH = 95 * proj.scale;
        const clearanceH = 46 * proj.scale; // Open area under the truss
        const trussW = 135 * proj.scale;

        // Truss side pillars
        ctx.fillStyle = '#374151';
        ctx.fillRect(-trussW / 2, -trussH, 9 * proj.scale, trussH);
        ctx.fillRect(trussW / 2 - 9 * proj.scale, -trussH, 9 * proj.scale, trussH);

        // Overhead horizontal sign box (between clearanceH and trussH)
        const boxH = trussH - clearanceH;
        ctx.fillStyle = '#111827';
        ctx.fillRect(-trussW / 2, -trussH, trussW, boxH);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = Math.max(1, 2.5 * proj.scale);
        ctx.strokeRect(-trussW / 2, -trussH, trussW, boxH);

        // Hanging marquee text
        ctx.fillStyle = '#f87171';
        ctx.font = `bold ${Math.max(6, 11 * proj.scale)}px Orbitron, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▼ SLIDE ▼', 0, -trussH + boxH / 2);

        // Dangling cinema spotlights
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(-trussW * 0.28, -clearanceH, 4 * proj.scale, 0, Math.PI * 2);
        ctx.arc(trussW * 0.28, -clearanceH, 4 * proj.scale, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'LANE_CAR': {
        // Futuristic Cyber Hovercar (Full lane block - move!)
        const carW = 95 * proj.scale;
        const carH = 65 * proj.scale;
        const hoverOffset = Math.sin(this.time * 6 + ob.id) * 4 * proj.scale;

        // Shadow on road
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.ellipse(0, -2, carW * 0.55, 8 * proj.scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Car body
        ctx.save();
        ctx.translate(0, -hoverOffset);

        // Cyan/Purple neon underglow
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12 * proj.scale;

        ctx.fillStyle = '#18122B';
        ctx.beginPath();
        ctx.roundRect(-carW / 2, -carH, carW, carH * 0.85, 8 * proj.scale);
        ctx.fill();

        // Car canopy / rear glass
        ctx.fillStyle = '#0f0a1d';
        ctx.beginPath();
        ctx.roundRect(-carW * 0.38, -carH * 1.15, carW * 0.76, carH * 0.45, 4 * proj.scale);
        ctx.fill();

        // Dual Glowing Neon Tail Lights (Crimson)
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 15 * proj.scale;
        ctx.fillRect(-carW * 0.45, -carH * 0.45, carW * 0.25, 8 * proj.scale);
        ctx.fillRect(carW * 0.2, -carH * 0.45, carW * 0.25, 8 * proj.scale);

        // VIP Cinema License Plate
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 ${Math.max(5, 8 * proj.scale)}px Orbitron, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('SRN 007', 0, -carH * 0.35);

        ctx.restore();
        break;
      }

      case 'CINEMA_BARRICADE':
      case 'CONSTRUCTION_BOT':
      default: {
        // Heavy Neon Road Barricade
        const barW = 100 * proj.scale;
        const barH = 55 * proj.scale;

        ctx.fillStyle = '#1f2937';
        ctx.fillRect(-barW / 2, -barH, barW, barH);

        // Hazard stripes (Yellow & Black)
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 5 * proj.scale;
        for (let sx = -barW / 2; sx < barW / 2; sx += 14 * proj.scale) {
          ctx.beginPath();
          ctx.moveTo(sx, -barH);
          ctx.lineTo(sx + 10 * proj.scale, 0);
          ctx.stroke();
        }

        // Warning Strobes
        const strobe = Math.sin(this.time * 12 + ob.id) > 0;
        ctx.fillStyle = strobe ? '#ef4444' : '#7f1d1d';
        ctx.beginPath();
        ctx.arc(-barW * 0.35, -barH - 5 * proj.scale, 5 * proj.scale, 0, Math.PI * 2);
        ctx.arc(barW * 0.35, -barH - 5 * proj.scale, 5 * proj.scale, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }

  private renderSingleCollectible(c: Collectible) {
    const ctx = this.ctx;
    const bob = Math.sin(this.time * 5 + c.id) * 12;
    const proj = this.project(c.lane, c.z, 28 + bob);
    if (!proj.visible) return;

    ctx.save();
    ctx.translate(proj.x, proj.y);

    const size = 38 * proj.scale;
    const rot = c.rotation + this.time * 2.5;

    // Ground shadow
    const groundProj = this.project(c.lane, c.z, 0);
    ctx.save();
    ctx.translate(0, groundProj.y - proj.y);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.5, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    switch (c.type) {
      case 'FILM_REEL': {
        // 🎬 Film Reel (+10 pts)
        ctx.rotate(rot);
        ctx.save();
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10 * proj.scale;

        // Outer rim
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 3.5 * proj.scale;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
        ctx.stroke();

        // Inner film disc
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // 3 Spoke cutouts
        ctx.fillStyle = '#083344';
        for (let a = 0; a < 3; a++) {
          const ang = (a * Math.PI * 2) / 3;
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * size * 0.38, Math.sin(ang) * size * 0.38, size * 0.16, 0, Math.PI * 2);
          ctx.fill();
        }

        // Center axle
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
      }

      case 'POPCORN': {
        // 🍿 Popcorn Box (+25 pts)
        ctx.save();
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 10 * proj.scale;

        // Tub (trapezoid)
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(-size * 0.35, size * 0.5);
        ctx.lineTo(size * 0.35, size * 0.5);
        ctx.lineTo(size * 0.45, -size * 0.2);
        ctx.lineTo(-size * 0.45, -size * 0.2);
        ctx.closePath();
        ctx.fill();

        // White stripes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-size * 0.15, -size * 0.2, size * 0.09, size * 0.7);
        ctx.fillRect(size * 0.06, -size * 0.2, size * 0.09, size * 0.7);

        // Fluffy Popcorn kernels
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(-size * 0.25, -size * 0.32, size * 0.18, 0, Math.PI * 2);
        ctx.arc(0, -size * 0.4, size * 0.2, 0, Math.PI * 2);
        ctx.arc(size * 0.25, -size * 0.32, size * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
      }

      case 'GOLDEN_STAR': {
        // ⭐ Golden Cinema Star (+50 pts)
        ctx.rotate(rot);
        ctx.save();
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 14 * proj.scale;

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        const spikes = 5;
        const outerRadius = size * 0.8;
        const innerRadius = size * 0.38;
        for (let i = 0; i < spikes * 2; i++) {
          const r = (i % 2 === 0) ? outerRadius : innerRadius;
          const a = (i * Math.PI) / spikes - Math.PI / 2;
          const sx = Math.cos(a) * r;
          const sy = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        break;
      }

      case 'TICKET': {
        // 🎟 VIP Cinema Ticket (+100 pts)
        ctx.rotate(Math.sin(this.time * 3 + c.id) * 0.25);
        ctx.save();
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 14 * proj.scale;

        const tw = size * 1.3;
        const th = size * 0.7;

        ctx.fillStyle = '#b45309';
        ctx.fillRect(-tw / 2, -th / 2, tw, th);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-tw / 2 + 2, -th / 2 + 2, tw - 4, th - 4);

        // Notches
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.arc(-tw / 2, 0, 4 * proj.scale, 0, Math.PI * 2);
        ctx.arc(tw / 2, 0, 4 * proj.scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#78350f';
        ctx.font = `bold ${Math.max(5, 7 * proj.scale)}px Orbitron, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SRN VIP', 0, 0);
        ctx.restore();
        break;
      }
    }

    ctx.restore();
  }

  private renderSinglePowerUp(p: PowerUpItem) {
    const ctx = this.ctx;
    const bob = Math.sin(this.time * 6 + p.id) * 10;
    const proj = this.project(p.lane, p.z, 35 + bob);
    if (!proj.visible) return;

    ctx.save();
    ctx.translate(proj.x, proj.y);

    const size = 42 * proj.scale;
    const rot = p.rotation + this.time * 3;

    // Glowing Neon Hexagon Capsule
    ctx.save();
    let glowColor = '#06b6d4';
    let iconChar = '🧲';

    if (p.type === 'SHIELD') {
      glowColor = '#10b981';
      iconChar = '🛡';
    } else if (p.type === 'DOUBLE_SCORE') {
      glowColor = '#f59e0b';
      iconChar = '2X';
    } else if (p.type === 'SLOW_MO') {
      glowColor = '#8b5cf6';
      iconChar = '⏱';
    }

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 18 * proj.scale;

    // Hexagon frame
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 3.5 * proj.scale;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 + rot * 0.3;
      const hx = Math.cos(angle) * size * 0.75;
      const hy = Math.sin(angle) * size * 0.75;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Icon in center
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(10, 16 * proj.scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(iconChar, 0, 0);

    ctx.restore();
    ctx.restore();
  }

  // --- 8. Player Character ---
  private renderPlayer(player: PlayerState, reducedMotion: boolean) {
    const ctx = this.ctx;

    // Player position in 3D road perspective
    const playerZ = 100;
    const jumpOffsetPixels = player.jumpHeight * 115;
    const proj = this.project(player.lanePositionX, playerZ, jumpOffsetPixels);
    const groundProj = this.project(player.lanePositionX, playerZ, 0);

    ctx.save();

    // 8a. Shadow on road
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    const shadowScale = Math.max(0.4, 1.0 - player.jumpHeight * 0.5);
    ctx.beginPath();
    ctx.ellipse(groundProj.x, groundProj.y, 26 * shadowScale, 9 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 8b. Invincibility Flicker
    if (player.invincibleTimer > 0 && Math.sin(player.invincibleTimer * 28) > 0) {
      ctx.globalAlpha = 0.45;
    }

    ctx.translate(proj.x, proj.y);

    // 8c. Slide Mode
    if (player.isSliding) {
      this.renderPlayerSliding(ctx, reducedMotion);
    } else if (player.isJumping) {
      // 8d. Jump Mode
      this.renderPlayerJumping(ctx);
    } else {
      // 8e. Running Mode
      this.renderPlayerRunning(ctx, player.runCycle);
    }

    // 8f. Active Power-Up Auras on Player
    if (player.hasShield) {
      // Hexagonal cyan/emerald energy shield bubble
      ctx.save();
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.85)';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.beginPath();
      ctx.arc(0, -36, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (player.activePowerUps.MAGNET > 0) {
      // Magnetic blue rings
      ctx.save();
      const ringR = 34 + Math.sin(this.time * 10) * 8;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -36, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (player.activePowerUps.DOUBLE_SCORE > 0) {
      // Golden 2X Floating Badge
      ctx.save();
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 12;
      ctx.font = '900 13px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ 2X ⚡', 0, -84);
      ctx.restore();
    }

    ctx.restore();
  }

  private renderPlayerRunning(ctx: CanvasRenderingContext2D, runCycle: number) {
    const legSwing = Math.sin(runCycle);
    const armSwing = Math.cos(runCycle);

    // Legs (Cybernetic charcoal with crimson neon knee/heel accents)
    // Left leg
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(-10, -30);
    ctx.lineTo(-12 + legSwing * 12, -15);
    ctx.lineTo(-10 + legSwing * 16, 0);
    ctx.stroke();

    // Right leg
    ctx.beginPath();
    ctx.moveTo(10, -30);
    ctx.lineTo(12 - legSwing * 12, -15);
    ctx.lineTo(10 - legSwing * 16, 0);
    ctx.stroke();

    // Glowing Boot Soles (Neon Cyan)
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(-15 + legSwing * 16, -2, 10, 3.5);
    ctx.fillRect(5 - legSwing * 16, -2, 10, 3.5);

    // Torso / Cyber Jacket (Back view)
    const bob = Math.abs(Math.sin(runCycle * 2)) * 3;
    const bodyY = -32 - bob;

    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.roundRect(-16, bodyY - 26, 32, 28, [6, 6, 2, 2]);
    ctx.fill();

    // Glowing "SRN" Brand Emblem on the back of the runner's vest!
    ctx.save();
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ef4444';
    ctx.font = '900 9px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SRN', 0, bodyY - 12);
    ctx.restore();

    // Arms
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 6;
    ctx.beginPath();
    // Left arm
    ctx.moveTo(-16, bodyY - 22);
    ctx.lineTo(-24, bodyY - 10 + armSwing * 10);
    ctx.stroke();
    // Right arm
    ctx.moveTo(16, bodyY - 22);
    ctx.lineTo(24, bodyY - 10 - armSwing * 10);
    ctx.stroke();

    // Head / Cyber Helmet
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, bodyY - 35, 12, 0, Math.PI * 2);
    ctx.fill();

    // Neon Cyber Visor Band (Cyan)
    ctx.save();
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(-11, bodyY - 37, 22, 4.5);
    ctx.restore();
  }

  private renderPlayerJumping(ctx: CanvasRenderingContext2D) {
    // Knees tucked up, arms raised high
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';

    // Tucked legs
    ctx.beginPath();
    ctx.moveTo(-10, -28);
    ctx.lineTo(-18, -12);
    ctx.lineTo(-8, -4);
    ctx.moveTo(10, -28);
    ctx.lineTo(18, -12);
    ctx.lineTo(8, -4);
    ctx.stroke();

    // Torso
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.roundRect(-16, -56, 32, 28, [6, 6, 2, 2]);
    ctx.fill();

    // SRN emblem
    ctx.save();
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ef4444';
    ctx.font = '900 9px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SRN', 0, -42);
    ctx.restore();

    // Arms outstretched
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-16, -52);
    ctx.lineTo(-28, -64);
    ctx.moveTo(16, -52);
    ctx.lineTo(28, -64);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -66, 12, 0, Math.PI * 2);
    ctx.fill();

    // Visor
    ctx.save();
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(-11, -68, 22, 4.5);
    ctx.restore();
  }

  private renderPlayerSliding(ctx: CanvasRenderingContext2D, reducedMotion: boolean) {
    // Low profile slide along ground
    ctx.save();
    ctx.translate(0, -12);

    // Torso laid back
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.roundRect(-24, -12, 38, 18, [4, 4, 4, 4]);
    ctx.fill();

    // Head
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-26, -6, 10, 0, Math.PI * 2);
    ctx.fill();

    // Visor
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(-34, -8, 14, 4);

    // Legs extended forward
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(10, -2);
    ctx.lineTo(28, 4);
    ctx.stroke();

    // Slide sparks on road!
    if (!reducedMotion) {
      ctx.fillStyle = '#facc15';
      for (let s = 0; s < 4; s++) {
        const sx = 20 + Math.random() * 18;
        const sy = 4 + (Math.random() - 0.5) * 6;
        ctx.fillRect(sx, sy, 2.5, 2.5);
      }
    }

    ctx.restore();
  }

  // --- 9. Particle Effects ---
  private renderParticles(particles: Particle[]) {
    const ctx = this.ctx;
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // --- 10. Floating Score Popups ---
  private renderFloatingTexts(floatingTexts: FloatingText[]) {
    const ctx = this.ctx;
    for (const ft of floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.font = `bold ${ft.size}px Orbitron, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  // --- 11. Cinematic Vignette & Speed Effect ---
  private renderCinematicVignette(isDoubleScore: boolean, isSlowMo: boolean) {
    const ctx = this.ctx;
    // Edge vignette
    const vigGrad = ctx.createRadialGradient(
      this.width / 2, this.height / 2, this.width * 0.35,
      this.width / 2, this.height / 2, this.width * 0.72
    );
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(1, isDoubleScore ? 'rgba(234, 179, 8, 0.25)' : (isSlowMo ? 'rgba(139, 92, 246, 0.25)' : 'rgba(0, 0, 0, 0.55)'));

    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, this.width, this.height);
  }
}
