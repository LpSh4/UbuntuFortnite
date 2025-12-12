const { Pool } = require('pg');
const prompt = require('prompt-sync')();
const pool = new Pool({
    user: 'postgres',
    host: prompt('Enter the host: '),
    database: 'applications',
    password: prompt('DB password: '),
    port: prompt('DB port: '),
});


module.exports = {
    query: (text, params) => pool.query(text, params),
};