import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './RabbitJump.module.css';
import { playPopSound, playErrorSound } from '../utils/audio';

interface Obstacle {
  id: number;
  x: number;
  type: 'rock' | 'fox';
}

const RabbitJump: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [rabbitY, setRabbitY] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [weather, setWeather] = useState<'day' | 'night' | 'rain' | 'snow'>('day');
  
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  
  // High-performance game state ref
  const gameState = useRef({
    y: 0,
    velocity: 0,
    isGrounded: true,
    jumpCount: 0,
    isGliding: false,
    score: 0,
    speed: 6,
    distanceSinceLastObstacle: 0,
    weatherTimer: 0
  });

  const jump = useCallback(() => {
    if (gameState.current.jumpCount < 2) {
      gameState.current.velocity = 18; // Crisper jump
      gameState.current.isGrounded = false;
      gameState.current.jumpCount++;
      gameState.current.isGliding = false;
      playPopSound(600 + gameState.current.jumpCount * 100);
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!isPlaying) {
      startGame();
      return;
    }

    const state = gameState.current;
    const startTime = performance.now();
    let isLongPress = false;

    const timer = setTimeout(() => {
      if (!state.isGrounded) {
        state.isGliding = true;
        isLongPress = true;
      }
    }, 150);

    const upHandler = () => {
      clearTimeout(timer);
      state.isGliding = false;
      if (!isLongPress && performance.now() - startTime < 150) {
        jump();
      }
      window.removeEventListener('pointerup', upHandler);
    };
    window.addEventListener('pointerup', upHandler);
  };

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setObstacles([]);
    setWeather('day');
    gameState.current = {
      y: 0, velocity: 0, isGrounded: true, jumpCount: 0, isGliding: false, score: 0, speed: 7, distanceSinceLastObstacle: 0, weatherTimer: 0
    };
  };

  const update = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = Math.min(time - lastTimeRef.current, 32) / 16.67; // Normalize to 60fps
    lastTimeRef.current = time;

    const state = gameState.current;
    
    // Physics
    const gravity = state.isGliding ? 0.25 : 1.1;
    state.velocity -= gravity * deltaTime;
    state.y += state.velocity * deltaTime;

    if (state.y <= 0) {
      state.y = 0;
      state.velocity = 0;
      state.isGrounded = true;
      state.jumpCount = 0;
      state.isGliding = false;
    }
    setRabbitY(state.y);

    // Speed scaling
    state.speed = 7 + (state.score / 8);
    
    // Weather Cycle
    state.weatherTimer += deltaTime;
    if (state.weatherTimer > 600) { // Every ~10 seconds at 60fps
      state.weatherTimer = 0;
      const weathers: ('day' | 'night' | 'rain' | 'snow')[] = ['day', 'night', 'rain', 'snow'];
      const nextWeather = weathers[(weathers.indexOf(weather) + 1) % weathers.length];
      setWeather(nextWeather);
    }

    // Obstacles
    state.distanceSinceLastObstacle += state.speed * deltaTime;
    
    setObstacles((prev) => {
      const moved = prev
        .map(o => ({ ...o, x: o.x - state.speed * deltaTime }))
        .filter(o => o.x > -100);
      
      // Spawn logic: controlled randomness
      if (state.distanceSinceLastObstacle > 400 + Math.random() * 300) {
        const type = Math.random() > 0.7 ? 'fox' : 'rock';
        moved.push({ id: Date.now(), x: window.innerWidth, type });
        state.distanceSinceLastObstacle = 0;
      }

      // Collision Detection
      for (const o of moved) {
        // Precise bounding box check
        if (o.x > 60 && o.x < 140 && state.y < 60) {
          setIsPlaying(false);
          playErrorSound();
          return [];
        }
      }

      // Scoring
      prev.forEach(oldO => {
        if (oldO.x >= 60 && !moved.find(m => m.id === oldO.id)) {
          state.score++;
          setScore(state.score);
          playPopSound(800);
        }
      });

      return moved;
    });

    if (isPlaying) {
      requestRef.current = requestAnimationFrame(update);
    }
  }, [isPlaying, weather]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = 0;
    };
  }, [isPlaying, update]);

  return (
    <div className={`${styles.container} ${styles[weather]}`} onPointerDown={handlePointerDown}>
      {/* Weather Effects */}
      {weather === 'rain' && <div className={styles.rainLayer} />}
      {weather === 'snow' && <div className={styles.snowLayer} />}
      
      <div className={styles.sky}>
        <div className={styles.score}>🥕 {score}</div>
        {weather === 'night' ? <div className={styles.moon}>🌙</div> : <div className={styles.sun}>☀️</div>}
      </div>

      <div className={styles.gameArea}>
        <div 
          className={`${styles.rabbit} ${gameState.current.isGliding ? styles.gliding : ''}`} 
          style={{ transform: `translateY(${-rabbitY}px)` }}
        >
          <div className={styles.rabbitVisual}>
            {gameState.current.isGliding ? '🚁' : '🐰'}
            {/* Note: In a real app we'd put <Lottie animationData={rabbitRun} /> here */}
          </div>
        </div>

        {obstacles.map(o => (
          <div 
            key={o.id} 
            className={styles.obstacle}
            style={{ left: `${o.x}px` }}
          >
            {o.type === 'rock' ? '🪨' : '🦊'}
          </div>
        ))}
        
        <div className={styles.ground}>
          <div className={styles.grassPattern} />
        </div>
      </div>

      {!isPlaying && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Peter Run! 🐰</h2>
            <p className={styles.modalText}>Pule as pedras e fuja da raposa!</p>
            <div className={styles.instructions}>
              <div>👆 Toque: Pulo</div>
              <div>👆👆 2 Toques: Pulo Duplo</div>
              <div>🖐️ Segure: Planar</div>
            </div>
            <button className={`${styles.playBtn} bouncy-tap`}>Começar! 🥕</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RabbitJump;
