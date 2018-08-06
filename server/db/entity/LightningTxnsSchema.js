const { LightningTxns } = require("../model/LightningTxns");

module.exports = {
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
};
