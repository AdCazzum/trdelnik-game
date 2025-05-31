import { useState } from 'react';
import WalletConnection from '@/components/WalletConnection';
import ChainSelector from '@/components/ChainSelector';
import GameBoard from '@/components/GameBoard';
import { useWallet } from '@/hooks/useWallet';
import LastPlayedGames from '@/components/LastPlayedGames';

const Index = () => {
  const { isConnected, isInitialized } = useWallet();

  console.log('Index component - isConnected:', isConnected, 'isInitialized:', isInitialized);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-yellow-500/10 rounded-full blur-2xl animate-bounce"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Top header with Chain Selector */}
        <div className="flex justify-end mb-6">
          <ChainSelector />
        </div>

        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="mb-6 relative">
            {/* Logo with glow effect */}
            <div className="inline-block relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
              <div className="relative z-10 p-4 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl border-4 border-yellow-400 shadow-2xl">
                <img 
                  src="https://cdn-icons-png.flaticon.com/512/8350/8350046.png" 
                  alt="Trdelnik" 
                  className="w-24 h-24 object-contain"
                />
              </div>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-300 bg-clip-text text-transparent drop-shadow-2xl">
            TruDelník
          </h1>
          
          <div className="mb-8 space-y-2">
            <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
              Taste the thrill of verifiable chance
            </p>
            <p className="text-lg text-blue-300/80 max-w-2xl mx-auto">
              Sweet stakes, zero fakes. Every bet is baked with blockchain-verified randomness, 
              so the only thing cooked is the pastry vibe—never the odds.
            </p>
          </div>
          
          <WalletConnection />
        </div>

        {/* Show loading state while initializing */}
        {isInitialized && !isConnected && (
          <div className="text-center text-yellow-300/80 animate-pulse">
            Connecting to wallet...
          </div>
        )}

        {/* Show game board when connected */}
        {isConnected && (
          <div className="space-y-6">
            <GameBoard />
            <LastPlayedGames />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
