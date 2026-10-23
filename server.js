// Express
const express = require('express');
const app = express();

app.use(express.static('public'));
// Let's the panel run programs on server
const { execFile } = require('child_process');


//Port where the panel runs
const PORT = 3000;




app.get('/about', (req, res) => {
    res.send('This is gonna be an awesome server panel for my valheim server ♥');
});

app.get('/api/status', (req, res) => {
    execFile('systemctl', ['is-active', 'valheim'], (error, stdout) => {
        const status = stdout.trim();
        const isActive = status === 'active'

        if (status === '') {
            return res.json({running: 'unknown', checkedAt: new Date().toISOString()});
        }

        res.json({ running: isActive, checkedAt: "date" });
    });
});

app.listen(PORT, () => {
    console.log(`Panel running on http://localhost:${PORT}`);
});