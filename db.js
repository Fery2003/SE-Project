const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    password: 'YahiaEhab10',
    host: 'localhost',
    database: 'postgres',
    port: 5432
});

module.exports = pool;
