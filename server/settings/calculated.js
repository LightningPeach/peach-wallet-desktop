const fs = require("fs");
const { join } = require("path");
const helpers = require("../utils/helpers");
const baseLogger = require("../utils/logger");
// ToDo: add public ip after testing
const publicIp = require("public-ip");
// const internalIp = require("internal-ip");

const logger = baseLogger.child("electron");

module.exports = ({
    appPath,
    dataPath,
    baseSettings,
    config,
}) => {
    const peersFile = join(config.get("dataPath"), "peers.json");
    const ipFile = join(config.get("dataPath"), "ip.json");
    const userPathsFile = join(config.get("dataPath"), "usersPath.json");
    /**
     * Return username based path to database file
     * @param {*} username
     * @returns {*}
     */
    const databasePath = username => join(config.get("lndPath"), String(username), config.get("backend.dbFile"));

    /**
     * Create agreement file (eula.txt and google analytics agreement)
     * @param {bool} gaChecked - if user agreed to send ga analytics
     */
    const setAgreement = async (gaChecked) => {
        logger.info("[SETTINGS] - setAgreement", gaChecked);
        const sendStatistics = gaChecked || false;
        const agreementContent = [
            "[agreement]",
            "eula = true",
            `sendStatistics = ${sendStatistics}`,
        ];
        if (gaChecked) {
            agreementContent.push(
                "",
                "[analytics]",
                `trackingID = ${baseSettings.peachSettings.analytics.trackingID}`,
                `appUrl = ${baseSettings.peachSettings.analytics.appUrl}`,
            );
        }
        logger.info("[SETTINGS] - will write ", agreementContent);
        await helpers.writeFile(join(dataPath, "agreement.ini"), agreementContent.join("\n"));
        config.set("analytics", Object.assign({}, baseSettings.peachSettings.analytics));
        config.set("agreement", { eula: true, sendStatistics });
    };

    const walletLndPath = (name, additionalFile) => {
        if (!name) {
            throw new Error("Username for wallet not provided");
        }
        const paths = [config.get("dataPath"), String(name)];
        if (additionalFile) {
            paths.push(String(additionalFile));
        }
        return join(...paths);
    };

    const listenPort = (username) => {
        const fileExists = fs.existsSync(peersFile);
        if (!fileExists) {
            logger.info("[SETTINGS] - listenPort", { fileExists, username, port: config.get("lnd.init_listen") });
            return config.get("lnd.init_listen");
        }
        const peers = JSON.parse(fs.readFileSync(peersFile).toString());
        logger.info("[SETTINGS] - listenPort", { fileExists, username, peers });
        if (username in peers) {
            return peers[username];
        }
        const lndPeer = Math.max(...Object.values(peers));
        logger.info("[SETTINGS] - listenPort", { fileExists, username, lndPeer });
        return parseInt(lndPeer, 10) + 1;
    };

    const setListenPort = async (username, port) => {
        const initPort = config.get("lnd.init_listen");
        const parsedPort = parseInt(port, 10);
        if (parsedPort < initPort) {
            throw new Error(`Port must be greater than ${initPort}`);
        }
        const fileExists = fs.existsSync(peersFile);
        logger.info("[SETTINGS] - setListenPort", {
            initPort, parsedPort, peersFile, fileExists, username,
        });
        if (!fileExists) {
            await helpers.writeFile(peersFile, JSON.stringify({ [username]: parsedPort }));
            return;
        }
        helpers.ipcSend("setPeerPort", parsedPort);
        const peers = JSON.parse(fs.readFileSync(peersFile).toString());
        logger.info("[SETTINGS] - setListenPort", { peers });
        if (username in peers && peers[username] === parsedPort) {
            return;
        }
        peers[username] = parsedPort;
        await helpers.writeFile(peersFile, JSON.stringify(peers));
    };

    const getCustomPathLndUsernames = () => {
        const basePath = config.get("dataPath");
        const baseFolders = {};
        let allData;
        helpers.readFolderWithinFolder(basePath).forEach((item) => {
            baseFolders[item] = basePath;
        });
        if (fs.existsSync(userPathsFile)) {
            allData = Object.assign({}, baseFolders, JSON.parse(fs.readFileSync(userPathsFile).toString()));
        } else {
            allData = baseFolders;
        }
        return Object.entries(allData).reduce((data, [username, userPath]) => {
            const returnData = data;
            const { ok } = helpers.checkDirSync(join(userPath, username, "data"));
            if (ok) {
                returnData[username] = userPath;
            }
            return returnData;
        }, {});
    };

    const loadLndPath = async (username) => {
        const defaultPath = config.get("dataPath");
        const paths = getCustomPathLndUsernames();
        logger.info("[SETTINGS] - getLndPath", { username, paths });
        if (username in paths) {
            return paths[username];
        }
        return defaultPath;
    };

    const saveLndPath = async (username, lndPath) => {
        const paths = getCustomPathLndUsernames();
        logger.info("[SETTINGS] - saveLndPath", { paths });
        if (username in paths && paths[username] === lndPath) {
            return;
        }
        paths[username] = lndPath;
        await helpers.writeFile(userPathsFile, JSON.stringify(paths));
    };

    const saveLndIP = async (username, ip) => {
        const fileExists = fs.existsSync(ipFile);
        logger.info("[SETTINGS] - saveLndIP", {
            ip, ipFile, fileExists, username,
        });
        if (!fileExists) {
            await helpers.writeFile(ipFile, JSON.stringify({ [username]: ip }));
            return;
        }
        const ips = JSON.parse(fs.readFileSync(ipFile).toString());
        logger.info("[SETTINGS] - saveLndIP", { ips });
        if (username in ips && ips[username] === ip) {
            return;
        }
        ips[username] = ip;
        await helpers.writeFile(ipFile, JSON.stringify(ips));
    };

    /**
     * Will save ip into file if file does not exist or if there in no data about current user
     * @param username
     * @returns ip
     */
    const getLndIP = async (username) => {
        const fileExists = fs.existsSync(ipFile);
        const lnd = config.get("lnd");
        const defaultIP = `${await publicIp.v4()}:${lnd.restlisten}`;
        logger.debug("[SETTINGS] - getLndIP defaultip:", defaultIP);
        if (!fileExists) {
            // default return for the function
            await saveLndIP(username, defaultIP);
            return defaultIP;
        }
        const ips = JSON.parse(fs.readFileSync(ipFile).toString());
        logger.info("[SETTINGS] - getLndIP", { fileExists, username, ips });
        if (username in ips) {
            return ips[username];
        }

        // defaul return for the function
        await saveLndIP(username, defaultIP);
        return defaultIP;
    };

    return {
        getCustomPathLndUsernames,
        databasePath,
        listenPort,
        setAgreement,
        setListenPort,
        walletLndPath,
        loadLndPath,
        saveLndPath,
        getLndIP,
        saveLndIP,
    };
};
