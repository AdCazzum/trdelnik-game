
import { Card } from '@/components/ui/card';
import { GameConfig } from './GameBoard';
import { Zap, TrendingUp, Crown, ChevronLeft, ChevronRight } from 'lucide-react';

interface GameStepsProps {
  config: GameConfig;
  currentStep: number;
  gameActive: boolean;
  gameLost: boolean;
  currentMultiplier: number;
}

const GameSteps = ({ config, currentStep, gameActive, gameLost, currentMultiplier }: GameStepsProps) => {
  const generateSteps = () => {
    const steps = [];
    for (let i = 1; i <= config.maxSteps; i++) {
      const multiplier = config.startMultiplier ** i;
      steps.push({ step: i, multiplier });
    }
    return steps;
  };

  const getAllSteps = () => generateSteps();
  
  const getVisibleSteps = () => {
    const allSteps = getAllSteps();
    if (currentStep === 0) {
      // Show first 6 steps when game hasn't started
      return allSteps.slice(0, 6);
    }
    
    // Show: previous step (if exists), current step, next 5 steps
    const startIndex = Math.max(0, currentStep - 2); // -1 for previous, -1 for 0-based index
    const endIndex = Math.min(allSteps.length, currentStep + 5);
    
    return allSteps.slice(startIndex, endIndex);
  };

  const visibleSteps = getVisibleSteps();
  const allSteps = getAllSteps();

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep && gameActive) return 'current';
    if (stepNumber === currentStep && gameLost) return 'lost';
    return 'pending';
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': 
        return 'bg-green-600/30 border-green-400';
      case 'current': 
        return 'bg-blue-600/30 border-blue-400 animate-pulse';
      case 'lost': 
        return 'bg-red-600/30 border-red-400';
      default: 
        return 'bg-white/5 border-white/20 hover:bg-white/10';
    }
  };

  const getBeeAnimation = () => {
    if (gameLost) return 'grayscale opacity-50';
    if (gameActive) return 'animate-bounce';
    return 'hover:scale-110 transition-transform duration-300';
  };

  const canShowPrevious = currentStep > 1;
  const canShowNext = currentStep < config.maxSteps;

  return (
    <>
      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8b5cf6, #3b82f6);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7c3aed, #2563eb);
        }
      `}</style>

      <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">Game Progress</h3>
        </div>

        {/* Current Multiplier Display */}
        {gameActive && (
          <div className="mb-6 p-4 bg-gradient-to-br from-green-600/30 to-emerald-600/20 rounded-lg border-2 border-green-400/30">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-green-200 font-medium">Current Multiplier</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {currentMultiplier.toFixed(2)}x
              </div>
            </div>
          </div>
        )}

        <div className="relative">
          {/* Bee Character */}
          <div className="flex justify-center mb-6 relative">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
              
              <div className={`relative z-10 p-4 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full border-3 border-yellow-400 shadow-2xl ${getBeeAnimation()}`}>
                <div className="text-6xl drop-shadow-lg">
                  🐝
                </div>
              </div>

              {gameActive && !gameLost && (
                <>
                  <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                  <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-orange-400 rounded-full animate-ping delay-150"></div>
                  <div className="absolute top-1/2 -right-4 w-1 h-1 bg-yellow-300 rounded-full animate-bounce delay-300"></div>
                </>
              )}

              {currentStep === config.maxSteps && !gameLost && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Crown className="w-8 h-8 text-yellow-400 animate-bounce" />
                </div>
              )}
            </div>
          </div>

          {/* Progress Navigation and Info */}
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2 text-blue-200 text-sm">
              <span>Step {currentStep} of {config.maxSteps}</span>
              {currentStep > 0 && (
                <span className="text-green-300">
                  • {((currentStep / config.maxSteps) * 100).toFixed(0)}%
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1 text-blue-200/50 text-xs">
              {canShowPrevious && <ChevronLeft className="w-3 h-3" />}
              <span>Showing nearby steps</span>
              {canShowNext && <ChevronRight className="w-3 h-3" />}
            </div>
          </div>

          {/* Steps Grid - Consistent with other components */}
          <div className="overflow-x-auto custom-scrollbar">
            <div className="flex gap-3 min-w-max pb-2">
              {visibleSteps.map(({ step, multiplier }) => {
                const status = getStepStatus(step);
                
                return (
                  <div
                    key={step}
                    className={`relative p-4 rounded-lg border-2 transition-all duration-300 min-w-[100px] ${getStepColor(status)}`}
                  >
                    <div className="text-center relative z-10">
                      <div className="text-white font-bold text-lg mb-2 flex items-center justify-center gap-1">
                        #{step}
                        {status === 'completed' && <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>}
                        {status === 'current' && <Zap className="w-3 h-3 text-yellow-300" />}
                      </div>
                      
                      <div className="text-xs">
                        <span className="bg-black/30 px-2 py-1 rounded-full text-white/90">
                          {multiplier >= 1000 ? `${(multiplier/1000).toFixed(1)}K` : multiplier.toFixed(2)}x
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-white/10 rounded-full h-3 overflow-hidden border border-white/20">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${(currentStep / config.maxSteps) * 100}%` }}
            ></div>
          </div>

          {/* Game Status Messages */}
          {gameLost && (
            <div className="text-center mt-6 p-4 bg-gradient-to-br from-red-600/30 to-pink-600/20 rounded-lg border-2 border-red-500/50">
              <div className="text-3xl mb-2">💥</div>
              <div className="text-red-300 font-bold text-xl mb-2">Game Over!</div>
              <div className="text-white/80 text-lg">
                The bee got caught at step <span className="font-bold text-red-300">{currentStep}</span>
              </div>
              <div className="mt-3 text-sm text-red-200/60">
                Better luck next time! 🚀
              </div>
            </div>
          )}

          {currentStep === config.maxSteps && !gameLost && gameActive && (
            <div className="text-center mt-6 p-4 bg-gradient-to-br from-green-600/30 to-emerald-600/20 rounded-lg border-2 border-green-500/50">
              <div className="text-3xl mb-2">🎉</div>
              <div className="text-green-300 font-bold text-xl mb-2">Maximum Steps Reached!</div>
              <div className="text-white/80 text-lg">
                The bee conquered all {config.maxSteps} steps! Cash out now! 💰
              </div>
            </div>
          )}
        </div>
      </Card>
    </>
  );
};

export default GameSteps;
