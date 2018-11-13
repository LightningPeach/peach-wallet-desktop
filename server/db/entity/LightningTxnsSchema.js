const { EntitySchema } = require("typeorm");

const { LightningTxns } = require("../model/LightningTxns");

module.exports = new EntitySchema({
    target: LightningTxns,
    columns: {
        paymentHash: {
            primary: true,
            type: "varchar",
            generated: false,
        },
        name: {
            type: "varchar",
            default: "payment",
        },
    },
});
