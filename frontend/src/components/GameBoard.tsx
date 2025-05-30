
import { useState } from 'react';
import DifficultySelector from './DifficultySelector';
import GameSteps from './GameSteps';
import BettingPanel from './BettingPanel';
import GameControls from './GameControls';
import { useGameContract } from '@/hooks/useGameContract';
import { useWallet } from '@/hooks/useWallet';
import { Card } from '@/components/ui/card';
import { Wallet } from 'lucide-react';

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Hardcore';

export interface GameConfig {
  maxSteps: number;
  startMultiplier: number;
  maxWin: number;
  winProbability: number;
}

export const GAME_CONFIGS: Record<Difficulty, GameConfig> = {
  Easy: { maxSteps: 24, startMultiplier: 1.02, maxWin: 24.50, winProbability: 96 },
  Medium: { maxSteps: 22, startMultiplier: 1.11, maxWin: 2254, winProbability: 88 },
  Hard: { maxSteps: 20, startMultiplier: 1.22, maxWin: 52067.39, winProbability: 80 },
  Hardcore: { maxSteps: 15, startMultiplier: 1.63, maxWin: 3203384.80, winProbability: 60 },
};

const GameBoard = () => {
  const { isConnected } = useWallet();
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [betAmount, setBetAmount] = useState<string>('0.01');
  
  const { 
    gameState, 
    isLoading, 
    startGame, 
    playStep, 
    cashOut,
    getCurrentMultiplier 
  } = useGameContract();

  const config = GAME_CONFIGS[difficulty];

  // If wallet is not connected, show connection message
  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="p-8 bg-gradient-to-br from-red-600/30 to-pink-600/20 backdrop-blur-sm border-2 border-red-500/50 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-2xl font-bold text-white mb-4">Wallet Required</h3>
          <p className="text-red-200 text-lg">
            Please connect your MetaMask wallet to access the game.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-red-300">
            <Wallet className="w-5 h-5" />
            <span>Connect wallet to continue</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <GameSteps 
        config={config}
        currentStep={gameState?.currentStep || 0}
        gameActive={gameState?.active || false}
        gameLost={gameState?.lost || false}
        currentMultiplier={getCurrentMultiplier()}
      />

      <GameControls
        gameState={gameState}
        betAmount={betAmount}
        difficulty={difficulty}
        isLoading={isLoading}
        onStartGame={startGame}
        onPlayStep={playStep}
        onCashOut={cashOut}
      />
      
      <BettingPanel 
        betAmount={betAmount}
        setBetAmount={setBetAmount}
        disabled={gameState?.active || false}
      />

      <DifficultySelector 
        difficulty={difficulty} 
        setDifficulty={setDifficulty}
        disabled={gameState?.active || false}
      />
    </div>
  );
};

export default GameBoard;
