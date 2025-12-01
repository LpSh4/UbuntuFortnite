const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',       // Замените на ваше
    host: 'localhost',
    database: 'applications',         // Имя БД, которую вы создали
    password: '8585', // Замените на ваше
    port: 5432,
});


module.exports = {
    query: (text, params) => pool.query(text, params),
};