import { DB } from "config/node-settings";
import { exceptions } from "config";
import { errorPromise, successPromise } from "./index";

const {
    Channels,
    Contacts,
    Config,
    LightningTxns,
    Onchain,
    Stream,
    StreamPart,
} = DB.Entities;
const connection = DB.Connection;

// TODO implement over dispatch
let tempClose = false;

async function dbStart(walletName, dbPass) {
    const dbPath = DB.databasePath(walletName);
    try {
        await connection.init({ dbPass, dbPath });
        tempClose = false;
        return successPromise();
    } catch (e) {
        return errorPromise(e.message, dbStart);
    }
}

async function dbClose() {
    tempClose = true;
    await connection.close();
}

function getBuilder(repository, alias) {
    if (tempClose) {
        throw new Error(`${alias}: ${exceptions.DB_NOT_OPENED}`);
    }
    return connection.get()
        .createQueryBuilder(repository, alias);
}

function contactsBuilder() {
    return getBuilder(Contacts, "contacts");
}

function configBuilder() {
    return getBuilder(Config, "config");
}

function channelsBuilder() {
    return getBuilder(Channels, "channels");
}

function onchainBuilder() {
    return getBuilder(Onchain, "onchain");
}

function lightningBuilder() {
    return getBuilder(LightningTxns, "lightning_txns");
}

function streamBuilder() {
    return getBuilder(Stream, "stream");
}

function streamPartBuilder() {
    return getBuilder(StreamPart, "stream_part");
}

function changePass(pass) {
    return connection.get().manager.query(`PRAGMA rekey = ${pass};`);
}

export {
    contactsBuilder,
    configBuilder,
    channelsBuilder,
    lightningBuilder,
    onchainBuilder,
    dbStart,
    dbClose,
    streamBuilder,
    streamPartBuilder,
    changePass,
};
