const { Client } = require('pg');

const client = new Client({
    user: "username",
    host: "local_host",
    database: "database_name",
    password: "pw",
    port: 5432
});

module.exports = client;