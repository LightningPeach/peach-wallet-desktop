/* eslint-disable no-await-in-loop */
const fs = require("fs");
const path = require("path");
const util = require("util");
const rimraf = require("rimraf");
const { spawn } = require("child_process");
const execFile = util.promisify(require("child_process").execFile);
const config = require("./config");
const helpers = require("../../server/utils/helpers");

let btcdPid;
let fundsLndPid;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Backup or restore file
 * @param {string} baseDir
 * @param {string} fileName
 * @param {boolean} restore - Should restore backup file
 */
const fileBackup = (baseDir, fileName, restore = false) => {
    let oldPath;
    let newPath;
    if (restore) {
        oldPath = path.join(baseDir, `${fileName}${config.filenamePostfix}`);
        newPath = path.join(baseDir, fileName);
    } else {
        oldPath = path.join(baseDir, fileName);
        newPath = path.join(baseDir, `${fileName}${config.filenamePostfix}`);
    }
    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
    }
};

/**
 * Override app settings
 * @param {string} baseDir
 * @returns {Promise<void>}
 */
const writeLocalSettings = async (baseDir) => {
    const baseSettings = [
        "[bitcoin]",
        "node = btcd",
        "network = simnet",
        "[btcd]",
        "rpcuser = kek",
        "rpcpass = kek",
        "rpchost = 127.0.0.1:18556",
        `rpccert = ${path.join(__dirname, "test_data", "b_data", "rpc.cert")}`,
    ];
    await helpers.writeFile(path.join(baseDir, config.localSettings), baseSettings.join("\n"));
};

const startBtcd = (miningAddr) => {
    const options = [
        "--configfile", path.join(__dirname, "test_data", "b_data", "btcd.conf"),
        "--simnet",
        "--datadir", path.join(__dirname, "test_data", "b_data", "data"),
        "--logdir", path.join(__dirname, "test_data", "b_data", "logs"),
        "--rpccert", path.join(__dirname, "test_data", "b_data", "rpc.cert"),
        "--rpckey", path.join(__dirname, "test_data", "b_data", "rpc.key"),
        "--rpcuser", "kek",
        "--rpcpass", "kek",
        "--rpclisten", "127.0.0.1:18556",
        "--txindex", "1",
        "--addrindex", "1",
    ];
    if (miningAddr) {
        options.push("--miningaddr", miningAddr);
    }
    console.log("BTCD OPTIONS: ", options.join(" "));
    const btcd = spawn("btcd", options);
    btcdPid = btcd.pid;
};

const btcctl = async (command, params = []) => {
    const { stdout } = await execFile(
        "btcctl",
        [
            "--rpcuser", "kek",
            "--rpcpass", "kek",
            "--simnet",
            "--rpccert", path.join(__dirname, "test_data", "b_data", "rpc.cert"),
            command,
            ...params,
        ],
    );
    await sleep(config.cmdUtilsTimeout);
    console.log(`BTCCTL: ${stdout}`);
    return stdout;
};

const btcctlGenerate = async (count = 1) => {
    await btcctl("generate", [count]);
};

const startFundsLnd = () => {
    const options = [
        "--configfile", path.join(__dirname, "test_data", "l_data", "btcd.conf"),
        "--no-macaroons",
        "--datadir", path.join(__dirname, "test_data", "l_data", "data"),
        "--logdir", path.join(__dirname, "test_data", "l_data", "logs"),
        "--tlscertpath", path.join(__dirname, "test_data", "l_data", "tls.cert"),
        "--tlskeypath", path.join(__dirname, "test_data", "l_data", "tls.key"),
        "--bitcoin.active",
        "--bitcoin.node", "btcd",
        "--bitcoin.simnet",
        "--listen", "127.0.0.1:20202",
        "--rpclisten", "127.0.0.1:20201",
        "--restlisten", "127.0.0.1:20200",
        "--btcd.rpcuser", "kek",
        "--btcd.rpcpass", "kek",
        "--btcd.rpchost", "127.0.0.1:18556",
        "--btcd.rpccert", path.join(__dirname, "test_data", "b_data", "rpc.cert"),
        "--noencryptwallet",
    ];
    console.log("LND OPTIONS: ", options.join(" "));
    const lnd = spawn("lnd", options);
    fundsLndPid = lnd.pid;
};

const fundsLncli = async (command, params = []) => {
    const { stdout } = await execFile(
        "lncli",
        [
            "--no-macaroons",
            "--rpcserver", "127.0.0.1:20201",
            "--tlscertpath", path.join(__dirname, "test_data", "l_data", "tls.cert"),
            command,
            ...params,
        ],
    );
    await sleep(config.cmdUtilsTimeout);
    console.log(`LNCLI: ${stdout}`);
    return JSON.parse(stdout);
};

const isLndAvailable = async () => {
    let available = false;
    while (!available) {
        try {
            await sleep(config.cmdUtilsCallDelay);
            await fundsLncli("getinfo");
            available = true;
        } catch (e) {
            console.log(e);
        }
    }
};

const isBtcdAvailable = async () => {
    let available = false;
    while (!available) {
        try {
            await sleep(config.cmdUtilsCallDelay);
            await btcctl("getinfo");
            available = true;
        } catch (e) {
            console.log(e);
        }
    }
};

/**
 * @param {object} params
 * @property {string} params.baseDir - basedir of app
 * @property {string} params.userPath - path for test user data
 */
const beforeTestPrepare = async (params) => {
    fileBackup(params.baseDir, config.localSettings);
    await writeLocalSettings(params.baseDir);
    startBtcd();
    await isBtcdAvailable();
    startFundsLnd();
    await isLndAvailable();
    let address = false;
    while (!address) {
        ({ address } = await fundsLncli("newaddress", ["p2wkh"]));
        await sleep(config.cmdUtilsCallDelay);
    }
    process.kill(btcdPid);
    startBtcd(address);
    await isBtcdAvailable();
    await btcctlGenerate(300);
    await isBtcdAvailable();
    // If not restart lnd it hang on sendcoins
    process.kill(fundsLndPid);
    startFundsLnd();
    await isLndAvailable();
    let synced = false;
    // lnd started from node have long synchronization
    while (!synced) {
        const info = await fundsLncli("getinfo"); // eslint-disable-line
        synced = info.synced_to_chain;
        await sleep(config.cmdUtilsCallDelay);
    }
    await btcctlGenerate(10);
    await isBtcdAvailable();
    await fundsLncli("walletbalance");
};

/**
 * @param {object} params
 * @property {string} params.baseDir - basedir of app
 * @property {string} params.userPath - path for test user data
 */
const afterTestClear = (params) => {
    fileBackup(params.baseDir, config.localSettings, true);
    process.kill(btcdPid);
    process.kill(fundsLndPid);
    rimraf.sync(params.userPath);
    rimraf.sync(path.join(__dirname, "test_data"));
};

const generateBlock = async (count = 1) => {
    const { stdout } = await execFile(
        "btcctl",
        [
            "--simnet",
            "generate", `${count}`,
        ],
    );
    console.log(stdout);
};

const lncli = async (command, params = []) => {
    const { stdout } = await execFile(
        "lncli",
        [
            "--no-macaroons",
            "--rpcserver", "127.0.0.1:20201",
            command,
            ...params,
        ],
    );
    await sleep(1000);
    console.log(`LNCLI: ${stdout}`);
    return JSON.parse(stdout);
};

module.exports = {
    afterTestClear,
    beforeTestPrepare,
    sleep,
    btcctlGenerate,
    fundsLncli,
    generateBlock,
    lncli,
};
/* eslint-enable no-await-in-loop */
