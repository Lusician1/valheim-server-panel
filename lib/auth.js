const bcrypt = require('bcryptjs');

function checkPassword(password) {
    return bcrypt.compare(password, process.env.PANEL_PASSWORD_HASH);
}

function requireLogin(req, res, next){
    if(req.session.loggedIn) {
        return next();
    }

    if(req.path.startsWith('/api/')){
        return res.status(401).json({ error: 'Not logged in' })
    }
    res.redirect('/login')
}

module.exports = { checkPassword, requireLogin };