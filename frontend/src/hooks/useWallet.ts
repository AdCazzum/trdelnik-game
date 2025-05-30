
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  isLoading: boolean;
  isInitialized: boolean;
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    isLoading: false,
    isInitialized: false,
  });

  console.log('useWallet - current state:', walletState);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // Get balance for an address
  const getBalance = async (address: string) => {
    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    });
    return (parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4);
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    console.log('connectWallet called');
    
    if (!isMetaMaskInstalled()) {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask to play the game",
        variant: "destructive",
      });
      return;
    }

    setWalletState(prev => ({ ...prev, isLoading: true }));

    try {
      console.log('Requesting accounts...');
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      console.log('Accounts received:', accounts);

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      const balanceInEth = await getBalance(address);

      console.log('Setting wallet state - connected:', address, balanceInEth);

      setWalletState({
        isConnected: true,
        address,
        balance: balanceInEth,
        isLoading: false,
        isInitialized: true,
      });

      toast({
        title: "Wallet Connected!",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });

    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      setWalletState(prev => ({ 
        ...prev, 
        isLoading: false,
        isInitialized: true 
      }));
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to MetaMask",
        variant: "destructive",
      });
    }
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    console.log('disconnectWallet called');
    
    try {
      // Try to revoke permissions if the method is available
      if (window.ethereum && window.ethereum.request) {
        try {
          await window.ethereum.request({
            method: "wallet_revokePermissions",
            params: [
              {
                eth_accounts: {}
              }
            ]
          });
        } catch (revokeError) {
          console.log('wallet_revokePermissions not supported or failed:', revokeError);
          // If revokePermissions is not supported, we'll still update local state
        }
      }
    } catch (error) {
      console.error('Error during disconnect:', error);
    }

    // Always update local state regardless of MetaMask response
    setWalletState({
      isConnected: false,
      address: null,
      balance: null,
      isLoading: false,
      isInitialized: true,
    });

    toast({
      title: "Wallet Disconnected",
      description: "You've been disconnected from MetaMask",
    });
  };

  // Handle account changes
  const handleAccountsChanged = async (accounts: string[]) => {
    console.log('Accounts changed:', accounts);
    if (accounts.length === 0) {
      // User disconnected from MetaMask
      setWalletState(prev => ({
        ...prev,
        isConnected: false,
        address: null,
        balance: null,
      }));
      toast({
        title: "Wallet Disconnected",
        description: "MetaMask was disconnected",
      });
    } else {
      // User switched accounts
      const address = accounts[0];
      const balanceInEth = await getBalance(address);
      setWalletState(prev => ({
        ...prev,
        isConnected: true,
        address,
        balance: balanceInEth,
      }));
      toast({
        title: "Account Changed",
        description: `Switched to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    }
  };

  // Check connection on load and setup event listeners
  useEffect(() => {
    const checkConnection = async () => {
      console.log('Checking existing connection...');
      if (isMetaMaskInstalled()) {
        try {
          // Setup event listeners
          window.ethereum.on('accountsChanged', handleAccountsChanged);
          
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });
          
          console.log('Existing accounts:', accounts);
          
          if (accounts.length > 0) {
            const address = accounts[0];
            const balanceInEth = await getBalance(address);
            
            console.log('Auto-connecting to existing account:', address);
            
            setWalletState({
              isConnected: true,
              address,
              balance: balanceInEth,
              isLoading: false,
              isInitialized: true,
            });
          } else {
            setWalletState(prev => ({ ...prev, isInitialized: true }));
          }
        } catch (error) {
          console.error('Failed to check wallet connection:', error);
          setWalletState(prev => ({ ...prev, isInitialized: true }));
        }
      } else {
        setWalletState(prev => ({ ...prev, isInitialized: true }));
      }
    };

    checkConnection();

    // Cleanup event listeners
    return () => {
      if (isMetaMaskInstalled() && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    isMetaMaskInstalled,
  };
};
