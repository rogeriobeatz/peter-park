import React from 'react';
import styles from './GameCard.module.css';

interface GameCardProps {
  title: string;
  icon: string;
  color: string;
  index?: number;
  onClick: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ title, icon, color, index = 0, onClick }) => {
  return (
    <button 
      className={`${styles.card} bouncy-tap`}
      style={{ 
        '--card-color': color,
        '--card-index': index 
      } as React.CSSProperties}
      onClick={onClick}
    >
      <div className={styles.icon}>{icon}</div>
      <div className={styles.title}>{title}</div>
    </button>
  );
};

export default GameCard;
