import React, { useState, useEffect } from 'react';
import styles from './NumbersGame.module.css';
import { playSuccessSound, playErrorSound, playPopSound } from '../utils/audio';

const NumbersGame: React.FC = () => {
  const [sequence, setSequence] = useState<(number | null)[]>([]);
  const [options, setOptions] = useState<number[]>([]);
  const [errorIndex, setErrorIndex] = useState<number | null>(null);
  const [message, setMessage] = useState('Complete a sequência! 🚂');

  const initGame = () => {
    playPopSound(300);
    const start = Math.floor(Math.random() * 5) + 1; // 1 to 5
    const fullSeq = [start, start + 1, start + 2, start + 3];
    
    // Hide one or two numbers
    const missingIndices = [1, 2].sort(() => Math.random() - 0.5).slice(0, Math.random() > 0.5 ? 2 : 1);
    const newSeq = fullSeq.map((n, i) => missingIndices.includes(i) ? null : n);
    
    setSequence(newSeq);
    setOptions(missingIndices.map(i => fullSeq[i]).sort(() => Math.random() - 0.5));
    setErrorIndex(null);
    setMessage('Complete a sequência! 🚂');
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleDrop = (num: number, index: number) => {
    const start = sequence.find(n => n !== null)! - sequence.indexOf(sequence.find(n => n !== null)!);
    const expected = start + index;

    if (num === expected) {
      playSuccessSound();
      const newSeq = [...sequence];
      newSeq[index] = num;
      setSequence(newSeq);
      setOptions(prev => prev.filter(o => o !== num));
      setErrorIndex(null);

      if (newSeq.every(n => n !== null)) {
        setMessage('Muito bem! O trem vai partir! 💨');
      }
    } else {
      playErrorSound();
      setErrorIndex(index);
      setMessage('Tente outro número! 😊');
      setTimeout(() => setErrorIndex(null), 400);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{message}</h2>

      <div className={styles.trainArea}>
        <div className={styles.train}>
          <div className={styles.engine}>🚂</div>
          {sequence.map((num, i) => (
            <div 
              key={i} 
              className={`
                ${styles.wagon} 
                ${num === null ? styles.empty : styles.filled} 
                ${errorIndex === i ? styles.error : ''}
              `}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                const draggedNum = parseInt(window.sessionStorage.getItem('draggedNum') || '0');
                handleDrop(draggedNum, i);
              }}
            >
              {num !== null ? num : '?'}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.options}>
        {options.map((num) => (
          <div
            key={num}
            className={`${styles.numberCard} bouncy-tap`}
            draggable
            onDragStart={() => {
              window.sessionStorage.setItem('draggedNum', num.toString());
              playPopSound(500);
            }}
          >
            {num}
          </div>
        ))}
      </div>

      {sequence.every(n => n !== null) && (
        <button className={`${styles.resetBtn} bouncy-tap`} onClick={initGame}>
          Novo Trem!
        </button>
      )}
    </div>
  );
};

export default NumbersGame;
