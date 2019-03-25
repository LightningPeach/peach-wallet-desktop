const fs = require("fs");
const publicIp = require("public-ip");
const { Certificate } = require('@fidm/x509');
const protoLoader = require("@grpc/proto-loader");
const grpc = require("grpc");
const path = require("path");
const { spawn } = require("child_process");
const Exec = require("./Exec");
const baseLogger = require("../utils/logger");
const rmrf = require("rimraf");
const registerIpc = require("electron-ipc-tunnel/server").default;
const { ipcSend, isPortTaken, noExponents } = require("../utils/helpers");
const settings = require("../settings");
const helpers = require("../utils/helpers");

const LND_ERRORS = [
    {
        match: /(unknown|undefined|unavailable)/gi,
        pattern: /[0-9]+ (unknown|undefined|unavailable):/gi,
        replace: "",
    },
    {
        match: "unable to route payment to destination",
        pattern: /.*(unable to route payment to destination).*/gi,
        replace: "$1",
    },
];
const logger = baseLogger.child("binaries");
const LND_DEFAULT_RPC_PORT = 10009;
const LND_DEFAULT_REST_PORT = 8080;
const packageDefinition = protoLoader.loadSync("rpc.proto", {
    keepCase: true,
    longs: Number,
    defaults: true,
    oneofs: true,
    includeDirs: [path.join(__dirname, "proto")],
});
const lnRpcDescriptor = grpc.loadPackageDefinition(packageDefinition);

const localLndRpcIp = `127.0.0.1:${settings.get.lnd.rpclisten}`;
const LND_CONF_FILE = "lnd.conf";
const LND_CERT_FILE = "tls.cert";
const LND_KEY_FILE = "tls.key";
const MACAROON_FILE = "admin.macaroon";
const READONLY_MACAROON_FILE = "readonly.macaroon";
const INVOICE_MACAROON_FILE = "invoice.macaroon";
const BLOCK_HEADERS_FILE = "block_headers.bin";
const NEUTRINO_FILE = "neutrino.db";
const REG_FILTER_HEADERS_FILE = "reg_filter_headers.bin";

process.env.GRPC_SSL_CIPHER_SUITES = "HIGH+ECDSA";

// in seconds
const GRPC_DEADLINE = 60;

/**
 * set Rpc timeout deadline.
 * @param {number} deadline
 * @return {number} - Deadline, current time + deadline
 */
const getDeadLine = (deadline = GRPC_DEADLINE) => {
    const deadLine = new Date();
    return deadLine.setSeconds(deadLine.getSeconds() + deadline);
};

const getMacaroonMeta = (name) => {
    const macaroonFile = path.join(settings.get.lndPath, name, MACAROON_FILE);
    const metadata = new grpc.Metadata();
    const macaroonHex = fs.readFileSync(macaroonFile).toString("hex");
    metadata.add("macaroon", macaroonHex);
    return metadata;
};

/**
 * Get WalletUnlocker or Lightning rpc service
 * @param {string} name
 * @param {string}[service=WalletUnlocker|Lightning] service
 * @return {Promise<void>}
 */
const getRpcService = async (name, service) => new Promise((resolve, reject) => {
    const certPath = path.join(settings.get.lndPath, name, LND_CERT_FILE);
    const sslCreds = grpc.credentials.createSsl(fs.readFileSync(certPath));
    const client = new lnRpcDescriptor.lnrpc[service](localLndRpcIp, sslCreds);
    logger.info({ func: getRpcService }, `Will start waiting for grpc connection with params: ${name}, ${service}`);
    ipcSend("setLndInitStatus", `Wait for ${service} service in LND`);
    grpc.waitForClientReady(client, Infinity, (err) => {
        logger.debug({ func: getRpcService }, `Error while waiting: ${err}`);
        if (err) {
            logger.error({ func: getRpcService }, err);
            reject(err);
        }
        if (service === "Lightning" && !settings.get.lnd.no_macaroons) {
            resolve({ client, metadata: getMacaroonMeta(name) });
        }
        resolve(client);
    });
});

let lastError;

/**
 * Wait until lnd autogenerate certs
 * @param {string} name
 * @return {Promise<any>}
 */
const awaitTlsGen = async name => new Promise((resolve) => {
    const intervalId = setInterval(() => {
        if (fs.existsSync(path.join(settings.get.lndPath, name, LND_CERT_FILE))) {
            clearInterval(intervalId);
            resolve();
        }
    }, 500);
});

