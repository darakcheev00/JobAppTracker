const { Pool } = require('pg');

const pool = new Pool({
    user: "daniel_dev",
    password: "changeme",
    host: "postgres",
    database: "daniel_dev",
    port: 5432
});

module.exports = pool;