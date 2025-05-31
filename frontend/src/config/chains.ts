export interface ChainConfig {
  id: string;
  name: string;
  displayName: string;
  chainId: number;
  rpcUrl: string;
  contractAddress: string;
  blockscoutUrl: string;
  meritsApiUrl: string;
  currency: string;
  icon: string;
  color: string;
}

export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  berachain: {
    id: 'berachain',
    name: 'berachain',
    displayName: 'Berachain',
    chainId: Number(import.meta.env.VITE_BERACHAIN_CHAIN_ID) || 80094,
    rpcUrl: import.meta.env.VITE_BERACHAIN_RPC_URL || 'https://rpc.berachain.com/',
    contractAddress: import.meta.env.VITE_BERACHAIN_CONTRACT_ADDRESS || '',
    blockscoutUrl: import.meta.env.VITE_BERACHAIN_BLOCKSCOUT_URL || 'https://berascan.com',
    meritsApiUrl: import.meta.env.VITE_BERACHAIN_MERITS_API_URL || 'https://merits-staging.blockscout.com/api/v1',
    currency: 'BERA',
    icon: '🐻',
    color: '#FFA500'
  },
  coston2: {
    id: 'coston2',
    name: 'coston2',
    displayName: 'Coston2',
    chainId: Number(import.meta.env.VITE_COSTON2_CHAIN_ID) || 114,
    rpcUrl: import.meta.env.VITE_COSTON2_RPC_URL || 'https://coston2-api.flare.network/ext/C/rpc',
    contractAddress: import.meta.env.VITE_COSTON2_CONTRACT_ADDRESS || '',
    blockscoutUrl: import.meta.env.VITE_COSTON2_BLOCKSCOUT_URL || 'https://coston2-explorer.flare.network',
    meritsApiUrl: import.meta.env.VITE_COSTON2_MERITS_API_URL || 'https://merits-staging.blockscout.com/api/v1',
    currency: 'C2FLR',
    icon: '🔥',
    color: '#E31937'
  }
};

export const DEFAULT_CHAIN = import.meta.env.VITE_DEFAULT_CHAIN || 'berachain';

export const getChainConfig = (chainId: string): ChainConfig => {
  const config = SUPPORTED_CHAINS[chainId];
  if (!config) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  return config;
};

export const getChainByChainId = (chainId: number): ChainConfig | null => {
  return Object.values(SUPPORTED_CHAINS).find(chain => chain.chainId === chainId) || null;
}; 