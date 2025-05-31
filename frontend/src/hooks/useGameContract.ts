import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Difficulty, GAME_CONFIGS } from '@/components/GameBoard';
import { ethers } from 'ethers';
import contractArtifact from '../contracts/artifacts/Game.sol/TrdelnikGame.json';
// Import BerachainGame only if available, fallback to TrdelnikGame
let berachainContractArtifact: any;
try {
  berachainContractArtifact = require('../contracts/artifacts/BerachainGame.sol/BerachainGame.json');
  console.log('✅ BerachainGame artifact loaded successfully');
} catch (error) {
  console.warn('⚠️ BerachainGame artifact not found, using TrdelnikGame ABI for all chains');
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
  pendingRandomness?: boolean; // For BerachainGame
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

  // Check if current chain uses BerachainGame (with Pyth Entropy)
  const isBerachainGame = useCallback(() => {
    return chainConfig.id === 'berachain';
  }, [chainConfig.id]);

  // Get contract ABI based on chain
  const getContractABI = useCallback(() => {
    // For Berachain networks, use BerachainGame ABI
    if (isBerachainGame()) {
      console.log('🐻 Using BerachainGame ABI for Berachain');
      console.log('BerachainGame ABI functions:', berachainContractArtifact.abi.filter((item: any) => item.type === 'function').map((item: any) => item.name));
      return berachainContractArtifact.abi;
    }
    // For Flare networks (Coston2), use TrdelnikGame ABI
    console.log('🔥 Using TrdelnikGame ABI for Flare network');
    console.log('TrdelnikGame ABI functions:', contractArtifact.abi.filter((item: any) => item.type === 'function').map((item: any) => item.name));
    return contractArtifact.abi;
  }, [isBerachainGame]);

  // Initialize contract
  useEffect(() => {
    const initContract = async () => {
      if (!window.ethereum || !chainConfig.contractAddress) return;
      
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        let contractABI;
        let contractInstance;
        
        if (isBerachainGame()) {
          console.log('🐻 Using BerachainGame ABI for Berachain');
          contractABI = berachainContractArtifact.abi;
          contractInstance = new ethers.Contract(chainConfig.contractAddress, contractABI, signer);
          
          // Verify it has the expected functions
          const hasStartGameWithTwoParams = contractInstance.interface.hasFunction('startGame') && 
                                            contractInstance.interface.getFunction('startGame').inputs.length === 2;
          const hasGetEntropyFee = contractInstance.interface.hasFunction('getEntropyFee');
          const hasPlayStepWithTwoParams = contractInstance.interface.hasFunction('playStep') && 
                                           contractInstance.interface.getFunction('playStep').inputs.length === 2;
          
          console.log(`✅ BerachainGame ABI verification:`, {
            hasStartGameWithTwoParams,
            hasGetEntropyFee,
            hasPlayStepWithTwoParams
          });
          
          // Debug: Verifica se Pyth Entropy è configurato correttamente
          if (hasGetEntropyFee) {
            try {
              const entropyFee = await contractInstance.getEntropyFee();
              console.log(`💰 Entropy fee from contract: ${entropyFee} (${ethers.formatEther(entropyFee)} ${chainConfig.currency})`);
              
              // Se l'entropy fee è 0 o la chiamata fallisce, probabilmente entropy non è configurato
              if (entropyFee === 0n) {
                console.error(`❌ Entropy fee is 0 - Pyth Entropy likely not configured correctly in the deployed contract`);
              }
            } catch (entropyError) {
              console.error(`❌ Failed to get entropy fee - contract likely deployed with wrong Pyth Entropy addresses:`, entropyError);
              console.error(`🔧 You may need to redeploy BerachainGame with correct Pyth Entropy contract addresses`);
            }
          }
          
        } else {
          console.log('🔥 Using TrdelnikGame ABI for Flare network');
          contractABI = contractArtifact.abi;
          contractInstance = new ethers.Contract(chainConfig.contractAddress, contractABI, signer);
        }
        
        setContract(contractInstance);
      } catch (error) {
        console.error('Failed to initialize contract:', error);
      }
    };

    if (isConnected) {
      initContract();
    }
  }, [isConnected, chainConfig.contractAddress, isBerachainGame]);

  // Convert difficulty enum to contract format
  const difficultyToEnum = (difficulty: Difficulty): number => {
    const mapping = { Easy: 0, Medium: 1, Hard: 2, Hardcore: 3 };
    return mapping[difficulty];
  };

  // Generate random number for BerachainGame
  const generateUserRandomNumber = (): string => {
    return ethers.hexlify(ethers.randomBytes(32));
  };

  // Get entropy fee for BerachainGame
  const getEntropyFee = useCallback(async (): Promise<bigint> => {
    if (!contract) return 0n;
    
    try {
      // Check if the contract has the getEntropyFee function
      if (!contract.interface.hasFunction('getEntropyFee')) {
        console.log('⚠️ Contract does not have getEntropyFee function, assuming zero fee');
        return 0n;
      }
      
      const fee = await contract.getEntropyFee();
      return fee;
    } catch (error) {
      console.warn('Could not fetch entropy fee:', error);
      return 0n;
    }
  }, [contract]);

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
      
      const response = await fetch(`https://merits-staging.blockscout.com/partner/api/v1/distribute`, {
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
    console.log(`🎮 startGame called with:`, { difficulty, betAmount, typeof_betAmount: typeof betAmount });
    
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

    if (!contract) {
      toast({
        title: "Contract not initialized",
        description: "Please wait for contract initialization",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check wallet balance first
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(address!);
      console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} ${chainConfig.currency}`);
      
      // Check if contract exists at address
      const contractCode = await provider.getCode(chainConfig.contractAddress);
      console.log(`🏗️ Contract address: ${chainConfig.contractAddress}`);
      console.log(`📋 Contract code length: ${contractCode.length} (${contractCode === '0x' ? 'NO CONTRACT' : 'CONTRACT EXISTS'})`);
      
      let tx;
      let actualBetAmount = betAmount;
      
      // Check if contract has BerachainGame signature (2 parameters)
      const startGameFragment = contract.interface.getFunction('startGame');
      const isBerachainContract = startGameFragment.inputs.length === 2;
      
      console.log(`🔍 Contract analysis:`, {
        isBerachainContract,
        fragmentInputs: startGameFragment.inputs.length,
        hasGetEntropyFee: contract.interface.hasFunction('getEntropyFee')
      });
      
      if (isBerachainContract) {
        console.log('🐻 Using BerachainGame startGame(difficulty, userRandomNumber)');
        // BerachainGame: startGame(difficulty, userRandomNumber) + entropy fee
        const userRandomNumber = generateUserRandomNumber();
        console.log(`Generated userRandomNumber: ${userRandomNumber}`);
        
        const entropyFee = await getEntropyFee();
        console.log(`Entropy fee from contract: ${entropyFee} (${ethers.formatEther(entropyFee)} ${chainConfig.currency})`);
        
        const betValue = ethers.parseEther(betAmount);
        console.log(`Bet value: ${betValue} (${ethers.formatEther(betValue)} ${chainConfig.currency})`);
        
        const totalValue = betValue + entropyFee;
        console.log(`Total value calculation: ${betValue} + ${entropyFee} = ${totalValue} (${ethers.formatEther(totalValue)} ${chainConfig.currency})`);
        
        // Verify we have enough balance
        if (balance < totalValue) {
          console.error(`❌ Insufficient balance! Have: ${ethers.formatEther(balance)} ${chainConfig.currency}, Need: ${ethers.formatEther(totalValue)} ${chainConfig.currency}`);
          throw new Error(`Insufficient balance. Need ${ethers.formatEther(totalValue)} ${chainConfig.currency}, have ${ethers.formatEther(balance)} ${chainConfig.currency}`);
        }
        
        // Check contract requirements: msg.value > entropyFee
        if (totalValue <= entropyFee) {
          console.error(`❌ Contract requirement failed! Total value (${ethers.formatEther(totalValue)}) must be > entropy fee (${ethers.formatEther(entropyFee)})`);
          throw new Error(`Bet amount too small. Must be greater than entropy fee of ${ethers.formatEther(entropyFee)} ${chainConfig.currency}`);
        }
        
        console.log(`BerachainGame - Bet: ${betAmount} ${chainConfig.currency}, Entropy Fee: ${ethers.formatEther(entropyFee)} ${chainConfig.currency}, Total: ${ethers.formatEther(totalValue)} ${chainConfig.currency}`);
        
        console.log(`About to call contract.startGame with:`, {
          difficulty: difficultyToEnum(difficulty),
          userRandomNumber,
          value: totalValue.toString()
        });
        
        // Try to estimate gas first
        try {
          const gasEstimate = await contract.startGame.estimateGas(difficultyToEnum(difficulty), userRandomNumber, {
            value: totalValue
          });
          console.log(`⛽ Gas estimate: ${gasEstimate.toString()}`);
        } catch (estimateError) {
          console.error(`❌ Gas estimation failed:`, estimateError);
          throw new Error(`Transaction will fail: ${estimateError.message}`);
        }
        
        tx = await contract.startGame(difficultyToEnum(difficulty), userRandomNumber, {
          value: totalValue
        });
        
        // Actual bet is the amount minus entropy fee
        actualBetAmount = ethers.formatEther(betValue);
      } else {
        console.log('🎲 Using TrdelnikGame startGame(difficulty)');
        
        const betValueWei = ethers.parseEther(betAmount);
        console.log(`💰 Bet amount input: "${betAmount}"`);
        console.log(`💰 Parsed bet value: ${betValueWei.toString()} wei (${ethers.formatEther(betValueWei)} ${chainConfig.currency})`);
        
        console.log(`About to call contract.startGame with:`, {
          difficulty: difficultyToEnum(difficulty),
          value: betValueWei.toString()
        });
        
        // TrdelnikGame: startGame(difficulty)
        tx = await contract.startGame(difficultyToEnum(difficulty), {
          value: betValueWei
        });
      }
      
      console.log(`🚀 Transaction sent:`, tx);
      console.log(`📋 Transaction hash: ${tx.hash}`);
      console.log(`🔗 View on block explorer: ${chainConfig.blockscoutUrl}/tx/${tx.hash}`);
      
      const receipt = await tx.wait();
      
      console.log(`📊 Transaction status: ${receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
      console.log(`💸 Effective gas price: ${receipt.gasPrice?.toString()}`);
      console.log(`💰 Value sent: ${tx.value.toString()} wei (${ethers.formatEther(tx.value)} ${chainConfig.currency})`);
      console.log(`📋 Block number: ${receipt.blockNumber}`);
      console.log(`📧 Full receipt:`, receipt);

      // Debug: Parse all logs to see what events were emitted
      const parsedLogs = receipt.logs.map((log, index) => {
        try {
          const parsed = contract.interface.parseLog(log);
          console.log(`✅ Event ${index}:`, {
            name: parsed?.name,
            args: parsed?.args,
            fragment: parsed?.fragment?.name
          });
          return parsed;
        } catch (error) {
          console.log(`❌ Could not parse log ${index}:`, log);
          return null;
        }
      }).filter(Boolean);
      
      console.log(`🔍 All parsed events:`, parsedLogs);

      // Get the gameId from the GameStarted event
      const gameStartedEvent = receipt.logs.find(
        (log: any) => log.fragment?.name === 'GameStarted'
      );

      if (!gameStartedEvent) {
        // Try alternative event names or look for any event with gameId
        const alternativeEvent = parsedLogs.find(event => 
          event?.name === 'GameStarted' || 
          event?.name === 'GameCreated' || 
          event?.name === 'NewGame' ||
          (event?.args && event.args[0] !== undefined) // Any event with first argument (likely gameId)
        );
        
        console.log(`🔍 Alternative event found:`, alternativeEvent);
        
        if (alternativeEvent) {
          const gameId = alternativeEvent.args[0];
          console.log(`🎮 Using gameId from alternative event: ${gameId}`);
          
          setGameState({
            gameId: Number(gameId),
            active: true,
            lost: false,
            currentStep: 1,
            bet: actualBetAmount,
            difficulty: difficulty.toString(),
            multiplier: getCurrentMultiplier().toFixed(2),
            payout: '0',
            pendingRandomness: isBerachainContract ? false : undefined,
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
          
          return; // Exit successfully
        }
        
        throw new Error('GameStarted event not found');
      }
      
      const gameId = gameStartedEvent.args[0];
      
      setGameState({
        gameId: Number(gameId),
        active: true,
        lost: false,
        currentStep: 1, // First step completed automatically
        bet: actualBetAmount,
        difficulty: difficulty.toString(),
        multiplier: getCurrentMultiplier().toFixed(2),
        payout: '0',
        pendingRandomness: isBerachainContract ? false : undefined, // BerachainGame starts with false since first step is processed
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
  }, [address, chainConfig, getCurrentMultiplier, getEntropyFee, contract]);

  // Play next step
  const playStep = useCallback(async () => {
    if (!gameState?.gameId || !chainConfig.contractAddress || !contract) return;
    
    // Check if contract has BerachainGame signature
    const playStepFragment = contract.interface.getFunction('playStep');
    const isBerachainContract = playStepFragment.inputs.length === 2; // BerachainGame has (gameId, userRandomNumber)
    
    // Check if BerachainGame is pending randomness
    if (isBerachainContract && gameState.pendingRandomness) {
      toast({
        title: "Step in progress",
        description: "Please wait for the current step to complete",
        variant: "default",
      });
      return;
    }

    setIsLoading(true);

    try {
      let tx;
      
      if (isBerachainContract) {
        console.log('🐻 Using BerachainGame playStep(gameId, userRandomNumber)');
        // BerachainGame: playStep(gameId, userRandomNumber) + entropy fee
        const userRandomNumber = generateUserRandomNumber();
        const entropyFee = await getEntropyFee();
        
        console.log(`BerachainGame playStep - Entropy Fee: ${ethers.formatEther(entropyFee)} ${chainConfig.currency}`);
        
        // Set pending state for BerachainGame
        setGameState(prev => prev ? { ...prev, pendingRandomness: true } : null);
        
        tx = await contract.playStep(gameState.gameId, userRandomNumber, {
          value: entropyFee
        });
      } else {
        console.log('🎲 Using TrdelnikGame playStep(gameId)');
        // TrdelnikGame: playStep(gameId)
        tx = await contract.playStep(gameState.gameId);
      }
      
      const receipt = await tx.wait();

      // For TrdelnikGame, process result immediately
      // For BerachainGame, result will come via callback (we should listen for events)
      if (!isBerachainContract) {
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
      } else {
        // BerachainGame - show transaction sent, result will come later
        toast({
          title: "Step Requested! ⏳",
          description: `Waiting for Pyth Entropy callback...<br/>View on <a href="${chainConfig.blockscoutUrl}/tx/${receipt.hash}" target="_blank" rel="noopener noreferrer">Blockscout</a>`,
          variant: "default",
        });
      }

    } catch (error: any) {
      console.error('Failed to play step:', error);
      
      // Reset pending state on error
      if (isBerachainContract) {
        setGameState(prev => prev ? { ...prev, pendingRandomness: false } : null);
      }
      
      toast({
        title: "Failed to play step",
        description: error.message || "Transaction failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [gameState, chainConfig, address, saveGameData, getEntropyFee, contract]);

  // Cash out current winnings
  const cashOut = useCallback(async () => {
    if (!gameState?.gameId || !chainConfig.contractAddress || !contract) return;
    
    // Check if contract has BerachainGame signature for pending randomness check
    const playStepFragment = contract.interface.getFunction('playStep');
    const isBerachainContract = playStepFragment.inputs.length === 2;
    
    // Check if BerachainGame is pending randomness
    if (isBerachainContract && gameState.pendingRandomness) {
      toast({
        title: "Cannot cash out",
        description: "Please wait for the current step to complete",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
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
  }, [gameState, getCurrentMultiplier, chainConfig, address, saveGameData, contract]);

  return {
    gameState,
    isLoading,
    startGame,
    playStep,
    cashOut,
    getCurrentMultiplier,
    contract,
    chainConfig,
    isBerachainGame: isBerachainGame(),
    getEntropyFee,
  };
};