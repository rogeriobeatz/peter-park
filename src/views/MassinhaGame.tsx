import React, { useRef, useState, useEffect, useCallback } from 'react';
import styles from './MassinhaGame.module.css';
import { playPopSound } from '../utils/audio';

const COLORS = [
  { id: 'magenta', value: 'rgba(255, 0, 150, 0.7)' },
  { id: 'cyan', value: 'rgba(0, 200, 255, 0.7)' },
  { id: 'yellow', value: 'rgba(255, 230, 0, 0.7)' },
  { id: 'green', value: 'rgba(50, 255, 50, 0.7)' },
  { id: 'orange', value: 'rgba(255, 120, 0, 0.7)' },
];

const MassinhaGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeColor, setActiveColor] = useState(COLORS[0].value);
  const [isDrawing, setIsDrawing] = useState(false);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 60; 

    // Simulation of 3D dough depth
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 6;
  }, []);

  useEffect(() => {
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, [setupCanvas]);

  const startDrawing = (e: React.PointerEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = activeColor;
    
    // Use standard mode with transparency for mixing without burning to black
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.5;
    
    playPopSound(400);
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear everything
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setupCanvas();
    playPopSound(200);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>Massinha Mágica 🎨</h2>
          <p className={styles.subtitle}>Misture as cores com o dedo!</p>
        </div>
        <button className={`${styles.clearBtn} bouncy-tap`} onClick={clearCanvas}>
          🗑️ Limpar
        </button>
      </header>

      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
        />
      </div>

      <div className={styles.palette}>
        {COLORS.map((color) => (
          <button
            key={color.id}
            className={`${styles.colorBtn} bouncy-tap ${activeColor === color.value ? styles.active : ''}`}
            style={{ backgroundColor: color.value.split(',').slice(0, 3).join(',') + ')' }}
            onClick={() => {
              setActiveColor(color.value);
              playPopSound(600);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default MassinhaGame;
