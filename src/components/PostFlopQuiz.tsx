import React, { useState, useEffect } from 'react';
import Card from './Card';
//import { Card } from './Card';
import '../styles/PostFlopQuiz.css';
import soundManager from '../utils/sound';

interface CardType {
  value: string;
  suit: string;
  image: string;
}


interface PostFlopQuizProps {
  onBackToMenu: () => void;
}

interface QuizStats {
  correctAnswers: number;
  totalAttempts: number;
}

const PostFlopQuiz: React.FC<PostFlopQuizProps> = ({ onBackToMenu }) => {
  // State variables
  const [selectedPlayerCards, setSelectedPlayerCards] = useState<CardType[]>([]);
  const [selectedBoardCards, setSelectedBoardCards] = useState<CardType[]>([]);
  const [selectedOpp1Cards, setSelectedOpp1Cards] = useState<CardType[]>([]);
  const [selectedOpp2Cards, setSelectedOpp2Cards] = useState<CardType[]>([]);
  const [equity, setEquity] = useState<any>(null);
  const [selectionMode, setSelectionMode] = useState<'opp1' | 'opp2'>('opp1');
  const [isCalculating, setIsCalculating] = useState(false);
  const [deadCardsMode, setDeadCardsMode] = useState<boolean>(false);
  const [playerGuess, setPlayerGuess] = useState<string>('');
  const [quizStats, setQuizStats] = useState<QuizStats>({ correctAnswers: 0, totalAttempts: 0 });
  const [showResult, setShowResult] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [autoOpp1Mode, setAutoOpp1Mode] = useState<boolean>(false);

  // Function to generate all 52 cards
  const generateDeck = () => {
    const suits = ['h', 'd', 'c', 's'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'].reverse();
    const deck: CardType[] = [];

    values.forEach(value => {
      suits.forEach(suit => {
        deck.push({
          value,
          suit,
          image: `/cards/${value}${suit}.png`
        });
      });
    });

    return deck;
  };

  // Function to calculate hand score
  const calculateHandScore = async (hand: string[]) => {
    try {
      const response = await fetch('http://localhost:5000/calculate_score_6plo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hand })
      });
      const result = await response.json();
      return result.total_score || 0;  // Use total_score instead of score
    } catch (error) {
      console.error('Error calculating hand score:', error);
      return 0;
    }
  };

  // Function to generate random cards
  const generateRandomCards = (count: number, excludeCards: CardType[] = []) => {
    const suits = ['h', 'd', 'c', 's'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const allCards: CardType[] = [];
    const excludeStrings = excludeCards.map(card => `${card.value}${card.suit}`);

    values.forEach(value => {
      suits.forEach(suit => {
        if (!excludeStrings.includes(`${value}${suit}`)) {
          allCards.push({
            value,
            suit,
            image: `/cards/${value}${suit}.png`
          });
        }
      });
    });

    const shuffled = [...allCards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  // Add function to generate random opponent cards
  const generateRandomOpp1Cards = async (excludeCards: CardType[]) => {
    let opp1Cards: CardType[] = [];
    let score = 0;
    let attempts = 0;
    const MAX_ATTEMPTS = 50;

    do {
      opp1Cards = generateRandomCards(6, [...excludeCards]);
      score = await calculateHandScore(opp1Cards.map(card => `${card.value}${card.suit}`));
      console.log('Opp1 Attempt:', attempts + 1, 'Hand:', opp1Cards.map(card => `${card.value}${card.suit}`), 'Score:', score);
      attempts++;
      
      if (score >= 5 || attempts >= MAX_ATTEMPTS) break;
    } while (score < 5);

    if (attempts >= MAX_ATTEMPTS) {
      console.error('Failed to generate Opp1 hand with score >= 5 after', MAX_ATTEMPTS, 'attempts');
    }

    return opp1Cards;
  };

  // Modify generateNewHand to use the new function
  const generateNewHand = async () => {
    setIsCalculating(true);
    try {
      let playerCards: CardType[] = [];
      let score = 0;
      let attempts = 0;
      const MAX_ATTEMPTS = 50;
      
      do {
        playerCards = generateRandomCards(6);
        score = await calculateHandScore(playerCards.map(card => `${card.value}${card.suit}`));
        console.log('Player Attempt:', attempts + 1, 'Hand:', playerCards.map(card => `${card.value}${card.suit}`), 'Score:', score);
        attempts++;
        
        if (score >= 6 || attempts >= MAX_ATTEMPTS) break;
      } while (score < 6);

      // Generate board cards (75% chance for 3 cards, 25% chance for 4 cards)
      const boardCardCount = Math.random() < 0.75 ? 3 : 4;
      const boardCards = generateRandomCards(boardCardCount, playerCards);

      // Generate opponent 1 cards if in automatic mode
      const opp1Cards = autoOpp1Mode 
        ? await generateRandomOpp1Cards([...playerCards, ...boardCards])
        : [];

      setSelectedPlayerCards(playerCards);
      setSelectedBoardCards(boardCards);
      setSelectedOpp1Cards(opp1Cards);
      setSelectedOpp2Cards([]);
      setEquity(null);
      setPlayerGuess('');
      setShowResult(false);
    } catch (error) {
      console.error('Error generating hand:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  // Add sound to card selection
  const handleCardClick = (card: CardType) => {
    soundManager.play('cardFlip');
    const isCardSelected = (card: CardType, selectedCards: CardType[]) => {
      return selectedCards.some(c => c.value === card.value && c.suit === card.suit);
    };

    // Check if card is already selected in any category
    if (
      isCardSelected(card, selectedPlayerCards) ||
      isCardSelected(card, selectedBoardCards) ||
      isCardSelected(card, selectedOpp1Cards) ||
      isCardSelected(card, selectedOpp2Cards)
    ) {
      return;
    }

    switch (selectionMode) {
      case 'opp1':
        if (selectedOpp1Cards.length < 6) {
          setSelectedOpp1Cards([...selectedOpp1Cards, card]);
        }
        break;
      case 'opp2':
        if (selectedOpp2Cards.length < 6) {
          setSelectedOpp2Cards([...selectedOpp2Cards, card]);
        }
        break;
    }
  };

  // Remove selected card
  const removeCard = (cardType: 'opp1' | 'opp2', index: number) => {
    switch (cardType) {
      case 'opp1':
        setSelectedOpp1Cards(cards => cards.filter((_, i) => i !== index));
        break;
      case 'opp2':
        setSelectedOpp2Cards(cards => cards.filter((_, i) => i !== index));
        break;
    }
  };

  // Calculate equity
  const calculateEquity = async () => {
    if (selectedPlayerCards.length < 1 || selectedBoardCards.length < 3 || selectedOpp1Cards.length < 1) {
      alert('Please select required cards first');
      return null;
    }

    const formatCards = (cards: CardType[]) => 
      cards.map(card => `${card.value}${card.suit}`);

    const formatOppRange = (cards: CardType[]) => {
      const ranges: string[] = [];
      let final_string: string = "";
      for (let i = 0; i < cards.length; i += 1) {
        final_string += `${cards[i].value}${cards[i].suit}`;
      }
      ranges.push(final_string);
      return ranges;
    };

    try {
      if (deadCardsMode) {
        const endpoint = 'http://localhost:5000/calculate_post_flop_hu_6plo';
        const payload = {
          hand: formatCards(selectedPlayerCards),
          board: formatCards(selectedBoardCards),
          deadCards: formatCards(selectedOpp2Cards),
          opp_range: formatOppRange(selectedOpp1Cards)
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        setEquity(result);
        return result;
      } else {
        const endpoint = selectedOpp2Cards.length > 0 
          ? 'http://localhost:5000/calculate_post_flop_3players_6plo'
          : 'http://localhost:5000/calculate_post_flop_hu_6plo';

        const payload = selectedOpp2Cards.length > 0 
          ? {
              hand: formatCards(selectedPlayerCards),
              board: formatCards(selectedBoardCards),
              opp_range_1: formatOppRange(selectedOpp1Cards),
              opp_range_2: formatOppRange(selectedOpp2Cards)
            }
          : {
              hand: formatCards(selectedPlayerCards),
              board: formatCards(selectedBoardCards),
              opp_range: formatOppRange(selectedOpp1Cards)
            };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        setEquity(result);
        return result;
      }
    } catch (error) {
      console.error('Error calculating equity:', error);
      return null;
    }
  };

  // Add sound to guess checking
  const checkGuess = async () => {
    soundManager.play('buttonClick');
    
    if (!playerGuess || isNaN(Number(playerGuess))) {
      alert('Please enter a valid equity guess (0-100)');
      return;
    }

    setIsCalculating(true);
    try {
      const actualEquity = await calculateEquity();
      if (actualEquity) {
        const guess = Number(playerGuess);
        const heroEquity = actualEquity.hero_equity;
        const isCorrectGuess = Math.abs(heroEquity - guess) <= 10;
        
        // Play appropriate sound
        if (isCorrectGuess) {
          soundManager.play('correct');
        } else {
          soundManager.play('incorrect');
        }
        
        setIsCorrect(isCorrectGuess);
        setQuizStats(prev => ({
          correctAnswers: prev.correctAnswers + (isCorrectGuess ? 1 : 0),
          totalAttempts: prev.totalAttempts + 1
        }));
        setShowResult(true);
      }
    } catch (error) {
      console.error('Error checking guess:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  // Add sound to next hand button
  const handleNextHand = () => {
    soundManager.play('buttonClick');
    generateNewHand();
  };

  // Initialize first hand when component mounts
  useEffect(() => {
    generateNewHand();
  }, []);

  return (
    <div className="post-flop-quiz">
      <h2>Post-Flop Quiz</h2>
      
      {/* Stats Display */}
      <div className="quiz-stats">
        <span>Correct: {quizStats.correctAnswers}</span>
        <span>Total: {quizStats.totalAttempts}</span>
        <span>Accuracy: {quizStats.totalAttempts > 0 
          ? ((quizStats.correctAnswers / quizStats.totalAttempts) * 100).toFixed(1) 
          : 0}%</span>
      </div>

      {/* Mode toggles */}
      <div className="mode-toggle">
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={autoOpp1Mode}
            onChange={(e) => setAutoOpp1Mode(e.target.checked)}
          />
          <span className="toggle-slider"></span>
          Auto Opp1 Mode
        </label>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={deadCardsMode}
            onChange={(e) => setDeadCardsMode(e.target.checked)}
          />
          <span className="toggle-slider"></span>
          Dead Cards Mode
        </label>
      </div>

      {/* Selection controls */}
      <div className="selection-controls">
        <button 
          className={selectionMode === 'opp1' ? 'active' : ''} 
          onClick={() => setSelectionMode('opp1')}
          disabled={autoOpp1Mode}
        >
          Select Opponent 1 ({selectedOpp1Cards.length}/6)
        </button>
        <button 
          className={selectionMode === 'opp2' ? 'active' : ''} 
          onClick={() => setSelectionMode('opp2')}
        >
          {deadCardsMode ? 'Select Dead Cards' : 'Select Opponent 2'} ({selectedOpp2Cards.length}/6)
        </button>
      </div>

      {/* Card selection deck */}
      <div className="deck">
        {generateDeck().map((card, index) => (
          <div 
            key={index} 
            onClick={() => handleCardClick(card)}
            className={`card-wrapper ${
              selectedPlayerCards.some(c => c.value === card.value && c.suit === card.suit) ? 'selected-player' :
              selectedBoardCards.some(c => c.value === card.value && c.suit === card.suit) ? 'selected-board' :
              selectedOpp1Cards.some(c => c.value === card.value && c.suit === card.suit) ? 'selected-opp1' :
              selectedOpp2Cards.some(c => c.value === card.value && c.suit === card.suit) ? 'selected-opp2' : ''
            }`}
          >
            <Card {...card} />
          </div>
        ))}
      </div>

      {/* Selected cards display */}
      <div className="selected-cards">
        <div className="player-cards">
          <h3>Your Hand</h3>
          <div className="cards-container">
            {selectedPlayerCards.map((card, index) => (
              <div key={index} className="card-wrapper">
                <Card {...card} />
              </div>
            ))}
          </div>
          {showResult && equity && (
            <div className="equity-value">
              Actual Equity: {equity.hero_equity?.toFixed(2)}%
            </div>
          )}
        </div>
        <div className="board-cards">
          <h3>Board</h3>
          <div className="cards-container">
            {selectedBoardCards.map((card, index) => (
              <div key={index} className="card-wrapper">
                <Card {...card} />
              </div>
            ))}
          </div>
        </div>
        <div className="opp1-cards">
          <h3>Opponent 1</h3>
          <div className="cards-container">
            {selectedOpp1Cards.map((card, index) => (
              <div key={index} onClick={() => removeCard('opp1', index)} className="card-wrapper">
                <Card {...card} />
              </div>
            ))}
          </div>
          {showResult && equity && (
            <div className="equity-value">
              Actual Equity: {(equity.opp_equity || equity.opp1_equity)?.toFixed(2)}%
            </div>
          )}
        </div>
        <div className="opp2-cards">
          <h3>{deadCardsMode ? 'Dead Cards' : 'Opponent 2 (Optional)'}</h3>
          <div className="cards-container">
            {selectedOpp2Cards.map((card, index) => (
              <div key={index} onClick={() => removeCard('opp2', index)} className="card-wrapper">
                <Card {...card} />
              </div>
            ))}
          </div>
          {showResult && equity && equity.opp2_equity && !deadCardsMode && (
            <div className="equity-value">
              Actual Equity: {equity.opp2_equity?.toFixed(2)}%
            </div>
          )}
        </div>
      </div>

      {/* Equity guess input and results */}
      <div className="equity-guess-section">
        <input
          type="number"
          min="0"
          max="100"
          value={playerGuess}
          onChange={(e) => setPlayerGuess(e.target.value)}
          placeholder="Enter your equity guess (0-100)"
          disabled={showResult}
        />
        <div className="equity-quick-select">
          {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((value) => (
            <button
              key={value}
              onClick={() => setPlayerGuess(value.toString())}
              disabled={showResult}
              className={playerGuess === value.toString() ? 'active' : ''}
            >
              {value}%
            </button>
          ))}
        </div>
        {!showResult ? (
          <button 
            onClick={checkGuess}
            disabled={!playerGuess || selectedOpp1Cards.length === 0}
            className="submit-guess"
          >
            Submit Guess
          </button>
        ) : (
          <div className={`guess-result ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect ? 'Correct!' : 'Incorrect!'} 
            Your guess: {playerGuess}% 
            Actual: {equity?.hero_equity?.toFixed(2)}%
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="action-buttons">
        {isCalculating && (
          <div className="loading-overlay">
            <div className="spinner">
              <div className="spinner-text">Calculating...</div>
            </div>
          </div>
        )}
        <button onClick={handleNextHand}>Next Hand</button>
        <button onClick={() => {
          soundManager.play('buttonClick');
          onBackToMenu();
        }}>Back to Menu</button>
      </div>
    </div>
  );
};

export default PostFlopQuiz;