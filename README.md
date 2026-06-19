# FIFA Tournament Bracket Manager

> Archive. Built this to run a same-day, in-person FIFA tournament with mates -
> brackets, group stage, live score entry, the lot. We just used a whiteboard,
> so it never really got a run. Leaving it up for posterity.

A full-stack web application to organize and manage FIFA tournaments with your friends. Features bracket visualization, group stage support, score tracking, and time estimation.

## Features

### Core Functionality
- **Flexible Player Count**: Support for 2-32 players/teams
- **Game Modes**: 1v1 or 2v2 tournaments
- **Tournament Formats**:
  - Single Elimination Bracket
  - Group Stage + Knockout (requires 8+ players)
- **Live Score Entry**: Click any pending match to enter scores
- **State Persistence**: All tournaments are saved and accessible via public URLs
- **Time Estimation**: Automatically calculates expected tournament duration

### Additional Features
- **Group Stage Standings**: Complete standings table with points, goal difference, etc.
- **Bracket Visualization**: Clean, intuitive bracket display
- **Auto-advancement**: Winners automatically progress to next rounds
- **Bye Handling**: Automatic bye assignments for non-power-of-2 player counts
- **Seeding Options**: Optional player seeding for competitive balance
- **Tournament Management**: View, edit, and delete tournaments
- **Responsive Design**: Works on desktop and mobile devices

## Screenshots

```
Main Menu → Create Tournament → Configure → View Bracket → Enter Scores
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fifa-bracket.git
cd fifa-bracket
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### Creating a Tournament

1. Click "Create New Tournament" from the main menu
2. Fill in the tournament details:
   - **Tournament Name**: Give your tournament a memorable name
   - **Game Mode**: Choose 1v1 or 2v2
   - **Format**:
     - Single Elimination: Direct knockout bracket
     - Group Stage + Knockout: Round-robin groups followed by playoffs (requires 8+ players)
   - **Number of Players**: 2-32 players
3. Enter player/team names
4. (Optional) Enable seeding to order players by skill level
5. Click "Create Tournament"

### Managing Matches

- **Pending Matches**: Click any match with both teams assigned to enter scores
- **Score Entry**: Enter goals for each team and click submit
- **Auto-advancement**: Winners automatically move to next rounds
- **Group Standings**: Automatically updates with wins, draws, losses, and points

### Viewing Tournaments

- Access any saved tournament from the "View Tournaments" menu
- Share the URL with friends for public viewing
- Tournament state is persistent across sessions

## Tournament Formats Explained

### Single Elimination
- Players are randomly seeded into a bracket
- Losers are eliminated immediately
- Bracket auto-adjusts for non-power-of-2 player counts with byes
- Example: 8 players → Quarter Finals → Semi Finals → Final

### Group Stage + Knockout
- Players split into groups of 4
- Round-robin within each group (everyone plays everyone)
- Top 2 from each group advance to knockout rounds
- Points: Win = 3, Draw = 1, Loss = 0
- Tiebreakers: Goal difference, then goals scored

## Time Estimation

The app estimates total tournament time based on:
- 15 minutes per match
- 5 minutes between matches
- Total number of matches required

Example estimates:
- 8 players (single elimination): ~2 hours
- 16 players (group stage): ~4.5 hours
- 32 players (single elimination): ~8 hours

## Project Structure

```
fifa-bracket/
├── server.js           # Express backend with REST API
├── package.json        # Dependencies and scripts
├── public/             # Frontend files
│   ├── index.html      # Main HTML structure
│   ├── styles.css      # Styling and responsive design
│   └── app.js          # Frontend JavaScript logic
└── data/               # Tournament data storage (JSON files)
```

## API Endpoints

### Tournaments
- `POST /api/tournaments` - Create new tournament
- `GET /api/tournaments` - List all tournaments
- `GET /api/tournaments/:id` - Get specific tournament
- `DELETE /api/tournaments/:id` - Delete tournament

### Matches
- `POST /api/tournaments/:id/matches/:matchId/score` - Update match score

## Technology Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript (no framework dependencies)
- **Storage**: JSON file-based persistence
- **Styling**: Custom CSS with responsive design

## Development

To run in development mode with auto-restart:

```bash
npm install --save-dev nodemon
npm run dev
```

## Future Enhancement Ideas

Here are some ideas for expanding the app:

1. **Stats Tracking**: Player win/loss records across tournaments
2. **Best-of Series**: Support for best-of-3 or best-of-5 matches
3. **Random Team Selection**: Auto-assign teams for fairness
4. **Swiss System**: Alternative tournament format
5. **Live Timer**: Real-time match duration tracking
6. **Player Profiles**: Stats, avatars, and rankings
7. **Double Elimination**: Losers bracket support
8. **Export Results**: PDF/CSV export of tournament results
9. **Team Builder**: Random team composition for 2v2 modes
10. **Match History**: Detailed match replay and statistics

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this for your own tournaments!

## Credits

Built for FIFA enthusiasts who love competitive gaming and clean tournament organization.
