# QuAIto - Intelligent Quarto Game

## Overview

QuAIto is a sophisticated digital implementation of the classic Quarto strategy board game, built with React 19 and TypeScript. The game features intelligent AI opponents with multiple difficulty levels, making it perfect for both casual players learning the game and experienced strategists seeking a challenge.

## Game Description

**Quarto** is a 2-player abstract strategy game invented by Blaise Müller in 1991. The name "Quarto" comes from the Latin word for "four," which is central to the game's objective.

### Objective
Be the first player to align four pieces in a row (horizontal, vertical, or diagonal) that share at least one common attribute.

### Game Components
- **16 Unique Pieces**: Each piece has 4 binary attributes:
  - **Height**: Tall (T) or Short (S)
  - **Color**: Light (L) or Dark (D)
  - **Shape**: Circle (C) or Square (Q)
  - **Top**: Solid (●) or Hollow (○)

Examples: TLCF (Tall Light Circle Solid), SDQH (Short Dark Square Hollow)

### Game Rules

1. **Setup**: All 16 pieces start off the board, available for selection.

2. **Turn Structure**: Each turn consists of two phases:
   - **Place Phase**: Place the piece your opponent selected for you
   - **Give Phase**: Select a piece from the available pieces for your opponent to place

3. **Winning**: A player wins by placing a piece that creates a line of four pieces sharing at least one attribute:
   - All tall or all short
   - All light or all dark  
   - All circles or all squares
   - All solid or all hollow

4. **Important Rule**: You cannot choose which piece you place - only your opponent can select pieces for you to place.

5. **Game End**: The game ends when someone creates a winning line or all 16 pieces are placed (tie).

## Technical Features

### AI System
The game includes a sophisticated AI system with four difficulty levels:

- **Easy** (40% random moves): Makes random moves 40% of the time, 50% chance to miss obvious wins
- **Normal** (20% random moves): More strategic but still makes occasional mistakes  
- **Hard** (10% random moves): Advanced strategic play with minimal errors
- **Brutal** (0% random moves): Near-perfect play with sophisticated position evaluation

### Game Modes
- **Human vs Human**: Local multiplayer
- **Human vs AI**: Single player against computer
- **AI vs AI**: Watch AI opponents compete

### User Interface
- **Responsive Design**: CSS Grid-based layout that scales across devices
- **Visual Indicators**: Clear piece attribute visualization with height indicators
- **Game State Tracking**: Shows current player, game phase, and last moves
- **Winning Highlights**: Animated highlighting of winning lines
- **Modal System**: In-game help, rules reference, and AI settings

### Technical Stack
- **Frontend**: React 19 with TypeScript
- **Styling**: CSS with custom properties for responsive design
- **Build Tool**: Vite for fast development and optimized builds
- **Code Quality**: ESLint for consistent code standards

## Game Strategy Tips

1. **Think Defensively**: Always consider what pieces you're giving your opponent
2. **Control the Endgame**: As fewer pieces remain, safe choices become limited
3. **Pattern Recognition**: Look for multiple potential winning lines
4. **Force Dilemmas**: Try to put your opponent in positions where all available pieces are dangerous
5. **Count Attributes**: Keep track of how many pieces with each attribute are still available

## Development Highlights

### Code Architecture
- **Modular Components**: Separate components for game board, pieces, controls, and UI elements
- **Type Safety**: Comprehensive TypeScript interfaces for game state and AI logic
- **Performance**: Optimized rendering with React hooks and memoization
- **Maintainability**: Constants extracted to file tops, clean separation of concerns

### AI Implementation
- **Strategic Evaluation**: Multi-layered decision making considering wins, blocks, and safety
- **Difficulty Scaling**: Configurable parameters for different skill levels
- **Move Planning**: Separate logic for piece placement and piece selection
- **Debug Features**: Optional AI decision logging for analysis

### User Experience
- **Smooth Animations**: CSS transitions for piece placement and UI interactions
- **Visual Feedback**: Clear indication of game state, valid moves, and winning conditions
- **Accessibility**: Keyboard navigation and screen reader friendly markup
- **Responsive**: Adapts to different screen sizes while maintaining playability

## Getting Started

1. **Installation**:
   ```bash
   npm install
   ```

2. **Development**:
   ```bash
   npm run dev
   ```

3. **Build**:
   ```bash
   npm run build
   ```

The game will open in your browser, and you can immediately start playing against the AI or set up a local multiplayer session.

## Why Quarto?

Quarto is an excellent choice for a digital adaptation because:
- **Pure Strategy**: No luck involved, making AI implementation meaningful
- **Quick Games**: Matches typically last 5-15 minutes
- **Scalable Difficulty**: From beginner-friendly to expert-level challenge
- **Visual Appeal**: The unique pieces and grid layout translate well to digital interfaces
- **Educational Value**: Develops pattern recognition and strategic thinking skills

QuAIto brings this classic game to modern devices with intelligent opponents that provide a challenging and engaging experience for players of all skill levels.