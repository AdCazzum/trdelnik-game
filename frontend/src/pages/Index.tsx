import { useState } from 'react';
import WalletConnection from '@/components/WalletConnection';
import GameBoard from '@/components/GameBoard';
import { useWallet } from '@/hooks/useWallet';

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
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="mb-6 relative">
            {/* Bee logo with glow effect */}
            <div className="inline-block relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
              <div className="relative z-10 text-8xl p-4 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl border-4 border-yellow-400 shadow-2xl">
                🐝
              </div>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-300 bg-clip-text text-transparent drop-shadow-2xl">
            Bee Game
          </h1>
          
          <div className="mb-8 space-y-2">
            <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
              🚀 Next-Gen Crypto Gaming
            </p>
            <p className="text-lg text-blue-300/80 max-w-2xl mx-auto">
              Join the hive and multiply your crypto! Each step brings higher rewards, but one wrong move and it's game over. 
              <span className="font-semibold text-yellow-300"> Powered by Hedera Network ⚡</span>
            </p>
          </div>
          
          <WalletConnection />
        </div>

        {/* Show loading state while initializing */}
        {!isInitialized && (
          <div className="text-center py-20 animate-fade-in">
            <div className="bg-gradient-to-br from-white/10 to-purple-500/10 backdrop-blur-xl rounded-3xl p-12 max-w-lg mx-auto border-2 border-purple-500/30 shadow-2xl">
              <div className="text-6xl mb-6 animate-spin">⚡</div>
              <h3 className="text-3xl font-bold text-white mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Checking Wallet Connection...
              </h3>
              <p className="text-blue-200/80 text-lg">
                Please wait while we verify your wallet status
              </p>
            </div>
          </div>
        )}

        {/* Game Area - Only show when wallet is connected AND initialized */}
        {isInitialized && isConnected && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500/20 to-emerald-600/20 backdrop-blur-sm rounded-2xl px-6 py-4 border border-green-400/30">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-green-300 font-bold text-xl">✅ Wallet Connected - Ready to Buzz!</p>
                <div className="text-2xl">🎮</div>
              </div>
            </div>
            <GameBoard />
          </div>
        )}

        {/* Show message when wallet is not connected AND initialized */}
        {isInitialized && !isConnected && (
          <div className="text-center py-20 animate-fade-in">
            <div className="bg-gradient-to-br from-white/10 to-purple-500/10 backdrop-blur-xl rounded-3xl p-12 max-w-lg mx-auto border-2 border-purple-500/30 shadow-2xl">
              <div className="text-6xl mb-6">🔗</div>
              <h3 className="text-3xl font-bold text-white mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Connect to the Hive
              </h3>
              <p className="text-blue-200/80 text-lg leading-relaxed">
                Connect your MetaMask wallet to start your crypto adventure! 
                <br />
                <span className="text-yellow-300 font-semibold">🐝 The bee is waiting for you!</span>
              </p>
              
              {/* Feature highlights */}
              <div className="mt-8 grid grid-cols-1 gap-4 text-left">
                <div className="flex items-center gap-3 text-sm text-blue-200/70">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Provably fair gaming on Hedera</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-blue-200/70">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span>Instant payouts & low fees</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-blue-200/70">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Multiple difficulty levels</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
