const { Stream } = require("../model/Stream");
const { StreamPart } = require("../model/StreamPart");

module.exports = {
    target: Stream,
    columns: {
        id: {
            primary: true,
            type: "varchar",
            generated: false,
        },
        name: {
            type: "varchar",
        },
        totalParts: {
            type: "int",
        },
        currentPart: {
            type: "int",
        },
        price: {
            type: "int",
        },
        memo: {
            type: "varchar",
        },
        lightningID: {
            type: "varchar",
        },
        date: {
            type: "int",
        },
        status: {
            type: "varchar",
            default: "active",
        },
        delay: {
            type: "int",
        },
    },
    relations: {
        parts: {
            target: () => StreamPart,
            type: "one-to-many",
            inverseSide: "stream",
            JoinColumn: true,
        },
    },
};
