import { useState } from 'react';
import Park from './views/Park';
import BubblePop from './views/BubblePop/BubblePop';
import MemoryGame from './views/MemoryGame/MemoryGame';
import ShapesGame from './views/ShapesGame/ShapesGame';
import FeedingGame from './views/FeedingGame/FeedingGame';
import MassinhaGame from './views/MassinhaGame/MassinhaGame';
import NumbersGame from './views/NumbersGame';
import MusicGame from './views/MusicGame/MusicGame';
import WhackGame from './views/WhackGame';
import BackgroundMusic from './components/BackgroundMusic';

function App() {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const handleSelectGame = (gameId: string) => {
    setActiveGame(gameId);
  };

  const handleBackToPark = () => {
    setActiveGame(null);
  };

  const renderGame = () => {
    switch (activeGame) {
      case 'bolhas':
        return <BubblePop />;
      case 'memoria':
        return <MemoryGame />;
      case 'formas':
        return <ShapesGame />;
      case 'comida':
        return <FeedingGame />;
      case 'massinha':
        return <MassinhaGame />;
      case 'numeros':
        return <NumbersGame />;
      case 'musica':
        return <MusicGame />;
      case 'smak':
        return <WhackGame />;
      default:
        return (
          <div style={{ 
            width: '100vw', 
            height: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: 'var(--color-bg)'
          }}>
            <h2 style={{ fontSize: '48px' }}>Em breve: {activeGame}</h2>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      <BackgroundMusic />
      {!activeGame ? (
        <Park onSelectGame={handleSelectGame} />
      ) : (
        <div className="game-wrapper">
          <header style={{ 
            padding: 'calc(10px + env(safe-area-inset-top)) 20px', 
            position: 'fixed', 
            top: 0, 
            left: 'env(safe-area-inset-left)', 
            zIndex: 9999,
            pointerEvents: 'none' 
          }}>
            <button 
              className="bouncy-tap"
              onClick={handleBackToPark}
              style={{
                fontSize: 'clamp(30px, 5vw, 40px)',
                background: 'var(--color-white)',
                borderRadius: '50%',
                width: 'clamp(60px, 10vw, 80px)',
                height: 'clamp(60px, 10vw, 80px)',
                boxShadow: '0 8px 0 rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'auto',
                border: '4px solid var(--color-primary)'
              }}
            >
              🏠
            </button>
          </header>
          
          {renderGame()}
        </div>
      )}
    </div>
  );
}

export default App;
