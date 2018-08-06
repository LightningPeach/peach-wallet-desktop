const fs = require("fs");
const os = require("os");
const helpers = require("../utils/helpers");
const baseLogger = require("../utils/logger");
const settings = require("../settings");

const logger = baseLogger.child("binaries");
const platform = os.platform();
const arch = os.arch();

/**
 * @TODO implement starting Lnd&Lis from BinaryManager
 */
/**
 * @class BinaryManager
 */
class BinaryManager {
    /**
     * Create a manager for target (lnd)
     */
    constructor() {
        const target = "lnd";
        const clientBinaries = JSON.parse(fs.readFileSync("binaries.json").toString());
        this._binPath = settings.get.binariesLndPath;
        this._downloadLink = clientBinaries[target][platform][arch].url;
        this._sha1 = clientBinaries[target][platform][arch].sha1.toUpperCase();
    }

    /**
     * Return received and total
     * @callback BinaryManager~onProgress
     * @param {number} received
     * @param {number} total
     */

    /**
     * Return error if happens
     * @callback BinaryManager~onError
     * @param {Error} error
     */

    /**
     * Download binary
     * @param {BinaryManager~onProgress} onProgress - The callback that return download status
     * @param {BinaryManager~onError} onError - The call for error
     * @return {Promise<void>}
     */
    async download(onProgress, onError) {
        await helpers.mkDirRecursive(settings.get.binariesBasePath);
        await helpers.downloadFile({
            remoteFile: this._downloadLink,
            localFile: this._binPath,
            onProgress,
            onError,
        });
    }

    /**
     * Check is file exists and it sha1 equals predefined sha1
     * @return {Promise<boolean>}
     */
    async isValid() {
        return this._checkFileExists() && this._sha1 === await this._getCheckSum();
    }

    /**
     * Check is file exists
     * @return {boolean}
     * @private
     */
    _checkFileExists() {
        return fs.existsSync(this._binPath);
    }

    /**
     * Get file `sha` checksum
     * @return {Promise<String>}
     * @private
     */
    async _getCheckSum() {
        try {
            const sha = await helpers.checkFileHash(this._binPath);
            return sha.sha1.toUpperCase();
        } catch (e) {
            return "";
        }
    }
}

module.exports = BinaryManager;
