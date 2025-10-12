# QuAIto 🎲

A digital implementation of the classic Quarto board game featuring intelligent AI opponents with multiple difficulty levels.

![QuAIto Game](https://img.shields.io/badge/Game-QuAIto-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)

## 🎯 About the Game

Quarto is a strategic board game invented by Blaise Müller in 1991. It's a game of logic and pattern recognition where players must think several moves ahead to avoid giving their opponent a winning opportunity.

**Objective:** Be the first to get four pieces in a row that share at least one common attribute.

## 🚀 Features

- **🎮 Multiple Game Modes**
  - Human vs Human: Play against a friend locally
  - Human vs AI: Challenge intelligent computer opponents
  - AI vs AI: Watch AI players compete against each other

- **🤖 Advanced AI System**
  - **Easy**: 60% random moves, occasionally misses winning opportunities
  - **Normal**: 30% random moves, 5% chance to miss wins
  - **Hard**: Strategic play with minimal randomness (1% miss rate)
  - **Nightmare**: Near-perfect play with advanced position evaluation

- **🎨 Modern UI**
  - Clean, responsive design using CSS Grid
  - Visual piece indicators for tall pieces
  - Winning line highlighting
  - Last move tracking
  - Smooth animations and transitions

- **⚙️ Customizable Settings**
  - Configurable AI difficulty levels
  - Debug logging for AI decision analysis
  - Game rules and help system

## 🎲 Game Rules

### Setup
- 16 unique pieces with 4 attributes each:
  - **Height**: Tall or Short
  - **Color**: Light or Dark  
  - **Shape**: Circle or Square
  - **Top**: Solid or Hollow

### Gameplay
1. **Give Phase**: Current player selects a piece for their opponent
2. **Place Phase**: Opponent places the given piece on the board
3. Players alternate between giving and placing pieces
4. Game continues until someone wins or the board is full (tie)

### Winning
Create a line of four pieces sharing at least one attribute:
- Horizontal (any row)
- Vertical (any column)
- Diagonal (either diagonal)

## 🛠️ Technology Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: CSS Grid and modern CSS features
- **AI Algorithms**: Heuristic-based decision making with strategic position evaluation

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/dfotland/quaito.git
   cd quaito
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🎮 How to Play

1. **Starting a Game**: Click "New Game" to begin
2. **Setting Up AI**: Use the "⚙️ AI Settings" button to configure computer opponents
3. **Making Moves**:
   - Select a piece from the available pieces grid
   - The selected piece will be staged for your opponent
   - Your opponent (human or AI) will place the piece on the board
4. **Winning**: Get four pieces in a line sharing a common attribute!

## 🧠 AI Strategy

The AI uses sophisticated heuristics to evaluate positions:

- **Winning Move Detection**: Always takes available wins (except on easier difficulties)
- **Safety Analysis**: Evaluates how many "safe" pieces remain after each move
- **Minimum Thresholds**: Higher difficulties require more safe pieces before making moves
- **Strategic Randomness**: Lower difficulties incorporate randomness for more human-like play

### Difficulty Breakdown
- **Easy**: 2 safe pieces minimum, 20% win miss rate, 60% random moves
- **Normal**: 2 safe pieces minimum, 5% win miss rate, 30% random moves  
- **Hard**: 3 safe pieces minimum, 1% win miss rate, 0% random moves
- **Nightmare**: 8 safe pieces minimum, never misses wins, purely strategic

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── GameBoard.tsx   # Main game board
│   ├── Piece.tsx       # Individual game pieces
│   └── PieceSet.tsx    # Available pieces grid
├── ai/                 # AI implementation
│   ├── ai.ts          # Main AI logic
│   └── mcts.ts        # Monte Carlo Tree Search (future)
├── utils/             # Utility functions
│   └── gameUtils.ts   # Game logic and validation
└── App.tsx            # Main application component
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines
- Follow TypeScript best practices
- Maintain consistent code formatting
- Add tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact

For suggestions or bugs, email: **fotland@smart-games.com**

## 🙏 Acknowledgments

- Blaise Müller for creating the original Quarto game
- The React and TypeScript communities for excellent tools and documentation
- Contributors and testers who helped improve the game

---

*QuAIto - Where strategy meets artificial intelligence! 🧠🎮*
