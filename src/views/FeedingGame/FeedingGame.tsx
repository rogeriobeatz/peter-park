import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './FeedingGame.module.css';
import { playSuccessSound, playPopSound, playErrorSound } from '../../utils/audio';

interface Animal {
  id: string;
  name: string;
  emoji: string;
  food: string;
  color: string;
}

interface FoodItem {
  id: number;
  emoji: string;
  targetAnimal: string;
}

const ANIMALS: Animal[] = [
  { id: 'macaco', name: 'Macaco', emoji: '🐒', food: '🍌', color: '#FFD93D' },
  { id: 'coelho', name: 'Coelho', emoji: '🐰', food: '🥕', color: '#FF8B13' },
  { id: 'gato', name: 'Gato', emoji: '🐱', food: '🐟', color: '#4ECDC4' },
  { id: 'panda', name: 'Panda', emoji: '🐼', food: '🎋', color: '#A8E6CF' }
];

const FeedingGame: React.FC = () => {
  const [currentFoods, setCurrentFoods] = useState<FoodItem[]>([]);
  const [fed, setFed] = useState<Record<string, boolean>>({});
  const [dragItem, setDragItem] = useState<FoodItem | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [activeAnimalId, setActiveAnimalId] = useState<string | null>(null);
  
  const animalsRef = useRef<Record<string, HTMLDivElement | null>>({});

  const initGame = useCallback(() => {
    const foods = ANIMALS.map((a, i) => ({
      id: Date.now() + i,
      emoji: a.food,
      targetAnimal: a.id
    })).sort(() => Math.random() - 0.5);
    
    setCurrentFoods(foods);
    setFed({});
    setDragItem(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handlePointerDown = (e: React.PointerEvent, item: FoodItem) => {
    setDragItem(item);
    setDragPos({ x: e.clientX, y: e.clientY });
    playPopSound(600);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragItem) return;
    setDragPos({ x: e.clientX, y: e.clientY });

    // Checar proximidade com animais para efeito de "boca aberta"
    let closestAnimal: string | null = null;
    Object.entries(animalsRef.current).forEach(([id, el]) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        const dist = Math.sqrt(
          Math.pow(e.clientX - (rect.left + rect.width / 2), 2) +
          Math.pow(e.clientY - (rect.top + rect.height / 2), 2)
        );
        if (dist < 150) closestAnimal = id;
      }
    });
    setActiveAnimalId(closestAnimal);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragItem) return;

    let targetMet = false;
    const el = animalsRef.current[dragItem.targetAnimal];

    if (el) {
      const rect = el.getBoundingClientRect();
      if (
        e.clientX > rect.left - 20 && e.clientX < rect.right + 20 &&
        e.clientY > rect.top - 20 && e.clientY < rect.bottom + 20
      ) {
        // ALIMENTOU!
        playSuccessSound();
        setFed(prev => ({ ...prev, [dragItem.targetAnimal]: true }));
        setCurrentFoods(prev => prev.filter(f => f.id !== dragItem.id));
        targetMet = true;
      }
    }

    if (!targetMet) {
      playErrorSound();
    }

    setDragItem(null);
    setActiveAnimalId(null);
  };

  const allFed = Object.keys(fed).length === ANIMALS.length;

  return (
    <div 
      className={styles.container}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <header className={styles.header}>
        <div className={styles.titleCard}>
          {allFed ? 'Todos estão felizes! 😋' : 'Quem está com fome?'}
        </div>
      </header>

      {/* Área dos Animais */}
      <div className={styles.animalShelter}>
        {ANIMALS.map(animal => (
          <div 
            key={animal.id}
            ref={el => { animalsRef.current[animal.id] = el; }}
            className={`
              ${styles.animalCard} 
              ${activeAnimalId === animal.id ? styles.expecting : ''}
              ${fed[animal.id] ? styles.isFed : ''}
            `}
            style={{ '--accent': animal.color } as React.CSSProperties}
          >
            <div className={styles.animalEmoji}>
              {fed[animal.id] ? '😊' : animal.emoji}
            </div>
            {fed[animal.id] && <div className={styles.heart}>❤️</div>}
            <div className={styles.animalName}>{animal.name}</div>
          </div>
        ))}
      </div>

      {/* Área das Comidas */}
      <div className={styles.foodBank}>
        {currentFoods.map(food => (
          <div
            key={food.id}
            className={`
              ${styles.foodItem} 
              ${dragItem?.id === food.id ? styles.dragging : ''}
            `}
            style={{
              left: dragItem?.id === food.id ? dragPos.x - 40 : 'auto',
              top: dragItem?.id === food.id ? dragPos.y - 40 : 'auto',
              position: dragItem?.id === food.id ? 'fixed' : 'relative'
            }}
            onPointerDown={(e) => handlePointerDown(e, food)}
          >
            {food.emoji}
          </div>
        ))}
      </div>

      {allFed && (
        <button className={`${styles.resetBtn} bouncy-tap`} onClick={initGame}>
          Alimentar de Novo! 🍎
        </button>
      )}

      <div className={styles.background}>
        <div className={styles.grass} />
        <div className={styles.sun}>☀️</div>
      </div>
    </div>
  );
};

export default FeedingGame;
