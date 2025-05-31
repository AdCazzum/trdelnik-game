import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Difficulty, GAME_CONFIGS } from './GameBoard';
import { useMerits } from '@/hooks/useMerits';
import { Lock, Sparkles } from 'lucide-react';

interface DifficultySelectorProps {
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => void;
  disabled?: boolean;
}

const DIFFICULTY_REQUIREMENTS: Record<Difficulty, number> = {
  Easy: 0,
  Medium: 100,
  Hard: 110,
  Hardcore: 200
};

const DifficultySelector = ({ difficulty, setDifficulty, disabled }: DifficultySelectorProps) => {
  const { totalBalance } = useMerits();
  const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard', 'Hardcore'];

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case 'Easy': return 'bg-green-600';
      case 'Medium': return 'bg-yellow-600';
      case 'Hard': return 'bg-orange-600';
      case 'Hardcore': return 'bg-red-600';
    }
  };

  const getDifficultyLabel = (diff: Difficulty) => {
    switch (diff) {
      case 'Easy': return 'Beginner';
      case 'Medium': return 'Advanced';
      case 'Hard': return 'Expert';
      case 'Hardcore': return 'Master';
    }
  };

  const isDifficultyLocked = (diff: Difficulty) => {
    const requiredMerits = DIFFICULTY_REQUIREMENTS[diff];
    const userMerits = totalBalance || 0;
    return userMerits < requiredMerits;
  };

  return (
    <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
      <h3 className="text-xl font-semibold text-white mb-4">Select Difficulty</h3>
      
      <div className="space-y-3">
        {difficulties.map((diff) => {
          const config = GAME_CONFIGS[diff];
          const isSelected = difficulty === diff;
          const isLocked = isDifficultyLocked(diff);
          const requiredMerits = DIFFICULTY_REQUIREMENTS[diff];
          
          return (
            <button
              key={diff}
              onClick={() => !isLocked && setDifficulty(diff)}
              disabled={disabled || isLocked}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                isSelected 
                  ? 'border-blue-400 bg-blue-600/30' 
                  : 'border-white/20 bg-white/5 hover:bg-white/10'
              } ${(disabled || isLocked) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{diff}</span>
                <Badge className={`${getDifficultyColor(diff)} text-white`}>
                  {getDifficultyLabel(diff)}
                </Badge>
              </div>
              
              <div className="text-sm text-blue-200 space-y-1">
                <div>Steps: {config.maxSteps}</div>
                <div>Start: {config.startMultiplier}x</div>
                <div>Max Win: {config.maxWin.toLocaleString()}x</div>
                {isLocked && (
                  <div className="flex items-center gap-2 text-red-300 mt-2">
                    <Lock className="w-4 h-4" />
                    <span>Requires {requiredMerits} Merits</span>
                  </div>
                )}
                {!isLocked && requiredMerits > 0 && (
                  <div className="flex items-center gap-2 text-green-300 mt-2">
                    <span>✓ Unlocked with {requiredMerits} Merits</span>
                  </div>
                )}
                {diff === 'Easy' && (
                  <div className="flex items-center gap-2 text-green-300 mt-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Always available</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
};

export default DifficultySelector;
