const CARD_FOLDER = '/cards/';

interface CardType {
  value: string;
  suit: string;
  image: string;
}

// All possible values and suits
const VALUES = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const SUITS = ['H', 'D', 'C', 'S'];

// Generate all 52 cards and repeat them for each row
const generateDeck = () => {
  // First, generate all 52 cards
  const allCards: CardType[] = [];
  
  VALUES.forEach(value => {
    SUITS.forEach(suit => {
     
      
      allCards.push({
        value: value,
        suit: suit,
        image: `${CARD_FOLDER}${value}${suit}.png`
      });
    });
  });

  // Create 6 rows, each containing all 52 cards
  const rows: Record<string, CardType[]> = {
    'row1': [...allCards],
    'row2': [...allCards].reverse(),
    'row3': [...allCards],
    'row4': [...allCards].reverse(),
    'row5': [...allCards],
    'row6': [...allCards].reverse()
  };

  return rows;
};

export const getAllCards = () => generateDeck();

interface ScoreResponse {
  connected_score: number;
  high_score: number;
  pairs_score: number;
  suits_score: number;
  total_score: number;
}

export const calculateScore = async (selectedCards: CardType[]): Promise<ScoreResponse> => {
  // Convert cards to the format backend expects (e.g., "AS" for Ace of Spades)
  const formattedHand = selectedCards.map(card => {
    // Just combine value and suit directly
    return `${card.value}${card.suit}`;
  });

  try {
    const response = await fetch('http://localhost:5000/calculate_score_6plo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hand: formattedHand }),
    });

    if (!response.ok) {
      throw new Error('Failed to calculate score');
    }

    return await response.json();
  } catch (error) {
    console.error('Error calculating score:', error);
    throw error;
  }
};