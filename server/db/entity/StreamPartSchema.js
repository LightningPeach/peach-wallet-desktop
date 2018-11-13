const { EntitySchema } = require("typeorm");

const { StreamPart } = require("../model/StreamPart");
const { Stream } = require("../model/Stream");

module.exports = new EntitySchema({
    target: StreamPart,
    columns: {
        payment_hash: {
            primary: true,
            type: "varchar",
        },
    },
    relations: {
        stream: {
            target: () => Stream,
            type: "many-to-one",
            inverseSide: "parts",
        },
    },
});
