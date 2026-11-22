import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './MemoryGame.module.css';
import { playSuccessSound, playPopSound } from '../../utils/audio';

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJIS = ['🦁', '🦒', '🐘', '🦄', '🐧', '🦖', '🐝', '🐙', '🦋', '🐥', '🐸', '🐹'];
const INITIAL_ORDER = [0, 3, 1, 4, 2, 5, 0, 4, 3, 1, 5, 2];

const MemoryGame: React.FC = () => {
  const [cards, setCards] = useState<Card[]>(() => INITIAL_ORDER.map((emojiIndex, id) => ({ id, emoji: EMOJIS[emojiIndex], isFlipped: false, isMatched: false })));
  const timeoutRefs = useRef<number[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [isLocking, setIsLocking] = useState(false);
  const [matches, setMatches] = useState(0);

  const initGame = useCallback(() => {
    // Para crianças de 3-5 anos, 12 cards (6 pares) é o ideal para não frustrar
    const selectedEmojis = EMOJIS.slice(0, 6);
    const pairEmojis = [...selectedEmojis, ...selectedEmojis];
    const shuffled = pairEmojis
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false
      }));
    
    setCards(shuffled);
    setFlippedIds([]);
    setMatches(0);
    setIsLocking(false);
  }, []);

  const scheduleTimeout = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timeoutRefs.current = timeoutRefs.current.filter(id => id !== timer);
      callback();
    }, delay);
    timeoutRefs.current.push(timer);
  };

  useEffect(() => () => {
    timeoutRefs.current.forEach(window.clearTimeout);
  }, []);

  const handleCardClick = (id: number) => {
    if (isLocking) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    playPopSound(500);
    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    // Virar o card no estado visual
    setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));

    if (newFlipped.length === 2) {
      setIsLocking(true);
      checkMatch(newFlipped);
    }
  };

  const checkMatch = (ids: number[]) => {
    const [id1, id2] = ids;
    const card1 = cards.find(c => c.id === id1);
    const card2 = cards.find(c => c.id === id2);

    if (card1 && card2 && card1.emoji === card2.emoji) {
      // SUCESSO!
      scheduleTimeout(() => {
        playSuccessSound();
        setCards(prev => prev.map(c => 
          ids.includes(c.id) ? { ...c, isMatched: true } : c
        ));
        setFlippedIds([]);
        setIsLocking(false);
        setMatches(prev => prev + 1);
      }, 500);
    } else {
      // ERRO
      scheduleTimeout(() => {
        setCards(prev => prev.map(c => 
          ids.includes(c.id) ? { ...c, isFlipped: false } : c
        ));
        setFlippedIds([]);
        setIsLocking(false);
      }, 1200); // Tempo maior para a criança processar a falha
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleCard}>
          Encontre os Pares! {matches === 6 ? '🎉' : '🔍'}
        </div>
      </header>

      <main className={styles.grid}>
        {cards.map(card => (
          <div 
            key={card.id}
            className={`
              ${styles.cardContainer} 
              ${card.isFlipped || card.isMatched ? styles.flipped : ''} 
              ${card.isMatched ? styles.matched : ''}
            `}
            onClick={() => handleCardClick(card.id)}
          >
            <div className={styles.cardInner}>
              {/* Lado Escondido */}
              <div className={styles.cardBack}>
                <span className={styles.questionMark}>?</span>
              </div>
              
              {/* Lado do Emoji */}
              <div className={styles.cardFront}>
                <span className={styles.emoji}>{card.emoji}</span>
              </div>
            </div>
          </div>
        ))}
      </main>

      {matches === 6 && (
        <button className={`${styles.resetBtn} bouncy-tap`} onClick={initGame}>
          Brincar de Novo! ✨
        </button>
      )}

      <div className={styles.decor}>
        <div className={styles.bgCircle1} />
        <div className={styles.bgCircle2} />
      </div>
    </div>
  );
};

export default MemoryGame;
