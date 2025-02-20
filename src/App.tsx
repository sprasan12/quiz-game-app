// quiz-game-app/src/App.tsx
import React, { useState } from 'react';
import './styles/App.css';
import QuizMode from './components/QuizMode';
import PostFlopCalc from './components/PostFlopCalc';
import PostFlopQuiz from './components/PostFlopQuiz';

const App: React.FC = () => {
  const [gameMode, setGameMode] = useState<'menu' | 'quiz' | 'postflop' | 'postflopquiz'>('menu');

  if (gameMode === 'menu') {
    return (
      <div className="App">
        <h1>Card Quiz Game</h1>
        <div className="mode-selection">
          <button onClick={() => setGameMode('quiz')}>
            Pre-Flop Quiz
          </button>
          <button onClick={() => setGameMode('postflop')}>
            Post-Flop Calc
          </button>
          <button onClick={() => setGameMode('postflopquiz')}>
            Post-Flop Quiz
          </button>
        </div>
      </div>
    );
  }

  if (gameMode === 'quiz') {
    return (
      <div className="App">
        <QuizMode onBackToMenu={() => setGameMode('menu')} />
      </div>
    );
  }

  if (gameMode === 'postflop') {
    return (
      <div className="App">
        <PostFlopCalc onBackToMenu={() => setGameMode('menu')} />
      </div>
    );
  }

  if (gameMode === 'postflopquiz') {
    return (
      <div className="App">
        <PostFlopQuiz onBackToMenu={() => setGameMode('menu')} />
      </div>
    );
  }

  return null;
};

export default App;