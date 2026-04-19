import React, { useState, useRef, useEffect } from 'react';
import styles from './ShapesGame.module.css';
import { playSuccessSound, playErrorSound, playPopSound } from '../utils/audio';

const SHAPES = [
  { id: 'circle', label: 'Círculo', emoji: '🔴', color: '#FF6B6B' },
  { id: 'square', label: 'Quadrado', emoji: '🟦', color: '#4ECDC4' },
  { id: 'triangle', label: 'Triângulo', emoji: '🔺', color: '#FFEEAD' },
  { id: 'star', label: 'Estrela', emoji: '⭐', color: '#FFD700' },
];

const ShapesGame: React.FC = () => {
  const [placed, setPlaced] = useState<Record<string, boolean>>({});
  const [errorId, setErrorId] = useState<string | null>(null);
  const [message, setMessage] = useState('Encaixe as formas!');
  
  // Drag State
  const [draggingShape, setDraggingShape] = useState<{ id: string, emoji: string, color: string, x: number, y: number, startX: number, startY: number } | null>(null);
  const targetRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleDrop = (targetId: string, draggedId: string) => {
    if (targetId === draggedId) {
      playSuccessSound();
      setPlaced(prev => ({ ...prev, [targetId]: true }));
      setErrorId(null);
      
      const nextPlaced = { ...placed, [targetId]: true };
      const allPlaced = SHAPES.every(s => nextPlaced[s.id]);
      setMessage(allPlaced ? 'Muito bem! 🎉' : 'Isso mesmo! 🌟');
    } else {
      playErrorSound();
      setErrorId(targetId);
      setMessage('Essa forma não entra aí! 🛑');
      setTimeout(() => setErrorId(null), 400);
    }
  };

  const onPointerDown = (e: React.PointerEvent, shape: typeof SHAPES[0]) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    setDraggingShape({
      ...shape,
      x: rect.left,
      y: rect.top,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top
    });
    
    playPopSound(500);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!draggingShape) return;
    setDraggingShape(prev => prev ? {
      ...prev,
      x: e.clientX - prev.startX,
      y: e.clientY - prev.startY
    } : null);
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!draggingShape) return;

    let matchedId: string | null = null;
    for (const id in targetRefs.current) {
      const el = targetRefs.current[id];
      if (el) {
        const rect = el.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          matchedId = id;
          break;
        }
      }
    }

    if (matchedId) {
      handleDrop(matchedId, draggingShape.id);
    }
    setDraggingShape(null);
  };

  useEffect(() => {
    if (draggingShape) {
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [draggingShape]);

  const resetGame = () => {
    playPopSound(300);
    setPlaced({});
    setErrorId(null);
    setMessage('Encaixe as formas!');
  };

  return (
    <div className={styles.container} style={{ touchAction: 'none' }}>
      <h2 className={styles.title}>{message}</h2>
      
      <div className={styles.gameArea}>
        <div className={styles.targets}>
          {SHAPES.map(shape => (
            <div 
              key={shape.id} 
              ref={el => { targetRefs.current[shape.id] = el; }}
              className={`
                ${styles.target} 
                ${placed[shape.id] ? styles.filled : ''} 
                ${errorId === shape.id ? styles.error : ''}
              `}
              style={{ '--shape-color': shape.color } as React.CSSProperties}
            >
              {!placed[shape.id] ? (
                <div className={styles.silhouette}>{shape.emoji}</div>
              ) : (
                <div className={styles.success}>{shape.emoji}</div>
              )}
              <div className={styles.label}>{shape.label}</div>
            </div>
          ))}
        </div>

        <div className={styles.draggables}>
          {SHAPES
            .filter(shape => !placed[shape.id])
            .map(shape => (
              <div
                key={shape.id}
                className={`${styles.shape} bouncy-tap`}
                onPointerDown={(e) => onPointerDown(e, shape)}
                style={{ 
                  backgroundColor: shape.color,
                  visibility: draggingShape?.id === shape.id ? 'hidden' : 'visible'
                }}
              >
                {shape.emoji}
              </div>
            ))}
        </div>
      </div>

      {draggingShape && (
        <div 
          className={styles.ghost}
          style={{ 
            left: draggingShape.x, 
            top: draggingShape.y,
            backgroundColor: draggingShape.color
          }}
        >
          {draggingShape.emoji}
        </div>
      )}

      {SHAPES.every(s => placed[s.id]) && (
        <button className={`${styles.resetBtn} bouncy-tap`} onClick={resetGame}>
          De Novo!
        </button>
      )}
    </div>
  );
};

export default ShapesGame;
