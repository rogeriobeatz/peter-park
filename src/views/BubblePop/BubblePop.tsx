import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './BubblePop.module.css';

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  wobble: number; // Para o movimento senoidal
  wobbleSpeed: number;
  isPopping: boolean;
  isMagic?: boolean;
}

const COLORS = [
  { name: 'Rosa', hex: '#FF6B6B' },
  { name: 'Turquesa', hex: '#4ECDC4' },
  { name: 'Azul', hex: '#45B7D1' },
  { name: 'Verde', hex: '#96CEB4' },
  { name: 'Amarelo', hex: '#FFEEAD' },
  { name: 'Roxo', hex: '#9B59B6' }
];

const BubblePop: React.FC = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const requestRef = useRef<number>(undefined);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
  };

  const playPopSound = (isMagic = false) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freq = isMagic ? 200 : 400 + Math.random() * 300;
    
    osc.type = isMagic ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  };

  const spawnBubble = useCallback(() => {
    const id = Date.now() + Math.random();
    const size = 120 + Math.random() * 100;
    const x = Math.random() * (window.innerWidth - size);
    const isMagic = Math.random() < 0.07;
    const colorObj = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    const newItem: Bubble = {
      id,
      x,
      y: window.innerHeight + 100,
      size,
      color: isMagic ? 'linear-gradient(45deg, #FFD700, #FFF176)' : colorObj.hex,
      speed: 0.6 + Math.random() * 0.8, // Velocidade pedagógica lenta
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
      isPopping: false,
      isMagic
    };
    
    setBubbles(prev => {
      const maxBubbles = Math.min(35, 6 + Math.floor(score / 4));
      if (prev.length < maxBubbles) return [...prev, newItem];
      return prev;
    });
  }, [score]);

  const update = useCallback(() => {
    setBubbles(prev => prev.map(b => {
      if (b.isPopping) return b;
      // Movimento Senoidal (Balanço lateral suave)
      const newWobble = b.wobble + b.wobbleSpeed;
      const xOffset = Math.sin(newWobble) * 1.5;
      return {
        ...b,
        y: b.y - b.speed,
        x: b.x + xOffset,
        wobble: newWobble
      };
    }).filter(b => b.y + b.size > -100));
    
    requestRef.current = requestAnimationFrame(update);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    const interval = setInterval(spawnBubble, Math.max(400, 1500 - (score * 30)));
    return () => {
      cancelAnimationFrame(requestRef.current!);
      clearInterval(interval);
    };
  }, [spawnBubble, update, score]);

  const popBubble = (id: number, isMagic = false) => {
    initAudio();
    playPopSound(isMagic);

    if (isMagic) {
      setBubbles(prev => prev.map(b => ({ ...b, isPopping: true })));
      setScore(s => s + bubbles.length);
      setTimeout(() => setBubbles([]), 400);
    } else {
      setBubbles(prev => prev.map(b => b.id === id ? { ...b, isPopping: true } : b));
      setScore(s => s + 1);
      setTimeout(() => setBubbles(prev => prev.filter(b => b.id !== id)), 300);
    }
  };

  return (
    <div className={styles.container} onPointerDown={initAudio}>
      <div className={styles.ui}>
        <div className={styles.scoreBoard}>
          <span className={styles.scoreIcon}>🫧</span>
          <span className={styles.scoreValue}>{score}</span>
        </div>
      </div>

      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          className={`${styles.bubble} ${bubble.isPopping ? styles.popping : ''} ${bubble.isMagic ? styles.magic : ''}`}
          style={{
            left: bubble.x,
            top: bubble.y,
            width: bubble.size,
            height: bubble.size,
            background: bubble.color,
            '--pop-color': bubble.isMagic ? '#FFD700' : bubble.color
          } as React.CSSProperties}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (!bubble.isPopping) popBubble(bubble.id, bubble.isMagic);
          }}
        >
          <div className={styles.shine} />
          {bubble.isMagic && <div className={styles.star}>⭐</div>}
        </div>
      ))}

      {/* Decoração de Fundo com Parallax Suave */}
      <div className={styles.decor}>
        <div className={styles.cloud1}>☁️</div>
        <div className={styles.cloud2}>☁️</div>
        <div className={styles.sun}>☀️</div>
      </div>
    </div>
  );
};

export default BubblePop;
