const { Channels } = require("../model/Channels");

module.exports = {
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
        blockHeight: {
            type: "integer",
            default: 0,
        },
    },
};
