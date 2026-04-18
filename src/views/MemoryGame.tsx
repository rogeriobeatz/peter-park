import React, { useState, useEffect } from 'react';
import styles from './MemoryGame.module.css';
import { playSuccessSound, playErrorSound, playPopSound } from '../utils/audio';

interface Card {
  id: number;
  dino: string;
  isFlipped: boolean;
  isMatched: boolean;
  hasError: boolean;
}

const DINOS = ['🦖', '🦕', '🐊', '🐢', '🐉', '🐍'];

const MemoryGame: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);

  const initGame = () => {
    playPopSound(300);
    const deck = [...DINOS, ...DINOS]
      .sort(() => Math.random() - 0.5)
      .map((dino, index) => ({
        id: index,
        dino,
        isFlipped: false,
        isMatched: false,
        hasError: false,
      }));
    setCards(deck);
    setFlippedCards([]);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2 || cards[id].isFlipped || cards[id].isMatched) return;

    playPopSound(500 + cards[id].id * 10);
    const newCards = [...cards];
    newCards[id].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      const [firstId, secondId] = newFlipped;
      if (cards[firstId].dino === cards[secondId].dino) {
        // MATCH
        setTimeout(() => {
          playSuccessSound();
          const matchedCards = [...cards];
          matchedCards[firstId].isMatched = true;
          matchedCards[secondId].isMatched = true;
          setCards(matchedCards);
          setFlippedCards([]);
        }, 500);
      } else {
        // ERROR
        setTimeout(() => {
          playErrorSound();
          const errorCards = [...cards];
          errorCards[firstId].hasError = true;
          errorCards[secondId].hasError = true;
          setCards(errorCards);

          setTimeout(() => {
            const resetCards = [...cards];
            resetCards[firstId].isFlipped = false;
            resetCards[firstId].hasError = false;
            resetCards[secondId].isFlipped = false;
            resetCards[secondId].hasError = false;
            setCards(resetCards);
            setFlippedCards([]);
          }, 500);
        }, 500);
      }
    }
  };

  const isGameOver = cards.length > 0 && cards.every(c => c.isMatched);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Dino Memória 🦖</h2>
        {isGameOver && (
          <button className={`${styles.resetBtn} bouncy-tap`} onClick={initGame}>
            Jogar de Novo!
          </button>
        )}
      </div>
      <div className={styles.grid}>
        {cards.map((card) => (
          <div
            key={card.id}
            className={`
              ${styles.card} 
              ${card.isFlipped || card.isMatched ? styles.flipped : ''} 
              ${card.isMatched ? styles.matched : ''} 
              ${card.hasError ? styles.error : ''} 
              bouncy-tap
            `}
            onClick={() => handleCardClick(card.id)}
          >
            <div className={styles.cardInner}>
              <div className={styles.cardFront}>🦴</div>
              <div className={styles.cardBack}>
                {card.dino}
                {card.isMatched && <div className={styles.sparkle}>✨</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemoryGame;