const awaitMacaroonsGen = async name => new Promise((resolve) => {
    const intervalId = setInterval(() => {
        if (fs.existsSync(path.join(settings.get.lndPath, name, MACAROON_FILE))) {
            clearInterval(intervalId);
            resolve();
        }
    }, 500);
});



const isLndPortsAvailable = async (peerPort) => {
    const rpcPort = settings.get.lnd.rpclisten ? settings.get.lnd.rpclisten : LND_DEFAULT_RPC_PORT;
    const restPort = settings.get.lnd.restlisten ? settings.get.lnd.restlisten : LND_DEFAULT_REST_PORT;
    try {
        const peerPortListen = await isPortTaken(peerPort, "0.0.0.0");
        const rpcPortListen = await isPortTaken(rpcPort, "127.0.0.1");
        const restPortListen = await isPortTaken(restPort, "127.0.0.1");
        const portErrors = [];
        if (!peerPortListen) {
            portErrors.push(peerPort);
        }
        if (!rpcPortListen) {
            portErrors.push(rpcPort);
        }
        if (!restPortListen) {
            portErrors.push(restPort);
        }
        const error = `${portErrors.join(", ")} ${
            portErrors.length > 1 ? "ports are" : "port is"
        } used by some app. Free ${portErrors.length > 1 ? "them" : "it"} before using wallet`;
        return { ok: peerPortListen && rpcPortListen && restPortListen, error, type: "port" };
    } catch (e) {
        return { ok: false, error: e.message, type: "internal" };
    }
};

const getLogLevel = () => {
    const availableLevels = ["trace", "debug", "info", "warn", "error", "critical"];
    const level = String(settings.get.lnd.log_level);
    if (!availableLevels.includes(level)) {
        return availableLevels[2];
    }
    return level;
};

let singleton = null;

class Lnd extends Exec {
    constructor() {
        super();
        if (!singleton) {
            singleton = this;
        } else {
            return singleton;
        }
        this.process_name = "Lnd";
        this.name = "";
        this.pid_name = "lnd_pid.json";
        this.pid = this._getPid();
        this.starting = false;

        this._unlocker = null;
        this._client = null;
        this._metadata = null;

        this._bitcoinMeasure = null;
        this.shoudClearData = false;
        this._peerPort = null;

        this._registerListener();
    }

    async validateBeforeStart() {
        try {
            if (!fs.existsSync(settings.get.binariesLndPath)) {
                return { ok: false, error: "LND binary not found" };
            }
            const isFreePorts = await isLndPortsAvailable(this._peerPort);
            if (!isFreePorts.ok) {
                this.starting = false;
                return isFreePorts;
            }
            return { ok: true };
        } catch (e) {
            return { ok: false, error: e.message, type: "internal" };
        }
    }

    /**
     * Function checks if preload not injected yet, and inserts data from "node_modules/preload/"
     * Data has following directories structure: "lnd/data/chain/bitcoin/testnet/neutrino";
     * @returns {Promise<*>}
     */
    async injectPreload() {
        const errorHandler = (err, filename) => {
            if (err) {
                logger.error({ func: "injectPreload" }, err);
            } else {
                logger.info({ func: "injectPreload" }, `${filename} copied`);
            }
        };
        try {
            if (!this.name) {
                return { ok: false, error: "No name for LND given" };
            }
            // default value is mainnet
            let dataDir = path.join("data", "chain", "bitcoin", "mainnet");
            if (settings.get.bitcoin.network === "testnet") {
                dataDir = path.join("data", "chain", "bitcoin", "testnet");
            }
            const userDataDir = path.join(settings.get.lndPath, this.name, dataDir);
            const preloadDataDir = path.join(settings.get.preloadBasePath, dataDir);
            if (!fs.existsSync(preloadDataDir)) {
                return { ok: false, error: "Preload files not found" };
            }
            logger.info({ func: "injectPreload" }, `Will check preload files in ${userDataDir}`);
            if (!fs.existsSync(userDataDir)) {
                await helpers.mkDirRecursive(userDataDir);
            }
            await fs.copyFile(
                path.join(preloadDataDir, BLOCK_HEADERS_FILE),
                path.join(userDataDir, BLOCK_HEADERS_FILE),
                fs.constants.COPYFILE_EXCL,
                err => errorHandler(err, BLOCK_HEADERS_FILE),
            );
            await fs.copyFile(
                path.join(preloadDataDir, NEUTRINO_FILE),
                path.join(userDataDir, NEUTRINO_FILE),
                fs.constants.COPYFILE_EXCL,
                err => errorHandler(err, NEUTRINO_FILE),
            );
            await fs.copyFile(
                path.join(preloadDataDir, REG_FILTER_HEADERS_FILE),
                path.join(userDataDir, REG_FILTER_HEADERS_FILE),
                fs.constants.COPYFILE_EXCL,
                err => errorHandler(err, REG_FILTER_HEADERS_FILE),
            );
            return { ok: true };
        } catch (e) {
            return { ok: false, error: e.message, type: "internal" };
        }
    }

