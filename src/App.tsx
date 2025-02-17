// quiz-game-app/src/App.tsx
import React, { useState, useEffect } from 'react';
import Card from './components/Card';
import { getAllCards, calculateScore } from './services/api';
import './styles/App.css';
import QuizMode from './components/QuizMode';
import soundManager from './utils/sound';
import PostFlopQuiz from './components/PostFlopQuiz';

interface CardType {
  value: string;
  suit: string;
  image: string;
}

interface ScoreDetails {
  connected_score: number;
  high_score: number;
  pairs_score: number;
  suits_score: number;
  total_score: number;
}

const App: React.FC = () => {
  const [gameMode, setGameMode] = useState<'menu' | 'selection' | 'quiz' | 'postflop'>('menu');
  const [allCards, setAllCards] = useState<Record<string, CardType[]>>({});
  const [selectedCards, setSelectedCards] = useState<(CardType | undefined)[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [scoreDetails, setScoreDetails] = useState<ScoreDetails | null>(null);

  useEffect(() => {
    setAllCards(getAllCards());
  }, []);

  const handleCardSelect = (card: CardType, rowIndex: number) => {
    // Check if this card is already selected in another row
    const isCardAlreadySelected = selectedCards.some((selectedCard, index) => 
      index !== rowIndex && // Don't check the current row
      selectedCard && // Check if there's a card selected
      selectedCard.value === card.value && 
      selectedCard.suit === card.suit
    );

    if (isCardAlreadySelected) {
      alert('This card is already selected in another row!');
      return;
    }

    setSelectedCards(prev => {
      const newSelection = [...prev];
      newSelection[rowIndex] = card;
      return newSelection;
    });
  };

  const isCardSelected = (card: CardType, rowIndex: number) => {
    // Card is selected in current row
    const isSelectedInCurrentRow = selectedCards[rowIndex]?.image === card.image;
    
    // Card is selected in any other row
    const isSelectedInOtherRow = selectedCards.some((selectedCard, index) => 
      index !== rowIndex && 
      selectedCard && 
      selectedCard.value === card.value && 
      selectedCard.suit === card.suit
    );

    return isSelectedInCurrentRow || isSelectedInOtherRow;
  };

  // Add a helper function to get the card status class
  const getCardStatusClass = (card: CardType, rowIndex: number) => {
    if (selectedCards[rowIndex]?.image === card.image) {
      return 'selected';
    }
    if (selectedCards.some((selectedCard, index) => 
      index !== rowIndex && 
      selectedCard && 
      selectedCard.value === card.value && 
      selectedCard.suit === card.suit
    )) {
      return 'disabled';
    }
    return '';
  };

  const handleConfirmSelection = async () => {
    if (selectedCards.length === 6 && !selectedCards.includes(undefined)) {
      setIsCalculating(true);
      setError(null);
      soundManager.play('click');
      
      try {
        const result = await calculateScore(selectedCards as CardType[]);
        setScoreDetails(result);
        setScore(result.total_score);
        soundManager.play('correct');
      } catch (err) {
        setError('Failed to calculate score. Please try again.');
        soundManager.play('incorrect');
        console.error('Error calculating score:', err);
      } finally {
        setIsCalculating(false);
      }
    } else {
      alert('Please select one card from each row');
    }
  };

  const toggleSound = () => {
    const isEnabled = soundManager.toggle();
    setIsSoundEnabled(isEnabled);
  };

  if (gameMode === 'menu') {
    return (
      <div className="App">
        <h1>Card Quiz Game</h1>
        <div className="mode-selection">
          <button onClick={() => setGameMode('selection')}>
            Create Your Hand
          </button>
          <button onClick={() => setGameMode('quiz')}>
            Score Guessing Quiz
          </button>
          <button onClick={() => setGameMode('postflop')}>
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
        <PostFlopQuiz onBackToMenu={() => setGameMode('menu')} />
      </div>
    );
  }

  // Original card selection mode
  return (
    <div className="App">
      <h1>Card Quiz Game</h1>
      <button 
        onClick={() => setGameMode('menu')} 
        className="back-button"
      >
        Back to Menu
      </button>
      
      <div className="selected-preview">
        <h3>Selected Cards:</h3>
        <div className="cards-container">
          {selectedCards.map((card, index) => (
            card && (
              <Card
                key={index}
                value={card.value}
                suit={card.suit}
                image={card.image}
              />
            )
          ))}
        </div>
        {error && <p className="error-message">{error}</p>}
        {scoreDetails && (
          <div className="score-details">
            <h3>Hand Score Breakdown</h3>
            <div className="score-grid">
              <div className="score-item">
                <span className="score-label">Connected Score:</span>
                <span className="score-value">{scoreDetails.connected_score}</span>
              </div>
              <div className="score-item">
                <span className="score-label">High Card Score:</span>
                <span className="score-value">{scoreDetails.high_score}</span>
              </div>
              <div className="score-item">
                <span className="score-label">Pairs Score:</span>
                <span className="score-value">{scoreDetails.pairs_score}</span>
              </div>
              <div className="score-item">
                <span className="score-label">Suits Score:</span>
                <span className="score-value">{scoreDetails.suits_score}</span>
              </div>
              <div className="score-item total">
                <span className="score-label">Total Score:</span>
                <span className="score-value">{scoreDetails.total_score}</span>
              </div>
            </div>
          </div>
        )}
        <button 
          onClick={handleConfirmSelection}
          disabled={selectedCards.length !== 6 || 
                   selectedCards.includes(undefined) ||
                   isCalculating}
          className="confirm-button"
        >
          {isCalculating ? 'Calculating...' : 'Calculate Score'}
        </button>
      </div>

      <h2>Select Your Hand - Choose One Card from Each Row</h2>
      
      <div className="selection-area">
        {Object.entries(allCards).map(([rowName, cards], rowIndex) => (
          <div key={rowName} className="card-row">
            <h3>Row {rowIndex + 1}</h3>
            <div className="cards-container">
              {cards.map((card) => (
                <div 
                  key={`${card.value}-${card.suit}`}
                  onClick={() => !isCardSelected(card, rowIndex) && handleCardSelect(card, rowIndex)}
                  className={`card-wrapper ${getCardStatusClass(card, rowIndex)}`}
                >
                  <Card
                    value={card.value}
                    suit={card.suit}
                    image={card.image}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button 
        className="sound-toggle"
        onClick={toggleSound}
        title={`Sound ${isSoundEnabled ? 'On' : 'Off'}`}
      >
        {isSoundEnabled ? '🔊' : '🔇'}
      </button>
    </div>
  );
};

export default App;