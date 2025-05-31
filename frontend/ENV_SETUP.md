# 🔧 Environment Setup for Multi-Chain Support

Per utilizzare il sistema multi-chain di TruDelník Game, devi configurare le seguenti variabili d'ambiente nel file `.env`:

## 📋 Template per .env

Crea un file `.env` nella directory `frontend/` con il seguente contenuto:

```bash
# Berachain (Mainnet) Configuration
VITE_BERACHAIN_RPC_URL=https://rpc.berachain.com/
VITE_BERACHAIN_CHAIN_ID=80094
VITE_BERACHAIN_CONTRACT_ADDRESS=YOUR_BERACHAIN_CONTRACT_ADDRESS_HERE
VITE_BERACHAIN_BLOCKSCOUT_URL=https://berascan.com
VITE_BERACHAIN_MERITS_API_URL=https://merits-staging.blockscout.com/api/v1

# Coston2 (Flare Testnet) Configuration
VITE_COSTON2_RPC_URL=https://coston2-api.flare.network/ext/C/rpc
VITE_COSTON2_CHAIN_ID=114
VITE_COSTON2_CONTRACT_ADDRESS=YOUR_COSTON2_CONTRACT_ADDRESS_HERE
VITE_COSTON2_BLOCKSCOUT_URL=https://coston2-explorer.flare.network
VITE_COSTON2_MERITS_API_URL=https://merits-staging.blockscout.com/api/v1

# Default Chain (will be set to Berachain initially)
VITE_DEFAULT_CHAIN=berachain

# Merits API Configuration
VITE_MERITS_API_KEY=YOUR_MERITS_API_KEY_HERE

# Akave Configuration
VITE_AKAVE_ACCESS_KEY_ID=YOUR_AKAVE_ACCESS_KEY
VITE_AKAVE_SECRET_ACCESS_KEY=YOUR_AKAVE_SECRET_KEY
VITE_AKAVE_BUCKET=trdelnik-game-data
VITE_AKAVE_ENDPOINT=https://akave.ai
```

## 🔗 Dove ottenere i valori

### Contract Addresses
- **VITE_BERACHAIN_CONTRACT_ADDRESS**: Indirizzo del contratto deployato su Berachain mainnet (ottenuto dal deployment)
- **VITE_COSTON2_CONTRACT_ADDRESS**: Indirizzo del contratto deployato su Coston2 (ottenuto dal deployment)

### Merits API
- **VITE_MERITS_API_KEY**: Chiave API di Blockscout Merits (da richiedere a Blockscout)

### Akave Storage
- **VITE_AKAVE_ACCESS_KEY_ID**: Access Key per Akave S3
- **VITE_AKAVE_SECRET_ACCESS_KEY**: Secret Key per Akave S3

## 🚀 Come deployare i contratti

Dopo aver configurato le chiavi private nei contracts/.env, esegui:

```bash
# Deploy su Berachain mainnet
cd contracts
npm run deploy:berachain

# Deploy su Coston2  
npm run deploy:coston2
```

Copia gli indirizzi dei contratti deployati nelle rispettive variabili del frontend/.env

## 🎯 Chain Switching

Il sistema supporta:
- **Berachain (Chain ID: 80094)** - Berachain Mainnet con valuta BERA
- **Coston2 (Chain ID: 114)** - Flare Testnet con valuta C2FLR

Il selettore di chain in alto a destra permette di:
- Visualizzare la chain corrente
- Cambiare chain (aggiunge automaticamente la rete a MetaMask se necessario)
- Vedere informazioni sulla rete (currency, chain ID, explorer)

## 🔄 Comportamento Multi-Chain

- **Contratti**: Automaticamente selezionato BerachainGame per Berachain, TrdelnikGame per Coston2
- **RPC**: URL configurabile per ogni chain
- **Explorer**: Link automatici a Berascan per Berachain e Blockscout per Coston2
- **Merits**: API endpoint configurabile per chain
- **Persistenza**: La chain selezionata viene salvata in localStorage 