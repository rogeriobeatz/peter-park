import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent, CSSProperties } from 'react';
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
const SCENES = [
  { src: '/aquaplay/scene-1.webp', label: 'Cidade coral', icon: '🏙️' },
  { src: '/aquaplay/scene-2.webp', label: 'Mar noturno', icon: '🌌' },
  { src: '/aquaplay/scene-3.webp', label: 'Casa abacaxi', icon: '🍍' },
];

const makeBubbleBurst = (side: PumpDirection, baseId: number): WaterBubble[] =>
  Array.from({ length: 11 }, (_, index) => ({
    id: baseId + index,
    side,
    offset: (index - 5) * 7 + (index % 2 ? 4 : -4),
  }));

const Aquaplay = () => {
  const [rings, setRings] = useState<AquaRing[]>(createInitialRings);
  const [caughtTotal, setCaughtTotal] = useState(0);
  const [round, setRound] = useState(1);
  const [scene, setScene] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [activePump, setActivePump] = useState<PumpDirection | null>(null);
  const [bubbles, setBubbles] = useState<WaterBubble[]>([]);
  const [hint, setHint] = useState('BOMBE NA HORA CERTA. SOLTE PARA ALINHAR!');

  const ringsRef = useRef(rings);
  const pumpIntervalRef = useRef<number | null>(null);
  const bubbleTimeoutRef = useRef<number | null>(null);
  const hintTimeoutRef = useRef<number | null>(null);
  const celebrationTimeoutRef = useRef<number | null>(null);
  const bubbleIdRef = useRef(0);
  const pulseRef = useRef(0);

  const resetRound = useCallback(() => {
    const fresh = createInitialRings();
    ringsRef.current = fresh;
    setRings(fresh);
    setCelebrating(false);
    setScene((value) => (value + 1) % SCENES.length);
    setRound((value) => value + 1);
    setHint('NOVO AQUÁRIO! ENCONTRE O RITMO DAS BOMBAS 🫧');
  }, []);

  const pump = useCallback((direction: PumpDirection) => {
    const next = pumpRings(ringsRef.current, direction, pulseRef.current);
    pulseRef.current += 1;
    ringsRef.current = next;
    setRings(next);
    setActivePump(direction);

    const baseId = bubbleIdRef.current;
    bubbleIdRef.current += 11;
    setBubbles(makeBubbleBurst(direction, baseId));
    if (bubbleTimeoutRef.current !== null) window.clearTimeout(bubbleTimeoutRef.current);
    bubbleTimeoutRef.current = window.setTimeout(() => setBubbles([]), 760);

    playPopSound(direction < 0 ? 390 : 520);
  }, []);

  const startPump = (direction: PumpDirection, event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pumpIntervalRef.current !== null) window.clearInterval(pumpIntervalRef.current);
    pump(direction);
    pumpIntervalRef.current = window.setInterval(() => pump(direction), 265);
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
    let lastUpdate = 0;

    const animate = (time: number) => {
      if (!previousTime) previousTime = time;
      const delta = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;

      if (time - lastUpdate > 32 && !celebrating) {
        const result = stepRings(ringsRef.current, delta);
        ringsRef.current = result.rings;
        setRings(result.rings);
        lastUpdate = time;

        if (result.caughtIds.length > 0) {
          setCaughtTotal((value) => value + result.caughtIds.length);
          playSuccessSound();
          if (result.rings.every((ring) => ring.caught)) {
            setCelebrating(true);
            playSuccessSound();
            celebrationTimeoutRef.current = window.setTimeout(resetRound, 2700);
          }
        }

        if (result.missedIds.length > 0) {
          setHint('PASSOU DO ARO! TENTE COM MENOS IMPULSO 🎯');
          if (hintTimeoutRef.current !== null) window.clearTimeout(hintTimeoutRef.current);
          hintTimeoutRef.current = window.setTimeout(
            () => setHint('BOMBE NA HORA CERTA. SOLTE PARA ALINHAR!'),
            1900,
          );
        }
      }

      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [celebrating, resetRound]);

  useEffect(() => () => {
    if (pumpIntervalRef.current !== null) window.clearInterval(pumpIntervalRef.current);
    if (bubbleTimeoutRef.current !== null) window.clearTimeout(bubbleTimeoutRef.current);
    if (hintTimeoutRef.current !== null) window.clearTimeout(hintTimeoutRef.current);
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
      aria-label={direction < 0 ? 'Bombear água pelo lado esquerdo' : 'Bombear água pelo lado direito'}
      aria-pressed={activePump === direction}
    >
      <span className={styles.buttonIcon}>{direction < 0 ? '💦' : '🫧'}</span>
      <span className={styles.buttonLabel}>{direction < 0 ? 'BOMBA ESQ.' : 'BOMBA DIR.'}</span>
      <span className={styles.buttonHint}>TOQUE OU SEGURE</span>
    </button>
  );

  const caughtInRound = rings.filter((ring) => ring.caught).length;

  return (
    <main className={styles.game}>
      <img className={styles.sceneImage} src={SCENES[scene].src} alt="" />
      <div className={styles.waterWash} />
      <div className={styles.ambientBubbles} aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <i key={index} style={{ '--bubble-index': index } as CSSProperties} />
        ))}
      </div>

      <header className={styles.topBar}>
        <button className={styles.homeButton} onClick={handleHome} aria-label="Voltar ao parque">🏠</button>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>🐠</span>
          <div>
            <h1>AQUAPLAY</h1>
            <p>OCEANO DE ARGOLAS</p>
          </div>
        </div>
        <div className={styles.score} aria-live="polite">
          <span>⭐</span>
          <strong>{caughtInRound}/8</strong>
        </div>
      </header>

      <nav className={styles.scenePicker} aria-label="Escolher cenário">
        {SCENES.map((item, index) => (
          <button
            key={item.src}
            type="button"
            className={scene === index ? styles.sceneActive : ''}
            onClick={() => setScene(index)}
            aria-label={'Cenário: ' + item.label}
            aria-pressed={scene === index}
          >
            <span>{item.icon}</span>
            <small>{item.label}</small>
          </button>
        ))}
      </nav>

      <section className={styles.playArea} aria-label="Brinquedo Aquaplay">
        <div className={styles.tank}>
          <div className={styles.glassGlare} />
          <div className={styles.waterLine}><i /><i /><i /></div>
          <div className={[styles.target, styles.targetLeft].join(' ')}>
            <span className={styles.targetHalo} />
            <span className={styles.targetPost} />
            <b>⭐</b>
          </div>
          <div className={[styles.target, styles.targetRight].join(' ')}>
            <span className={styles.targetHalo} />
            <span className={styles.targetPost} />
            <b>⭐</b>
          </div>

          <div className={styles.depthGuide}>← MAIS PERTO <span>·</span> MAIS FUNDO →</div>

          {rings.map((ring) => (
            <div
              key={ring.id}
              className={[
                styles.ringSlot,
                ring.caught ? styles.ringCaught : '',
                ring.missed ? styles.ringMissed : '',
              ].join(' ')}
              style={{
                left: ring.x + '%',
                top: ring.y + '%',
                zIndex: Math.round(4 + ring.z * 4),
                '--ring-color': ring.color,
                '--ring-depth': ring.z,
                '--ring-tilt': ring.tilt + 'deg',
                '--ring-spin': ring.spin + 'deg',
              } as CSSProperties}
            >
              <div className={styles.ring3d}>
                <span className={styles.ringHole} />
                {ring.caught && <span className={styles.ringSparkle}>✨</span>}
              </div>
              {!ring.caught && <span className={styles.ringShadow} />}
            </div>
          ))}

          {bubbles.map((bubble) => (
            <span
              key={bubble.id}
              className={styles.burstBubble}
              style={{
                left: (bubble.side < 0 ? 29 : 71) + '%',
                '--bubble-offset': bubble.offset + 'px',
                '--bubble-delay': (Math.abs(bubble.offset) / 160) + 's',
              } as CSSProperties}
            />
          ))}

          <div className={styles.tankFrameBottom} />
          {celebrating && (
            <div className={styles.celebration}>
              <div className={styles.celebrationAnimals}>🎉🐬🐠🎉</div>
              <strong>VOCÊ DOMINOU O AQUÁRIO!</strong>
              <span>As oito argolas encontraram seus aros!</span>
              <div className={styles.confetti}>⭐ 🫧 🐚 💖 🐙</div>
            </div>
          )}
        </div>
      </section>

      <footer className={styles.controls}>
        <div className={styles.controlHint}>{hint}</div>
        <div className={styles.buttonRow}>
          {renderPump(-1)}
          {renderPump(1)}
        </div>
        <div className={styles.footerMeta}>RODADA {round} <span>•</span> {caughtTotal} ARGOLAS ENCAIXADAS 🏆</div>
      </footer>
    </main>
  );
};

export default Aquaplay;
