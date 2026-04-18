import { useState } from 'react';
import Park from './views/Park';
import BubblePop from './views/BubblePop';

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
      {!activeGame ? (
        <Park onSelectGame={handleSelectGame} />
      ) : (
        <div className="game-wrapper">
          <header style={{ padding: '20px', position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
            <button 
              className="bouncy-tap"
              onClick={handleBackToPark}
              style={{
                fontSize: '40px',
                background: 'var(--color-white)',
                borderRadius: '50%',
                width: '80px',
                height: '80px',
                boxShadow: '0 6px 0 rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
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