    /**
     * Subscribe to changes bitcoin measure from frontend
     * @private
     */
    _registerListener() {
        registerIpc("set-bitcoin-measure", (event, arg) => {
            this._bitcoinMeasure = {
                type: arg.type,
                multiplier: arg.multiplier,
                toFixed: arg.toFixed,
            };
        });
        registerIpc("set-should-clear-data", (event, arg) => {
            this.shoudClearData = arg.clearData;
        });
    }

    /**
     * Lightning rpc call
     * @param {string} method
     * @param {object} [args={}]
     * @param {null|number} [deadLine=]
     * @param {function} [cb=] Callback
     * @return {undefined|Object|Promise<any>}
     */
    call(method, args = {}, deadLine = GRPC_DEADLINE, cb = null) {
        logger.debug("Checking current pid while calling", this.pid);
        if (this.pid === -1) {
            return { ok: false, error: "Lnd stopped" };
        }
        const logArgs = Object.assign({}, args);
        delete logArgs.wallet_password;
        logger.debug("[LND] Call: ", { method, args: logArgs });
        let timeout = parseInt(deadLine, 10);
        timeout = Number.isNaN(timeout) ? GRPC_DEADLINE : timeout;
        const dateDeadLine = getDeadLine(timeout < 1 ? GRPC_DEADLINE : timeout);
        if (cb) {
            const response = this._client[method](args, { deadline: dateDeadLine }, cb);
            logger.debug("[LND] Response (callback): ", { Method: method, response });
            return undefined;
        }
        return new Promise((resolve) => {
            try {
                const params = [{ deadline: dateDeadLine }];
                if (!settings.get.lnd.no_macaroons) {
                    params.unshift(this._metadata);
                }
                this._client[method](args, ...params, (err, response) => {
                    if (err) {
                        logger.error(method, args, err);
                        const error = this.prettifyMessage(err.message);
                        resolve(Object.assign({ ok: false }, err, { error }));
                    }
                    logger.debug("[LND] Response: ", { method, args: logArgs, response });
                    resolve(Object.assign({ ok: true }, { response }));
                });
            } catch (err) {
                logger.error(method, args, err);
                const error = this.prettifyMessage(err.message);
                resolve(Object.assign({ ok: false }, err, { error }));
            }
        });
    }

    /**
     * Lightning stream rpc call
     * @param {string} method
     * @param {object} [args={}]
     * @return {*}
     */
    streamCall(method, args = {}) {
        let response;
        logger.debug("[LND] Call: ", { method, args });
        try {
            if (method === "sendPayment") {
                response = !settings.get.lnd.no_macaroons ?
                    this._client[method](this._metadata, args) :
                    this._client[method](args);
                logger.debug("[LND] Response: ", { method, args, response });
                return ({
                    ok: true,
                    stream: response,
                });
            }
            response = !settings.get.lnd.no_macaroons ?
                this._client[method](args, this._metadata) :
                this._client[method](args);
            logger.debug("[LND] Response: ", { method, args, response });
            return ({
                ok: true,
                stream: response,
            });
            // return ({ ok: true, stream: this._client[method](args) });
        } catch (err) {
            logger.error(method, args, err);
            return Object.assign({ ok: false }, err, { error: this.prettifyMessage(err.message) });
        }
    }

