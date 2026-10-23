const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send('Hello Valheim!');
});

app.get('/about', (req, res) => {
    res.send('This is gonna be an awesome server panel for my valheim server ♥');
});

app.get('/api/status', (req, res) => {
    res.json({ status: 'unknown' });
});

app.listen(PORT, () => {
    console.log(`Panel running on http://localhost:${PORT}`);
});