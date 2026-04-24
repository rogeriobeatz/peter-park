import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './WhackGame.module.css';
import { playSuccessSound, playErrorSound, playPopSound } from '../utils/audio';

interface SoupItem {
  id: number;
  image: string;
  type: 'food' | 'trash';
  x: number;
}

const INGREDIENTS = [
  '/sprites/soup/ingredients/broccoli.png',
  '/sprites/soup/ingredients/carrot.png',
  '/sprites/soup/ingredients/corn.png',
  '/sprites/soup/ingredients/mushroom.png',
  '/sprites/soup/ingredients/potato.png',
  '/sprites/soup/ingredients/pumpkin.png',
  '/sprites/soup/ingredients/tomato.png'
];

const TRASH = [
  '/sprites/soup/trash/brick.png',
  '/sprites/soup/trash/cactus.png',
  '/sprites/soup/trash/car.png',
  '/sprites/soup/trash/duck.png',
  '/sprites/soup/trash/fly.png',
  '/sprites/soup/trash/shoe.png',
  '/sprites/soup/trash/sock.png'
];

const SoupGame: React.FC = () => {
  const [items, setItems] = useState<SoupItem[]>([]);
  const [soupState, setSoupState] = useState<'idle' | 'happy' | 'yucky'>('idle');
  const [score, setScore] = useState(0);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [isOverPot, setIsOverPot] = useState(false);
  
  const potRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(undefined);

  const spawnItem = useCallback(() => {
    const isFood = Math.random() > 0.4;
    const list = isFood ? INGREDIENTS : TRASH;
    const newItem: SoupItem = {
      id: Date.now() + Math.random(),
      image: list[Math.floor(Math.random() * list.length)],
      type: isFood ? 'food' : 'trash',
      x: -200,
    };
    setItems(prev => [...prev, newItem]);
  }, []);

  const update = useCallback(() => {
    setItems(prev => prev
      .map(item => (item.id === activeDragId ? item : { ...item, x: item.x + 2.5 }))
      .filter(item => item.x < window.innerWidth + 200)
    );
    requestRef.current = requestAnimationFrame(update);
  }, [activeDragId]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    const interval = setInterval(spawnItem, 2500);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      clearInterval(interval);
    };
  }, [spawnItem, update]);

  const handlePointerDown = (e: React.PointerEvent, item: SoupItem) => {
    setActiveDragId(item.id);
    setDragPos({ x: e.clientX, y: e.clientY });
    playPopSound(600);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activeDragId !== null) {
      setDragPos({ x: e.clientX, y: e.clientY });
      
      if (potRef.current) {
        const rect = potRef.current.getBoundingClientRect();
        // Área de colisão expandida para facilitar o jogo
        const isCurrentlyOver = e.clientX > rect.left - 50 && e.clientX < rect.right + 50 && 
                                e.clientY > rect.top - 50 && e.clientY < rect.bottom + 50;
        setIsOverPot(isCurrentlyOver);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeDragId === null) return;

    const draggedItem = items.find(i => i.id === activeDragId);
    
    // Verificação de colisão final no momento do soltar
    let finalOver = isOverPot;
    if (potRef.current) {
      const rect = potRef.current.getBoundingClientRect();
      finalOver = e.clientX > rect.left - 50 && e.clientX < rect.right + 50 && 
                  e.clientY > rect.top - 50 && e.clientY < rect.bottom + 50;
    }

    if (finalOver && draggedItem) {
      if (draggedItem.type === 'food') {
        playSuccessSound();
        setScore(s => s + 1);
        setSoupState('happy');
      } else {
        playErrorSound();
        setSoupState('yucky');
      }
      
      setTimeout(() => setSoupState('idle'), 2000);
      setItems(prev => prev.filter(i => i.id !== activeDragId));
    }

    setActiveDragId(null);
    setIsOverPot(false);
  };

  return (
    <div 
      className={styles.container} 
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className={styles.bgOverlay} />
      
      <header className={styles.header}>
        <div className={styles.scoreBoard}>
          Minha Sopa: {score} 🍲
        </div>
      </header>

      {/* Esteira */}
      <div className={styles.conveyorArea}>
        <div className={styles.beltImage} />
        <div className={styles.itemsLayer}>
          {items.map(item => (
            <div
              key={item.id}
              className={`${styles.item} ${activeDragId === item.id ? styles.dragging : ''}`}
              style={{ 
                left: activeDragId === item.id ? dragPos.x - 80 : item.x,
                top: activeDragId === item.id ? dragPos.y - 80 : 'auto',
                position: activeDragId === item.id ? 'fixed' : 'absolute',
              }}
              onPointerDown={(e) => handlePointerDown(e, item)}
            >
              <img src={item.image} alt="ingrediente" className={styles.itemImg} />
            </div>
          ))}
        </div>
      </div>

      {/* Panela com Sistema de Camadas (Instantâneo) */}
      <div 
        ref={potRef}
        className={`
          ${styles.potContainer} 
          ${isOverPot ? styles.over : ''}
        `}
      >
        <div className={styles.potLayers}>
          <img 
            src="/sprites/soup/pot/pot_idle.png" 
            className={`${styles.potImg} ${soupState === 'idle' ? styles.visible : styles.hidden}`} 
            alt="Panela Normal" 
          />
          <img 
            src="/sprites/soup/pot/pot_happy.png" 
            className={`${styles.potImg} ${soupState === 'happy' ? styles.visible : styles.hidden} ${styles.glowGreen}`} 
            alt="Panela Feliz" 
          />
          <img 
            src="/sprites/soup/pot/pot_yucky.png" 
            className={`${styles.potImg} ${soupState === 'yucky' ? styles.visible : styles.hidden} ${styles.shake}`} 
            alt="Panela Eca" 
          />
        </div>
        <div className={styles.potLabel}>Panela do Peter</div>
      </div>

      <div className={styles.instruction}>
        Arraste a comida para a panela! 🥕
      </div>
    </div>
  );
};

export default SoupGame;
