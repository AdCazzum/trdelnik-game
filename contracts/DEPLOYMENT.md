# 🚀 Smart Deployment Guide

Sistema intelligente di deployment che sceglie automaticamente il contratto giusto in base alla rete e gestisce i parametri appropriati.

## 🧠 Logica Automatica

Il sistema rileva automaticamente la rete e deploya il contratto appropriato:

| Rete | Chain ID | Contratto Deployato | Randomness Provider |
|------|----------|---------------------|-------------------|
| **Berachain** | 80094 | BerachainGame | Pyth Entropy |
| **Bepolia** | 80069 | BerachainGame | Pyth Entropy |
| **Flare** | 14 | TrdelnikGame | Flare Randomness |
| **Coston2** | 114 | TrdelnikGame | Flare Randomness |
| **Altre** | - | ❌ Errore | - |

## 📋 Comandi di Deployment

### Usando NPM Scripts (Raccomandato)
```bash
# Deploy su Berachain mainnet → BerachainGame + Pyth Entropy
npm run deploy:berachain

# Deploy su Bepolia testnet → BerachainGame + Pyth Entropy  
npm run deploy:bepolia

# Deploy su Flare mainnet → TrdelnikGame + Flare Randomness
npm run deploy:flare

# Deploy su Coston2 testnet → TrdelnikGame + Flare Randomness
npm run deploy:coston2
```

### Usando Hardhat direttamente
```bash
# Deploy su qualsiasi rete supportata
npx hardhat run scripts/deploy.ts --network <network_name>
```

## ⚙️ Configurazione Environment Variables

### Per Berachain Networks (Pyth Entropy)

Aggiungi queste variabili al file `contracts/.env`:

```bash
# Berachain Mainnet
BERACHAIN_ENTROPY_ADDRESS=0x... # Indirizzo Pyth Entropy Contract
BERACHAIN_ENTROPY_PROVIDER=0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344

# Bepolia Testnet  
BEPOLIA_ENTROPY_ADDRESS=0x... # Indirizzo Pyth Entropy Contract
BEPOLIA_ENTROPY_PROVIDER=0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344

# Private Key (for all networks)
PRIVATE_KEY=your_private_key_here
```

### Per Flare Networks

Solo la private key è necessaria:
```bash
PRIVATE_KEY=your_private_key_here
```

## 📝 Esempi Pratici

### Deploy su Berachain (con Pyth Entropy)
```bash
npm run deploy:berachain
```
**Output:**
```
🌐 Detected network: berachain (Chain ID: 80094)
🐻 Berachain network detected → Deploying BerachainGame with Pyth Entropy
🔀 Entropy Contract: 0x123...
⚡ Entropy Provider: 0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344
📦 Deploying BerachainGame...
✅ BerachainGame deployed successfully!
📍 Contract address: 0x456...
💰 Entropy Fee: 0.001 BERA
🎮 Minimum Game Value: 0.001001 BERA
🔍 View on explorer: https://berascan.com/address/0x456...

📋 Next Steps for BerachainGame:
1. 🔐 Update frontend .env with contract address:
   VITE_BERACHAIN_CONTRACT_ADDRESS=0x456...
2. 🎮 Update frontend to handle new function signatures:
   - startGame(difficulty, userRandomNumber) + entropy fee
   - playStep(gameId, userRandomNumber) + entropy fee
```

### Deploy su Coston2 (con Flare Randomness)
```bash
npm run deploy:coston2
```
**Output:**
```
🌐 Detected network: coston2 (Chain ID: 114)
🔥 Flare network detected → Deploying TrdelnikGame
📦 Deploying TrdelnikGame...
✅ TrdelnikGame deployed successfully!
📍 Contract address: 0x789...
🌐 Network: coston2 (Chain ID: 114)
🔍 View on explorer: https://coston2-explorer.flare.network/address/0x789...

📋 Next Steps for TrdelnikGame:
1. 🔐 Update frontend .env with contract address:
   VITE_COSTON2_CONTRACT_ADDRESS=0x789...
2. 🎮 Use standard function signatures:
   - startGame(difficulty)
   - playStep(gameId)
```

## 🔍 Verifica Contratti

Dopo il deployment, verifica i contratti:

```bash
# Verifica su Berachain
npx hardhat verify --network berachain <CONTRACT_ADDRESS> <ENTROPY_ADDRESS> <ENTROPY_PROVIDER>

# Verifica su Bepolia
npx hardhat verify --network bepolia <CONTRACT_ADDRESS> <ENTROPY_ADDRESS> <ENTROPY_PROVIDER>

# Verifica su Flare (no additional params)
npx hardhat verify --network flare <CONTRACT_ADDRESS>

# Verifica su Coston2 (no additional params)
npx hardhat verify --network coston2 <CONTRACT_ADDRESS>
```

## 🛠️ Troubleshooting

### Errore: "Entropy contract address not configured"
```
❌ Entropy contract address not configured for this network
Please set environment variables:
  BERACHAIN_ENTROPY_ADDRESS=0x...
```
**Soluzione**: Configura le variabili d'ambiente per Pyth Entropy.

### Errore: "Unsupported network"
```
❌ Unsupported network: sepolia (Chain ID: 11155111)
```
**Soluzione**: Usa solo le reti supportate (Berachain, Bepolia, Flare, Coston2).

### Fondi insufficienti
Assicurati che il wallet abbia fondi sulla rete di destinazione:
- **Berachain**: [Berachain Faucet](https://faucet.berachain.com/)
- **Bepolia**: [Bepolia Faucet](https://bepolia.beratrail.io/faucet) 
- **Coston2**: [Coston2 Faucet](https://coston2-faucet.towolabs.com/)

### Pyth Entropy non disponibile
Se ricevi errori relativi a entropy fee:
```
⚠️  Could not fetch entropy fee (this is normal if entropy contracts are not yet deployed)
```
Questo è normale se Pyth Entropy non è ancora deployato sulla rete.

## 🎯 Quick Reference

| Obiettivo | Comando | Contratto | Provider |
|-----------|---------|-----------|----------|
| 🐻 Deploy Berachain mainnet | `npm run deploy:berachain` | BerachainGame | Pyth Entropy |
| 🧪 Test Bepolia testnet | `npm run deploy:bepolia` | BerachainGame | Pyth Entropy |
| 🔥 Deploy Flare mainnet | `npm run deploy:flare` | TrdelnikGame | Flare Randomness |
| 🧪 Test Coston2 testnet | `npm run deploy:coston2` | TrdelnikGame | Flare Randomness |

### Altri Comandi Utili
| Comando | Descrizione |
|---------|-------------|
| `npm run compile` | Compila contratti |
| `npm run clean` | Pulisci artifacts |
| `npm run test` | Esegui test |

## 📚 Risorse

- 🐻 [Berachain Docs](https://docs.berachain.com/)
- ⚡ [Pyth Entropy Docs](https://docs.pyth.network/entropy)
- 🔥 [Flare Docs](https://docs.flare.network/)
- 📖 [BerachainGame Guide](./BERACHAIN_ENTROPY.md)