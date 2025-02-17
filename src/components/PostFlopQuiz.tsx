import React, { useState } from 'react';
import Card from './Card';
import '../styles/PostFlopQuiz.css';

interface PostFlopQuizProps {
  onBackToMenu: () => void;
}

interface CardType {
  value: string;
  suit: string;
  image: string;
}

const PostFlopQuiz: React.FC<PostFlopQuizProps> = ({ onBackToMenu }) => {
  const [selectedPlayerCards, setSelectedPlayerCards] = useState<CardType[]>([]);
  const [selectedBoardCards, setSelectedBoardCards] = useState<CardType[]>([]);
  const [selectedOpp1Cards, setSelectedOpp1Cards] = useState<CardType[]>([]);
  const [selectedOpp2Cards, setSelectedOpp2Cards] = useState<CardType[]>([]);
  const [equity, setEquity] = useState<any>(null);
  const [selectionMode, setSelectionMode] = useState<'player' | 'board' | 'opp1' | 'opp2'>('player');
  const [isCalculating, setIsCalculating] = useState(false);

  // Function to generate all 52 cards
  const generateDeck = () => {
    const suits = ['h', 'd', 'c', 's'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const deck: CardType[] = [];

    suits.forEach(suit => {
      values.forEach(value => {
        deck.push({
          value,
          suit,
          image: `/cards/${value}${suit}.png`
        });
      });
    });

    return deck;
  };

  const handleCardClick = (card: CardType) => {
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
      case 'player':
        if (selectedPlayerCards.length < 6) {
          setSelectedPlayerCards([...selectedPlayerCards, card]);
        }
        break;
      case 'board':
        if (selectedBoardCards.length < 3) {
          setSelectedBoardCards([...selectedBoardCards, card]);
        }
        break;
      case 'opp1':
        if (selectedOpp1Cards.length < 5) {
          setSelectedOpp1Cards([...selectedOpp1Cards, card]);
        }
        break;
      case 'opp2':
        if (selectedOpp2Cards.length < 5) {
          setSelectedOpp2Cards([...selectedOpp2Cards, card]);
        }
        break;
    }
  };

  const removeCard = (cardType: 'player' | 'board' | 'opp1' | 'opp2', index: number) => {
    switch (cardType) {
      case 'player':
        setSelectedPlayerCards(cards => cards.filter((_, i) => i !== index));
        break;
      case 'board':
        setSelectedBoardCards(cards => cards.filter((_, i) => i !== index));
        break;
      case 'opp1':
        setSelectedOpp1Cards(cards => cards.filter((_, i) => i !== index));
        break;
      case 'opp2':
        setSelectedOpp2Cards(cards => cards.filter((_, i) => i !== index));
        break;
    }
  };

  const calculateEquity = async () => {
    setIsCalculating(true);
    try {
      if (selectedPlayerCards.length < 1 || selectedBoardCards.length !== 3 || selectedOpp1Cards.length < 1) {
        alert('Please select required cards first');
        return;
      }

      const formatCards = (cards: CardType[]) => 
        cards.map(card => `${card.value}${card.suit}`);

      // New function to format opponent ranges
      const formatOppRange = (cards: CardType[]) => {
        // Group cards into pairs
        const ranges: string[] = [];
        for (let i = 0; i < cards.length; i += 2) {
          if (cards[i + 1]) {
            // If we have a pair of cards, combine them
            ranges.push(`${cards[i].value}${cards[i].suit}${cards[i + 1].value}${cards[i + 1].suit}`);
          } else {
            // If we have a single card
            ranges.push(`${cards[i].value}${cards[i].suit}`);
          }
        }
        return ranges;
      };

      const endpoint = selectedOpp2Cards.length > 0 
        ? 'http://localhost:5000/calculate_post_flop_3players'
        : 'http://localhost:5000/calculate_post_flop_hu';

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

      // Add detailed console logging
      console.log('API Request Details:');
      console.log('Endpoint:', endpoint);
      console.log('Payload:', JSON.stringify(payload, null, 2));
      console.log('Player Cards:', selectedPlayerCards.map(c => `${c.value}${c.suit}`));
      console.log('Board Cards:', selectedBoardCards.map(c => `${c.value}${c.suit}`));
      console.log('Opponent 1 Range:', formatOppRange(selectedOpp1Cards));
      if (selectedOpp2Cards.length > 0) {
        console.log('Opponent 2 Range:', formatOppRange(selectedOpp2Cards));
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log('API Response:', result);
      console.log('Response type:', typeof result);
      console.log('Response structure:', Object.keys(result));
      
      setEquity(result);
    } catch (error) {
      console.error('Error calculating equity:', error);
      alert('Error calculating equity');
    } finally {
      setIsCalculating(false);
    }
  };

  const resetSelections = () => {
    setSelectedPlayerCards([]);
    setSelectedBoardCards([]);
    setSelectedOpp1Cards([]);
    setSelectedOpp2Cards([]);
    setEquity(null);
  };

  return (
    <div className="post-flop-quiz">
      <h2>Post-Flop Equity Quiz</h2>
      
      <div className="selection-controls">
        <button 
          className={selectionMode === 'player' ? 'active' : ''} 
          onClick={() => setSelectionMode('player')}
        >
          Select Player Cards ({selectedPlayerCards.length}/6)
        </button>
        <button 
          className={selectionMode === 'board' ? 'active' : ''} 
          onClick={() => setSelectionMode('board')}
        >
          Select Board ({selectedBoardCards.length}/3)
        </button>
        <button 
          className={selectionMode === 'opp1' ? 'active' : ''} 
          onClick={() => setSelectionMode('opp1')}
        >
          Select Opponent 1 ({selectedOpp1Cards.length}/5)
        </button>
        <button 
          className={selectionMode === 'opp2' ? 'active' : ''} 
          onClick={() => setSelectionMode('opp2')}
        >
          Select Opponent 2 ({selectedOpp2Cards.length}/5)
        </button>
      </div>

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

      <div className="selected-cards">
        <div className="player-cards">
          <h3>Player Cards</h3>
          <div className="cards-container">
            {selectedPlayerCards.map((card, index) => (
              <div key={index} onClick={() => removeCard('player', index)} className="card-wrapper">
                <Card {...card} />
              </div>
            ))}
          </div>
          {equity && (
            <div className="equity-value">
              Equity: {equity.hero_equity?.toFixed(2)}%
            </div>
          )}
        </div>
        <div className="board-cards">
          <h3>Board</h3>
          <div className="cards-container">
            {selectedBoardCards.map((card, index) => (
              <div key={index} onClick={() => removeCard('board', index)} className="card-wrapper">
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
          {equity && (
            <div className="equity-value">
              Equity: {(equity.opp_equity || equity.opp1_equity)?.toFixed(2)}%
            </div>
          )}
        </div>
        <div className="opp2-cards">
          <h3>Opponent 2 (Optional)</h3>
          <div className="cards-container">
            {selectedOpp2Cards.map((card, index) => (
              <div key={index} onClick={() => removeCard('opp2', index)} className="card-wrapper">
                <Card {...card} />
              </div>
            ))}
          </div>
          {equity && equity.opp2_equity && (
            <div className="equity-value">
              Equity: {equity.opp2_equity?.toFixed(2)}%
            </div>
          )}
        </div>
      </div>

      <div className="action-buttons">
        {isCalculating && (
          <div className="loading-overlay">
            <div className="spinner">
              <div className="spinner-text">Calculating Equity...</div>
            </div>
          </div>
        )}
        <button 
          onClick={calculateEquity} 
          disabled={selectedPlayerCards.length < 1 || selectedBoardCards.length !== 3 || selectedOpp1Cards.length < 1 || isCalculating}
        >
          {isCalculating ? 'Calculating...' : 'Calculate Equity'}
        </button>
        <button onClick={resetSelections}>Reset</button>
        <button onClick={onBackToMenu}>Back to Menu</button>
      </div>
    </div>
  );
};

export default PostFlopQuiz;