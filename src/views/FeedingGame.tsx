import React, { useState, useEffect, useCallback } from 'react';
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

  const initGame = useCallback(() => {
    const shuffled = [...ALL_ANIMALS].sort(() => Math.random() - 0.5);
    setCurrentAnimals(shuffled.slice(0, 3));
    setFed({});
    setErrorId(null);
    setMessage('Dê a comida para o animal certo!');
    playPopSound(300);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleDrop = (animalId: string, foodType: string) => {
    const animal = currentAnimals.find(a => a.id === animalId);
    if (animal && animal.food === foodType) {
      playSuccessSound();
      setFed(prev => ({ ...prev, [animalId]: true }));
      setErrorId(null);
      
      const nextFed = { ...fed, [animalId]: true };
      const allFed = currentAnimals.every(a => nextFed[a.id]);
      
      if (allFed) {
        setMessage('Todos estão felizes! 😋');
      } else {
        setMessage('Hummm, que delícia!');
      }
    } else {
      playErrorSound();
      setErrorId(animalId);
      setMessage('Opa, esse bicho não come isso!');
      setTimeout(() => setErrorId(null), 400);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{message}</h2>

      <div className={styles.gameArea}>
        <div className={styles.animals}>
          {currentAnimals.map(animal => (
            <div 
              key={animal.id}
              className={`
                ${styles.animalCard} 
                ${fed[animal.id] ? styles.happy : ''} 
                ${errorId === animal.id ? styles.error : ''}
              `}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const food = e.dataTransfer.getData('food');
                handleDrop(animal.id, food);
              }}
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
            .sort(() => Math.random() - 0.5)
            .map(animal => (
              <div
                key={animal.id}
                className={`${styles.food} bouncy-tap`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('food', animal.food);
                  playPopSound(500);
                }}
              >
                {animal.food}
              </div>
            ))}
        </div>
      </div>

      {currentAnimals.length > 0 && currentAnimals.every(a => fed[a.id]) && (
        <button className={`${styles.resetBtn} bouncy-tap`} onClick={initGame}>
          Alimentar de Novo!
        </button>
      )}
    </div>
  );
};

export default FeedingGame;
