const bcrypt = require('bcryptjs');

function checkPassword(password) {
    return bcrypt.compare(password, process.env.PANEL_PASSWORD_HASH);
}

module.exports = { checkPassword };