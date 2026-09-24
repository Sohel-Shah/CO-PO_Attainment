// Creates the co_po_attainment database if it doesn't exist
// Run: node prisma/createdb.js
require("dotenv").config({ path: __dirname + "/../.env" });
const { Client } = require("pg");

async function main() {
    // Connect to the default 'postgres' database to issue CREATE DATABASE
    const client = new Client({
        host: "localhost",
        port: 5433,
        user: "postgres",
        password: "Kunal123",
        database: "postgres",          // always exists
    });

    try {
        await client.connect();
        const res = await client.query(
            `SELECT 1 FROM pg_database WHERE datname = 'co_po_attainment'`
        );
        if (res.rowCount === 0) {
            await client.query(`CREATE DATABASE co_po_attainment`);
            console.log("✅  Database 'co_po_attainment' created successfully.");
        } else {
            console.log("ℹ️   Database 'co_po_attainment' already exists — skipping.");
        }
    } catch (err) {
        console.error("❌  Error:", err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
