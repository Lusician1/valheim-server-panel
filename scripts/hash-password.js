const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
    console.log('Usage: node scripts/hash-password.js <password>');
    process.exit(1);
}

console.log(bcrypt.hashSync(password, 12));