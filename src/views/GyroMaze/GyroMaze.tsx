import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './GyroMaze.module.css';
import { MAZE_LAYOUT, MAZE_SIZE, START_POSITION, isGoalAt, stepBall, type MazeVector } from '../../games/gyro-maze/physics';

type Tilt = { x: number; y: number };
type OrientationPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const GyroMaze = () => {
  const [ball, setBall] = useState<MazeVector>(START_POSITION);
  const [gyroEnabled, setGyroEnabled] = useState(false);
  const [sensorMessage, setSensorMessage] = useState('Ative o sensor ou use os controles');
  const [won, setWon] = useState(false);
  const [moves, setMoves] = useState(0);
  const tiltRef = useRef<Tilt>({ x: 0, y: 0 });
  const baselineRef = useRef<{ beta: number; gamma: number } | null>(null);
  const ballRef = useRef<MazeVector>(START_POSITION);
  const lastFrameRef = useRef(0);
  const lastTileRef = useRef('1,1');

  const reset = useCallback(() => {
    ballRef.current = { ...START_POSITION };
    tiltRef.current = { x: 0, y: 0 };
    setBall({ ...START_POSITION });
    setWon(false);
    setMoves(0);
    lastFrameRef.current = 0;
    lastTileRef.current = '1,1';
  }, []);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    if (event.beta === null || event.gamma === null) return;
    if (!baselineRef.current) baselineRef.current = { beta: event.beta, gamma: event.gamma };
    const beta = event.beta - baselineRef.current.beta;
    const gamma = event.gamma - baselineRef.current.gamma;
    tiltRef.current = {
      x: clamp(gamma / 24, -1, 1),
      y: clamp(beta / 24, -1, 1),
    };
  }, []);

  const enableGyro = useCallback(async () => {
    if (!('DeviceOrientationEvent' in window)) {
      setSensorMessage('Sensor não disponível neste aparelho');
      return;
    }
    try {
      const Orientation = DeviceOrientationEvent as OrientationPermission;
      if (typeof Orientation.requestPermission === 'function') {
        const permission = await Orientation.requestPermission();
        if (permission !== 'granted') {
          setSensorMessage('Permissão negada. Use os controles na tela.');
          return;
        }
      }
      baselineRef.current = null;
      window.addEventListener('deviceorientation', handleOrientation, true);
      setGyroEnabled(true);
      setSensorMessage('Incline o celular para mover a bolinha');
    } catch {
      setSensorMessage('Não foi possível ativar o sensor. Use os controles.');
    }
  }, [handleOrientation]);

  const calibrate = useCallback(() => {
    baselineRef.current = null;
    tiltRef.current = { x: 0, y: 0 };
    setSensorMessage('Calibrado! Mantenha o celular nivelado');
  }, []);

  useEffect(() => {
    let frame = 0;
    const animate = (timestamp: number) => {
      if (!lastFrameRef.current) lastFrameRef.current = timestamp;
      const delta = (timestamp - lastFrameRef.current) / 1000;
      lastFrameRef.current = timestamp;
      if (!won) {
        const next = stepBall(ballRef.current, tiltRef.current, delta);
        ballRef.current = next;
        setBall(next);
        const tile = `${Math.floor(next.x)},${Math.floor(next.y)}`;
        if (tile !== lastTileRef.current) {
          lastTileRef.current = tile;
          setMoves(value => value + 1);
        }
        if (isGoalAt(next.x, next.y)) setWon(true);
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [won]);

  useEffect(() => () => {
    window.removeEventListener('deviceorientation', handleOrientation, true);
  }, [handleOrientation]);

  const setPadTilt = (x: number, y: number) => {
    tiltRef.current = { x, y };
  };

  const releasePad = () => {
    if (!gyroEnabled) tiltRef.current = { x: 0, y: 0 };
  };

  return (
    <main className={styles.container}>
      <div className={styles.topbar}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>DESAFIO DE EQUILÍBRIO</span>
          <h1>Labirinto do Peter</h1>
          <p>Leve a bolinha até a estrela!</p>
        </div>
        <button className={styles.homeButton} onClick={() => window.dispatchEvent(new CustomEvent('peterpark:back'))} aria-label="Voltar ao parque">🏠</button>
      </div>

      <div className={styles.sensorPanel}>
        <div className={styles.sensorCopy}>
          <strong>{gyroEnabled ? 'Giroscópio ativo' : 'Controle de movimento'}</strong>
          <span>{sensorMessage}</span>
        </div>
        <div className={styles.sensorActions}>
          {!gyroEnabled ? <button onClick={enableGyro}>Ativar sensor</button> : <button onClick={calibrate}>Calibrar</button>}
          <button className={styles.resetButton} onClick={reset} aria-label="Reiniciar labirinto">↻</button>
        </div>
      </div>

      <section className={styles.playArea} aria-label="Tabuleiro do labirinto">
        <div className={styles.maze} style={{ gridTemplateColumns: `repeat(${MAZE_SIZE}, 1fr)` }}>
          {MAZE_LAYOUT.flatMap((row, y) => row.split('').map((cell, x) => (
            <div key={`${x}-${y}`} className={cell === '#' ? styles.wall : cell === 'G' ? styles.goal : styles.path}>
              {cell === 'G' && <span>⭐</span>}
              {cell === 'S' && <span className={styles.startDot}>●</span>}
            </div>
          )))}
          <div className={styles.ball} style={{ left: `${(ball.x / MAZE_SIZE) * 100}%`, top: `${(ball.y / MAZE_SIZE) * 100}%` }} />
        </div>
      </section>

      <div className={styles.bottomPanel}>
        <div className={styles.progress}><span>Movimentos</span><strong>{moves}</strong></div>
        <div className={styles.dpad} aria-label="Controles alternativos">
          <button onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setPadTilt(0, -1); }} onPointerUp={releasePad} onPointerCancel={releasePad} aria-label="Mover para cima">▲</button>
          <button onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setPadTilt(-1, 0); }} onPointerUp={releasePad} onPointerCancel={releasePad} aria-label="Mover para esquerda">◀</button>
          <button onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setPadTilt(0, 1); }} onPointerUp={releasePad} onPointerCancel={releasePad} aria-label="Mover para baixo">▼</button>
          <button onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setPadTilt(1, 0); }} onPointerUp={releasePad} onPointerCancel={releasePad} aria-label="Mover para direita">▶</button>
        </div>
      </div>

      {won && <div className={styles.winOverlay}>
        <div className={styles.winCard}>
          <span>🏆</span>
          <h2>Você conseguiu!</h2>
          <p>Peter chegou ao final do labirinto!</p>
          <button onClick={reset}>Jogar novamente</button>
        </div>
      </div>}
    </main>
  );
};

export default GyroMaze;
