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
const expressLayouts = require('express-ejs-layouts');

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
app.use(expressLayouts);
app.locals.panelName = process.env.PANEL_NAME;

// Import scripts
const { checkPassword, requireLogin } = require('./lib/auth');
const { getStatus } = require('./lib/valheim');

//Port where the panel runs
const PORT = process.env.PORT || 3000;


app.get('/', requireLogin, async (req, res) => {
    data = await getStatus()
    res.render('index', { ...data, script: '/app.js' });
})

app.get('/login', (req, res) => {
    res.render('login', { error: null, panelName: process.env.PANEL_NAME });
});

app.post('/login', async (req, res) => {
    const ok = await checkPassword(req.body.password || '');

    if (!ok) {
        return res.status(401).render('login', {
            error: 'Wrong password',
            panelName: process.env.PANEL_NAME
        });
    }

    req.session.regenerate((err) => {
        if (err) {
            return res.status(500).send('Session error');
        }
        req.session.loggedIn = true;
        res.redirect('/');
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

app.get('/about', (req, res) => {
    res.send('This is gonna be an awesome server panel for my valheim server ♥');
});

app.post('/api/server/:action', requireLogin, async (req, res) => {
    try {
        await controlServer(req.params.action);
        res.json({ ok: true, ...(await getStatus()) });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message});
    }
});

app.get('/api/status', requireLogin, async (req, res) => {
    res.json(await getStatus());
});

app.listen(PORT, () => {
    console.log(`Panel running on http://localhost:${PORT}`);
});