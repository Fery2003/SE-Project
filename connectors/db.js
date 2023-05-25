// import the knex library that will allow us to
// construct SQL statements
const knex = require('knex');
const {Pool} = require('pg');

// define the configuration settings to connect
// to our local postgres server
const config = {
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '86032125',
    database: 'se_project23',
  }
};

// create the connection with postgres
const db = knex(config);
const pool = new Pool(config)


// expose the created connection so we can
// use it in other files to make sql statements
module.exports = db;
module.exports = pool;