    /**
     * Options for lnd starting
     * @return {*[]}
     */
    async getOptions() {
        const options = [
            "--lnddir", path.join(settings.get.lndPath, this.name),
            "--configfile", path.join(settings.get.lndPath, this.name, LND_CONF_FILE),
            "--datadir", path.join(settings.get.lndPath, this.name, "data"),
            "--tlscertpath", path.join(settings.get.lndPath, this.name, LND_CERT_FILE),
            "--tlskeypath", path.join(settings.get.lndPath, this.name, LND_KEY_FILE),
            "--logdir", path.join(settings.get.lndPath, this.name, "log"),
            "--debuglevel", getLogLevel(),
            "--tlsextraip", "0.0.0.0",
            "--tlsextraip", (await settings.get.getLndIP(this.name)).split(":")[0],
            "--bitcoin.node", settings.get.bitcoin.node,
            "--listen", `0.0.0.0:${this._peerPort}`,
            // "--nat",
        ];
        if (settings.get.lnd) {
            if (settings.get.lnd.rpclisten) {
                options.push("--rpclisten", `0.0.0.0:${settings.get.lnd.rpclisten}`);
            }
            if (settings.get.lnd.restlisten) {
                options.push("--restlisten", `0.0.0.0:${settings.get.lnd.restlisten}`);
            }
            options.push("--maxpendingchannels", settings.get.lnd.maxpendingchannels || 1);
        }
        if (!settings.get.lnd.no_macaroons) {
            options.push(
                "--adminmacaroonpath", path.join(settings.get.lndPath, this.name, MACAROON_FILE),
                "--readonlymacaroonpath", path.join(settings.get.lndPath, this.name, READONLY_MACAROON_FILE),
                "--invoicemacaroonpath", path.join(settings.get.lndPath, this.name, INVOICE_MACAROON_FILE),
            );
        } else {
            options.push("--no-macaroons");
        }
        if (settings.get.bitcoin.active) {
            options.push("--bitcoin.active");
        }
        if (settings.get.bitcoin.network === "testnet") {
            options.push("--bitcoin.testnet");
        } else if (settings.get.bitcoin.network === "simnet") {
            options.push("--bitcoin.simnet");
        } else if (settings.get.bitcoin.network === "mainnet") {
            options.push("--bitcoin.mainnet");
        } else {
            options.push("--bitcoin.regtest");
        }
        if (settings.get.bitcoin.node === "neutrino") {
            options.push("--neutrino.connect", settings.get.neutrino.connect);
        } else if (settings.get.bitcoin.node === "btcd") {
            options.push(
                "--btcd.rpcuser", settings.get.btcd.rpcuser,
                "--btcd.rpcpass", settings.get.btcd.rpcpass,
                "--btcd.rpchost", settings.get.btcd.rpchost,
                "--btcd.rpccert", settings.get.btcd.rpccert,
            );
        }
        if (settings.get.autopilot.active) {
            options.push("--autopilot.active");
        }
        return options;
    }

    getMacaroonsHex() {
        return fs.readFileSync(path.join(settings.get.lndPath, this.name, MACAROON_FILE)).toString("hex");
    }

    getCert() {
        return fs.readFileSync(path.join(settings.get.lndPath, this.name, LND_CERT_FILE)).toString();
    }

    /**
     * Start lnd
     * @param {string} name
     * @return {Promise<*>}
     */
    async start(name) {
        if (!name) {
            const error = "No name for LND given";
            logger.error({ func: this.start }, error);
            return { ok: false, error };
        }
        if (this.starting) {
            const error = "LND has been started already";
            logger.error({ func: this.start }, error);
            return { ok: false, error };
        }
        this.name = name;
        this.manualStopped = false;
        this._peerPort = settings.get.listenPort(this.name);
        logger.debug("Checking current pid while starting", this.pid);
        if (this.pid !== -1) {
            logger.debug("Will call stop from start function");
            this.stop();
        }

        return this._startLnd();
    }

    /**
     * Clear lnd folder
     * @return {*}
     * @private
     */
    _clearData() {
        return new Promise((resolve) => {
            if (!this.name) {
                const error = "No name for LND given";
                logger.error({ func: this.clearData }, error);
                resolve({ ok: false, error });
                return;
            }

            rmrf(path.join(settings.get.lndPath, this.name), (err) => {
                if (err) {
                    logger.error({ func: this.clearData }, err);
                    resolve({ ok: false, error: err.message });
                }
                resolve({ ok: true });
            });
        });
    }

