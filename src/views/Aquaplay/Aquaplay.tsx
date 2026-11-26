import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import styles from './Aquaplay.module.css';
import { playPopSound, playSuccessSound } from '../../utils/audio';
import {
  createInitialRings,
  pumpRings,
  stepRings,
  type AquaRing,
  type PumpDirection,
} from '../../games/aquaplay/physics';

type WaterBubble = { id: number; side: PumpDirection; offset: number };

const makeBubbleBurst = (side: PumpDirection, baseId: number): WaterBubble[] =>
  Array.from({ length: 9 }, (_, index) => ({
    id: baseId + index,
    side,
    offset: (index - 4) * 5 + (index % 2 ? 3 : -3),
  }));

const Aquaplay = () => {
  const [rings, setRings] = useState<AquaRing[]>(createInitialRings);
  const [caughtTotal, setCaughtTotal] = useState(0);
  const [round, setRound] = useState(1);
  const [celebrating, setCelebrating] = useState(false);
  const [activePump, setActivePump] = useState<PumpDirection | null>(null);
  const [bubbles, setBubbles] = useState<WaterBubble[]>([]);
  const [muted, setMuted] = useState(false);
  const ringsRef = useRef(rings);
  const mutedRef = useRef(muted);
  const pumpIntervalRef = useRef<number | null>(null);
  const burstTimeoutRef = useRef<number | null>(null);
  const celebrationTimeoutRef = useRef<number | null>(null);
  const bubbleIdRef = useRef(0);

  mutedRef.current = muted;

  const resetRound = useCallback(() => {
    const fresh = createInitialRings();
    ringsRef.current = fresh;
    setRings(fresh);
    setCelebrating(false);
    setRound((value) => value + 1);
  }, []);

  const pump = useCallback((direction: PumpDirection) => {
    ringsRef.current = pumpRings(ringsRef.current, direction);
    setRings(ringsRef.current);
    setActivePump(direction);

    const nextId = bubbleIdRef.current;
    bubbleIdRef.current += 9;
    setBubbles(makeBubbleBurst(direction, nextId));
    if (burstTimeoutRef.current !== null) window.clearTimeout(burstTimeoutRef.current);
    burstTimeoutRef.current = window.setTimeout(() => setBubbles([]), 850);

    if (!mutedRef.current) playPopSound(direction < 0 ? 390 : 520);
  }, []);

  const startPump = (direction: PumpDirection, event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pumpIntervalRef.current !== null) window.clearInterval(pumpIntervalRef.current);
    pump(direction);
    pumpIntervalRef.current = window.setInterval(() => pump(direction), 240);
  };

  const stopPump = () => {
    if (pumpIntervalRef.current !== null) {
      window.clearInterval(pumpIntervalRef.current);
      pumpIntervalRef.current = null;
    }
    setActivePump(null);
  };

  useEffect(() => {
    let frame = 0;
    let previousTime = 0;
    let lastPaint = 0;

    const animate = (time: number) => {
      if (!previousTime) previousTime = time;
      const delta = (time - previousTime) / 1000;
      previousTime = time;

      if (time - lastPaint > 28 && !celebrating) {
        const result = stepRings(ringsRef.current, delta);
        ringsRef.current = result.rings;
        setRings(result.rings);
        lastPaint = time;

        if (result.caughtIds.length > 0) {
          setCaughtTotal((value) => value + result.caughtIds.length);
          if (!mutedRef.current) playSuccessSound();
          if (result.rings.every((ring) => ring.caught)) {
            setCelebrating(true);
            if (!mutedRef.current) playSuccessSound();
            celebrationTimeoutRef.current = window.setTimeout(resetRound, 2300);
          }
        }
      }

      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [celebrating, resetRound]);

  useEffect(() => () => {
    if (pumpIntervalRef.current !== null) window.clearInterval(pumpIntervalRef.current);
    if (burstTimeoutRef.current !== null) window.clearTimeout(burstTimeoutRef.current);
    if (celebrationTimeoutRef.current !== null) window.clearTimeout(celebrationTimeoutRef.current);
  }, []);

  const handleHome = () => {
    stopPump();
    window.dispatchEvent(new CustomEvent('peterpark:back'));
  };

  const renderPump = (direction: PumpDirection) => (
    <button
      type="button"
      className={[
        styles.pumpButton,
        direction < 0 ? styles.leftPump : styles.rightPump,
        activePump === direction ? styles.pumping : '',
      ].join(' ')}
      onPointerDown={(event) => startPump(direction, event)}
      onPointerUp={stopPump}
      onPointerCancel={stopPump}
      onLostPointerCapture={stopPump}
      aria-label={direction < 0 ? 'Apertar bomba esquerda' : 'Apertar bomba direita'}
      aria-pressed={activePump === direction}
    >
      <span className={styles.buttonSplash}>{direction < 0 ? '💦' : '🫧'}</span>
      <span className={styles.buttonLabel}>{direction < 0 ? 'ESQUERDA' : 'DIREITA'}</span>
      <span className={styles.buttonHint}>APERTE!</span>
    </button>
  );

  const caughtInRound = rings.filter((ring) => ring.caught).length;

  return (
    <main className={styles.game}>
      <header className={styles.topBar}>
        <button className={styles.homeButton} onClick={handleHome} aria-label="Voltar ao parque">🏠</button>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>🐠</span>
          <div>
            <h1>AQUAPLAY</h1>
            <p>APERTE E FAÇA A MÁGICA! ✨</p>
          </div>
        </div>
        <div className={styles.topActions}>
          <div className={styles.score} aria-live="polite">
            <span>⭐</span>
            <strong>{caughtInRound}/8</strong>
          </div>
          <button className={styles.soundButton} onClick={() => setMuted((value) => !value)} aria-label={muted ? 'Ativar sons' : 'Silenciar sons'}>
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      <section className={styles.playArea} aria-label="Brinquedo Aquaplay">
        <div className={styles.tank}>
          <div className={styles.tankShine} />
          <div className={styles.waterSurface}><span /><span /><span /></div>
          <div className={styles.sunRays}>☀️</div>
          <div className={styles.target targetLeft}><i /><span>⭐</span></div>
          <div className={styles.target targetRight}><i /><span>⭐</span></div>

          <div className={styles.fish fishOne}>🐠</div>
          <div className={styles.fish fishTwo}>🐟</div>
          <div className={styles.turtle}>🐢</div>
          <div className={styles.jellyfish}>🪼</div>
          <div className={styles.octopus}>🐙</div>
          <div className={styles.dolphin}>🐬</div>
          <div className={styles.seaweed}>🌿 🌿</div>
          <div className={styles.coral}>🪸</div>

          {rings.map((ring) => (
            <div
              key={ring.id}
              className={styles.ringSlot}
              style={{ left: ring.x + '%', top: ring.y + '%' }}
            >
              <div
                className={styles.ring}
                style={{
                  borderColor: ring.color,
                  transform: 'translate(-50%, -50%) rotate(' + ring.angle + 'deg)',
                  opacity: ring.caught ? 1 : 0.98,
                }}
              >
                {ring.caught && <span className={styles.ringSparkle}>✨</span>}
              </div>
            </div>
          ))}

          {bubbles.map((bubble) => (
            <span
              key={bubble.id}
              className={styles.burstBubble}
              style={{
                left: (bubble.side < 0 ? 28 : 72) + '%',
                '--bubble-offset': bubble.offset + 'px',
                '--bubble-delay': (Math.abs(bubble.offset) / 120) + 's',
              } as React.CSSProperties}
            />
          ))}

          <div className={styles.floor} />
          <div className={styles.tankLabel}>🌊 OCEANO DA DIVERSÃO 🌊</div>
          {celebrating && (
            <div className={styles.celebration}>
              <div>🎉🐬🎉</div>
              <strong>VOCÊ CONSEGUIU!</strong>
              <span>As argolas encontraram seus lugares!</span>
              <div className={styles.confetti}>⭐ 🫧 🐠 💖 🐙</div>
            </div>
          )}
        </div>
      </section>

      <footer className={styles.controls}>
        <div className={styles.controlHint}>SEGURE OS BOTÕES E VEJA A ÁGUA FAZER MÁGICA!</div>
        <div className={styles.buttonRow}>
          {renderPump(-1)}
          {renderPump(1)}
        </div>
        <div className={styles.footerMeta}>RODADA {round} <span>•</span> {caughtTotal} ARGOLAS NO TOTAL 🏆</div>
      </footer>
    </main>
  );
};

export default Aquaplay;
