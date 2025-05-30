
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, DollarSign, RotateCcw, Gamepad2, Zap } from 'lucide-react';
import { Difficulty } from './GameBoard';

interface GameState {
  gameId?: number;
  active: boolean;
  lost: boolean;
  currentStep: number;
  bet: string;
}

interface GameControlsProps {
  gameState: GameState | null;
  betAmount: string;
  difficulty: Difficulty;
  isLoading: boolean;
  onStartGame: (difficulty: Difficulty, betAmount: string) => void;
  onPlayStep: () => void;
  onCashOut: () => void;
}

const GameControls = ({ 
  gameState, 
  betAmount, 
  difficulty, 
  isLoading,
  onStartGame,
  onPlayStep,
  onCashOut 
}: GameControlsProps) => {
  const canStartGame = !gameState?.active && !isLoading && parseFloat(betAmount) > 0;
  const canPlayStep = gameState?.active && !gameState?.lost && !isLoading;
  const canCashOut = gameState?.active && !gameState?.lost && gameState?.currentStep > 0 && !isLoading;

  return (
    <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
          <Gamepad2 className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white">Game Controls</h3>
      </div>
      
      <div className="space-y-4">
        {!gameState?.active ? (
          <button
            onClick={() => onStartGame(difficulty, betAmount)}
            disabled={!canStartGame}
            className={`w-full p-4 rounded-lg border-2 transition-all ${
              canStartGame && !isLoading
                ? 'border-green-400 bg-green-600/30 hover:bg-green-600/40 cursor-pointer' 
                : 'border-white/20 bg-white/5 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <Play className="w-5 h-5 text-white" />
              <span className="text-white font-medium text-lg">
                {isLoading ? 'Starting Game...' : 'Start Game'}
              </span>
            </div>
            <div className="text-sm text-green-200">
              Ready to buzz with {difficulty} difficulty
            </div>
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={onPlayStep}
              disabled={!canPlayStep}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                canPlayStep
                  ? 'border-blue-400 bg-blue-600/30 hover:bg-blue-600/40 cursor-pointer' 
                  : 'border-white/20 bg-white/5 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-white" />
                <span className="text-white font-medium text-lg">
                  {isLoading ? 'Playing Step...' : 'Next Step'}
                </span>
              </div>
              <div className="text-sm text-blue-200">
                Take the next step forward
              </div>
            </button>
            
            <button
              onClick={onCashOut}
              disabled={!canCashOut}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                canCashOut
                  ? 'border-yellow-400 bg-yellow-600/30 hover:bg-yellow-600/40 cursor-pointer' 
                  : 'border-white/20 bg-white/5 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-white" />
                <span className="text-white font-medium text-lg">Cash Out</span>
              </div>
              <div className="text-sm text-yellow-200">
                Secure your current winnings
              </div>
            </button>
          </div>
        )}

        {gameState?.lost && (
          <button
            onClick={() => window.location.reload()}
            className="w-full p-4 rounded-lg border-2 border-purple-400 bg-purple-600/30 hover:bg-purple-600/40 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <RotateCcw className="w-5 h-5 text-white" />
              <span className="text-white font-medium text-lg">New Game</span>
            </div>
            <div className="text-sm text-purple-200">
              Start fresh with a new game
            </div>
          </button>
        )}
      </div>

      {/* Game Stats */}
      {gameState && (
        <div className="mt-6 pt-6 border-t border-white/20">
          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            Game Statistics
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
              <span className="text-blue-200 text-sm">Game ID</span>
              <span className="text-white font-medium">{gameState.gameId || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
              <span className="text-blue-200 text-sm">Current Step</span>
              <span className="text-white font-medium">{gameState.currentStep}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
              <span className="text-blue-200 text-sm">Bet Amount</span>
              <span className="text-white font-medium">{gameState.bet} ETH</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default GameControls;
