import React, { useState, useEffect, useRef } from 'react';
import styles from './NumbersGame.module.css';
import { playSuccessSound, playErrorSound, playPopSound } from '../utils/audio';

const NumbersGame: React.FC = () => {
  const [sequence, setSequence] = useState<(number | null)[]>([]);
  const [options, setOptions] = useState<number[]>([]);
  const [errorIndex, setErrorIndex] = useState<number | null>(null);
  const [message, setMessage] = useState('Complete a sequência! 🚂');
  
  // Drag State
  const [draggingNumber, setDraggingNumber] = useState<{ value: number, x: number, y: number, startX: number, startY: number } | null>(null);
  const wagonRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const initGame = () => {
    playPopSound(300);
    const start = Math.floor(Math.random() * 5) + 1; // 1 to 5
    const fullSeq = [start, start + 1, start + 2, start + 3];
    
    const missingIndices = [1, 2].sort(() => Math.random() - 0.5).slice(0, Math.random() > 0.5 ? 2 : 1);
    const newSeq = fullSeq.map((n, i) => missingIndices.includes(i) ? null : n);
    
    setSequence(newSeq);
    setOptions(missingIndices.map(i => fullSeq[i]).sort(() => Math.random() - 0.5));
    setErrorIndex(null);
    setDraggingNumber(null);
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

  const onPointerDown = (e: React.PointerEvent, num: number) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    setDraggingNumber({
      value: num,
      x: rect.left,
      y: rect.top,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top
    });
    
    playPopSound(500);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!draggingNumber) return;
    setDraggingNumber(prev => prev ? {
      ...prev,
      x: e.clientX - prev.startX,
      y: e.clientY - prev.startY
    } : null);
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!draggingNumber) return;

    let matchedIndex: number | null = null;
    for (const key in wagonRefs.current) {
      const el = wagonRefs.current[key];
      if (el) {
        const rect = el.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          matchedIndex = parseInt(key);
          break;
        }
      }
    }

    if (matchedIndex !== null) {
      handleDrop(draggingNumber.value, matchedIndex);
    }
    setDraggingNumber(null);
  };

  useEffect(() => {
    if (draggingNumber) {
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [draggingNumber]);

  return (
    <div className={styles.container} style={{ touchAction: 'none' }}>
      <h2 className={styles.title}>{message}</h2>

      <div className={styles.trainArea}>
        <div className={styles.train}>
          <div className={styles.engine}>🚂</div>
          {sequence.map((num, i) => (
            <div 
              key={i} 
              ref={el => { wagonRefs.current[i] = el; }}
              className={`
                ${styles.wagon} 
                ${num === null ? styles.empty : styles.filled} 
                ${errorIndex === i ? styles.error : ''}
              `}
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
            onPointerDown={(e) => onPointerDown(e, num)}
            style={{ visibility: draggingNumber?.value === num ? 'hidden' : 'visible' }}
          >
            {num}
          </div>
        ))}
      </div>

      {draggingNumber && (
        <div 
          className={styles.ghost}
          style={{ 
            left: draggingNumber.x, 
            top: draggingNumber.y,
          }}
        >
          {draggingNumber.value}
        </div>
      )}

      {sequence.every(n => n !== null) && (
        <button className={`${styles.resetBtn} bouncy-tap`} onClick={initGame}>
          Novo Trem!
        </button>
      )}
    </div>
  );
};

export default NumbersGame;
