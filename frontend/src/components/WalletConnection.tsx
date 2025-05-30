
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { Wallet, LogOut } from 'lucide-react';

const WalletConnection = () => {
  const { isConnected, address, balance, isLoading, connectWallet, disconnectWallet } = useWallet();

  if (isConnected) {
    return (
      <div className="flex items-center gap-4 justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4" />
            <span className="font-medium">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
          <div className="text-sm text-blue-200">
            Balance: {balance} ETH
          </div>
        </div>
        <Button 
          onClick={disconnectWallet}
          variant="outline"
          className="bg-red-600/20 border-red-500 text-white hover:bg-red-600/30"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={connectWallet}
      disabled={isLoading}
      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
      size="lg"
    >
      <Wallet className="w-5 h-5 mr-2" />
      {isLoading ? 'Connecting...' : 'Connect MetaMask'}
    </Button>
  );
};

export default WalletConnection;
