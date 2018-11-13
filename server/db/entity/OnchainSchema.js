const { EntitySchema } = require("typeorm");

const { Onchain } = require("../model/Onchain");

module.exports = new EntitySchema({
    target: Onchain,
    columns: {
        txHash: {
            primary: true,
            type: "varchar",
            generated: false,
        },
        name: {
            type: "varchar",
            default: "",
        },
        timeStamp: {
            type: "integer",
        },
        address: {
            type: "varchar",
        },
        status: {
            type: "varchar",
            default: "pending",
        },
        amount: {
            type: "integer",
        },
        blockHash: {
            type: "varchar",
            default: "",
        },
        numConfirmations: {
            type: "integer",
            default: 0,
        },
        blockHeight: {
            type: "integer",
            default: 0,
        },
        totalFees: {
            type: "integer",
            default: 0,
        },
    },
});
