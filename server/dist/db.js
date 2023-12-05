"use strict";
const { Pool } = require('pg');
const pool = new Pool({
    user: "postgres",
    password: "password",
    host: "localhost",
    database: "tfdsatemp",
    port: 5432
});
module.exports = pool;
