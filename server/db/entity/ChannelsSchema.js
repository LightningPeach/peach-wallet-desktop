const { EntitySchema } = require("typeorm");

const { Channels } = require("../model/Channels");

module.exports = new EntitySchema({
    target: Channels,
    columns: {
        fundingTxid: {
            primary: true,
            type: "varchar",
            generated: false,
        },
        name: {
            type: "varchar",
        },
        status: {
            type: "varchar",
            default: "pending",
        },
        activeStatus: {
            type: "integer",
            default: 0,
        },
        localBalance: {
            type: "integer",
            default: 0,
        },
        remoteBalance: {
            type: "integer",
            default: 0,
        },
    },
});