    _deleteCerts() {
        return new Promise((resolve) => {
            if (!this.name) {
                const error = "No name for LND given";
                logger.error({ func: this.clearData }, error);
                resolve({ ok: false, error });
                return;
            }

            rmrf(path.join(settings.get.lndPath, this.name, LND_CERT_FILE), (errCert) => {
                if (errCert) {
                    logger.error({ func: this.clearData }, errCert);
                    resolve({ ok: false, error: errCert.message });
                }
                rmrf(path.join(settings.get.lndPath, this.name, LND_KEY_FILE), (errKey) => {
                    if (errKey) {
                        logger.error({ func: this.clearData }, errKey);
                        resolve({ ok: false, error: errKey.message });
                    }

                    resolve({ ok: true });
                });
            });
        });
    }

    async rebuildCerts(username) {
        this._deleteCerts();
        const ip = `${await publicIp.v4()}:${settings.get.lnd.restlisten}`;
        settings.get.saveLndIP(username, ip);

        return {
            ok: true,
        };
        // certificate need custom certificate
        // let { stdout, stderr } = await exec('openssl ecparam -name prime256v1 -genkey -noout -out tls.key');
        // out = await exec(`openssl req -new -key tls.key -x509 -nodes -days 365
        // -config openssl.cnf -subj "/O=Lightning Peach desktop wallet" -out tls.cert`);
    }
    /**
     * Run lnd, set WalletUnlocker rpc service
     * @return {Promise<*>}
     * @private
     */
    async _startLnd() {
        this.starting = true;
        const validStartup = await this.validateBeforeStart();
        if (!validStartup.ok) {
            this.starting = false;
            return validStartup;
        }
        const injectPreload = await this.injectPreload();
        if (!injectPreload.ok) {
            logger.error("Preload injection failed:", injectPreload);
        }
        // check if lnd cert is available for external (0.0.0.0) usage
        if (fs.existsSync(path.join(settings.get.lndPath, this.name, LND_CERT_FILE))) {
            const tlsCert = fs.readFileSync(path.join(settings.get.lndPath, this.name, LND_CERT_FILE)).toString();
            const issuer = Certificate.fromPEM(tlsCert);
            const extensions = issuer.extensions;
            let ips = null;
            extensions.forEach((el) => {
                if (el.name === "subjectAltName") {
                    ips = el.altNames;
                }
            });
            console.log(ips);
            let certIsForExternalUsage = false;
            if (ips != null) {
                ips.forEach((el) => {
                    if (el.ip === "0.0.0.0") {
                        certIsForExternalUsage = true;
                    }
                });
            }
            if (!certIsForExternalUsage) {
                await this.rebuildCerts();
            }
        }
        logger.info("Will start lnd with params: \n", (await this.getOptions()).join(" "));
        ipcSend("setLndInitStatus", "Lnd prepare to start");
        try {
            // trying to remove old tls.cert / tls.key
            // await this._clearCerts();
            // Start Lnd
            const lnd = spawn(settings.get.binariesLndPath, await this.getOptions(), { detached: true });
            lnd.stdout.on("data", (data) => {
                console.log(`LND stdout: ${data}`);
            });
            lnd.stderr.on("data", (data) => {
                logger.debug("Got an error and will close", data.toString());
                logger.error({ func: this._startLnd }, "LND stderr: ", data.toString());
                lastError = data.toString();
            });
            lnd.on("exit", (code, signal) => {
                logger.debug("Triggered exit lnd: code", code);
                logger.debug("Triggered exit lnd: signal", signal);
                logger.debug("Last error", lastError);
                ipcSend("lnd-down", lastError);
                if (lastError) {
                    ipcSend("setLndInitStatus", lastError);
                }
                this.handleExit(code, signal);
            });
            this._savePid(lnd.pid);
        } catch (err) {
            this.starting = false;
            logger.error({ func: this._startLnd }, "Error while running LND: ", err);
            return {
                ok: false,
                error: err.message,
            };
        }

        // wait for cert generating
        await awaitTlsGen(this.name);
        try {
            logger.debug("[LND] Init grpc WalletUnlock");
            this._client = await getRpcService(this.name, "WalletUnlocker");
            return { ok: true };
        } catch (err) {
            logger.error({ func: this._startLnd }, "Error while unlock/create LND: ", err);
            return {
                ok: false,
                error: err.message,
            };
        }
    }

