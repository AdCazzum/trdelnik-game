import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Difficulty, GAME_CONFIGS } from '@/components/GameBoard';
import { ethers } from 'ethers';
import contractArtifact from '../../../contracts/artifacts/contracts/Game.sol/TrdelnikGame.json';
import { useWallet } from './useWallet';

// const CONTRACT_ADDRESS = '0xefAB5594DB78bE844AEEED30a0C50333bacB7261';
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const CONTRACT_ABI = contractArtifact.abi;
const BLOCKSCOUT_URL = import.meta.env.VITE_BLOCKSCOUT_URL || 'https://blockscout.com/astar/tx/';
const MERITS_API_URL = import.meta.env.VITE_MERITS_API_PARTNER_URL || 'https://merits-staging.blockscout.com/api/v1';
const MERITS_API_KEY = import.meta.env.VITE_MERITS_API_KEY;

export interface GameState {
  gameId: number;
  active: boolean;
  lost: boolean;
  currentStep: number;
  bet: string;
  difficulty: string;
  multiplier: string;
  payout: string;
}

export const useGameContract = (onMeritsDistributed?: () => void) => {
  const { isConnected, address } = useWallet();
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

  // Distribute Merits
  const distributeMerits = async (address: string) => {
    try {
      const response = await fetch(`${MERITS_API_URL}/partner/api/v1/distribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': MERITS_API_KEY || '',
        },
        body: JSON.stringify({
          id: `trdelnik_game-${Date.now()}`,
          description: "Merits reward for playing Trdelnik Game",
          distributions: [
            {
              address,
              amount: "1"
            }
          ],
          create_missing_accounts: false,
          expected_total: "1"
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to distribute Merits: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Merits distributed:', data);

      // Show success toast
      toast({
        title: "Merits Earned! 🎉",
        description: "You've earned 1 Merit for playing Trdelnik Game",
        variant: "default",
      });

      // Call the callback to refresh Merits data
      onMeritsDistributed?.();

    } catch (error) {
      console.error('Failed to distribute Merits:', error);
      toast({
        title: "Failed to distribute Merits",
        description: "Don't worry, you can still play the game!",
        variant: "destructive",
      });
    }
  };

  // Start a new game
  const startGame = useCallback(async (difficulty: Difficulty, betAmount: string) => {
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
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const tx = await contract.startGame(difficultyToEnum(difficulty), {
        value: ethers.parseEther(betAmount)
      });
      
      const receipt = await tx.wait();

      // Get the gameId from the GameStarted event
      const gameStartedEvent = receipt.logs.find(
        (log: any) => log.fragment?.name === 'GameStarted'
      );

      if (!gameStartedEvent) {
        throw new Error('GameStarted event not found');
      }
      
      const gameId = gameStartedEvent.args[0];
      
      setGameState({
        gameId: Number(gameId),
        active: true,
        lost: false,
        currentStep: 1, // First step completed automatically
        bet: betAmount,
        difficulty: difficulty.toString(),
        multiplier: getCurrentMultiplier().toFixed(2),
        payout: '0'
      });

      // Distribute Merits
      if (address) {
        await distributeMerits(address);
      }

      toast({
        title: "Game Started!",
        description: `Game ID: ${gameId}<br/>View on <a href="${BLOCKSCOUT_URL}${receipt.hash}" target="_blank" rel="noopener noreferrer">Blockscout</a>`,
        variant: "default",
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
  }, [address]);

  // Play next step
  const playStep = useCallback(async () => {
    if (!gameState?.gameId) return;

    setIsLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const tx = await contract.playStep(gameState.gameId);
      const receipt = await tx.wait();

      // Get the step result from the StepResult event
      const stepResultEvent = receipt.logs.find(
        (log: any) => log.fragment?.name === 'StepResult'
      );

      if (!stepResultEvent) {
        throw new Error('StepResult event not found');
      }
      
      const success = stepResultEvent.args[2];
      
      if (success) {
        const newStep = gameState.currentStep + 1;
        setGameState(prev => prev ? { ...prev, currentStep: newStep } : null);
        
        toast({
          title: "Step Successful! 🎉",
          description: `Advanced to step ${newStep}<br/>View on <a href="${BLOCKSCOUT_URL}${receipt.hash}" target="_blank" rel="noopener noreferrer">Blockscout</a>`,
          variant: "default",
        });

        // Check if reached max steps
        const config = GAME_CONFIGS[gameState.difficulty];
        if (newStep >= config.maxSteps) {
          toast({
            title: "Maximum Steps Reached!",
            description: "Auto-cashing out your winnings!",
          });
          await cashOut();
        }
      } else {
        setGameState(prev => prev ? { ...prev, active: false, lost: true } : null);
        
        toast({
          title: "Game Over! 💥",
          description: `You lost this round. Better luck next time!<br/>View on <a href="${BLOCKSCOUT_URL}${receipt.hash}" target="_blank" rel="noopener noreferrer">Blockscout</a>`,
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
  }, [gameState]);

  // Cash out current winnings
  const cashOut = useCallback(async () => {
    if (!gameState?.gameId) return;

    setIsLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const tx = await contract.doCashout(gameState.gameId);
      const receipt = await tx.wait();

      // Get the payout from the Cashout event
      const cashoutEvent = receipt.logs.find(
        (log: any) => log.fragment?.name === 'Cashout'
      );

      if (!cashoutEvent) {
        throw new Error('Cashout event not found');
      }
      
      const payout = ethers.formatEther(cashoutEvent.args[1]);
      const finalMultiplier = getCurrentMultiplier();

      setGameState(prev => prev ? { ...prev, active: false } : null);

      toast({
        title: "Successfully Cashed Out! 💰",
        description: `You won ${payout} ETH (${finalMultiplier.toFixed(2)}x multiplier)<br/>View on <a href="${BLOCKSCOUT_URL}${receipt.hash}" target="_blank" rel="noopener noreferrer">Blockscout</a>`,
        variant: "default",
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
  }, [gameState, getCurrentMultiplier]);

  return {
    gameState,
    isLoading,
    startGame,
    playStep,
    cashOut,
    getCurrentMultiplier,
  };
};
