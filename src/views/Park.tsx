import React from 'react';
import GameCard from '../components/GameCard';
import styles from './Park.module.css';

interface ParkProps {
  onSelectGame: (gameId: string) => void;
}

const GAMES = [
  { id: 'pintura', title: 'Pintura', icon: '🎨', color: '#FF6B6B' },
  { id: 'memoria', title: 'Memória', icon: '🧩', color: '#4ECDC4' },
  { id: 'musica', title: 'Música', icon: '🎵', color: '#45B7D1' },
  { id: 'bolhas', title: 'Bolhas', icon: '🫧', color: '#96CEB4' },
  { id: 'comida', title: 'Comida', icon: '🍎', color: '#FFEEAD' },
];

const Park: React.FC<ParkProps> = ({ onSelectGame }) => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Peter Park 🎡</h1>
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
  );
};

export default Park;
