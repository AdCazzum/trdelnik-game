# Trdelnik Game Smart Contracts

This directory contains the smart contracts for the Trdelnik Game project.

## Overview

The main contract is `TrdelnikGame.sol`, which implements a step-risk game on the blockchain. The contract includes features such as:
- Multiple difficulty levels (Easy, Medium, Hard, Hardcore)
- Progressive multipliers for each step
- Automatic cashout on final step success
- Fair randomness (currently using block entropy, to be replaced with VRF)
- Owner controls for game settings

## Game Mechanics

- Players can start a game by placing a bet and choosing a difficulty level
- Each difficulty has different:
  - Success probability
  - Maximum number of steps
  - Payout multipliers
- Players can cash out at any time to secure their winnings
- One failed step results in losing the entire bet

## Development

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Compilation

```bash
npx hardhat compile
```

### Testing

```bash
npx hardhat test
```

### Deployment

To deploy to a local network:
```bash
npx hardhat node
npx hardhat run scripts/deploy.ts --network localhost
```

## Contract Structure

### TrdelnikGame.sol

The main game contract that handles:
- Game session management
- Step progression and validation
- Payout calculations
- Owner controls for multipliers

## Security

The contract includes several security features:
- ReentrancyGuard for preventing reentrancy attacks
- Ownable pattern for access control
- Input validation
- Safe math operations
- Future VRF integration for fair randomness

## License

This project is licensed under the MIT License.
