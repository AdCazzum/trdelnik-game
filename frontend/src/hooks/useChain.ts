import { useState, useEffect, useCallback } from 'react';
import { ChainConfig, SUPPORTED_CHAINS, DEFAULT_CHAIN, getChainConfig, getChainByChainId } from '@/config/chains';
import { toast } from '@/hooks/use-toast';

export const useChain = () => {
  const [currentChain, setCurrentChain] = useState<string>(DEFAULT_CHAIN);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved chain from localStorage on mount
  useEffect(() => {
    const savedChain = localStorage.getItem('selected-chain');
    if (savedChain && SUPPORTED_CHAINS[savedChain]) {
      setCurrentChain(savedChain);
    }
  }, []);

  // Get current chain config
  const getChainConfig = useCallback((): ChainConfig => {
    return SUPPORTED_CHAINS[currentChain];
  }, [currentChain]);

  // Switch to a different chain
  const switchChain = useCallback(async (chainId: string) => {
    if (!SUPPORTED_CHAINS[chainId]) {
      toast({
        title: "Unsupported Chain",
        description: `Chain ${chainId} is not supported`,
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    const chainConfig = SUPPORTED_CHAINS[chainId];

    try {
      // Check if MetaMask is available
      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }

      // Try to switch network in MetaMask
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainConfig.chainId.toString(16)}` }],
        });
      } catch (switchError: any) {
        // If the chain is not added to MetaMask, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${chainConfig.chainId.toString(16)}`,
                chainName: chainConfig.displayName,
                nativeCurrency: {
                  name: chainConfig.currency,
                  symbol: chainConfig.currency,
                  decimals: 18,
                },
                rpcUrls: [chainConfig.rpcUrl],
                blockExplorerUrls: [chainConfig.blockscoutUrl],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }

      // Update local state and storage
      setCurrentChain(chainId);
      localStorage.setItem('selected-chain', chainId);

      toast({
        title: "Chain Switched! 🎉",
        description: `Successfully switched to ${chainConfig.displayName}`,
        variant: "default",
      });

      return true;

    } catch (error: any) {
      console.error('Failed to switch chain:', error);
      toast({
        title: "Failed to switch chain",
        description: error.message || "Failed to switch network in MetaMask",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if current MetaMask network matches selected chain
  const checkNetworkMatch = useCallback(async (): Promise<boolean> => {
    if (!window.ethereum) return false;

    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentMetaMaskChainId = parseInt(chainId, 16);
      const expectedChainId = getChainConfig().chainId;
      
      return currentMetaMaskChainId === expectedChainId;
    } catch (error) {
      console.error('Failed to check network:', error);
      return false;
    }
  }, [getChainConfig]);

  // Listen for network changes in MetaMask
  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = (chainId: string) => {
      const newChainId = parseInt(chainId, 16);
      const matchingChain = getChainByChainId(newChainId);
      
      if (matchingChain && matchingChain.id !== currentChain) {
        setCurrentChain(matchingChain.id);
        localStorage.setItem('selected-chain', matchingChain.id);
        
        toast({
          title: "Network Changed",
          description: `Switched to ${matchingChain.displayName}`,
          variant: "default",
        });
      }
    };

    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [currentChain]);

  return {
    currentChain,
    chainConfig: getChainConfig(),
    supportedChains: Object.values(SUPPORTED_CHAINS),
    isLoading,
    switchChain,
    checkNetworkMatch,
  };
}; 