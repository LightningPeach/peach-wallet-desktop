const { createConnection } = require("typeorm");
const { SqliteDriver } = require("typeorm/driver/sqlite/SqliteDriver");
const PlatformTools = require("typeorm/platform/PlatformTools");
const StreamPartSchema = require("./entity/StreamPartSchema");
const StreamSchema = require("./entity/StreamSchema");
const ContactsSchema = require("./entity/ContactsSchema");
const ChannelsSchema = require("./entity/ChannelsSchema");
const OnchainSchema = require("./entity/OnchainSchema");
const LightningTxnsSchema = require("./entity/LightningTxnsSchema");
const ConfigSchema = require("./entity/ConfigSchema");

SqliteDriver.prototype.loadDependencies = function loadDependencies() {
    this.sqlite = PlatformTools.PlatformTools.load("@journeyapps/sqlcipher").verbose();
};
SqliteDriver.prototype.createDatabaseConnection = function createDatabaseConnection() {
    return new Promise(async (ok, fail) => {
        await this.createDatabaseDirectory(this.options.database);
        const databaseConnection = new this.sqlite.Database(this.options.database, (err) => {
            if (err) {
                fail(err);
                return;
            }
            // we need to enable foreign keys in sqlite to make sure all foreign key related features
            // working properly. this also makes onDelete to work with sqlite.
            databaseConnection.run("PRAGMA foreign_keys = ON;", (err1, result1) => {
                if (err) {
                    fail(err);
                    return;
                }
                if (!this.options.password) {
                    ok(databaseConnection);
                    return;
                }
                databaseConnection.run(`PRAGMA KEY = '${this.options.password}';`, (err2, result2) => {
                    if (err) {
                        fail(err);
                        return;
                    }
                    ok(databaseConnection);
                });
            });
        });
    });
};

const CONNECTION_NAME = "wallet_db";

let connection;

module.exports = {
    init: async ({ dbPath, dbPass, dbType = "sqlite", isDev = false }) => { // eslint-disable-line object-curly-newline
        connection = await createConnection({
            name: CONNECTION_NAME,
            type: dbType,
            database: dbPath,
            password: dbPass,
            synchronize: true,
            logging: isDev,
            entitySchemas: [
                StreamPartSchema,
                StreamSchema,
                ContactsSchema,
                ChannelsSchema,
                OnchainSchema,
                LightningTxnsSchema,
                ConfigSchema,
            ],
        });
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
