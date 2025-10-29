const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Data directory
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Helper functions
function saveTournament(tournament) {
  const filePath = path.join(DATA_DIR, `${tournament.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(tournament, null, 2));
  return tournament;
}

function loadTournament(id) {
  const filePath = path.join(DATA_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return null;
}

function getAllTournaments() {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => {
    const tournament = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
    return {
      id: tournament.id,
      name: tournament.name,
      playerCount: tournament.playerCount,
      format: tournament.format,
      gameMode: tournament.gameMode,
      status: tournament.status,
      createdAt: tournament.createdAt
    };
  });
}

// Bracket generation
function generateBracket(players, format) {
  if (format === 'single-elimination') {
    return generateSingleElimination(players);
  } else if (format === 'group-stage') {
    return generateGroupStage(players);
  }
}

function generateSingleElimination(players) {
  // Shuffle and pad to next power of 2
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(shuffled.length)));
  const rounds = [];

  // First round with byes if needed
  const firstRoundMatches = [];
  let matchCounter = 0;

  for (let i = 0; i < nextPowerOf2 / 2; i++) {
    const player1 = shuffled[i * 2] || null;
    const player2 = shuffled[i * 2 + 1] || null;

    firstRoundMatches.push({
      id: `match-${matchCounter++}`,
      roundIndex: 0,
      matchIndex: i,
      team1: player1,
      team2: player2,
      score1: null,
      score2: null,
      winner: player1 && !player2 ? player1 : null, // Auto-win on bye
      status: player1 && !player2 ? 'completed' : 'pending'
    });
  }

  rounds.push(firstRoundMatches);

  // Generate placeholder rounds
  let numMatches = nextPowerOf2 / 2;
  let roundIndex = 1;
  while (numMatches > 1) {
    numMatches = numMatches / 2;
    const roundMatches = [];
    for (let i = 0; i < numMatches; i++) {
      roundMatches.push({
        id: `match-${matchCounter++}`,
        roundIndex,
        matchIndex: i,
        team1: null,
        team2: null,
        score1: null,
        score2: null,
        winner: null,
        status: 'pending'
      });
    }
    rounds.push(roundMatches);
    roundIndex++;
  }

  return rounds;
}

function generateGroupStage(players) {
  // Split into groups of 4
  const groupSize = 4;
  const numGroups = Math.ceil(players.length / groupSize);
  const groups = [];

  const shuffled = [...players].sort(() => Math.random() - 0.5);

  for (let g = 0; g < numGroups; g++) {
    const groupPlayers = shuffled.slice(g * groupSize, (g + 1) * groupSize);
    const matches = [];
    let matchCounter = 0;

    // Round robin within group
    for (let i = 0; i < groupPlayers.length; i++) {
      for (let j = i + 1; j < groupPlayers.length; j++) {
        matches.push({
          id: `group-${g}-match-${matchCounter++}`,
          groupIndex: g,
          team1: groupPlayers[i],
          team2: groupPlayers[j],
          score1: null,
          score2: null,
          winner: null,
          status: 'pending'
        });
      }
    }

    groups.push({
      name: `Group ${String.fromCharCode(65 + g)}`,
      players: groupPlayers,
      matches,
      standings: groupPlayers.map(p => ({
        player: p,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
      }))
    });
  }

  return groups;
}

function calculateTimeEstimate(playerCount, format, gameMode) {
  const matchDuration = 15; // minutes per match
  const breakTime = 5; // minutes between matches

  let totalMatches;
  if (format === 'single-elimination') {
    totalMatches = playerCount - 1; // n-1 matches in elimination
  } else if (format === 'group-stage') {
    const groupSize = 4;
    const numGroups = Math.ceil(playerCount / groupSize);
    const groupMatches = numGroups * (groupSize * (groupSize - 1) / 2); // Round robin per group
    const knockoutPlayers = numGroups * 2; // Top 2 from each group
    const knockoutMatches = knockoutPlayers - 1;
    totalMatches = groupMatches + knockoutMatches;
  }

  const totalMinutes = (matchDuration * totalMatches) + (breakTime * (totalMatches - 1));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    totalMatches,
    totalMinutes,
    formatted: `${hours}h ${minutes}m`,
    estimatedEnd: new Date(Date.now() + totalMinutes * 60000).toISOString()
  };
}

// API Routes

// Create tournament
app.post('/api/tournaments', (req, res) => {
  try {
    const { name, players, format, gameMode, useSeeding } = req.body;

    if (!name || !players || !format || !gameMode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (players.length < 2 || players.length > 32) {
      return res.status(400).json({ error: 'Player count must be between 2 and 32' });
    }

    const tournament = {
      id: uuidv4(),
      name,
      playerCount: players.length,
      players,
      format,
      gameMode,
      useSeeding: useSeeding || false,
      status: 'active',
      currentRound: 0,
      createdAt: new Date().toISOString(),
      timeEstimate: calculateTimeEstimate(players.length, format, gameMode)
    };

    if (format === 'single-elimination') {
      tournament.rounds = generateBracket(players, format);
    } else if (format === 'group-stage') {
      tournament.groups = generateBracket(players, format);
      tournament.knockoutRounds = null; // Will be generated after group stage
    }

    saveTournament(tournament);
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tournaments
app.get('/api/tournaments', (req, res) => {
  try {
    const tournaments = getAllTournaments();
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tournament by ID
app.get('/api/tournaments/:id', (req, res) => {
  try {
    const tournament = loadTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update match score
app.post('/api/tournaments/:id/matches/:matchId/score', (req, res) => {
  try {
    const { score1, score2 } = req.body;
    const tournament = loadTournament(req.params.id);

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    let match = null;
    let matchLocation = null;

    // Find match in rounds or groups
    if (tournament.rounds) {
      for (let r = 0; r < tournament.rounds.length; r++) {
        const found = tournament.rounds[r].find(m => m.id === req.params.matchId);
        if (found) {
          match = found;
          matchLocation = { type: 'round', roundIndex: r };
          break;
        }
      }
    } else if (tournament.groups) {
      for (let g = 0; g < tournament.groups.length; g++) {
        const found = tournament.groups[g].matches.find(m => m.id === req.params.matchId);
        if (found) {
          match = found;
          matchLocation = { type: 'group', groupIndex: g };
          break;
        }
      }
    }

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Update match
    match.score1 = parseInt(score1);
    match.score2 = parseInt(score2);
    match.status = 'completed';

    if (match.score1 > match.score2) {
      match.winner = match.team1;
    } else if (match.score2 > match.score1) {
      match.winner = match.team2;
    } else {
      match.winner = 'draw';
    }

    // Update group standings if applicable
    if (matchLocation.type === 'group') {
      const group = tournament.groups[matchLocation.groupIndex];
      const standing1 = group.standings.find(s => s.player.name === match.team1.name);
      const standing2 = group.standings.find(s => s.player.name === match.team2.name);

      standing1.played++;
      standing2.played++;
      standing1.goalsFor += match.score1;
      standing1.goalsAgainst += match.score2;
      standing2.goalsFor += match.score2;
      standing2.goalsAgainst += match.score1;

      if (match.score1 > match.score2) {
        standing1.won++;
        standing1.points += 3;
        standing2.lost++;
      } else if (match.score2 > match.score1) {
        standing2.won++;
        standing2.points += 3;
        standing1.lost++;
      } else {
        standing1.drawn++;
        standing2.drawn++;
        standing1.points += 1;
        standing2.points += 1;
      }

      standing1.goalDifference = standing1.goalsFor - standing1.goalsAgainst;
      standing2.goalDifference = standing2.goalsFor - standing2.goalsAgainst;

      // Sort standings
      group.standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });
    }

    // Advance winner to next round if applicable
    if (matchLocation.type === 'round' && match.winner && match.winner !== 'draw') {
      const roundIndex = matchLocation.roundIndex;
      if (roundIndex < tournament.rounds.length - 1) {
        const nextRound = tournament.rounds[roundIndex + 1];
        const nextMatchIndex = Math.floor(match.matchIndex / 2);
        const nextMatch = nextRound[nextMatchIndex];

        if (match.matchIndex % 2 === 0) {
          nextMatch.team1 = match.winner;
        } else {
          nextMatch.team2 = match.winner;
        }
      }
    }

    saveTournament(tournament);
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete tournament
app.delete('/api/tournaments/:id', (req, res) => {
  try {
    const filePath = path.join(DATA_DIR, `${req.params.id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Tournament deleted' });
    } else {
      res.status(404).json({ error: 'Tournament not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`FIFA Tournament server running on http://localhost:${PORT}`);
});
