import { useEffect, useState } from 'react';
import Park from './views/Park';
import BubblePop from './views/BubblePop/BubblePop';
import MemoryGame from './views/MemoryGame/MemoryGame';
import ShapesGame from './views/ShapesGame/ShapesGame';
import FeedingGame from './views/FeedingGame/FeedingGame';
import MassinhaGame from './views/MassinhaGame/MassinhaGame';
import NumbersGame from './views/NumbersGame';
import MusicGame from './views/MusicGame/MusicGame';
import WhackGame from './views/WhackGame';
import GyroMaze from './views/GyroMaze/GyroMaze';
import TeiaTurbo from './views/TeiaTurbo/TeiaTurbo';
import BackgroundMusic from './components/BackgroundMusic';

function App() {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  useEffect(() => {
    const handleBack = () => setActiveGame(null);
    window.addEventListener('peterpark:back', handleBack);
    return () => window.removeEventListener('peterpark:back', handleBack);
  }, []);

  const renderGame = () => {
    switch (activeGame) {
      case 'bolhas': return <BubblePop />;
      case 'memoria': return <MemoryGame />;
      case 'formas': return <ShapesGame />;
      case 'comida': return <FeedingGame />;
      case 'massinha': return <MassinhaGame />;
      case 'numeros': return <NumbersGame />;
      case 'musica': return <MusicGame />;
      case 'smak': return <WhackGame />;
      case 'labirinto': return <GyroMaze />;
      case 'teia-turbo': return <TeiaTurbo />;
      default: return <div className="unknown-game">Em breve: {activeGame}</div>;
    }
  };

  return (
    <div className="app-container">
      <BackgroundMusic />
      {!activeGame ? <Park onSelectGame={setActiveGame} /> : (
        <div className="game-wrapper">
          {activeGame !== 'labirinto' && activeGame !== 'teia-turbo' && <header className="game-home-header">
            <button className="bouncy-tap" onClick={() => setActiveGame(null)} aria-label="Voltar ao parque">🏠</button>
          </header>}
          {renderGame()}
        </div>
      )}
    </div>
  );
}

export default App;
