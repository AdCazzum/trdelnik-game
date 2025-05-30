
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Coins, DollarSign } from 'lucide-react';

interface BettingPanelProps {
  betAmount: string;
  setBetAmount: (amount: string) => void;
  disabled?: boolean;
}

const BettingPanel = ({ betAmount, setBetAmount, disabled }: BettingPanelProps) => {
  const presetAmounts = ['0.01', '0.1', '0.5', '1.0'];

  const handleAmountChange = (value: string) => {
    // Only allow valid decimal numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBetAmount(value);
    }
  };

  return (
    <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
          <Coins className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white">Bet Amount</h3>
      </div>
      
      <div className="space-y-4">
        <div className="relative">
          <Input
            type="text"
            value={betAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0.01"
            disabled={disabled}
            className="pr-16 bg-white/10 border-white/20 text-white placeholder:text-white/50 text-lg h-12"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-white/70" />
            <span className="text-white/70 text-sm font-medium">ETH</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {presetAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => setBetAmount(amount)}
              disabled={disabled}
              className={`p-3 rounded-lg border-2 transition-all ${
                betAmount === amount
                  ? 'border-green-400 bg-green-600/30'
                  : 'border-white/20 bg-white/5 hover:bg-white/10'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="text-center">
                <div className="text-white font-medium">{amount}</div>
                <div className="text-green-200 text-xs">ETH</div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-400/30">
          <div className="text-sm text-blue-200 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
              <span className="font-medium">Betting Limits</span>
            </div>
            <div>Min: 0.01 ETH • Max: 200 ETH</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BettingPanel;
