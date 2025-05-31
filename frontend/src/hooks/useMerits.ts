import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';
import { useChain } from './useChain';

interface MeritsState {
  isRegistered: boolean;
  rank?: number;
  totalBalance?: number;
  usersBelow?: number;
  topPercent?: number;
}

export const useMerits = () => {
  const { address } = useWallet();
  const { chainConfig } = useChain();
  const [meritsState, setMeritsState] = useState<MeritsState>({ isRegistered: false });
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserInfo = useCallback(async () => {
    if (!address) return;

    try {
      setIsLoading(true);
      
      // Get user info
      const userResponse = await fetch(`${chainConfig.meritsApiUrl}/auth/user/${address}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('Merits API response:', userResponse.status, userResponse.statusText);
      const userData = await userResponse.json();
      console.log('Merits user data:', userData);

      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user info: ${userResponse.status} ${userResponse.statusText}`);
      }

      // Get leaderboard info
      const leaderboardResponse = await fetch(`${chainConfig.meritsApiUrl}/leaderboard/users/${address}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!leaderboardResponse.ok) {
        throw new Error(`Failed to fetch leaderboard info: ${leaderboardResponse.status} ${leaderboardResponse.statusText}`);
      }

      const leaderboardData = await leaderboardResponse.json();
      console.log('Merits leaderboard data:', leaderboardData);

      // Check if user exists and has ranking
      if (leaderboardData && leaderboardData.rank) {
        setMeritsState({
          isRegistered: true,
          rank: Number(leaderboardData.rank),
          totalBalance: Number(leaderboardData.total_balance || 0),
          usersBelow: Number(leaderboardData.users_below || 0),
          topPercent: Number(leaderboardData.top_percent || 0),
        });
      } else {
        console.log('User exists but not ranked yet');
        setMeritsState({
          isRegistered: true,
          rank: undefined,
          totalBalance: 0,
          usersBelow: 0,
          topPercent: 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch Merits info:', error);
      setMeritsState({ isRegistered: false });
    } finally {
      setIsLoading(false);
    }
  }, [address, chainConfig.meritsApiUrl]);

  useEffect(() => {
    if (address) {
      console.log('Fetching Merits info for address:', address);
      fetchUserInfo();
    }
  }, [address, fetchUserInfo]);

  return {
    ...meritsState,
    isLoading,
    fetchUserInfo,
  };
}; 