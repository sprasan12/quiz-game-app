import React, { useState, useEffect } from 'react';
import Card from './Card';
import { calculateScore, getAllCards } from '../services/api';
import soundManager from '../utils/sound';
import '../styles/QuizMode.css';

interface QuizModeProps {
  onBackToMenu: () => void;
}

interface CardType {
  value: string;
  suit: string;
  image: string;
}

interface ScoreResponse {
  connected_score: number;
  high_score: number;
  pairs_score: number;
  suits_score: number;
  total_score: number;
}

const QuizMode: React.FC<QuizModeProps> = ({ onBackToMenu }) => {
  const [quizHand, setQuizHand] = useState<CardType[]>([]);
  const [userGuess, setUserGuess] = useState<string>('2');
  const [actualScore, setActualScore] = useState<number | null>(null);
  const [scoreDetails, setScoreDetails] = useState<ScoreResponse | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    correctGuesses: 0
  });

  useEffect(() => {
    generateRandomHand();
  }, []);

  const generateRandomHand = () => {
    soundManager.play('cardFlip');
    const allCards = Object.values(getAllCards())[0];
    const shuffled = [...allCards].sort(() => Math.random() - 0.5);
    const randomHand = shuffled.slice(0, 6);

    setQuizHand(randomHand);
    setShowResult(false);
    setActualScore(null);
    setUserGuess('2');
  };

  const handleSubmitGuess = async () => {
    if (!userGuess) {
      alert('Please enter your guess!');
      return;
    }

    setIsLoading(true);
    try {
      const result = await calculateScore(quizHand);
      setScoreDetails(result);
      setActualScore(result.total_score);
      setShowResult(true);
      
      // Play correct/incorrect sound based on the guess
      if (Number(userGuess) === result.total_score) {
        soundManager.play('correct');
      } else {
        soundManager.play('incorrect');
      }
      
      setStats(prevStats => ({
        totalAttempts: prevStats.totalAttempts + 1,
        correctGuesses: prevStats.correctGuesses + (Number(userGuess) === result.total_score ? 1 : 0)
      }));
      
    } catch (error) {
      console.error('Error calculating score:', error);
      alert('Failed to calculate score. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetStats = () => {
    if (window.confirm('Are you sure you want to reset your stats?')) {
      soundManager.play('click');
      setStats({
        totalAttempts: 0,
        correctGuesses: 0
      });
    }
  };

  return (
    <div className="quiz-mode">
      <h2>Guess the Hand Score</h2>
      
      <div className="stats-display">
        <p>Score: {stats.correctGuesses} / {stats.totalAttempts}</p>
        <p>Accuracy: {stats.totalAttempts > 0 
          ? `${Math.round((stats.correctGuesses / stats.totalAttempts) * 100)}%` 
          : '0%'}
        </p>
        <button onClick={resetStats} className="reset-stats-button">
          Reset Stats
        </button>
      </div>
      
      <div className="quiz-hand">
        {quizHand.map((card, index) => (
          <Card
            key={index}
            value={card.value}
            suit={card.suit}
            image={card.image}
          />
        ))}
      </div>

      <div className="quiz-controls">
        <input
          type="number"
          value={userGuess}
          onChange={(e) => setUserGuess(e.target.value)}
          placeholder="Enter your score guess"
          min="0"
          max="100"
          disabled={showResult}
        />
        {!showResult ? (
          <button 
            onClick={handleSubmitGuess}
            disabled={isLoading || !userGuess}
          >
            {isLoading ? 'Checking...' : 'Submit Guess'}
          </button>
        ) : (
          <button onClick={generateRandomHand}>Next Hand</button>
        )}
        <button onClick={onBackToMenu} className="back-button">
          Back to Menu
        </button>
      </div>

      {showResult && scoreDetails && (
        <div className={`result ${Number(userGuess) === scoreDetails.total_score ? 'correct' : 'incorrect'}`}>
          <h3>
            {Number(userGuess) === scoreDetails.total_score 
              ? 'Correct! 🎉' 
              : 'Not quite right!'}
          </h3>
          
          <div className="main-score-display">
            <div className="total-score-section">
              <h4>Total Score</h4>
              <span className="total-value">{scoreDetails.total_score}</span>
            </div>
            
            {Number(userGuess) !== scoreDetails.total_score && (
              <div className="user-guess-section">
                <h4>Your Guess</h4>
                <span className="guess-value">{userGuess}</span>
              </div>
            )}
          </div>

          <div className="score-breakdown">
            <h4>Score Breakdown</h4>
            <div className="breakdown-grid">
              <div className="breakdown-item">
                <span className="label">Connected</span>
                <span className="value">{scoreDetails.connected_score}</span>
              </div>
              <div className="breakdown-item">
                <span className="label">High Card</span>
                <span className="value">{scoreDetails.high_score}</span>
              </div>
              <div className="breakdown-item">
                <span className="label">Pairs</span>
                <span className="value">{scoreDetails.pairs_score}</span>
              </div>
              <div className="breakdown-item">
                <span className="label">Suits</span>
                <span className="value">{scoreDetails.suits_score}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizMode; 