import { Card } from '@/components/ui/card';
import { Trophy, XCircle, History } from 'lucide-react';
import { useGameContract } from '@/hooks/useGameContract';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import contractArtifact from '../../../contracts/artifacts/contracts/Game.sol/TrdelnikGame.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const CONTRACT_ABI = contractArtifact.abi;
const BLOCK_LIMIT = 30; // Maximum blocks per request
const BLOCKSCOUT_URL = import.meta.env.VITE_BLOCKSCOUT_URL_BASE;

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
  const [lastGames, setLastGames] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGameHistory = async () => {
      if (!window.ethereum) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

        // Get current block
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 1000);
        console.log('Fetching events from block:', fromBlock, 'to', currentBlock);

        // Fetch events in batches
        const fetchEventsInBatches = async (eventName: string) => {
          const events = [];
          let currentFromBlock = fromBlock;
          
          while (currentFromBlock < currentBlock) {
            const toBlock = Math.min(currentFromBlock + BLOCK_LIMIT - 1, currentBlock);
            console.log(`Fetching ${eventName} events from block ${currentFromBlock} to ${toBlock}`);
            
            try {
              const batchEvents = await contract.queryFilter(eventName, currentFromBlock, toBlock);
              events.push(...batchEvents);
            } catch (error) {
              console.error(`Error fetching ${eventName} events from block ${currentFromBlock} to ${toBlock}:`, error);
            }
            
            currentFromBlock = toBlock + 1;
          }
          
          return events;
        };

        // Fetch all events in batches
        const [gameStartedEvents, gameLostEvents, cashoutEvents] = await Promise.all([
          fetchEventsInBatches('GameStarted'),
          fetchEventsInBatches('GameLost'),
          fetchEventsInBatches('Cashout')
        ]);

        console.log('GameStarted events:', gameStartedEvents.length);
        console.log('GameLost events:', gameLostEvents.length);
        console.log('Cashout events:', cashoutEvents.length);

        // Combine and process events
        const games = new Map<number, GameRecord>();

        // Process GameStarted events
        for (const event of gameStartedEvents) {
          try {
            const typedEvent = event as ethers.EventLog;
            if (!typedEvent.args) continue;
            
            const [gameId, player, difficulty, bet] = typedEvent.args;
            if (!gameId || !player || difficulty === undefined || !bet) continue;

            const block = await event.getBlock();
            if (!block) continue;
            
            games.set(Number(gameId), {
              gameId: Number(gameId),
              player,
              difficulty: ['Easy', 'Medium', 'Hard', 'Hardcore'][Number(difficulty)],
              bet: ethers.formatEther(bet),
              result: 'loss', // Default to loss until we find a win
              timestamp: block.timestamp * 1000,
              steps: 1,
              transactionHash: event.transactionHash
            });
            console.log('Processed GameStarted:', Number(gameId));
          } catch (error) {
            console.error('Error processing GameStarted event:', error);
          }
        }

        // Process GameLost events
        for (const event of gameLostEvents) {
          try {
            const typedEvent = event as ethers.EventLog;
            if (!typedEvent.args) continue;
            
            const [gameId, step] = typedEvent.args;
            if (!gameId || step === undefined) continue;

            const game = games.get(Number(gameId));
            if (game) {
              game.result = 'loss';
              game.steps = Number(step);
              console.log('Processed GameLost:', Number(gameId));
            }
          } catch (error) {
            console.error('Error processing GameLost event:', error);
          }
        }

        // Process Cashout events
        for (const event of cashoutEvents) {
          try {
            const typedEvent = event as ethers.EventLog;
            if (!typedEvent.args) continue;
            
            const [gameId, payout] = typedEvent.args;
            if (!gameId || !payout) continue;

            const game = games.get(Number(gameId));
            if (game) {
              game.result = 'win';
              game.payout = ethers.formatEther(payout);
              game.multiplier = (Number(ethers.formatEther(payout)) / Number(game.bet)).toFixed(2);
              console.log('Processed Cashout:', Number(gameId));
            }
          } catch (error) {
            console.error('Error processing Cashout event:', error);
          }
        }

        // Convert to array and sort by timestamp
        const sortedGames = Array.from(games.values())
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5); // Keep only last 5 games

        console.log('Final processed games:', sortedGames);
        setLastGames(sortedGames);
      } catch (error) {
        console.error('Error fetching game history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
              <History className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white">Last Played Games</h3>
          </div>
          <p className="text-white/60 text-center">Loading game history...</p>
        </Card>
      </div>
    );
  }

  if (lastGames.length === 0) {
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
          <h3 className="text-xl font-semibold text-white">Last Played Games</h3>
        </div>
        
        <div className="space-y-3">
          {lastGames.map((game) => (
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
                    href={`${BLOCKSCOUT_URL}/address/${game.player}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {game.player.slice(0, 6)}...{game.player.slice(-4)}
                  </a>
                </div>
                <div>Difficulty: {game.difficulty}</div>
                <div>Bet: {game.bet} ETH</div>
                <div>Steps: {game.steps}</div>
                {game.result === 'win' && (
                  <>
                    <div>Multiplier: {game.multiplier}x</div>
                    <div>Payout: {game.payout} ETH</div>
                  </>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-white/60">
                    {new Date(game.timestamp).toLocaleString()}
                  </span>
                  {game.transactionHash && (
                    <a
                      href={`${BLOCKSCOUT_URL}/tx/${game.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors text-xs"
                    >
                      View Transaction
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default LastPlayedGames; 