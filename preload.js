/* eslint-disable no-undef */
const fs = require("fs");
const path = require("path");
const IpcClient = require("electron-ipc-tunnel/client").default;
const electron = require("electron");

const settings = electron.remote.require("./server/settings");
const ipcTunnelClient = new IpcClient();

// Constants
window.env = {
    NODE_ENV: process.env.NODE_ENV,
};
window.INIT_LISTEN_PORT = settings.preload.getInitListenPort;
window.ELECTRON_SHELL = electron.shell;
window.ANALYTICS = settings.preload.getAnalytics;
window.PEACH = settings.preload.getPeach;
window.VERSION = {};
window.VERSION.Legal = settings.preload.getVersion.legal;
window.BITCOIN_SETTINGS = settings.preload.getBitcoin;
window.DEV_MODE = settings.preload.getDevMode;
window.DB = { Connection: {}, Entities: {} };
window.DB.databasePath = settings.preload.getDatabasePath;
window.DB.Connection = require("./server/db");
window.DB.Entities.Contacts = require("./server/db/model/Contacts").Contacts;
window.DB.Entities.Channels = require("./server/db/model/Channels").Channels;
window.DB.Entities.Onchain = require("./server/db/model/Onchain").Onchain;
window.DB.Entities.LightningTxns = require("./server/db/model/LightningTxns").LightningTxns;
window.DB.Entities.Stream = require("./server/db/model/Stream").Stream;
window.DB.Entities.StreamPart = require("./server/db/model/StreamPart").StreamPart;
window.DB.Entities.Config = require("./server/db/model/Config").Config;
window.VERSION.Wallet = require("./package").version;

window.LICENSE = fs.readFileSync(path.join(__dirname, "privacy_policy.html")).toString();
window.TERMS = fs.readFileSync(path.join(__dirname, "terms_and_conditions.html")).toString();
// Functions
window.ipcClient = async (action, params = {}) => {
    try {
        return await ipcTunnelClient.send(action, params);
    } catch (error) {
        return {
            error: error.message,
            message: error.message,
            name: error.name,
            ok: false,
            stack: error.stack,
        };
    }
};
window.pathSep = path.sep;
window.ipcRenderer = require("electron").ipcRenderer;
/* eslint-enable no-undef */
