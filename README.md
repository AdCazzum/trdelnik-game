# 🎲 TruDelník Game

> **Web3 Risk-Based Gaming with Verifiable Randomness**

Monorepo for **TruDelník**, a decentralized gambling game where players stake cryptocurrency, progress through risk-based steps with exponentially rising multipliers, and cash out anytime or lose it all. Built with **verifiable blockchain randomness** and complete transparency.

*Built for ETHGlobal Prague 2024* 🇨🇿

[![Live Demo](https://img.shields.io/badge/🎮_Live_Demo-trudelnik.netlify.app-blue?style=for-the-badge)](https://trudelnik.netlify.app)
[![Contracts](https://img.shields.io/badge/📋_Smart_Contracts-Multi--Chain-green?style=for-the-badge)](#smart-contracts)

## 🎮 Game Concept

**TruDelník** is a high-stakes, step-based gambling game where:

- **🎯 Stake & Risk**: Players stake ETH/BERA and choose difficulty levels
- **📈 Rising Multipliers**: Each successful step increases potential winnings exponentially  
- **💰 Cash Out Anytime**: Players can exit with current winnings before the next step
- **💥 All or Nothing**: One failed step loses the entire stake
- **🔐 Provably Fair**: Blockchain-verified randomness ensures complete transparency

### Difficulty Levels
| Difficulty | Success Rate | Max Steps | Max Multiplier |
|------------|-------------|-----------|----------------|
| 🟢 **Easy** | 90% | 24 | 24.5x |
| 🟡 **Medium** | 85% | 22 | 2,254x |
| 🔴 **Hard** | 70% | 20 | 52,067x |
| ⚫ **Hardcore** | 55% | 15 | 3,203,384x |

## 🏗️ Architecture

```
trdelnik-game/
├── 🏛️ contracts/          # Solidity smart contracts
│   ├── Game.sol           # Flare Network version (TrdelnikGame)
│   └── BerachainGame.sol  # Berachain version with Pyth Entropy
├── 🎨 frontend/           # React/TypeScript interface
│   ├── Multi-chain support
│   ├── Merits integration
│   └── Akave storage
└── 📚 Documentation & deployment scripts
```

## 🤝 Partner Integrations

### 🔥 **Flare Network** - *Secure Randomness*
- **Implementation**: `RandomNumberV2Interface` in `Game.sol`
- **Network**: Coston2 Testnet (Chain ID: 114)
- **Status**: ✅ **Fully Functional**
- **Features**: 
  - Synchronous random number generation
  - Built-in randomness verification
  - Production-ready deployment

### ⚡ **Pyth Network** - *Entropy Protocol*
- **Implementation**: `IEntropy` and `IEntropyConsumer` in `BerachainGame.sol`
- **Network**: Berachain Mainnet (Chain ID: 80094)
- **Status**: 🔄 **Under Development** (transactions succeed but events not emitted)
- **Features**:
  - Asynchronous randomness with callbacks
  - User-provided entropy mixing
  - Fee-based randomness requests

### 🔍 **Blockscout** - *Merits & Explorer*
- **Implementation**: Merit-based leaderboard system
- **Features**:
  - **1 Merit** awarded per game played
  - **Leaderboard rankings** based on Merit balance
  - **Feature gating**: Advanced difficulties require Merit thresholds
  - **Transaction explorer** integration for game verification

### 📦 **Protocol Labs (Akave)** - *Decentralized Storage*
- **Implementation**: Proof-of-play storage system
- **Features**:
  - **Game history** stored on decentralized storage
  - **Randomness transparency** - all random seeds recorded
  - **Immutable records** of wins, losses, and payouts
  - **CORS-configured** for seamless frontend integration

## 🌐 Multi-Chain Support

| Network | Contract Type | Randomness Provider | Status |
|---------|---------------|-------------------|---------|
| **🔥 Coston2** | TrdelnikGame | Flare Randomness | ✅ Live |
| **🐻 Berachain** | BerachainGame | Pyth Entropy | 🔄 Testing |

### Chain Selector
- **Automatic detection** of connected wallet network
- **Seamless switching** between supported chains
- **Chain-specific** contract interactions and fee handling

## 🚀 Key Features

### 🎲 **Provably Fair Gaming**
- **Blockchain-verified** random number generation
- **Transparent** randomness sources (Flare/Pyth)
- **Immutable** game state and history

### 💎 **Merit System** 
- **Earn Merits** for every game played
- **Unlock features** with Merit requirements
- **Leaderboard** competition with other players

### 📊 **Complete Transparency**
- **All game data** stored on Akave
- **Transaction hashes** for every action
- **Randomness proofs** publicly verifiable

### 🎨 **Modern UI/UX**
- **Responsive design** with Tailwind CSS
- **Real-time updates** and animations
- **Multi-chain** wallet integration

## 🛠️ Technical Stack

### **Smart Contracts**
- **Solidity ^0.8.0** with OpenZeppelin security
- **Hardhat** development environment
- **Multi-network** deployment automation

### **Frontend**
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **ethers.js** for blockchain interaction

### **Blockchain Integration**
- **MetaMask** wallet connection
- **Multi-chain** support (Flare, Berachain)
- **Automatic network** switching

## 🚦 Current Status

### ✅ **Working Features**
- ✅ **Flare Network deployment** - fully functional
- ✅ **Multi-chain frontend** with chain detection
- ✅ **Merit system** integration
- ✅ **Akave storage** for game history
- ✅ **Complete UI/UX** for all game functions

### 🔄 **In Development**
- 🔄 **Pyth Entropy integration** - debugging event emission issue
- 🔄 **Berachain optimization** - improving gas efficiency
- 🔄 **Advanced features** unlocked by Merit thresholds

## 🎯 ETHGlobal Prague 2024

This project showcases the integration of **cutting-edge blockchain technologies**:

- **🔐 Verifiable Randomness** from multiple sources
- **📊 Decentralized Data Storage** with Protocol Labs
- **🏆 Merit-based Gamification** with Blockscout
- **🌍 Multi-chain Architecture** for broader accessibility

**TruDelník** demonstrates how **Web3 gaming** can achieve:
- **Complete transparency** in random number generation
- **Immutable game records** stored decentrally
- **Cross-chain** user experiences
- **Community-driven** progression systems

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/trdelnik-game
cd trdelnik-game

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Deploy contracts
cd contracts && npm run deploy:coston2

# Start frontend
cd ../frontend && npm run dev
```

## 📖 Documentation

- [🏛️ Smart Contracts Guide](./contracts/README.md)
- [🎨 Frontend Setup](./frontend/README.md)
- [🚀 Deployment Guide](./contracts/DEPLOYMENT.md)

## 🔗 Links

- **🎮 Live Demo**: [trudelnik.netlify.app](https://trudelnik.netlify.app)
- **🔍 Explorer**: [Coston2 Blockscout](https://coston2-explorer.flare.network/)
- **📊 Merits**: [Blockscout Merits](https://merits-staging.blockscout.com/)

---

*Built with ❤️ for ETHGlobal Prague 2024* 🇨🇿
