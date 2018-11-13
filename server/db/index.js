const { join } = require("path");

const { createConnection } = require("typeorm");
const { SqliteDriver } = require("typeorm/driver/sqlite/SqliteDriver");
const PlatformTools = require("typeorm/platform/PlatformTools");

SqliteDriver.prototype.loadDependencies = function loadDependencies() {
    this.sqlite = PlatformTools.PlatformTools.load("@journeyapps/sqlcipher").verbose();
};

const CONNECTION_NAME = "wallet_db";

let connection;

module.exports = {
    init: async ({ dbPath, dbPass, dbType = "sqlite", isDev = false }) => { // eslint-disable-line object-curly-newline
        connection = await createConnection({
            name: CONNECTION_NAME,
            type: dbType,
            database: dbPath,
            key: `'${dbPass}'`,
            synchronize: false,
            logging: isDev,
            entities: [
                join(__dirname, "entity", "*.js"),
            ],
        });
        await connection.query("PRAGMA foreign_keys = OFF;");
        await connection.synchronize();
        await connection.query("PRAGMA foreign_keys = ON;");
        return connection;
    },
    close: async () => {
        if (connection) {
            if (connection.isConnected) {
                await connection.close();
            }
            connection = null;
        }
    },
    get: () => {
        if (!connection) {
            throw new Error("DB not initialized. call init() prior to get()");
        }
        return connection;
    },
    insert: async ({ alias, model, values }) => {
        if (!connection) {
            throw new Error("DB not initialized. call init() first");
        }
        await connection
            .createQueryBuilder(model, alias)
            .insert()
            .values(values)
            .execute();
    },
    update: ({ alias, model, values, where }) => { // eslint-disable-line object-curly-newline
        if (!connection) {
            throw new Error("DB not initialized. call init() first");
        }
        const request = connection
            .createQueryBuilder(model, alias)
            .update()
            .set(values);
        if (where) {
            request.where(where.query, where.values);
        }
        return request.execute();
    },
};
