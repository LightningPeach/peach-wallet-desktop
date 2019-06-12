const { EntitySchema } = require("typeorm");

const { Config } = require("../model/Config");

module.exports = new EntitySchema({
    target: Config,
    columns: {
        lightningId: {
            primary: true,
            type: "varchar",
            generated: false,
        },
        createChannelViewed: {
            type: "integer",
        },
        activeMeasure: {
            type: "varchar",
            default: "mBTC",
        },
        systemNotifications: {
            type: "integer",
            default: "0",
        },
        analytics: {
            type: "varchar",
            default: "",
        },
        terms: {
            type: "integer",
            default: 0,
        },
        walletMode: {
            type: "varchar",
            default: "",
        },
        legalVersion: {
            type: "varchar",
            default: "",
        },
    },
});
