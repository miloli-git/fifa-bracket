let currentTournament = null;
let currentMatch = null;

// Navigation
function showMainMenu() {
    hideAllSections();
    document.getElementById('main-menu').style.display = 'block';
}

function showCreateTournament() {
    hideAllSections();
    document.getElementById('create-tournament').style.display = 'block';
    generatePlayerInputs();
}

function showTournamentList() {
    hideAllSections();
    document.getElementById('tournament-list').style.display = 'block';
    loadTournaments();
}

function showTournamentView(tournamentId) {
    hideAllSections();
    document.getElementById('tournament-view').style.display = 'block';
    loadTournament(tournamentId);
}

function hideAllSections() {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.style.display = 'none');
}

// Player Input Generation
function generatePlayerInputs() {
    const count = parseInt(document.getElementById('player-count').value);
    const gameMode = document.getElementById('game-mode').value;
    const playerList = document.getElementById('player-list');

    playerList.innerHTML = '';

    for (let i = 1; i <= count; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'player-input';
        input.name = `player-${i}`;
        input.placeholder = gameMode === '2v2' ? `Team ${i}` : `Player ${i}`;
        input.required = true;
        playerList.appendChild(input);
    }

    updateTimeEstimate();
}

// Update time estimate
function updateTimeEstimate() {
    const count = parseInt(document.getElementById('player-count').value);
    const format = document.getElementById('tournament-format').value;
    const matchDuration = 15;
    const breakTime = 5;

    let totalMatches;
    if (format === 'single-elimination') {
        totalMatches = count - 1;
    } else if (format === 'group-stage') {
        const groupSize = 4;
        const numGroups = Math.ceil(count / groupSize);
        const groupMatches = numGroups * (groupSize * (groupSize - 1) / 2);
        const knockoutPlayers = numGroups * 2;
        const knockoutMatches = knockoutPlayers - 1;
        totalMatches = groupMatches + knockoutMatches;
    }

    const totalMinutes = (matchDuration * totalMatches) + (breakTime * (totalMatches - 1));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const estimateBox = document.getElementById('time-estimate');
    const estimateText = document.getElementById('estimate-text');
    estimateBox.style.display = 'block';
    estimateText.innerHTML = `
        <strong>Total Matches:</strong> ${totalMatches}<br>
        <strong>Estimated Duration:</strong> ${hours}h ${minutes}m<br>
        <small>Based on 15 min per match + 5 min breaks</small>
    `;
}

// Event listeners for form changes
document.getElementById('player-count').addEventListener('change', () => {
    generatePlayerInputs();
});

document.getElementById('game-mode').addEventListener('change', () => {
    generatePlayerInputs();
});

document.getElementById('tournament-format').addEventListener('change', () => {
    updateTimeEstimate();
});

// Tournament Form Submission
document.getElementById('tournament-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('tournament-name').value;
    const gameMode = document.getElementById('game-mode').value;
    const format = document.getElementById('tournament-format').value;
    const useSeeding = document.getElementById('use-seeding').checked;

    // Collect players
    const playerInputs = document.querySelectorAll('.player-input');
    const players = Array.from(playerInputs).map((input, index) => ({
        id: index + 1,
        name: input.value.trim(),
        seed: useSeeding ? index + 1 : null
    }));

    // Validation
    if (players.some(p => !p.name)) {
        alert('Please fill in all player names');
        return;
    }

    if (format === 'group-stage' && players.length < 8) {
        alert('Group stage format requires at least 8 players');
        return;
    }

    try {
        const response = await fetch('/api/tournaments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                players,
                format,
                gameMode,
                useSeeding
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create tournament');
        }

        const tournament = await response.json();
        showTournamentView(tournament.id);
    } catch (error) {
        alert('Error creating tournament: ' + error.message);
    }
});

