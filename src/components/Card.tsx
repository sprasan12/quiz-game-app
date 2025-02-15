import React from 'react';
import '../styles/Card.css';

interface CardProps {
  value: string;
  suit: string;
  image: string;
}

const Card: React.FC<CardProps> = ({ value, suit, image }) => {
  return (
    <div className="card">
      <img src={image} alt={`${value} of ${suit}`} />
    </div>
  );
};

export default Card;