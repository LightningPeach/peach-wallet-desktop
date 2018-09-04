import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";

const { JSDOM } = require("jsdom");

chai.use(sinonChai);
const { expect } = chai;

const jsdom = new JSDOM("<!doctype html><html><body></body></html>");
const { window } = jsdom;

const ipcClient = sinon.stub();

// Functions
window.ipcClient = ipcClient;

// Constants
window.env = process.env;
window.LND_SYNC_TIMEOUT = 1;
window.PEACH = { replenishUrl: "replenishurl" };
window.DB = { Connection: {}, Entities: {} };
window.DB.databasePath = sinon.stub();
window.DB.Connection = require("../server/db");
window.DB.Entities.Contacts = require("../server/db/model/Contacts").Contacts;
window.DB.Entities.Channels = require("../server/db/model/Channels").Channels;
window.DB.Entities.Onchain = require("../server/db/model/Onchain").Onchain;
window.DB.Entities.LightningTxns = require("../server/db/model/LightningTxns").LightningTxns;
window.DB.Entities.Stream = require("../server/db/model/Stream").Stream;
window.DB.Entities.StreamPart = require("../server/db/model/StreamPart").StreamPart;
window.DB.Entities.Config = require("../server/db/model/Config").Config;

const matchMedia = () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
});

window.matchMedia = window.matchMedia || matchMedia;

global.btoa = sinon.stub();
global.window = window;
global.navigator = {
    userAgent: "node.js",
};
global.document = window.document;
global.expect = expect;
global.sinon = sinon;
global.nap = ms => new Promise(resolve => setTimeout(resolve, ms));
