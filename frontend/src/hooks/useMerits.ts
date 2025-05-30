import { useState, useEffect } from 'react';
import { useWallet } from './useWallet';

const MERITS_API_URL = 'https://merits-staging.blockscout.com/api/v1';
const MERITS_PARTNER_API_URL = 'https://merits-staging.blockscout.com/partner/api/v1';

interface MeritsState {
  isRegistered: boolean;
  rank?: number;
  totalBalance?: number;
  usersBelow?: number;
  topPercent?: number;
}

export const useMerits = () => {
  const { address, signer } = useWallet();
  const [meritsState, setMeritsState] = useState<MeritsState>({ isRegistered: false });
  const [isLoading, setIsLoading] = useState(false);

  const getNonce = async () => {
    const response = await fetch(`${MERITS_API_URL}/auth/nonce`);
    const data = await response.json();
    return data.nonce;
  };

  const registerUser = async () => {
    if (!address || !signer) return;

    try {
      setIsLoading(true);
      
      // Get nonce
      const nonce = await getNonce();
      
      // Create message
      const message = `merits.blockscout.com wants you to sign in with your Ethereum account:\n${address}\n\nSign-In for the Blockscout Merits program.\n\nURI: https://merits-staging.blockscout.com\nVersion: 1\nChain ID: 1\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}\nExpiration Time: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}`;
      
      // Get signature
      const signature = await signer.signMessage(message);
      
      // Register user
      const response = await fetch(`${MERITS_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nonce,
          message,
          signature,
        }),
      });

      const data = await response.json();
      if (data.token) {
        // Store token in localStorage
        localStorage.setItem('merits_token', data.token);
        setMeritsState(prev => ({ ...prev, isRegistered: true }));
      }
    } catch (error) {
      console.error('Failed to register user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserRanking = async () => {
    if (!address) return;

    try {
      const response = await fetch(`${MERITS_API_URL}/leaderboard/users/${address}`);
      const data = await response.json();
      
      setMeritsState(prev => ({
        ...prev,
        rank: Number(1),
        totalBalance: Number(data.total_balance),
        usersBelow: Number(data.users_below),
        topPercent: Number(data.top_percent),
      }));
    } catch (error) {
      console.error('Failed to fetch user ranking:', error);
    }
  };

  useEffect(() => {
    if (address) {
      const token = localStorage.getItem('merits_token');
      if (token) {
        setMeritsState(prev => ({ ...prev, isRegistered: true }));
        fetchUserRanking();
      } else {
        registerUser();
      }
    }
  }, [address]);

  return {
    ...meritsState,
    isLoading,
    registerUser,
    fetchUserRanking,
  };
}; 