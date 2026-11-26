import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './TeiaTurbo.module.css';
import {
  INITIAL_SWING_STATE,
  starHeight,
  starWorldPosition,
  stepSwing,
  type SwingInput,
  type SwingState,
} from '../../games/teia-turbo/physics';

type OrientationPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, rotation: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let point = 0; point < 10; point += 1) {
    const r = point % 2 === 0 ? radius : radius * 0.45;
    const angle = -Math.PI / 2 + (point * Math.PI) / 5;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (point === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffd83d';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff4a8';
  ctx.stroke();
  ctx.restore();
}

function drawCity(ctx: CanvasRenderingContext2D, width: number, height: number, distance: number, time: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#67c9ff');
  sky.addColorStop(0.62, '#c4f1ff');
  sky.addColorStop(1, '#ffe5b4');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#fff3a6';
  ctx.beginPath();
  ctx.arc(width * 0.82, height * 0.18, height * 0.09, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 4; i += 1) {
    const cloudX = ((i * width * 0.39 - distance * (0.035 + i * 0.006)) % (width + 180) + width + 180) % (width + 180) - 90;
    const cloudY = height * (0.13 + (i % 2) * 0.16);
    ctx.fillStyle = '#ffffffd9';
    ctx.beginPath();
    ctx.arc(cloudX, cloudY, height * 0.045, 0, Math.PI * 2);
    ctx.arc(cloudX + height * 0.045, cloudY - height * 0.025, height * 0.055, 0, Math.PI * 2);
    ctx.arc(cloudX + height * 0.105, cloudY, height * 0.043, 0, Math.PI * 2);
    ctx.fill();
  }

  const palette = ['#86b7df', '#78a9d4', '#9ac8df', '#82b5cf', '#a1c2df'];
  const baseY = height * 0.78;
  for (let layer = 0; layer < 2; layer += 1) {
    const parallax = layer === 0 ? 0.16 : 0.34;
    const buildingWidth = layer === 0 ? width * 0.11 : width * 0.15;
    const offset = (distance * parallax) % buildingWidth;
    for (let i = -2; i < 12; i += 1) {
      const x = i * buildingWidth - offset;
      const seed = Math.abs(i * 17 + layer * 23);
      const buildingHeight = height * (0.2 + (seed % 5) * 0.045 + layer * 0.08);
      const y = baseY - buildingHeight;
      ctx.fillStyle = layer === 0 ? palette[seed % palette.length] : ['#438bb9', '#4d99bd', '#347eaa', '#5ba5c6'][seed % 4];
      ctx.fillRect(x, y, buildingWidth - 4, buildingHeight);
      if (layer === 1) {
        ctx.fillStyle = '#ffeaa0';
        const rows = Math.max(2, Math.floor(buildingHeight / 28));
        for (let row = 0; row < rows; row += 1) {
          for (let col = 0; col < 3; col += 1) {
            const wx = x + 10 + col * Math.max(18, (buildingWidth - 26) / 3);
            const wy = y + 14 + row * 24;
            ctx.fillRect(wx, wy, 8, 11);
          }
        }
      }
    }
  }

  ctx.fillStyle = '#55c879';
  ctx.fillRect(0, baseY, width, height - baseY);
  ctx.fillStyle = '#fff1c9';
  ctx.fillRect(0, baseY + height * 0.035, width, height * 0.025);
  ctx.fillStyle = '#48b7d4';
  ctx.fillRect(0, baseY + height * 0.06, width, height * 0.012);

  // Tiny friendly birds drifting above the rooftops.
  ctx.save();
  ctx.translate(width * 0.72, height * 0.34 + Math.sin(time * 0.0015) * 5);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(-8, 0, 8, Math.PI, Math.PI * 1.8);
  ctx.arc(8, 0, 8, Math.PI * 1.2, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawHero(ctx: CanvasRenderingContext2D, x: number, y: number, lean: number, time: number) {
  ctx.save();
  ctx.translate(x, y + Math.sin(time * 0.008) * 3);
  ctx.rotate(lean * 0.24);

  // Cape
  ctx.fillStyle = '#ef4055';
  ctx.beginPath();
  ctx.moveTo(-15, -8);
  ctx.quadraticCurveTo(-46, 5 + Math.sin(time * 0.01) * 8, -54, 28);
  ctx.quadraticCurveTo(-25, 24, -7, 15);
  ctx.closePath();
  ctx.fill();

  // Legs
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ef4055';
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(-5, 17);
  ctx.lineTo(-22, 37);
  ctx.moveTo(8, 17);
  ctx.lineTo(25, 34);
  ctx.stroke();
  ctx.fillStyle = '#2459a8';
  ctx.beginPath();
  ctx.ellipse(-24, 39, 11, 6, -0.3, 0, Math.PI * 2);
  ctx.ellipse(27, 36, 11, 6, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Arms
  ctx.strokeStyle = '#ef4055';
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(-13, -7);
  ctx.lineTo(-31, -20);
  ctx.moveTo(13, -7);
  ctx.lineTo(29, -22);
  ctx.stroke();

  // Blue suit
  ctx.fillStyle = '#2869c8';
  ctx.beginPath();
  ctx.roundRect(-19, -17, 38, 42, 13);
  ctx.fill();
  ctx.fillStyle = '#f9d34b';
  ctx.beginPath();
  ctx.arc(0, 1, 8, 0, Math.PI * 2);
  ctx.fill();
  drawStar(ctx, 0, 1, 6, 0);

  // Red mask and oversized friendly eyes
  ctx.fillStyle = '#ef4055';
  ctx.beginPath();
  ctx.arc(0, -31, 23, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(-9, -32, 7, 9, -0.2, 0, Math.PI * 2);
  ctx.ellipse(9, -32, 7, 9, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2459a8';
  ctx.beginPath();
  ctx.arc(-8, -31, 3, 0, Math.PI * 2);
  ctx.arc(10, -31, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b92e4b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -24, 6, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // Little gloves
  ctx.fillStyle = '#ef4055';
  ctx.beginPath();
  ctx.arc(-34, -22, 7, 0, Math.PI * 2);
  ctx.arc(32, -24, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawScene(ctx: CanvasRenderingContext2D, width: number, height: number, state: SwingState, time: number) {
  drawCity(ctx, width, height, state.distance, time);
  const heroX = width * (0.39 + state.offset * 0.15);
  const heroY = height * state.heroY;
  const anchorX = heroX + width * 0.12 + Math.sin(state.phase) * 18;
  const anchorY = height * 0.065;

  // Web line and a small web-shaped anchor.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(anchorX, anchorY);
  ctx.quadraticCurveTo(anchorX - 28, (anchorY + heroY) * 0.48, heroX + 28, heroY - 9);
  ctx.stroke();
  ctx.strokeStyle = '#d8f7ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(anchorX, anchorY, 18, 0, Math.PI * 2);
  ctx.moveTo(anchorX - 17, anchorY);
  ctx.lineTo(anchorX + 17, anchorY);
  ctx.moveTo(anchorX, anchorY - 17);
  ctx.lineTo(anchorX, anchorY + 17);
  ctx.stroke();

  // Stars appear in the path ahead; the collection window is intentionally generous.
  const firstVisible = Math.max(0, Math.floor((state.distance - 350) / 540) - 1);
  for (let index = firstVisible; index < firstVisible + 5; index += 1) {
    if (index <= state.lastStar) continue;
    const starX = heroX + (starWorldPosition(index) - state.distance) * 0.72;
    if (starX < -50 || starX > width + 50) continue;
    const starY = height * starHeight(index);
    const pulse = 1 + Math.sin(time * 0.006 + index) * 0.12;
    drawStar(ctx, starX, starY, height * 0.034 * pulse, time * 0.001 + index);
    ctx.fillStyle = '#fff8c7';
    ctx.beginPath();
    ctx.arc(starX - 17, starY - 16, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // A rainbow trail makes forward movement feel magical.
  ctx.globalAlpha = 0.2;
  const rainbow = ['#ff6262', '#ffbd4a', '#fff06a', '#68d88a', '#5caeff'];
  rainbow.forEach((color, index) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(heroX - 36 - index * 3, heroY + 22 + index * 2);
    ctx.lineTo(heroX - 105 - index * 5, heroY + 27 + index * 2);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;

  drawHero(ctx, heroX, heroY, state.offset, time);

  // Friendly rooftop pennants add movement and depth.
  for (let i = 0; i < 5; i += 1) {
    const x = ((i * width * 0.29 - state.distance * 0.5) % (width + 80) + width + 80) % (width + 80);
    const y = height * (0.72 + (i % 2) * 0.035);
    ctx.fillStyle = ['#ff6b6b', '#ffd34e', '#65c9ee', '#a78bfa'][i % 4];
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 18, y + 5);
    ctx.lineTo(x, y + 13);
    ctx.closePath();
    ctx.fill();
  }
}

const TeiaTurbo = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SwingState>({ ...INITIAL_SWING_STATE });
  const inputRef = useRef<SwingInput>({ x: 0, y: 0 });
  const baselineRef = useRef<{ beta: number; gamma: number } | null>(null);
  const lastFrameRef = useRef(0);
  const [started, setStarted] = useState(false);
  const [sensorActive, setSensorActive] = useState(false);
  const [sensorMessage, setSensorMessage] = useState('Incline o celular para guiar o herói');
  const [stars, setStars] = useState(0);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    if (event.beta === null || event.gamma === null) return;
    if (!baselineRef.current) {
      baselineRef.current = { beta: event.beta, gamma: event.gamma };
      return;
    }
    const beta = event.beta - baselineRef.current.beta;
    const gamma = event.gamma - baselineRef.current.gamma;
    const angle = (((screen.orientation?.angle ?? (window.orientation as number) ?? 0) % 360) + 360) % 360;
    let x = gamma;
    let y = beta;
    if (angle === 90) { x = beta; y = -gamma; }
    else if (angle === 180) { x = -gamma; y = -beta; }
    else if (angle === 270) { x = -beta; y = gamma; }
    inputRef.current = { x: clamp(x / 24, -1, 1), y: clamp(y / 28, -1, 1) };
  }, []);

  const startAdventure = useCallback(async () => {
    setStarted(true);
    stateRef.current = { ...INITIAL_SWING_STATE };
    inputRef.current = { x: 0, y: 0 };
    setStars(0);

    try {
      const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
      if (typeof orientation?.lock === 'function') void orientation.lock('landscape').catch(() => undefined);
    } catch {
      // Orientation lock is not supported by every browser, especially iOS Safari.
    }

    if (!('DeviceOrientationEvent' in window)) {
      setSensorMessage('Use as setinhas para passear!');
      return;
    }
    try {
      const Orientation = DeviceOrientationEvent as OrientationPermission;
      if (typeof Orientation.requestPermission === 'function') {
        const permission = await Orientation.requestPermission();
        if (permission !== 'granted') {
          setSensorMessage('Tudo bem! Use as setinhas para brincar.');
          return;
        }
      }
      baselineRef.current = null;
      window.addEventListener('deviceorientation', handleOrientation, true);
      setSensorActive(true);
      setSensorMessage('Sensor ligado! Incline para os lados e para frente.');
    } catch {
      setSensorMessage('Use as setinhas para passear!');
    }
  }, [handleOrientation]);

  const setDirection = (x: number, y: number) => {
    inputRef.current = { x, y };
  };

  useEffect(() => {
    let frame = 0;
    let previousStars = 0;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const animate = (timestamp: number) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.max(1, Math.round(rect.width * dpr));
      const pixelHeight = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (started) {
        if (!lastFrameRef.current) lastFrameRef.current = timestamp;
        const delta = Math.min((timestamp - lastFrameRef.current) / 1000, 0.05);
        lastFrameRef.current = timestamp;
        stateRef.current = stepSwing(stateRef.current, inputRef.current, delta);
        if (stateRef.current.stars !== previousStars) {
          previousStars = stateRef.current.stars;
          setStars(previousStars);
        }
      }
      drawScene(ctx, rect.width, rect.height, stateRef.current, timestamp);
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [started]);

  useEffect(() => () => {
    window.removeEventListener('deviceorientation', handleOrientation, true);
  }, [handleOrientation]);

  return (
    <main className={styles.game}>
      <canvas ref={canvasRef} className={styles.scene} aria-label="Herói balançando por uma cidade colorida" />
      <header className={styles.hud}>
        <button className={styles.home} onClick={() => window.dispatchEvent(new CustomEvent('peterpark:back'))} aria-label="Voltar ao parque">🏠</button>
        <div className={styles.title}>🕸️ TEIA TURBO</div>
        <div className={styles.score}>⭐ {stars}</div>
      </header>

      <div className={styles.sensorHint}>{sensorActive ? '✨ Sensor ligado' : sensorMessage}</div>

      {started && (
        <div className={styles.controls} aria-label="Controles alternativos">
          <button onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDirection(-1, 0); }} onPointerUp={() => setDirection(0, 0)} onPointerCancel={() => setDirection(0, 0)} aria-label="Ir para a esquerda">◀</button>
          <button onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDirection(1, 0); }} onPointerUp={() => setDirection(0, 0)} onPointerCancel={() => setDirection(0, 0)} aria-label="Ir para a direita">▶</button>
          <button onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDirection(0, -1); }} onPointerUp={() => setDirection(0, 0)} onPointerCancel={() => setDirection(0, 0)} aria-label="Subir">⬆</button>
          <button onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDirection(0, 1); }} onPointerUp={() => setDirection(0, 0)} onPointerCancel={() => setDirection(0, 0)} aria-label="Descer">⬇</button>
        </div>
      )}

      {!started && (
        <div className={styles.intro}>
          <div className={styles.introCard}>
            <div className={styles.heroBadge}>🦸‍♂️</div>
            <p className={styles.kicker}>UMA AVENTURA NAS ALTURAS</p>
            <h1>Teia Turbo!</h1>
            <p>Ajude nosso herói a passear pela cidade, pegar estrelinhas e fazer um montão de balanços!</p>
            <div className={styles.instructions}>
              <span>↔️ Incline para virar</span>
              <span>↕️ Incline para subir e descer</span>
              <span>⭐ Pegue as estrelas brilhantes</span>
            </div>
            <button className={styles.playButton} onClick={startAdventure}>BORA VOAR! 🚀</button>
            <small>Também dá para brincar usando as setinhas.</small>
          </div>
        </div>
      )}

      <div className={styles.landscapePrompt}>
        <div>📱</div>
        <strong>Vire o celular de lado!</strong>
        <span>A cidade é grandona e está esperando por você.</span>
      </div>
    </main>
  );
};

export default TeiaTurbo;