    /**
     * @param {string} password - Password
     * @param {array} [seed=] - Array of seed words
     * @param {boolean} [recovery=false] - Try to recover wallet from seed and pass
     * @returns {Promise<*>}
     */
    async createWallet(password, seed, recovery = false) {
        const params = { wallet_password: Buffer.from(password, "binary") };
        if (seed) {
            params.cipher_seed_mnemonic = seed;
        }
        if (recovery) {
            params.recovery_window = parseInt(settings.get.lnd.address_look_ahead, 10);
        }
        ipcSend("setLndInitStatus", "Creating wallet in LND");
        let response = await this.call("initWallet", params);
        if (!response.ok) {
            logger.error(response.message);
            return response;
        }
        response = await this._initWallet();
        return response;
    }

    async unlockWallet(password) {
        ipcSend("setLndInitStatus", "Unlocking wallet in LND");
        let response = await this.call("unlockWallet", { wallet_password: Buffer.from(password, "binary") });
        // logger.dedug("Got response from unlocking", response);
        if (!response.ok) {
            logger.error(response.message);
            ipcSend("setLndInitStatus", "");
            return response;
        }
        response = await this._initWallet();
        return response;
    }

    async _initWallet() {
        // Get Lightning rpc service
        logger.debug("[LND] Init grpc Lightning");
        // macaroons are not created immediately so we need to wait
        if (!settings.get.lnd.no_macaroons) {
            await awaitMacaroonsGen(this.name);
            logger.debug("[LND] Macaroons are created");
        }
        logger.debug("[LND] Macaroons existance", fs.existsSync(path.join(settings.get.lndPath, this.name, MACAROON_FILE)));
        const service = await getRpcService(this.name, "Lightning");
        if (!settings.get.lnd.no_macaroons) {
            this._client = service.client;
            this._metadata = service.metadata;
        } else {
            this._client = service;
        }
        // Sometimes rpc client start before lnd ready to accept rpc calls, let's wait
        const getInfo = await this._waitRpcAvailability();
        this.starting = false;
        settings.set("lndPeer", [this.name, this._peerPort]);
        settings.saveLndPath(this.name, settings.get.lndPath);
        return getInfo;
    }

    /**
     * wait until rpc service will be available
     * @returns {Promise}
     * @private
     */
    async _waitRpcAvailability() {
        return new Promise((resolve) => {
            const intervalId = setInterval(async () => {
                const response = await this.call("getInfo");
                if (response.ok) {
                    clearInterval(intervalId);
                    resolve(response);
                } else {
                    logger.debug("[LND] Waiting grpc Lightning");
                    this._client = await getRpcService(this.name, "Lightning");
                }
            }, 1000);
        });
    }

    /**
     * @param {string} msg
     */
    checkAvailablity(msg) {
        const notAvailable = (
            msg.toLowerCase().includes("unavailable") ||
            msg.toLowerCase().includes("connect failed") ||
            msg.toLowerCase().includes("the client has been shutdown")
        );
        if (notAvailable) {
            ipcSend("forceLogout", msg);
        }
    }

    /**
     * @param {string} msg
     * @return {string}
     */
    prettifyMessage(msg) {
        // const ERRORS = [/not enought witness outputs to create funding transaction/i];
        const convertBtcToSatoshi = value => Math.round(parseFloat(value) / 1e-8);
        const convertMSatToSatoshi = value => Math.round(parseFloat(value) * 1e-3);
        const convertToCurrent = (value, type = "BTC") => {
            let amount;
            if (type === "mSAT") {
                amount = convertMSatToSatoshi(value);
            } else {
                amount = convertBtcToSatoshi(value);
            }
            const num = (amount * this._bitcoinMeasure.multiplier);
            return noExponents(parseFloat(num.toFixed(this._bitcoinMeasure.toFixed)));
        };
        let newMsg = msg;
        LND_ERRORS.forEach(({ match, pattern, replace }) => {
            newMsg = newMsg.match(match) ? newMsg.replace(pattern, replace) : newMsg;
        });
        newMsg = newMsg.trim();
        newMsg = `[LND_ERROR]: ${newMsg}`;
        newMsg = newMsg.replace(/[0-9.]+\s*(BTC|mSAT)/igm, (item) => {
            const [a, m] = item.split(" ");
            if (m === this._bitcoinMeasure.type) {
                return item;
            }
            if (m === "BTC") {
                return `${convertToCurrent(a)} ${this._bitcoinMeasure.type}`;
            }
            if (m === "mSAT") {
                return `${convertToCurrent(a, m)} ${this._bitcoinMeasure.type}`;
            }
            return item;
        });
        this.checkAvailablity(newMsg);
        return newMsg;
    }
}

module.exports = Lnd;
