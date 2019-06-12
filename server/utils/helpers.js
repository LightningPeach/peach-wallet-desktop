const fs = require("fs");
const request = require("request");
const path = require("path");
const crypto = require("crypto");
const { webContents } = require("electron");
const Net = require("net");
const ini = require("ini");
const baseLogger = require("./logger");

const logger = baseLogger.child("helpers");
const hasProperty = Object.prototype.hasOwnProperty;

// TODO create shared functions and move this
/**
 * Convert number like 1e-3 to 0.001 string
 * @param {number} num
 * @returns {string}
 */
const noExponents = (num) => {
    const sign = num < 0 ? "-" : "";
    const data = String(num).split(/[eE]/);
    if (data.length === 1) {
        return sign + data[0];
    }
    const str = data[0].replace(".", "").replace("-", "");
    let mag = Number(data[1]) + 1;
    let z = "";
    if (mag < 0) {
        z = `${sign}0.`;
        while (mag) {
            z += "0";
            mag += 1;
        }
        return z + str.replace(/^-/, "");
    }
    if (mag >= str.length) {
        mag -= str.length;
        while (mag) {
            z += "0";
            mag -= 1;
        }
        return sign + str + z;
    }
    return mag ? `${str.slice(0, mag)}.${str.slice(mag)}` : str;
};

/**
 * Promise based delay
 * @param {number} ms
 * @return {Promise<void>}
 */
function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

async function readFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, "utf8", (err, contents) => {
            if (err) {
                logger.error({ func: readFile }, err);
                return reject(Object.assign({}, {
                    ok: false,
                    error: err.message,
                }, err));
            }
            return resolve(contents);
        });
    });
}

/**
 * Promise based write to file
 * @param {string} filePath
 * @param content
 * @return {Promise<any>}
 */
async function writeFile(filePath, content) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, content, "utf8", (err, contents) => {
            if (err) {
                logger.error({ func: writeFile }, err);
                return reject(Object.assign({}, {
                    ok: false,
                    error: err.message,
                }, err));
            }
            return resolve(contents);
        });
    });
}

/**
 * Promise based checking is dir exists
 * @param {string} dirPath
 * @return {Promise<Object>}
 */
async function checkAccess(dirPath, errorOnNotExist = true) {
    return new Promise((resolve) => {
        fs.access(dirPath, fs.constants.R_OK | fs.constants.W_OK, (err) => { // eslint-disable-line no-bitwise
            let ret = { ok: true };
            if (err) {
                if (errorOnNotExist) {
                    logger.error({ func: checkAccess }, err);
                }
                ret = Object.assign({}, err, { ok: false, error: err.message });
            }
            resolve(ret);
        });
    });
}

/**
 * Check is dir exists
 * @param {string} dirPath
 * @returns {{ok: boolean}}
 */
function checkDirSync(dirPath) {
    try {
        fs.accessSync(dirPath, fs.constants.R_OK | fs.constants.W_OK); // eslint-disable-line no-bitwise
        return { ok: true };
    } catch (error) {
        logger.error({ func: checkDirSync }, error);
        return Object.assign({}, error, { ok: false, error: error.message });
    }
}

/**
 * Recursive creating dirs
 * @param {string} dirPath
 */
function mkDirRecursive(dirPath) {
    const { sep } = path;
    const initDir = path.isAbsolute(dirPath) ? sep : "";
    dirPath.split(sep)
        .reduce((parentDir, childDir) => {
            if (!childDir) {
                return parentDir;
            }
            if (childDir.slice(-1) === ":") {
                return `${childDir}${sep}`;
            }
            const curDir = path.join(parentDir, childDir);
            if (!fs.existsSync(curDir)) {
                fs.mkdirSync(curDir);
            }
            return curDir;
        }, initDir);
}

/**
 * Make objects with specified key, from array of objects
 * @param {string} objectKey
 * @param {Array} [arrayOfObjects=[]]
 * @param {Function} keyAction
 */
function toHashMap(objectKey, arrayOfObjects = [], keyAction = val => val) {
    return arrayOfObjects.reduce((obj, item) => {
        const key = keyAction(item[objectKey]);
        return Object.assign({}, obj, { [key]: item });
    }, {});
}

/**
 * Promise based download file method
 * @param {Object} configuration
 * @param {string} configuration.remoteFile - what download
 * @param {string} configuration.localFile - where save file
 * @param {function} configuration.onProgress - callback received and total
 * @param {function} configuration.onError - callback for error
 * @return {Promise<any>}
 */
function downloadFile(configuration) {
    return new Promise((resolve, reject) => {
        // Save variable to know progress
        let receivedBytes = 0;
        let totalBytes = 0;

        const req = request({
            method: "GET",
            uri: configuration.remoteFile,
        });

        const out = fs.createWriteStream(configuration.localFile);
        req.pipe(out);

        req.on("response", (data) => {
            // Change the total bytes value to get progress later.
            totalBytes = parseInt(data.headers["content-length"], 10);
        });

        // Get progress if callback exists
        if (hasProperty.call(configuration, "onProgress")) {
            req.on("data", (chunk) => {
                // Update the received bytes
                receivedBytes += chunk.length;

                configuration.onProgress(receivedBytes, totalBytes);
            });
        } else {
            req.on("data", (chunk) => {
                // Update the received bytes
                receivedBytes += chunk.length;
            });
        }
        if (hasProperty.call(configuration, "onError")) {
            req.on("error", (err) => {
                logger.error({ func: downloadFile }, err);
                configuration.onError(err);
            });
        } else {
            req.on("error", (err) => {
                logger.error({ func: downloadFile }, err);
                reject(err);
            });
        }

        req.on("end", () => {
            resolve();
        });
    });
}

/**
 * @param {string} filePath - Path to file
 * @return {Promise<any>}
 */
function checkFileHash(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash("sha1");
        const stream = fs.createReadStream(filePath);
        stream.on("data", data => hash.update(data));
        stream.on("error", (err) => {
            logger.error({ func: downloadFile }, err);
            reject(err);
        });
        stream.on("end", () => resolve({ sha1: hash.digest("hex") }));
    });
}

function ipcSend(method, params) {
    webContents.getAllWebContents().forEach((win) => {
        if (win.isMain) {
            win.send(method, params);
        }
    });
}

function isPortTaken(port, extreaIp) {
    return new Promise((resolve, reject) => {
        const tester = Net.createServer()
            .once("error", err => (err.code === "EADDRINUSE" ? resolve(false) : reject(err)))
            .once("listening", () => tester.once("close", () => resolve(true)).close())
            .listen(port, extreaIp);
    });
}

function readFolderWithinFolder(folder) {
    return fs.readdirSync(folder).filter(f => fs.statSync(path.join(folder, f)).isDirectory()) || [];
}

module.exports.delay = delay;
module.exports.checkAccess = checkAccess;
module.exports.checkDirSync = checkDirSync;
module.exports.readFile = readFile;
module.exports.writeFile = writeFile;
module.exports.mkDirRecursive = mkDirRecursive;
module.exports.toHashMap = toHashMap;
module.exports.downloadFile = downloadFile;
module.exports.checkFileHash = checkFileHash;
module.exports.hasProperty = hasProperty;
module.exports.ipcSend = ipcSend;
module.exports.isPortTaken = isPortTaken;
module.exports.noExponents = noExponents;
module.exports.readFolderWithinFolder = readFolderWithinFolder;
