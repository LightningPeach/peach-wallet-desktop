import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import { JSDOM } from "jsdom";

chai.use(sinonChai);
const { expect } = chai;

const jsdom = new JSDOM("<!doctype html><html><body></body></html>");
const { window } = jsdom;

// Constants
window.env = process.env;
window.PEACH = { replenishUrl: "replenishurl" };
window.DB = { Connection: {}, Entities: {} };
window.VERSION = {
    Legal: "Legalized",
};
window.DB.databasePath = sinon.stub();
window.DB.Connection = require("../server/db");
window.DB.Entities.Contacts = require("../server/db/model/Contacts").Contacts;
window.DB.Entities.Channels = require("../server/db/model/Channels").Channels;
window.DB.Entities.Onchain = require("../server/db/model/Onchain").Onchain;
window.DB.Entities.LightningTxns = require("../server/db/model/LightningTxns").LightningTxns;
window.DB.Entities.Stream = require("../server/db/model/Stream").Stream;
window.DB.Entities.StreamPart = require("../server/db/model/StreamPart").StreamPart;
window.DB.Entities.Config = require("../server/db/model/Config").Config;

// Functions
const ipcClient = sinon.stub();
window.ipcClient = ipcClient;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const matchMedia = () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
});
window.matchMedia = window.matchMedia || matchMedia;

// Base implementation of electron ipc. For test some code like window.ipcRenderer.on("lnd-down")
let channels = {};
const ipcRenderer = {
    send: sinon.spy(async (channel, ...arg) => {
        if (channel in channels) {
            channels[channel].callbacks.forEach((callback) => {
                if (arg.length) {
                    callback(null, ...Object.values(arg[0]));
                } else {
                    callback(null);
                }
            });
        }
        return Promise.resolve();
    }),
    on: sinon.spy((channel, callback) => {
        if (channel in channels) {
            channels[channel].callbacks.push(callback);
        } else {
            channels[channel] = { callbacks: [callback] };
        }
    }),
    reset: () => {
        channels = {};
    },
};
window.ipcRenderer = ipcRenderer;

global.btoa = sinon.stub();
global.window = window;
global.navigator = {
    userAgent: "node.js",
};
global.document = window.document;
global.expect = expect;
global.sinon = sinon;
global.sleep = sleep;
