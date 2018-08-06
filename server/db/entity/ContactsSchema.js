const { Contacts } = require("../model/Contacts");

module.exports = {
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
};
