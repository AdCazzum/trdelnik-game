
import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Difficulty, GAME_CONFIGS } from '@/components/GameBoard';

// TODO: Replace with actual contract address when deployed
const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'; // PLACEHOLDER

// TODO: Replace with actual contract ABI
const CONTRACT_ABI = [
  // Placeholder ABI - replace with actual contract ABI
  {
    "inputs": [{"name": "difficulty", "type": "uint8"}],
    "name": "startGame",
    "outputs": [{"name": "gameId", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"name": "gameId", "type": "uint256"}],
    "name": "playStep",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "gameId", "type": "uint256"}],
    "name": "cashout",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

interface GameState {
  gameId?: number;
  active: boolean;
  lost: boolean;
  currentStep: number;
  bet: string;
  difficulty: Difficulty;
}

export const useGameContract = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Convert difficulty enum to contract format
  const difficultyToEnum = (difficulty: Difficulty): number => {
    const mapping = { Easy: 0, Medium: 1, Hard: 2, Hardcore: 3 };
    return mapping[difficulty];
  };

  // Calculate current multiplier based on difficulty and step
  const getCurrentMultiplier = useCallback((): number => {
    if (!gameState || gameState.currentStep === 0) return 1;
    
    const config = GAME_CONFIGS[gameState.difficulty];
    return Math.pow(config.startMultiplier, gameState.currentStep);
  }, [gameState]);

  // Start a new game
  const startGame = async (difficulty: Difficulty, betAmount: string) => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask to play",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with actual contract interaction
      console.log('Starting game with:', { difficulty, betAmount, contractAddress: CONTRACT_ADDRESS });
      
      // Simulate contract call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // TODO: Replace with actual contract call
      // const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      // const tx = await contract.startGame(difficultyToEnum(difficulty), {
      //   value: ethers.utils.parseEther(betAmount)
      // });
      // await tx.wait();

      // Simulate successful game start
      const mockGameId = Math.floor(Math.random() * 10000);
      
      setGameState({
        gameId: mockGameId,
        active: true,
        lost: false,
        currentStep: 1, // First step completed automatically
        bet: betAmount,
        difficulty
      });

      toast({
        title: "Game Started!",
        description: `Game ID: ${mockGameId} - First step completed!`,
      });

    } catch (error: any) {
      console.error('Failed to start game:', error);
      toast({
        title: "Failed to start game",
        description: error.message || "Transaction failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Play next step
  const playStep = async () => {
    if (!gameState?.gameId) return;

    setIsLoading(true);

    try {
      // TODO: Replace with actual contract interaction
      console.log('Playing step for game:', gameState.gameId);
      
      // Simulate contract call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // TODO: Replace with actual contract call
      // const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      // await contract.playStep(gameState.gameId);

      // Simulate step result based on difficulty probability
      const config = GAME_CONFIGS[gameState.difficulty];
      const success = Math.random() * 100 < config.winProbability;

      if (success) {
        const newStep = gameState.currentStep + 1;
        setGameState(prev => prev ? { ...prev, currentStep: newStep } : null);
        
        toast({
          title: "Step Successful! 🎉",
          description: `Advanced to step ${newStep}`,
        });

        // Check if reached max steps
        if (newStep >= config.maxSteps) {
          toast({
            title: "Maximum Steps Reached!",
            description: "Auto-cashing out your winnings!",
          });
          // Auto cash out would happen here
        }
      } else {
        setGameState(prev => prev ? { ...prev, active: false, lost: true } : null);
        
        toast({
          title: "Game Over! 💥",
          description: "You lost this round. Better luck next time!",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Failed to play step:', error);
      toast({
        title: "Failed to play step",
        description: error.message || "Transaction failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cash out current winnings
  const cashOut = async () => {
    if (!gameState?.gameId) return;

    setIsLoading(true);

    try {
      // TODO: Replace with actual contract interaction
      console.log('Cashing out game:', gameState.gameId);
      
      // Simulate contract call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // TODO: Replace with actual contract call
      // const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      // await contract.cashout(gameState.gameId);

      const finalMultiplier = getCurrentMultiplier();
      const winnings = (parseFloat(gameState.bet) * finalMultiplier).toFixed(4);

      setGameState(prev => prev ? { ...prev, active: false } : null);

      toast({
        title: "Successfully Cashed Out! 💰",
        description: `You won ${winnings} ETH (${finalMultiplier.toFixed(2)}x multiplier)`,
      });

    } catch (error: any) {
      console.error('Failed to cash out:', error);
      toast({
        title: "Failed to cash out",
        description: error.message || "Transaction failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    gameState,
    isLoading,
    startGame,
    playStep,
    cashOut,
    getCurrentMultiplier,
  };
};
