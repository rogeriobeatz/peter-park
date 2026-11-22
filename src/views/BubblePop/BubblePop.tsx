import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './BubblePop.module.css';

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  wobble: number;
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

function playBubbleSound(ctx: AudioContext, isMagic: boolean) {
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
}

const BubblePop: React.FC = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timeoutRefs = useRef<number[]>([]);

  const initAudio = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    if (audioCtxRef.current.state === 'suspended') void audioCtxRef.current.resume();
  };

  const scheduleTimeout = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timeoutRefs.current = timeoutRefs.current.filter(id => id !== timer);
      callback();
    }, delay);
    timeoutRefs.current.push(timer);
  };

  const spawnBubble = useCallback(() => {
    const id = Date.now() + Math.random();
    const size = 120 + Math.random() * 100;
    const x = Math.random() * Math.max(0, window.innerWidth - size);
    const isMagic = Math.random() < 0.07;
    const colorObj = COLORS[Math.floor(Math.random() * COLORS.length)];

    const newItem: Bubble = {
      id,
      x,
      y: window.innerHeight + 100,
      size,
      color: isMagic ? 'linear-gradient(45deg, #FFD700, #FFF176)' : colorObj.hex,
      speed: 0.6 + Math.random() * 0.8,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
      isPopping: false,
      isMagic
    };

    setBubbles(prev => {
      const maxBubbles = Math.min(35, 6 + Math.floor(score / 4));
      return prev.length < maxBubbles ? [...prev, newItem] : prev;
    });
  }, [score]);

  useEffect(() => {
    let frame = 0;
    let lastUpdate = 0;
    const update = (timestamp: number) => {
      if (timestamp - lastUpdate >= 30) {
        setBubbles(prev => prev.map(bubble => {
          if (bubble.isPopping) return bubble;
          const wobble = bubble.wobble + bubble.wobbleSpeed;
          return {
            ...bubble,
            y: bubble.y - bubble.speed,
            x: bubble.x + Math.sin(wobble) * 1.5,
            wobble
          };
        }).filter(bubble => bubble.y + bubble.size > -100));
        lastUpdate = timestamp;
      }
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(spawnBubble, Math.max(400, 1500 - score * 30));
    return () => window.clearInterval(interval);
  }, [spawnBubble, score]);

  useEffect(() => () => {
    timeoutRefs.current.forEach(window.clearTimeout);
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      void audioCtxRef.current.close();
    }
  }, []);

  const popBubble = (id: number, isMagic = false) => {
    initAudio();
    if (audioCtxRef.current) playBubbleSound(audioCtxRef.current, isMagic);

    if (isMagic) {
      setBubbles(prev => prev.map(bubble => ({ ...bubble, isPopping: true })));
      setScore(value => value + bubbles.length);
      scheduleTimeout(() => setBubbles([]), 400);
    } else {
      setBubbles(prev => prev.map(bubble => bubble.id === id ? { ...bubble, isPopping: true } : bubble));
      setScore(value => value + 1);
      scheduleTimeout(() => setBubbles(prev => prev.filter(bubble => bubble.id !== id)), 300);
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
          onPointerDown={event => {
            event.stopPropagation();
            if (!bubble.isPopping) popBubble(bubble.id, bubble.isMagic);
          }}
        >
          <div className={styles.shine} />
          {bubble.isMagic && <div className={styles.star}>⭐</div>}
        </div>
      ))}

      <div className={styles.decor}>
        <div className={styles.cloud1}>☁️</div>
        <div className={styles.cloud2}>☁️</div>
        <div className={styles.sun}>☀️</div>
      </div>
    </div>
  );
};

export default BubblePop;
