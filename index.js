const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

let players = [
    { name: 'Alice', position: 1 },
    { name: 'Bob', position: 1 }
];
const snakes = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
const ladders = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/app/index.html'));
});

app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, '/app/game/index.html'));
});
app.use('/game', express.static(path.join(__dirname, '/app/game')));

app.use('/images', express.static(path.join(__dirname, '/app/images')));

app.get('/api/status', (req, res) => {
    res.json({ status: 'Game is running', players });
});

app.get('/api/roll/:playerIdx', (req, res) => {
    const idx = parseInt(req.params.playerIdx, 10);
    if (isNaN(idx) || idx < 0 || idx >= players.length) {
        return res.status(400).json({ error: 'Invalid player index' });
    }
    const roll = Math.floor(Math.random() * 6) + 1;
    let pos = players[idx].position + roll;
    if (snakes[pos]) pos = snakes[pos];
    if (ladders[pos]) pos = ladders[pos];
    if (pos > 100) pos = players[idx].position; 
    players[idx].position = pos;
    res.json({ roll, position: pos });
});

app.get('/api/leaderboard', (req, res) => {
    const leaderboard = [...players].sort((a, b) => b.position - a.position);
    res.json(leaderboard);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});