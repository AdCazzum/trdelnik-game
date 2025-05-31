import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Network, Check, Loader2 } from 'lucide-react';
import { useChain } from '@/hooks/useChain';
import { cn } from '@/lib/utils';

const ChainSelector = () => {
  const { currentChain, chainConfig, supportedChains, isLoading, switchChain } = useChain();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleChainSwitch = async (chainId: string) => {
    if (chainId !== currentChain) {
      await switchChain(chainId);
    }
    setIsDropdownOpen(false);
  };

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-200",
            "h-12 px-4 py-2 rounded-xl shadow-lg"
          )}
          disabled={isLoading}
        >
          <div className="flex items-center gap-3">
            {/* Current chain icon and info */}
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold shadow-md"
                style={{ backgroundColor: chainConfig.color + '20', color: chainConfig.color }}
              >
                {chainConfig.icon}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold">{chainConfig.displayName}</span>
                <span className="text-xs text-white/70">{chainConfig.currency}</span>
              </div>
            </div>
            
            {/* Loading or dropdown indicator */}
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform duration-200",
                isDropdownOpen && "rotate-180"
              )} />
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        className="w-64 bg-white/95 backdrop-blur-md border-white/20 shadow-2xl rounded-xl p-2"
        align="end"
      >
        <div className="px-3 py-2 text-sm font-semibold text-gray-700 border-b border-gray-200/50 mb-1">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4" />
            Select Network
          </div>
        </div>

        {supportedChains.map((chain) => (
          <DropdownMenuItem
            key={chain.id}
            className={cn(
              "cursor-pointer rounded-lg p-3 m-1 transition-all duration-200",
              "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50",
              currentChain === chain.id && "bg-gradient-to-r from-blue-100 to-purple-100"
            )}
            onClick={() => handleChainSwitch(chain.id)}
          >
            <div className="flex items-center justify-between w-full">
              {/* Chain info */}
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-sm"
                  style={{ backgroundColor: chain.color + '20', color: chain.color }}
                >
                  {chain.icon}
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-gray-800">{chain.displayName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{chain.currency}</span>
                    <Badge 
                      variant="secondary" 
                      className="text-xs px-2 py-0 bg-gray-100 text-gray-600"
                    >
                      Chain {chain.chainId}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Selected indicator */}
              {currentChain === chain.id && (
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
              )}
            </div>
          </DropdownMenuItem>
        ))}

        {/* Footer info */}
        <div className="px-3 py-2 mt-2 border-t border-gray-200/50">
          <p className="text-xs text-gray-500 text-center">
            Network will be added to MetaMask if needed
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ChainSelector; 