import React, { useState } from 'react';
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

  const handleDrop = (targetId: string, draggedId: string) => {
    if (targetId === draggedId) {
      playSuccessSound();
      setPlaced(prev => ({ ...prev, [targetId]: true }));
      setErrorId(null);
      
      const nextPlaced = { ...placed, [targetId]: true };
      const allPlaced = SHAPES.every(s => nextPlaced[s.id]);
      if (allPlaced) {
        setMessage('Muito bem! 🎉');
      } else {
        setMessage('Isso mesmo! 🌟');
      }
    } else {
      playErrorSound();
      setErrorId(targetId);
      setMessage('Essa forma não entra aí! 🛑');
      setTimeout(() => setErrorId(null), 400);
    }
  };

  const resetGame = () => {
    playPopSound(300);
    setPlaced({});
    setErrorId(null);
    setMessage('Encaixe as formas!');
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{message}</h2>
      
      <div className={styles.gameArea}>
        {/* Targets */}
        <div className={styles.targets}>
          {SHAPES.map(shape => (
            <div 
              key={shape.id} 
              className={`
                ${styles.target} 
                ${placed[shape.id] ? styles.filled : ''} 
                ${errorId === shape.id ? styles.error : ''}
              `}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const draggedId = e.dataTransfer.getData('text');
                handleDrop(shape.id, draggedId);
              }}
            >
              {!placed[shape.id] ? (
                <span className={styles.placeholder}>{shape.emoji}</span>
              ) : (
                <span className={styles.success}>{shape.emoji}</span>
              )}
              <div className={styles.label}>{shape.label}</div>
            </div>
          ))}
        </div>

        {/* Draggables */}
        <div className={styles.draggables}>
          {SHAPES
            .filter(shape => !placed[shape.id])
            .sort(() => Math.random() - 0.5)
            .map(shape => (
              <div
                key={shape.id}
                className={`${styles.shape} bouncy-tap`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text', shape.id);
                  playPopSound(500);
                }}
                style={{ backgroundColor: shape.color }}
              >
                {shape.emoji}
              </div>
            ))}
        </div>
      </div>

      {SHAPES.every(s => placed[s.id]) && (
        <button className={`${styles.resetBtn} bouncy-tap`} onClick={resetGame}>
          De Novo!
        </button>
      )}
    </div>
  );
};

export default ShapesGame;
