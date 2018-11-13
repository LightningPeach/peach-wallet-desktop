const { EntitySchema } = require("typeorm");

const { Contacts } = require("../model/Contacts");

module.exports = new EntitySchema({
    target: Contacts,
    columns: {
        lightningID: {
            primary: true,
            type: "varchar",
            generated: false,
        },
        name: {
            type: "varchar",
        },
    },
});
