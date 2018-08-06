const { Config } = require("../model/Config");

module.exports = {
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
        lightningPaymentViewed: {
            type: "integer",
        },
        activeMeasure: {
            type: "varchar",
            default: "mBTC",
        },
    },
};