// Load Tournaments
async function loadTournaments() {
    try {
        const response = await fetch('/api/tournaments');
        const tournaments = await response.json();

        const container = document.getElementById('tournaments-container');

        if (tournaments.length === 0) {
            container.innerHTML = '<p style="color: var(--text-gray);">No tournaments yet. Create one to get started!</p>';
            return;
        }

        container.innerHTML = tournaments.map(t => `
            <div class="tournament-card" onclick="showTournamentView('${t.id}')">
                <h3>${t.name}</h3>
                <div class="tournament-card-info">
                    <span>${t.format === 'single-elimination' ? 'Single Elimination' : 'Group Stage + Knockout'}</span>
                    <span>${t.gameMode}</span>
                    <span>${t.playerCount} players</span>
                    <span>${t.status}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        alert('Error loading tournaments: ' + error.message);
    }
}

// Load Tournament
async function loadTournament(id) {
    try {
        const response = await fetch(`/api/tournaments/${id}`);

        if (!response.ok) {
            throw new Error('Tournament not found');
        }

        currentTournament = await response.json();
        renderTournament(currentTournament);
    } catch (error) {
        alert('Error loading tournament: ' + error.message);
        showTournamentList();
    }
}

// Render Tournament
function renderTournament(tournament) {
    // Header
    document.getElementById('tournament-title').textContent = tournament.name;
    document.getElementById('tournament-format-display').textContent =
        tournament.format === 'single-elimination' ? 'Single Elimination' : 'Group Stage + Knockout';
    document.getElementById('tournament-mode-display').textContent = tournament.gameMode;
    document.getElementById('tournament-player-count').textContent = `${tournament.playerCount} players`;

    // Stats
    document.getElementById('total-matches').textContent = tournament.timeEstimate.totalMatches;
    document.getElementById('estimated-time').textContent = tournament.timeEstimate.formatted;
    document.getElementById('tournament-status').textContent = tournament.status;

    // Show appropriate view
    if (tournament.format === 'group-stage') {
        document.getElementById('groups-view').style.display = 'block';
        document.getElementById('bracket-view').style.display = 'none';
        renderGroups(tournament.groups);
    } else {
        document.getElementById('groups-view').style.display = 'none';
        document.getElementById('bracket-view').style.display = 'block';
        renderBracket(tournament.rounds);
    }
}

// Render Groups
function renderGroups(groups) {
    const container = document.getElementById('groups-container');

    container.innerHTML = groups.map((group, index) => `
        <div class="group">
            <h4>${group.name}</h4>

            <table class="group-table">
                <thead>
                    <tr>
                        <th>Pos</th>
                        <th>Team</th>
                        <th>P</th>
                        <th>W</th>
                        <th>D</th>
                        <th>L</th>
                        <th>GF</th>
                        <th>GA</th>
                        <th>GD</th>
                        <th>Pts</th>
                    </tr>
                </thead>
                <tbody>
                    ${group.standings.map((standing, pos) => `
                        <tr>
                            <td>${pos + 1}</td>
                            <td>${standing.player.name}</td>
                            <td>${standing.played}</td>
                            <td>${standing.won}</td>
                            <td>${standing.drawn}</td>
                            <td>${standing.lost}</td>
                            <td>${standing.goalsFor}</td>
                            <td>${standing.goalsAgainst}</td>
                            <td>${standing.goalDifference > 0 ? '+' : ''}${standing.goalDifference}</td>
                            <td><strong>${standing.points}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="group-matches">
                <h5 style="margin: 15px 0 10px 0; color: var(--primary-color);">Matches</h5>
                ${group.matches.map(match => renderMatch(match)).join('')}
            </div>
        </div>
    `).join('');
}

// Render Bracket
function renderBracket(rounds) {
    const container = document.getElementById('bracket-container');

    const roundNames = ['Round 1', 'Round 2', 'Quarter Finals', 'Semi Finals', 'Final'];

    container.innerHTML = `
        <div class="bracket">
            ${rounds.map((round, index) => `
                <div class="round">
                    <div class="round-title">
                        ${getRoundName(index, rounds.length)}
                    </div>
                    ${round.map(match => renderMatch(match)).join('')}
                </div>
            `).join('')}
        </div>
    `;
}

function getRoundName(index, totalRounds) {
    if (totalRounds === 1) return 'Final';
    if (index === totalRounds - 1) return 'Final';
    if (index === totalRounds - 2) return 'Semi Finals';
    if (index === totalRounds - 3) return 'Quarter Finals';
    return `Round ${index + 1}`;
}

// Render Match
function renderMatch(match) {
    const team1Name = match.team1 ? match.team1.name : 'TBD';
    const team2Name = match.team2 ? match.team2.name : 'TBD';
    const canEdit = match.status === 'pending' && match.team1 && match.team2;

    const team1Class = match.winner && match.winner.name === team1Name ? 'winner' : '';
    const team2Class = match.winner && match.winner.name === team2Name ? 'winner' : '';

    return `
        <div class="match ${match.status} ${canEdit ? 'pending' : ''}"
             ${canEdit ? `onclick="openScoreModal('${match.id}')"` : ''}>
            <div class="match-teams">
                <div class="team">
                    <span class="team-name ${team1Class}">${team1Name}</span>
                    <span class="team-score ${team1Class}">${match.score1 !== null ? match.score1 : '-'}</span>
                </div>
                <div class="team">
                    <span class="team-name ${team2Class}">${team2Name}</span>
                    <span class="team-score ${team2Class}">${match.score2 !== null ? match.score2 : '-'}</span>
                </div>
            </div>
            <div class="match-status ${match.status}">
                ${match.status}
            </div>
        </div>
    `;
}

// Score Modal
function openScoreModal(matchId) {
    currentMatch = matchId;

    // Find the match
    let match = null;
    if (currentTournament.rounds) {
        for (let round of currentTournament.rounds) {
            match = round.find(m => m.id === matchId);
            if (match) break;
        }
    } else if (currentTournament.groups) {
        for (let group of currentTournament.groups) {
            match = group.matches.find(m => m.id === matchId);
            if (match) break;
        }
    }

    if (match) {
        document.getElementById('team1-label').textContent = match.team1.name;
        document.getElementById('team2-label').textContent = match.team2.name;
        document.getElementById('score1').value = 0;
        document.getElementById('score2').value = 0;
        document.getElementById('score-modal').style.display = 'flex';
    }
}

function closeModal() {
    document.getElementById('score-modal').style.display = 'none';
    currentMatch = null;
}

async function submitScore() {
    const score1 = document.getElementById('score1').value;
    const score2 = document.getElementById('score2').value;

    try {
        const response = await fetch(`/api/tournaments/${currentTournament.id}/matches/${currentMatch}/score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ score1, score2 })
        });

        if (!response.ok) {
            throw new Error('Failed to update score');
        }

        const updatedTournament = await response.json();
        currentTournament = updatedTournament;
        renderTournament(currentTournament);
        closeModal();
    } catch (error) {
        alert('Error updating score: ' + error.message);
    }
}

// Delete Tournament
async function deleteTournament() {
    if (!confirm('Are you sure you want to delete this tournament?')) {
        return;
    }

    try {
        const response = await fetch(`/api/tournaments/${currentTournament.id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete tournament');
        }

        showTournamentList();
    } catch (error) {
        alert('Error deleting tournament: ' + error.message);
    }
}

// Close modal on outside click
document.getElementById('score-modal').addEventListener('click', (e) => {
    if (e.target.id === 'score-modal') {
        closeModal();
    }
});

// Initialize
showMainMenu();
