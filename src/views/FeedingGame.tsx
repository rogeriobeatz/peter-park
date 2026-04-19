import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './FeedingGame.module.css';
import { playSuccessSound, playErrorSound, playPopSound } from '../utils/audio';

interface Animal {
  id: string;
  emoji: string;
  food: string;
  color: string;
}

const ALL_ANIMALS: Animal[] = [
  { id: 'monkey', emoji: '🐒', food: '🍌', color: '#FEF3C7' },
  { id: 'rabbit', emoji: '🐇', food: '🥕', color: '#F0FDF4' },
  { id: 'bear', emoji: '🐻', food: '🍯', color: '#FFF7ED' },
  { id: 'lion', emoji: '🦁', food: '🥩', color: '#FEF9C3' },
  { id: 'frog', emoji: '🐸', food: '🪰', color: '#DCFCE7' },
  { id: 'cow', emoji: '🐮', food: '🌿', color: '#F0FDF4' },
  { id: 'elephant', emoji: '🐘', food: '🥜', color: '#F1F5F9' },
  { id: 'cat', emoji: '🐱', food: '🐟', color: '#FFF1F2' },
];

const FeedingGame: React.FC = () => {
  const [currentAnimals, setCurrentAnimals] = useState<Animal[]>([]);
  const [fed, setFed] = useState<Record<string, boolean>>({});
  const [errorId, setErrorId] = useState<string | null>(null);
  const [message, setMessage] = useState('Dê a comida para o animal certo!');
  
  // Drag State
  const [draggingFood, setDraggingFood] = useState<{ id: string, food: string, x: number, y: number, startX: number, startY: number } | null>(null);
  const animalRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const initGame = useCallback(() => {
    const shuffled = [...ALL_ANIMALS].sort(() => Math.random() - 0.5);
    setCurrentAnimals(shuffled.slice(0, 3));
    setFed({});
    setErrorId(null);
    setDraggingFood(null);
    setMessage('Dê a comida para o animal certo!');
    playPopSound(300);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const onPointerDown = (e: React.PointerEvent, animalId: string, food: string) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    setDraggingFood({
      id: animalId,
      food,
      x: rect.left,
      y: rect.top,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top
    });
    
    playPopSound(500);
    // Prevent scrolling/ios behaviors
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!draggingFood) return;
    
    setDraggingFood(prev => prev ? {
      ...prev,
      x: e.clientX - prev.startX,
      y: e.clientY - prev.startY
    } : null);
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!draggingFood) return;

    // Check collision with animal cards
    let matchedId: string | null = null;
    
    for (const id in animalRefs.current) {
      const el = animalRefs.current[id];
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
      const animal = currentAnimals.find(a => a.id === matchedId);
      if (animal && animal.food === draggingFood.food) {
        playSuccessSound();
        setFed(prev => ({ ...prev, [matchedId!]: true }));
        setErrorId(null);
        
        const nextFed = { ...fed, [matchedId!]: true };
        const allFed = currentAnimals.every(a => nextFed[a.id]);
        setMessage(allFed ? 'Todos estão felizes! 😋' : 'Hummm, que delícia!');
      } else {
        playErrorSound();
        setErrorId(matchedId);
        setMessage('Opa, esse bicho não come isso!');
        setTimeout(() => setErrorId(null), 400);
      }
    }

    setDraggingFood(null);
  };

  useEffect(() => {
    if (draggingFood) {
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [draggingFood]);

  return (
    <div className={styles.container} style={{ touchAction: 'none' }}>
      <h2 className={styles.title}>{message}</h2>

      <div className={styles.gameArea}>
        <div className={styles.animals}>
          {currentAnimals.map(animal => (
            <div 
              key={animal.id}
              ref={el => { animalRefs.current[animal.id] = el; }}
              className={`
                ${styles.animalCard} 
                ${fed[animal.id] ? styles.happy : ''} 
                ${errorId === animal.id ? styles.error : ''}
              `}
              style={{ backgroundColor: animal.color }}
            >
              <div className={styles.animalEmoji}>{fed[animal.id] ? '😊' : animal.emoji}</div>
              {fed[animal.id] && <div className={styles.thanks}>{animal.food} ❤️</div>}
            </div>
          ))}
        </div>

        <div className={styles.foodBowl}>
          {currentAnimals
            .filter(a => !fed[a.id])
            .map(animal => (
              <div
                key={animal.id}
                className={`${styles.food} bouncy-tap`}
                onPointerDown={(e) => onPointerDown(e, animal.id, animal.food)}
                style={{ visibility: draggingFood?.id === animal.id ? 'hidden' : 'visible' }}
              >
                {animal.food}
              </div>
            ))}
        </div>
      </div>

      {/* Ghost element during drag */}
      {draggingFood && (
        <div 
          className={styles.ghost}
          style={{ 
            left: draggingFood.x, 
            top: draggingFood.y,
          }}
        >
          {draggingFood.food}
        </div>
      )}

      {currentAnimals.length > 0 && currentAnimals.every(a => fed[a.id]) && (
        <button className={`${styles.resetBtn} bouncy-tap`} onClick={initGame}>
          Alimentar de Novo!
        </button>
      )}
    </div>
  );
};

export default FeedingGame;
