import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './ShapesGame.module.css';
import { playSuccessSound, playPopSound } from '../../utils/audio';

interface Shape {
  id: string;
  icon: string;
  name: string;
  scale?: number;
}

const ALL_SHAPES: Shape[] = [
  { id: 'circulo', icon: '🔴', name: 'Círculo' },
  { id: 'quadrado', icon: '🟦', name: 'Quadrado' },
  { id: 'triangulo', icon: '🔺', name: 'Triângulo', scale: 2 },
  { id: 'estrela', icon: '⭐', name: 'Estrela', scale: 1 },
  { id: 'coracao', icon: '❤️', name: 'Coração' },
  { id: 'lua', icon: '🌙', name: 'Lua', scale: 1.1 }
];

const ShapesGame: React.FC = () => {
  const [currentShapes, setCurrentShapes] = useState<Shape[]>([]);
  const [shuffledShapes, setShuffledShapes] = useState<Shape[]>([]);
  const [placed, setPlaced] = useState<Record<string, boolean>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [activeTarget, setActiveTarget] = useState<string | null>(null);
  
  const targetsRef = useRef<Record<string, HTMLDivElement | null>>({});

  const initGame = useCallback(() => {
    // Seleciona 4 formas aleatórias para a rodada
    const selected = [...ALL_SHAPES].sort(() => Math.random() - 0.5).slice(0, 4);
    setCurrentShapes(selected);
    // Embaralha para a linha de baixo
    setShuffledShapes([...selected].sort(() => Math.random() - 0.5));
    setPlaced({});
    setDragId(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (placed[id]) return;
    setDragId(id);
    setDragPos({ x: e.clientX, y: e.clientY });
    playPopSound(600);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragId) return;
    setDragPos({ x: e.clientX, y: e.clientY });

    const targetEl = targetsRef.current[dragId];
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const dist = Math.sqrt(
        Math.pow(e.clientX - (rect.left + rect.width / 2), 2) +
        Math.pow(e.clientY - (rect.top + rect.height / 2), 2)
      );
      setActiveTarget(dist < 100 ? dragId : null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragId) return;

    const targetEl = targetsRef.current[dragId];
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const dist = Math.sqrt(
        Math.pow(e.clientX - (rect.left + rect.width / 2), 2) +
        Math.pow(e.clientY - (rect.top + rect.height / 2), 2)
      );

      if (dist < 80) {
        playSuccessSound();
        setPlaced(prev => ({ ...prev, [dragId]: true }));
      }
    }

    setDragId(null);
    setActiveTarget(null);
  };

  const isComplete = currentShapes.length > 0 && Object.keys(placed).length === currentShapes.length;

  return (
    <div 
      className={styles.container}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <header className={styles.header}>
        <div className={styles.titleCard}>
          {isComplete ? 'Parabéns! 🌈' : 'Encaixe a forma no lugar certo'}
        </div>
      </header>

      <div className={styles.board}>
        {/* Linha 1: Os Buracos (Ghost) */}
        <div className={styles.targetRow}>
          {currentShapes.map(shape => (
            <div 
              key={shape.id}
              ref={el => { targetsRef.current[shape.id] = el; }}
              className={`
                ${styles.target} 
                ${activeTarget === shape.id ? styles.highlight : ''}
                ${placed[shape.id] ? styles.filled : ''}
              `}
              style={{ '--shape-scale': shape.scale || 1 } as React.CSSProperties}
            >
              <span className={styles.ghostIcon}>{shape.icon}</span>
              {placed[shape.id] && (
                <span className={styles.placedIcon}>{shape.icon}</span>
              )}
            </div>
          ))}
        </div>

        {/* Linha 2: As Peças Soltas */}
        <div className={styles.sourceRow}>
          {shuffledShapes.map(shape => !placed[shape.id] && (
            <div
              key={shape.id}
              className={`
                ${styles.draggable} 
                ${dragId === shape.id ? styles.dragging : ''}
              `}
              style={{
                left: dragId === shape.id ? dragPos.x - 50 : 'auto',
                top: dragId === shape.id ? dragPos.y - 50 : 'auto',
                position: dragId === shape.id ? 'fixed' : 'relative',
                '--shape-scale': shape.scale || 1
              } as React.CSSProperties}
              onPointerDown={(e) => handlePointerDown(e, shape.id)}
            >
              {shape.icon}
            </div>
          ))}
        </div>
      </div>

      {isComplete && (
        <button className={`${styles.resetBtn} bouncy-tap`} onClick={initGame}>
          Mais formas! ✨
        </button>
      )}
    </div>
  );
};

export default ShapesGame;
