// quiz-game-app/src/components/Hand.tsx
import React from 'react';
import Card from './Card';

interface HandProps {
  cards: Array<{
    value: string;
    suit: string;
    image: string;
  }>;
  handIndex: number;
}

const Hand: React.FC<HandProps> = ({ cards, handIndex }) => {
  const currentHand = cards.slice(handIndex * 6, (handIndex + 1) * 6);

  return (
    <div className="hand">
      {currentHand.map((card, index) => (
        <Card 
          key={index}
          value={card.value}
          suit={card.suit}
          image={card.image}
        />
      ))}
    </div>
  );
};