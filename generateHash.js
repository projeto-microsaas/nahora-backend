const bcrypt = require('bcryptjs');

const password = 'password123';
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);
console.log('Hash gerado:', hash);