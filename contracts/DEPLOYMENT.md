# 🚀 Smart Deployment Guide

Sistema intelligente di deployment che sceglie automaticamente il contratto giusto in base alla rete.

## 🧠 Logica Automatica

Il sistema rileva automaticamente la rete e deploya il contratto appropriato:

| Rete | Chain ID | Contratto Deployato |
|------|----------|---------------------|
| **Berachain** | 80094 | BerachainGame |
| **Bepolia** | 80069 | BerachainGame |
| **Flare** | 14 | TrdelnikGame |
| **Coston2** | 114 | TrdelnikGame |
| **Altre** | - | ❌ Errore |

## 📋 Comandi di Deployment

### Usando NPM Scripts (Raccomandato)
```bash
# Deploy su Berachain mainnet → BerachainGame
npm run deploy:berachain

# Deploy su Bepolia testnet → BerachainGame  
npm run deploy:bepolia

# Deploy su Flare mainnet → TrdelnikGame
npm run deploy:flare

# Deploy su Coston2 testnet → TrdelnikGame
npm run deploy:coston2
```

### Usando Hardhat direttamente
```bash
# Deploy su qualsiasi rete supportata
npx hardhat run scripts/deploy.ts --network <network_name>
```

## 📝 Esempi Pratici

### Deploy su Berachain (mainnet)
```bash
npm run deploy:berachain
```
**Output:**
```
🌐 Detected network: berachain (Chain ID: 80094)
🐻 Berachain network detected → Deploying BerachainGame
📦 Deploying BerachainGame...
✅ BerachainGame deployed successfully!
📍 Contract address: 0x123...
🔍 View on explorer: https://berascan.com/address/0x123...
```

### Deploy su Coston2 (testnet)
```bash
npm run deploy:coston2
```
**Output:**
```
🌐 Detected network: coston2 (Chain ID: 114)
🔥 Flare network detected → Deploying TrdelnikGame
📦 Deploying TrdelnikGame...
✅ TrdelnikGame deployed successfully!
📍 Contract address: 0x456...
🔍 View on explorer: https://coston2-explorer.flare.network/address/0x456...
```

## ⚙️ Configurazione

Assicurati che il file `.env` contenga:
```bash
PRIVATE_KEY=your_private_key_here
FLARE_RPC_API_KEY=your_flare_api_key  # Opzionale
FLARESCAN_API_KEY=your_flarescan_api_key  # Opzionale
```

## 🔍 Verifica Contratti

Dopo il deployment, verifica i contratti:

```bash
# Verifica su Berachain
npx hardhat verify --network berachain <CONTRACT_ADDRESS>

# Verifica su Bepolia
npx hardhat verify --network bepolia <CONTRACT_ADDRESS>

# Verifica su Flare
npx hardhat verify --network flare <CONTRACT_ADDRESS>

# Verifica su Coston2
npx hardhat verify --network coston2 <CONTRACT_ADDRESS>
```

## 🛠️ Troubleshooting

### Rete non supportata
Se provi a deployare su una rete non supportata:
```
❌ Unsupported network: sepolia (Chain ID: 11155111)
Supported networks:
  - Berachain (80094) → BerachainGame
  - Bepolia (80069) → BerachainGame
  - Flare (14) → TrdelnikGame
  - Coston2 (114) → TrdelnikGame
```

### Fondi insufficienti
Assicurati che il wallet abbia fondi sulla rete di destinazione:
- **Bepolia**: [Faucet Bepolia](https://bepolia.beratrail.io/faucet) 
- **Coston2**: [Faucet Coston2](https://coston2-faucet.towolabs.com/)

## 🎯 Quick Reference

| Obiettivo | Comando |
|-----------|---------|
| 🐻 Deploy BerachainGame su mainnet | `npm run deploy:berachain` |
| 🧪 Test BerachainGame su testnet | `npm run deploy:bepolia` |
| 🔥 Deploy TrdelnikGame su mainnet | `npm run deploy:flare` |
| 🧪 Test TrdelnikGame su testnet | `npm run deploy:coston2` |
| 🏗️ Compila contratti | `npm run compile` |
| 🧹 Pulisci artifacts | `npm run clean` |