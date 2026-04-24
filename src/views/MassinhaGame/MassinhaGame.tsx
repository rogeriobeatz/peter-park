import React, { useState, useRef, useEffect } from 'react';
import styles from './MassinhaGame.module.css';
import { playPopSound, playSuccessSound } from '../../utils/audio';

const TOOLS = [
  { id: 'red', type: 'color', val: '#FF6B6B', icon: '🔴' },
  { id: 'blue', type: 'color', val: '#4ECDC4', icon: '🔵' },
  { id: 'yellow', type: 'color', val: '#FFD93D', icon: '🟡' },
  { id: 'green', type: 'color', val: '#4ADE80', icon: '🟢' },
  { id: 'star', type: 'stamp', val: '⭐' },
  { id: 'bunny', type: 'stamp', val: '🐰' },
  { id: 'heart', type: 'stamp', val: '❤️' }
];

const MassinhaGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState(TOOLS[0]);
  
  // Rastreamento de múltiplos dedos para 2-3 anos
  const paths = useRef<Map<number, { x: number, y: number }>>(new Map());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Impede gestos do sistema (importante para bebês)
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefault);
  }, []);

  const drawSplat = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();
    // Brilho da massinha
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(x - 8, y - 8, 8, 0, Math.PI * 2);
    ctx.fill();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    if (activeTool.type === 'stamp') {
      ctx.font = '120px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(activeTool.val, e.clientX, e.clientY);
      playSuccessSound();
    } else {
      paths.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      drawSplat(ctx, e.clientX, e.clientY, activeTool.val);
      playPopSound(800);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activeTool.type === 'stamp') return;
    const lastPos = paths.current.get(e.pointerId);
    if (!lastPos) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = activeTool.val;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 50;
      
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(e.clientX, e.clientY);
      ctx.stroke();
      
      // Efeito de "cobra de massinha"
      ctx.lineWidth = 20;
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.stroke();

      paths.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    paths.current.delete(e.pointerId);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      playPopSound(400);
    }
  };

  return (
    <div className={styles.container}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      <div className={styles.ui}>
        <div className={styles.toolBelt}>
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              className={`${styles.toolBtn} ${activeTool.id === tool.id ? styles.active : ''}`}
              onClick={() => {
                setActiveTool(tool);
                playPopSound(900);
              }}
              style={{ backgroundColor: tool.type === 'color' ? tool.val : '#fff' }}
            >
              {tool.type === 'stamp' ? tool.val : ''}
            </button>
          ))}
          <button className={styles.clearBtn} onClick={clear}>🗑️</button>
        </div>
      </div>

      <div className={styles.hint}>Esprema a massinha com os dedos! 🖐️</div>
    </div>
  );
};

export default MassinhaGame;
