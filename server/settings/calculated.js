const fs = require("fs");
const { join } = require("path");
const helpers = require("../utils/helpers");
const baseLogger = require("../utils/logger");
const publicIp = require("public-ip");

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
     * Return wallet name based path to database file
     * @param {*} walletName
     * @returns {*}
     */
    const databasePath = walletName => join(config.get("lndPath"), String(walletName), config.get("backend.dbFile"));

    const walletLndPath = (name, additionalFile) => {
        if (!name) {
            throw new Error("Wallet name not provided");
        }
        const paths = [config.get("dataPath"), String(name)];
        if (additionalFile) {
            paths.push(String(additionalFile));
        }
        return join(...paths);
    };

    const listenPort = (walletName) => {
        const fileExists = fs.existsSync(peersFile);
        if (!fileExists) {
            logger.info("[SETTINGS] - listenPort", { fileExists, walletName, port: config.get("lnd.init_listen") });
            return config.get("lnd.init_listen");
        }
        const peers = JSON.parse(fs.readFileSync(peersFile).toString());
        logger.info("[SETTINGS] - listenPort", { fileExists, walletName, peers });
        if (walletName in peers) {
            return peers[walletName];
        }
        const lndPeer = Math.max(...Object.values(peers));
        logger.info("[SETTINGS] - listenPort", { fileExists, walletName, lndPeer });
        return parseInt(lndPeer, 10) + 1;
    };

    const setListenPort = async (walletName, port) => {
        const initPort = config.get("lnd.init_listen");
        const parsedPort = parseInt(port, 10);
        if (parsedPort < initPort) {
            throw new Error(`Port must be greater than ${initPort}`);
        }
        const fileExists = fs.existsSync(peersFile);
        logger.info("[SETTINGS] - setListenPort", {
            initPort, parsedPort, peersFile, fileExists, walletName,
        });
        if (!fileExists) {
            await helpers.writeFile(peersFile, JSON.stringify({ [walletName]: parsedPort }));
            return;
        }
        helpers.ipcSend("setPeerPort", parsedPort);
        const peers = JSON.parse(fs.readFileSync(peersFile).toString());
        logger.info("[SETTINGS] - setListenPort", { peers });
        if (walletName in peers && peers[walletName] === parsedPort) {
            return;
        }
        peers[walletName] = parsedPort;
        await helpers.writeFile(peersFile, JSON.stringify(peers));
    };

    const getCustomPathLndWalletNames = () => {
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
        return Object.entries(allData).reduce((data, [walletName, userPath]) => {
            const returnData = data;
            const { ok } = helpers.checkDirSync(join(userPath, walletName, "data"));
            if (ok) {
                returnData[walletName] = userPath;
            }
            return returnData;
        }, {});
    };

    const loadLndPath = async (walletName) => {
        const defaultPath = config.get("dataPath");
        const paths = getCustomPathLndWalletNames();
        logger.info("[SETTINGS] - getLndPath", { walletName, paths });
        if (walletName in paths) {
            return paths[walletName];
        }
        return defaultPath;
    };

    const saveLndPath = async (walletName, lndPath) => {
        const paths = getCustomPathLndWalletNames();
        logger.info("[SETTINGS] - saveLndPath", { paths });
        if (walletName in paths && paths[walletName] === lndPath) {
            return;
        }
        paths[walletName] = lndPath;
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
        getCustomPathLndWalletNames,
        databasePath,
        listenPort,
        setListenPort,
        walletLndPath,
        loadLndPath,
        saveLndPath,
        getLndIP,
        saveLndIP,
    };
};
