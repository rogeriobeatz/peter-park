import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './WhackGame.module.css';
import { playSuccessSound, playErrorSound, playPopSound } from '../utils/audio';

type EntityType = 'monster' | 'cute';

interface Entity {
  id: number;
  type: EntityType;
}

interface HammerHit {
  id: number;
  x: number;
  y: number;
}

const WhackGame: React.FC = () => {
  // 5 slots for entities
  const [slots, setSlots] = useState<(Entity | null)[]>([null, null, null, null, null]);
  const [hitStates, setHitStates] = useState<Record<number, 'squished' | 'shaking' | null>>({});
  const [score, setScore] = useState(0);
  const [hammerHits, setHammerHits] = useState<HammerHit[]>([]);
  
  const spawnTimerRef = useRef<number | null>(null);

  const spawn = useCallback(() => {
    setSlots(prev => {
      const emptyIndices = prev.map((e, i) => e === null ? i : -1).filter(i => i !== -1);
      if (emptyIndices.length === 0) return prev;

      const holeIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      const type: EntityType = Math.random() > 0.4 ? 'monster' : 'cute';
      const id = Date.now();

      const next = [...prev];
      next[holeIndex] = { id, type };

      // Set auto-hide timer
      setTimeout(() => {
        setSlots(current => {
          const updated = [...current];
          if (updated[holeIndex]?.id === id) {
            updated[holeIndex] = null;
          }
          return updated;
        });
      }, 2000 + Math.random() * 1000);

      return next;
    });
  }, []);

  useEffect(() => {
    spawnTimerRef.current = setInterval(() => {
      if (Math.random() > 0.4) spawn();
    }, 800);
    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, [spawn]);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Global hammer effect
    const newHit = { id: Date.now(), x: e.clientX, y: e.clientY };
    setHammerHits(prev => [...prev, newHit]);
    playPopSound(150); // Deep thud

    setTimeout(() => {
      setHammerHits(prev => prev.filter(h => h.id !== newHit.id));
    }, 200);
  };

  const handleWhack = (e: React.PointerEvent, index: number) => {
    e.stopPropagation(); // Prevent global hammer trigger if we hit an entity specifically
    handlePointerDown(e);

    const entity = slots[index];
    if (!entity || hitStates[index]) return;

    if (entity.type === 'monster') {
      playSuccessSound();
      setScore(s => s + 1);
      setHitStates(prev => ({ ...prev, [index]: 'squished' }));
    } else {
      playErrorSound();
      setScore(s => Math.max(0, s - 1));
      setHitStates(prev => ({ ...prev, [index]: 'shaking' }));
    }

    // Clean up hit state and remove entity
    setTimeout(() => {
      setHitStates(prev => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      setSlots(prev => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
    }, 400);
  };

  return (
    <div className={styles.container} onPointerDown={handlePointerDown}>
      <div className={styles.gardenLayer} />
      
      <header className={styles.header}>
        <div className={styles.scoreCard}>
          <span className={styles.scoreLabel}>PONTOS:</span>
          <span className={styles.scoreValue}>{score}</span>
        </div>
      </header>

      <main className={styles.gameArea}>
        {slots.map((entity, i) => (
          <div key={i} className={styles.holeWrapper}>
            <div className={styles.hole} />
            <div className={styles.dirt} />
            <div className={styles.entityContainer}>
              {entity && (
                <div 
                  className={`
                    ${styles.entity} 
                    ${hitStates[i] === 'squished' ? styles.squished : ''} 
                    ${hitStates[i] === 'shaking' ? styles.shaking : ''}
                  `}
                  onPointerDown={(e) => handleWhack(e, i)}
                >
                  {entity.type === 'monster' ? '👹' : '🐰'}
                </div>
              )}
            </div>
          </div>
        ))}
      </main>

      {/* Visual Hammer Effects */}
      {hammerHits.map(hit => (
        <div 
          key={hit.id} 
          className={styles.hammerEffect} 
          style={{ left: hit.x - 50, top: hit.y - 50 }} 
        />
      ))}

      <div className={styles.hint}>
        Bata no 👹, não na 🐰!
      </div>
    </div>
  );
};

export default WhackGame;
