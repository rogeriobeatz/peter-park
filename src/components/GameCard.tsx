import React from 'react';
import styles from './GameCard.module.css';

interface GameCardProps {
  title: string;
  icon: string;
  color: string;
  onClick: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ title, icon, color, onClick }) => {
  return (
    <button 
      className={`${styles.card} bouncy-tap`}
      style={{ '--card-color': color } as React.CSSProperties}
      onClick={onClick}
    >
      <div className={styles.icon}>{icon}</div>
      <div className={styles.title}>{title}</div>
    </button>
  );
};

export default GameCard;
