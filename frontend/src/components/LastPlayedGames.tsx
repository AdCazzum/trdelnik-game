import { Card } from '@/components/ui/card';
import { Trophy, XCircle, History } from 'lucide-react';
import { useGameContract } from '@/hooks/useGameContract';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useAkave } from '../hooks/useAkave';
import { useChain } from '../hooks/useChain';

const BLOCK_LIMIT = 30; // Maximum blocks per request
const TOTAL_BLOCKS_TO_SEARCH = 300; // Total blocks to search (reduced for better performance)

interface GameRecord {
  gameId: number;
  difficulty: string;
  bet: string;
  result: 'win' | 'loss';
  multiplier?: string;
  payout?: string;
  timestamp: number;
  steps: number;
  player: string;
  transactionHash?: string;
}

const LastPlayedGames = () => {
  const { contract, gameState } = useGameContract();
  const { chainConfig } = useChain();
  const { getGameData } = useAkave();
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to manually refresh the game list
  const refreshGameList = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const fetchGameHistory = async () => {
    if (!contract || !contract.runner?.provider) {
      console.log('Contract or provider not available yet');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get current block
      const provider = contract.runner.provider;
      const currentBlock = await provider.getBlockNumber();
      const startBlock = Math.max(0, currentBlock - TOTAL_BLOCKS_TO_SEARCH);

      console.log(`Fetching games from block ${startBlock} to ${currentBlock}`);

      let allEvents: any[] = [];
      
      // Fetch events in batches of BLOCK_LIMIT
      for (let fromBlock = startBlock; fromBlock <= currentBlock; fromBlock += BLOCK_LIMIT) {
        const toBlock = Math.min(fromBlock + BLOCK_LIMIT - 1, currentBlock);
        
        try {
          console.log(`Fetching batch from ${fromBlock} to ${toBlock}`);
          const filter = contract.filters.GameStarted();
          const events = await contract.queryFilter(filter, fromBlock, toBlock);
          allEvents.push(...events);
          
          // Small delay to avoid overwhelming the RPC
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (batchError) {
          console.error(`Error fetching batch ${fromBlock}-${toBlock}:`, batchError);
          // Continue with next batch instead of failing completely
        }
      }
      
      console.log(`Found ${allEvents.length} GameStarted events total`);

      if (allEvents.length === 0) {
        setGames([]);
        return;
      }
      
      // Sort events by block number (newest first) and take only the latest 10
      const sortedEvents = allEvents
        .sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0))
        .slice(0, 10);
      
      // Helper function to fetch events in batches
      const fetchEventsInBatches = async (filter: any) => {
        const events: any[] = [];
        for (let fromBlock = startBlock; fromBlock <= currentBlock; fromBlock += BLOCK_LIMIT) {
          const toBlock = Math.min(fromBlock + BLOCK_LIMIT - 1, currentBlock);
          try {
            const batchEvents = await contract.queryFilter(filter, fromBlock, toBlock);
            events.push(...batchEvents);
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (error) {
            console.error(`Error fetching events batch ${fromBlock}-${toBlock}:`, error);
          }
        }
        return events;
      };
      
      const gamePromises = sortedEvents.map(async (event) => {
        try {
          // Type cast the event to EventLog to access args
          const eventLog = event as ethers.EventLog;
          const gameId = eventLog.args?.gameId;
          if (!gameId) return null;

          // Convert gameId to number using BigInt conversion
          const gameIdNumber = Number(gameId);
          console.log('Processing game ID:', gameIdNumber, 'Original:', gameId);

          const game = await contract.games(gameIdNumber);
          const gameLostFilter = contract.filters.GameLost(gameIdNumber);
          const cashoutFilter = contract.filters.Cashout(gameIdNumber);
          
          // Use batched fetching for game-specific events
          const [lostEvents, cashoutEvents] = await Promise.all([
            fetchEventsInBatches(gameLostFilter),
            fetchEventsInBatches(cashoutFilter)
          ]);

          const isLost = lostEvents.length > 0;
          const cashoutEvent = cashoutEvents[0] as ethers.EventLog;

          // Convert game properties using Number() directly
          const currentStep = Number(game.currentStep);
          const difficulty = Number(game.difficulty);

          // Safe formatEther with null checks
          const formatEtherSafe = (value: any) => {
            if (!value || value === null || value === undefined) return '0';
            try {
              return ethers.formatEther(value);
            } catch (error) {
              console.error('Error formatting ether value:', value, error);
              return '0';
            }
          };

          return {
            gameId: gameIdNumber,
            player: game.player || 'Unknown',
            difficulty: ['Easy', 'Medium', 'Hard'][difficulty] || 'Unknown',
            bet: formatEtherSafe(game.bet),
            result: (isLost ? 'loss' : 'win') as 'win' | 'loss',
            steps: currentStep,
            timestamp: Math.floor(Date.now() / 1000),
            transactionHash: event.transactionHash,
            payout: cashoutEvent && cashoutEvent.args?.payout ? formatEtherSafe(cashoutEvent.args.payout) : undefined,
            multiplier: cashoutEvent && cashoutEvent.args?.multiplier ? formatEtherSafe(cashoutEvent.args.multiplier) : undefined
          };
        } catch (error) {
          console.error('Error processing game event:', error);
          return null;
        }
      });

      const gameResults = await Promise.all(gamePromises);
      const validGames = gameResults.filter(game => game !== null) as GameRecord[];
      setGames(validGames.sort((a, b) => b.timestamp - a.timestamp));
      
      console.log(`Processed ${validGames.length} valid games`);
    } catch (error) {
      console.error('Error fetching game history:', error);
      setError('Failed to load game history');
    } finally {
      setLoading(false);
    }
  };

  // Refresh when contract changes or when manually triggered
  useEffect(() => {
    fetchGameHistory();
  }, [contract, refreshTrigger]);

  // Monitor game state changes and refresh when game ends
  useEffect(() => {
    if (gameState && !gameState.active && gameState.gameId > 0) {
      console.log('Game ended, refreshing game list in 3 seconds...');
      const timer = setTimeout(() => {
        refreshGameList();
      }, 3000); // Wait 3 seconds for events to be indexed

      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // Expose refresh function globally for debugging
  useEffect(() => {
    (window as any).refreshGameList = refreshGameList;
    return () => {
      delete (window as any).refreshGameList;
    };
  }, []);

  const handleDownloadGameData = async (gameId: number) => {
    try {
      const gameData = await getGameData(gameId);
      if (!gameData) {
        console.error('Game data not found on Akave');
        return;
      }

      // Create a blob with the game data
      const blob = new Blob([JSON.stringify(gameData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `game-${gameId}-summary.json`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading game data:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
              <History className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white">Last Played Games</h3>
          </div>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
              <History className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white">Last Played Games</h3>
          </div>
          <p className="text-red-400 text-center">{error}</p>
        </Card>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
              <History className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white">Last Played Games</h3>
          </div>
          <p className="text-white/60 text-center">No games played yet</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
            <History className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">Last Played Games on {chainConfig.displayName}</h3>
        </div>
        
        <div className="space-y-3">
          {games.map((game) => (
            <div
              key={game.gameId}
              className="p-4 rounded-lg border-2 border-white/20 bg-white/5 hover:bg-white/10 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {game.result === 'win' ? (
                    <Trophy className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span className="text-white font-medium">
                    Game #{game.gameId}
                  </span>
                </div>
                <span className={`text-sm font-medium ${
                  game.result === 'win' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {game.result === 'win' ? 'Won' : 'Lost'}
                </span>
              </div>
              <div className="text-sm text-blue-200 space-y-1">
                <div className="flex items-center gap-2">
                  <span>Player:</span>
                  <a 
                    href={`${chainConfig.blockscoutUrl}/address/${game.player}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {game.player.slice(0, 6)}...{game.player.slice(-4)}
                  </a>
                </div>
                <div>Difficulty: {game.difficulty}</div>
                <div>Bet: {game.bet} {chainConfig.currency}</div>
                <div>Steps: {game.steps}</div>
                {game.result === 'win' && (
                  <>
                    <div>Multiplier: {game.multiplier}x</div>
                    <div>Payout: {game.payout} {chainConfig.currency}</div>
                  </>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-white/60">
                    {new Date(game.timestamp).toLocaleString()}
                  </span>
                  {game.transactionHash && (
                    <a
                      href={`${chainConfig.blockscoutUrl}/tx/${game.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors text-xs"
                    >
                      View Transaction
                    </a>
                  )}
                </div>
              </div>
              <div className="mt-2">
                <button
                  onClick={() => handleDownloadGameData(game.gameId)}
                  className="px-2 py-1 text-xs bg-white/10 text-white/70 rounded hover:bg-white/20 hover:text-white/90 transition-colors border border-white/20"
                >
                  📄 Data
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default LastPlayedGames; 