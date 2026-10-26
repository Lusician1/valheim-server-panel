require('dotenv').config();
const required = ['SESSION_SECRET', 'PANEL_PASSWORD_HASH'];
const missing = required.filter(name => !process.env[name])

if (missing.length > 0) {
    console.error(`Missing in .env: ${missing.join(', ')}. See .env.example`);
    process.exit(1);
};


// Express
const express = require('express');
const app = express();
const session = require('express-session');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1 * 60 * 60 * 1000   // 8 hours
    }
}));

app.set('view engine', 'ejs');

// Import scripts
const { checkPassword } = require('./lib/auth');
const { getStatus } = require('./lib/valheim');

//Port where the panel runs
const PORT = process.env.PORT || 3000;


app.get('/', async (req, res) => {
    data = await getStatus()
    res.render('index', {...data, panelName: process.env.PANEL_NAME || "Panel" });
})

app.get('/about', (req, res) => {
    res.send('This is gonna be an awesome server panel for my valheim server ♥');
});

app.get('/api/status', async (req, res) => {
    res.json(await getStatus());
});

app.listen(PORT, () => {
    console.log(`Panel running on http://localhost:${PORT}`);
});