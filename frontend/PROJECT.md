# Trdelnik Game - Project Documentation

## Game Overview
Trdelnik is a Web3-based gambling game where players control an emoji bee character that progresses through steps. Each step represents a "round" with increasing multipliers based on the chosen difficulty level. Players must decide whether to continue to the next step or cash out their winnings.

## Core Game Mechanics

### Game Flow
1. Player connects their MetaMask wallet
2. Player selects difficulty level and bet amount
3. Player starts the game
4. For each step:
   - Player can choose to "Go" (continue) or "Cash Out"
   - If "Go" is chosen, a random number determines win/loss
   - If won, player can continue or cash out
   - If lost, all bet amount is lost

### Difficulty Levels and Multipliers

| Difficulty | Steps | Starting Multiplier | Max Win Multiplier | Win Probability |
|------------|-------|-------------------|-------------------|-----------------|
| Easy       | 24    | 1.02x            | 24.50x           | 96%            |
| Medium     | 22    | 1.11x            | 2,254x           | 88%            |
| Hard       | 20    | 1.22x            | 52,067.39x       | 80%            |
| Hardcore   | 15    | 1.63x            | 3,203,384.80x    | 60%            |

### Betting Rules
- Bet range: 0.01 to 200 units of the chosen currency
- Bet amount cannot be changed during an active game
- Only the game owner can play their game

## Technical Architecture

### Blockchain Integration
- Network: Hedera (EVM compatible)
- Block Explorer: Blockscout
- Random Number Generation: Pyth Network

### Smart Contract Interactions

#### Game State Management
```solidity
struct Game {
    address owner;
    uint256 betAmount;
    uint256 currentStep;
    uint256 multiplier;
    DifficultyLevel difficulty;
    bool isActive;
    bool hasLost;
}
```

#### Key Functions
1. `play()`: 
   - Creates new game if none exists
   - Tests current step if game exists
   - Uses Pyth for random number generation
   - Updates game state based on result

2. `cashOut()`:
   - Only available if game is active and not lost
   - Calculates winnings based on current multiplier
   - Transfers funds to player
   - Closes the game

### Frontend Components

1. **Wallet Connection**
   - MetaMask integration
   - Network validation (Hedera)
   - Balance checking

2. **Game Interface**
   - Difficulty selection
   - Bet amount input
   - Step visualization
   - Multiplier display
   - Play/Cash Out buttons

3. **Transaction Management**
   - Transaction status tracking
   - Blockscout integration for transaction history
   - Error handling and user feedback

## Development Guidelines

### State Management
- Track game state locally
- Sync with blockchain state
- Handle disconnections gracefully

### User Experience
- Clear feedback for all actions
- Transaction status updates
- Error messages and recovery options
- Responsive design for all devices

### Security Considerations
- Input validation
- Transaction confirmation requirements
- Error handling for failed transactions
- Network validation

## Testing Strategy

### Smart Contract Testing
- Unit tests for all contract functions
- Integration tests for game flow
- Random number generation verification
- Edge case handling

### Frontend Testing
- Component testing
- Integration testing
- Wallet connection testing
- Transaction flow testing

## Deployment

### Smart Contract
1. Deploy to Hedera testnet
2. Verify contract on Blockscout
3. Deploy to mainnet

### Frontend
1. Build optimization
2. Environment configuration
3. Deployment to production

## Future Enhancements
- Additional difficulty levels
- Tournament system
- Leaderboards
- Social features
- Mobile app version

## Questions to Address
1. Specific multiplier calculation formula for each step
2. Exact Pyth integration details
3. Gas optimization strategies
4. Additional security measures
5. Backup random number generation method
6. Maximum concurrent games per user
7. Minimum time between games
8. Fee structure and house edge 