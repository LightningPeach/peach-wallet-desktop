const os = require("os");
const convict = require("convict");
const { join } = require("path");
const { app } = require("electron");
const configSchema = require("./config-schema");
const settingsFiles = require("./settings-app");
const settingsPeach = require("./settings-peach");
const settingsAgreement = require("./settings-agreement");
const calculated = require("./calculated");
const baseLogger = require("../utils/logger");

const logger = baseLogger.child("electron");
const readSettings = ({ appPath, dataPath, config }) => {
    const baseSettings = settingsFiles(appPath);
    const peachSettings = settingsPeach(appPath);
    const agreementSettings = settingsAgreement(dataPath);
    config.load(baseSettings);
    config.load(agreementSettings);
    config.load(peachSettings);
    return {
        baseSettings,
        agreementSettings,
        peachSettings,
    };
};
const lndName = (() => {
    switch (os.platform()) {
        case "win32":
            return "lnd.exe";
        default:
            return "lnd";
    }
})();
const appPath = app.getAppPath();
const config = convict(configSchema);

config.set("userDataPath", app.getPath("userData"));
config.set("preloadBasePath", join(appPath, "node_modules", "preload").replace("app.asar", "app.asar.unpacked"));
config.set("binariesBasePath", join(appPath, "node_modules", "executable").replace("app.asar", "app.asar.unpacked"));
config.set("binariesLndPath", join(config.get("binariesBasePath"), lndName));
const dataPath = join(config.get("userDataPath"), ".lnd");
config.set("dataPath", dataPath);
config.set("lndPath", dataPath);
config.set("logFolder", join(config.get("dataPath"), "logs"));

const baseSettings = readSettings({ appPath, dataPath, config });

const logLevel = config.get("logger.level");
const logFolder = join(config.get("dataPath"), "logs");
const loggerOptions = Object.assign({}, { logLevel, logFolder });
baseLogger.init(loggerOptions);

const calculatedBase = calculated({
    appPath,
    dataPath,
    baseSettings,
    config,
});

module.exports = Object.freeze({
    get: new Proxy(config, {
        get(target, prop) {
            if (prop in calculatedBase) {
                return calculatedBase[prop];
            }
            let value;
            try {
                value = target.get(prop);
            } catch (e) {
                value = undefined;
            }
            return value;
        },
    }),
    /**
     * @param {String} prop
     * @param {Array|String} values
     * @returns {Promise<*>}
     */
    set: async (prop, values) => {
        logger.info("[SETTINGS] - requested set prop", prop);
        if (prop === "agreement") {
            return calculatedBase.setAgreement(...values);
        }
        if (prop === "lndPeer") {
            return calculatedBase.setListenPort(...values);
        }
        if (prop === "lndPath") {
            return config.set("lndPath", values);
        }
        throw new Error(`Set method not available for ${prop} property`);
    },
    saveLndPath: (username, lndPath) => calculatedBase.saveLndPath(username, lndPath),
    preload: {
        getAnalytics: config.get("analytics"),
        getAgreement: config.get("agreement"),
        getBitcoin: config.get("bitcoin"),
        getDatabasePath: calculatedBase.databasePath,
        getPeach: config.get("peach"),
        getDevMode: config.get("backend.devMode"),
        getInitListenPort: config.get("lnd.init_listen"),
    },
});
