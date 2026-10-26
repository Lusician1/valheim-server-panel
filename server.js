require('dotenv').config();

// Express
const express = require('express');
const app = express();


app.use(express.static('public'));
app.set('view engine', 'ejs');

// Import scripts
const { getStatus } = require('./lib/valheim');

//Port where the panel runs
const PORT = process.env.PORT || 3000;


app.get('/', async (req, res) => {
    data = await getStatus()
    res.render('index', data)
})

app.get('/about', (req, res) => {
    res.send('This is gonna be an awesome server panel for my valheim server ♥');
});

app.get('/api/status', async (req, res) => {
    res.json(await getStatus())
});

app.listen(PORT, () => {
    console.log(`Panel running on http://localhost:${PORT}`);
});