import React from 'react';
import GameCard from '../components/GameCard';
import styles from './Park.module.css';

interface ParkProps {
  onSelectGame: (gameId: string) => void;
}

const GAMES = [
  { id: 'bolhas', title: 'Bolhas', icon: '🫧', color: '#96CEB4' },
  { id: 'memoria', title: 'Memória', icon: '🦖', color: '#4ECDC4' },
  { id: 'comida', title: 'Comida', icon: '🍎', color: '#FFEEAD' },
  { id: 'formas', title: 'Encaixe', icon: '🔵', color: '#FF6B6B' },
  { id: 'massinha', title: 'Massinha', icon: '🎨', color: '#45B7D1' },
  { id: 'numeros', title: 'Números', icon: '🚂', color: '#FFCF00' },
  { id: 'musica', title: 'Banda', icon: '🎸', color: '#A78BFA' },
  { id: 'smak', title: 'Sopa Mágica', icon: '🍲', color: '#F87171' },
];

const Park: React.FC<ParkProps> = ({ onSelectGame }) => {
  return (
    <div className={styles.container}>
      {/* Background Decor */}
      <div className={styles.sky}>
        <div className={styles.sun}>☀️</div>
        <div className={`${styles.cloud} ${styles.cloud1}`}>☁️</div>
        <div className={`${styles.cloud} ${styles.cloud2}`}>☁️</div>
        <div className={styles.bird}>🐦</div>
      </div>

      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.titleWrapper}>
            <span className={styles.emojiLeft}>🎡</span>
            <h1 className={styles.title}>Peter Park</h1>
            <span className={styles.emojiRight}>🎠</span>
          </div>
          <p className={styles.subtitle}>Vamos brincar?</p>
        </header>

        <main className={styles.grid}>
          {GAMES.map((game) => (
            <GameCard
              key={game.id}
              title={game.title}
              icon={game.icon}
              color={game.color}
              onClick={() => onSelectGame(game.id)}
            />
          ))}
        </main>
      </div>

      {/* Foreground Decor */}
      <div className={styles.nature}>
        <div className={styles.grass}></div>
        <div className={styles.butterfly}>🦋</div>
        <div className={`${styles.butterfly} ${styles.butterfly2}`}>🦋</div>
        <div className={styles.flowers}>🌸🌼🌺</div>
        <div className={styles.pets}>🐶🐱🐰</div>
      </div>
    </div>
  );
};

export default Park;
