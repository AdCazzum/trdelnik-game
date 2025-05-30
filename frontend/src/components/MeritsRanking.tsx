import { useMerits } from '@/hooks/useMerits';
import { Trophy, ExternalLink } from 'lucide-react';

export const MeritsRanking = () => {
  const { rank, totalBalance, usersBelow, topPercent, isLoading } = useMerits();

  if (isLoading) {
    return (
      <div className="fixed bottom-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 shadow-lg border animate-pulse">
        <div className="h-4 w-24 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 shadow-lg border hover:bg-background/90 transition-colors">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <div className="text-sm">
          <div className="font-medium">
            {rank ? `Rank #${rank}` : 'Not Ranked'}
          </div>
          <div className="text-xs text-muted-foreground">
            {rank ? (
              <>
                Top {topPercent?.toFixed(2)}% • {totalBalance} Merits
              </>
            ) : (
              'Play to earn Merits!'
            )}
          </div>
        </div>
      </div>
      <a 
        href="https://merits-staging.blockscout.com/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="mt-2 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
      >
        <ExternalLink className="h-3 w-3" />
        Learn more about Merits
      </a>
    </div>
  );
}; 