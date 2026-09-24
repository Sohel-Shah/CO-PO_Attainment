const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { PrismaClient } = require("@prisma/client");

class Database {
    constructor() {
        if (!Database.instance) {
            this.prisma = new PrismaClient();
            Database.instance = this;
        }
        return Database.instance;
    }
}

const db = new Database();
module.exports = db.prisma;
