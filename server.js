const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Parse JSON bodies from the controller
app.use(express.json());

// In-memory game state (resets when server restarts)
let players = []; // array of { name }
let choices = {}; // { [name]: 'rock' | 'paper' | 'scissors' }
let lastEvent = ''; // string like "Alice pressed the button"
let resultText = ''; // final outcome description

function resetRoundIfReady() {
    if (players.length === 2) {
        choices = {};
        resultText = '';
        lastEvent = 'New round started.';
        console.log(lastEvent);
    }
}

function decideWinner() {
    if (players.length !== 2) return;

    const [p1, p2] = players;
    const c1 = choices[p1.name];
    const c2 = choices[p2.name];

    if (!c1 || !c2) return;

    if (c1 === c2) {
        resultText = `${p1.name} chose ${c1}, ${p2.name} chose ${c2}. It's a tie!`;
        return;
    }

    const beats = {
        rock: 'scissors',
        paper: 'rock',
        scissors: 'paper',
    };

    if (beats[c1] === c2) {
        resultText = `${p1.name} chose ${c1}, ${p2.name} chose ${c2}. ${p1.name} wins!`;
    } else {
        resultText = `${p1.name} chose ${c1}, ${p2.name} chose ${c2}. ${p2.name} wins!`;
    }
}

// Main enter screen
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'enterScreen.html'));
});

// Serve the static HTML/CSS/JS from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Player joins (called from playerController.html after entering a name)
app.post('/player-joined', (req, res) => {
    const { name } = req.body || {};
    const safeName = (name && String(name).trim()) || 'Unknown player';

    // Game supports only 2 players
    const existing = players.find((p) => p.name === safeName);
    if (!existing && players.length >= 2) {
        return res.status(400).json({ ok: false, error: 'Game already has two players.' });
    }

    if (!existing) {
        players.push({ name: safeName });
        resetRoundIfReady();
    }

    lastEvent = `${safeName} joined.`;
    console.log(lastEvent);

    res.status(200).json({ ok: true, players, lastEvent });
});

// Player sends their choice (rock/paper/scissors)
app.post('/choice', (req, res) => {
    const { name, choice } = req.body || {};
    const safeName = (name && String(name).trim()) || 'Unknown player';
    const normalizedChoice = (choice && String(choice).toLowerCase()) || '';

    if (!['rock', 'paper', 'scissors'].includes(normalizedChoice)) {
        return res.status(400).json({ ok: false, error: 'Invalid choice.' });
    }

    const playerExists = players.find((p) => p.name === safeName);
    if (!playerExists) {
        return res.status(400).json({ ok: false, error: 'Player has not joined.' });
    }

    choices[safeName] = normalizedChoice;
    lastEvent = `${safeName} has chosen.`;
    console.log(lastEvent);

    // If both players have chosen, decide winner
    decideWinner();
    if (resultText) {
        console.log(`Round result: ${resultText}`);
    }

    const allChosen =
        players.length === 2 &&
        players.every((p) => Boolean(choices[p.name]));

    res.status(200).json({
        ok: true,
        allChosen,
        result: resultText,
    });
});

// Enter screen polls this to know who joined and what happened last
app.get('/player-state', (req, res) => {
    const allChosen =
        players.length === 2 &&
        players.every((p) => Boolean(choices[p.name]));

    let phase = 'waitingForPlayers';
    if (players.length === 2 && !allChosen) {
        phase = 'waitingForChoices';
    } else if (players.length === 2 && allChosen) {
        phase = 'showResult';
    }

    res.json({
        players,
        lastEvent,
        phase,
        result: resultText,
    });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running and listening on port ${PORT}`);
});