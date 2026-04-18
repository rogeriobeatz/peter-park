import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './BubblePop.module.css';

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  isPopping: boolean;
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6'];

const BubblePop: React.FC = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Inicializa o contexto de áudio (precisa ser disparado por um toque no iOS)
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playPopSound = () => {
    if (!audioCtxRef.current) return;
    
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Variação aleatória de tom para ficar divertido
    const frequency = 400 + Math.random() * 200;
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  const spawnBubble = useCallback(() => {
    const id = Date.now() + Math.random();
    const size = 100 + Math.random() * 120;
    const x = Math.random() * (window.innerWidth - size);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const speed = 1.5 + Math.random() * 2.5;

    setBubbles((prev) => [...prev, { id, x, y: window.innerHeight + 100, size, color, speed, isPopping: false }]);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (bubbles.length < 15) {
        spawnBubble();
      }
    }, 800);
    return () => clearInterval(interval);
  }, [bubbles.length, spawnBubble]);

  const animate = useCallback((time: number) => {
    if (lastTimeRef.current !== undefined) {
      setBubbles((prev) => 
        prev
          .map((b) => (b.isPopping ? b : { ...b, y: b.y - b.speed }))
          .filter((b) => b.y + b.size > -150)
      );
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  const popBubble = (id: number) => {
    initAudio(); // Garante que o áudio esteja ativo
    playPopSound();
    
    setBubbles((prev) => 
      prev.map((b) => b.id === id ? { ...b, isPopping: true } : b)
    );
    
    setScore((s) => s + 1);

    setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== id));
    }, 200);
  };

  return (
    <div className={styles.gameContainer} onPointerDown={initAudio}>
      <div className={styles.uiLayer}>
        <div className={styles.scoreCard}>
          <span className={styles.scoreLabel}>Bolas:</span>
          <span className={styles.scoreValue}>{score}</span>
        </div>
      </div>
      
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className={`${styles.bubble} ${bubble.isPopping ? styles.popping : ''}`}
          style={{
            left: bubble.x,
            top: bubble.y,
            width: bubble.size,
            height: bubble.size,
            backgroundColor: bubble.color,
            '--pop-color': bubble.color
          } as React.CSSProperties}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (!bubble.isPopping) popBubble(bubble.id);
          }}
        >
          <div className={styles.shine} />
        </div>
      ))}
      
      <div className={styles.backgroundDecor}>
        <div className={styles.cloud} style={{ top: '10%', left: '10%' }}>☁️</div>
        <div className={styles.cloud} style={{ top: '20%', left: '70%' }}>☁️</div>
        <div className={styles.sun}>☀️</div>
      </div>
    </div>
  );
};

export default BubblePop;
