import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Difficulty, GAME_CONFIGS } from '@/components/GameBoard';
import { ethers } from 'ethers';
import contractArtifact from '../contracts/artifacts/contracts/Game.sol/TrdelnikGame.json';
// Import BerachainGame only if available, fallback to TrdelnikGame
let berachainContractArtifact: any;
try {
  berachainContractArtifact = require('../contracts/artifacts/contracts/BerachainGame.sol/BerachainGame.json');
} catch (error) {
  console.warn('BerachainGame artifact not found, using TrdelnikGame ABI for all chains');
  berachainContractArtifact = contractArtifact;
}
import { useWallet } from './useWallet';
import { useAkave } from './useAkave';
import { useChain } from './useChain';

export interface GameState {
  gameId: number;
  active: boolean;
  lost: boolean;
  currentStep: number;
  bet: string;
  difficulty: string;
  multiplier: string;
  payout: string;
  stepHistory?: Array<{
    step: number;
    success: boolean;
    timestamp: number;
  }>;
}

export const useGameContract = (onMeritsDistributed?: () => void) => {
  const { isConnected, address } = useWallet();
  const { saveGameData } = useAkave();
  const { chainConfig } = useChain();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  // Get contract ABI based on chain
  const getContractABI = useCallback(() => {
    // For Berachain networks, use BerachainGame ABI
    if (chainConfig.id === 'berachain') {
      return berachainContractArtifact.abi;
    }
    // For Flare networks (Coston2), use TrdelnikGame ABI
    return contractArtifact.abi;
  }, [chainConfig.id]);

  // Initialize contract
  useEffect(() => {
    const initContract = async () => {
      if (!window.ethereum || !chainConfig.contractAddress) return;
      
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contractABI = getContractABI();
        const contractInstance = new ethers.Contract(chainConfig.contractAddress, contractABI, signer);
        setContract(contractInstance);
      } catch (error) {
        console.error('Failed to initialize contract:', error);
      }
    };

    if (isConnected) {
      initContract();
    }
  }, [isConnected, chainConfig.contractAddress, getContractABI]);

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
      const meritsApiKey = import.meta.env.VITE_MERITS_API_KEY;
      
      const response = await fetch(`${chainConfig.meritsApiUrl}/partner/api/v1/distribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': meritsApiKey || '',
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

    if (!chainConfig.contractAddress) {
      toast({
        title: "Contract not configured",
        description: `Please configure the contract address for ${chainConfig.displayName}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractABI = getContractABI();
      const contract = new ethers.Contract(chainConfig.contractAddress, contractABI, signer);
      
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
        payout: '0',
        stepHistory: [{
          step: 1,
          success: true,
          timestamp: Math.floor(Date.now() / 1000)
        }]
      });

      // Distribute Merits
      if (address) {
        await distributeMerits(address);
      }

      toast({
        title: "Game Started!",
        description: `Game ID: ${gameId}<br/>View on <a href="${chainConfig.blockscoutUrl}/tx/${receipt.hash}" target="_blank" rel="noopener noreferrer">Blockscout</a>`,
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
  }, [address, chainConfig, getContractABI, getCurrentMultiplier]);

  // Play next step
  const playStep = useCallback(async () => {
    if (!gameState?.gameId || !chainConfig.contractAddress) return;

    setIsLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractABI = getContractABI();
      const contract = new ethers.Contract(chainConfig.contractAddress, contractABI, signer);
      
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
        const newStepHistoryEntry = {
          step: newStep,
          success: true,
          timestamp: Math.floor(Date.now() / 1000)
        };

        setGameState(prev => prev ? { 
          ...prev, 
          currentStep: newStep,
          stepHistory: [...(prev.stepHistory || []), newStepHistoryEntry]
        } : null);
        
        toast({
          title: "Step Successful! 🎉",
          description: `Advanced to step ${newStep}<br/>View on <a href="${chainConfig.blockscoutUrl}/tx/${receipt.hash}" target="_blank" rel="noopener noreferrer">Blockscout</a>`,
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
        const failedStepEntry = {
          step: gameState.currentStep + 1,
          success: false,
          timestamp: Math.floor(Date.now() / 1000)
        };

        const updatedStepHistory = [...(gameState.stepHistory || []), failedStepEntry];

        setGameState(prev => prev ? { 
          ...prev, 
          active: false, 
          lost: true,
          stepHistory: updatedStepHistory
        } : null);

        // Save game summary to Akave (loss)
        try {
          const gameDataToSave = {
            gameId: gameState.gameId,
            player: address || 'Unknown',
            difficulty: gameState.difficulty,
            bet: gameState.bet,
            result: 'loss' as const,
            steps: gameState.currentStep,
            timestamp: Math.floor(Date.now() / 1000),
            stepHistory: updatedStepHistory,
            transactionHash: receipt.hash,
            payout: '0',
            multiplier: '0',
            chain: chainConfig.displayName,
            chainId: chainConfig.chainId
          };

          await saveGameData(gameDataToSave);
          console.log('Game loss summary uploaded to Akave successfully');
        } catch (akaveError) {
          console.error('Failed to upload game loss summary to Akave:', akaveError);
          // Don't show error to user, just log it
        }
        
        toast({
          title: "Game Over! 💥",
          description: `You lost this round. Better luck next time!<br/>View on <a href="${chainConfig.blockscoutUrl}/tx/${receipt.hash}" target="_blank" rel="noopener noreferrer">Blockscout</a>`,
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
  }, [gameState, chainConfig, getContractABI, address, saveGameData]);

  // Cash out current winnings
  const cashOut = useCallback(async () => {
    if (!gameState?.gameId || !chainConfig.contractAddress) return;

    setIsLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractABI = getContractABI();
      const contract = new ethers.Contract(chainConfig.contractAddress, contractABI, signer);
      
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

      // Save game summary to Akave
      try {
        const gameDataToSave = {
          gameId: gameState.gameId,
          player: address || 'Unknown',
          difficulty: gameState.difficulty,
          bet: gameState.bet,
          result: 'win' as const,
          steps: gameState.currentStep,
          timestamp: Math.floor(Date.now() / 1000),
          stepHistory: gameState.stepHistory || [],
          transactionHash: receipt.hash,
          payout: payout,
          multiplier: finalMultiplier.toFixed(2),
          chain: chainConfig.displayName,
          chainId: chainConfig.chainId
        };

        await saveGameData(gameDataToSave);
        console.log('Game summary uploaded to Akave successfully');
      } catch (akaveError) {
        console.error('Failed to upload game summary to Akave:', akaveError);
        // Don't show error to user, just log it
      }

      toast({
        title: "Successfully Cashed Out! 💰",
        description: `You won ${payout} ${chainConfig.currency} (${finalMultiplier.toFixed(2)}x multiplier)<br/>View on <a href="${chainConfig.blockscoutUrl}/tx/${receipt.hash}" target="_blank" rel="noopener noreferrer">Blockscout</a>`,
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
  }, [gameState, getCurrentMultiplier, chainConfig, getContractABI, address, saveGameData]);

  return {
    gameState,
    isLoading,
    startGame,
    playStep,
    cashOut,
    getCurrentMultiplier,
    contract,
    chainConfig,
  };
};
