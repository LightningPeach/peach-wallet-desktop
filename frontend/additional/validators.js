import bitcoin from "bitcoinjs-lib";
import { exceptions } from "config";
import {
    MIN_PASS_LENGTH, WALLET_NAME_MAX_LENGTH, VALIDATE_PASS_REGEXP, ONLY_UNICODE_LETTERS_AND_NUMBERS,
    ONLY_LETTERS_AND_NUMBERS, LIGHTNING_ID_LENGTH, SEED_COUNT,
} from "config/consts";

/**
 * @param {string} addr - Bitcoin address
 * @param {object} network - Network params
 * @returns {string|null}
 */
const validateBitcoinAddr = (addr, network) => {
    try {
        bitcoin.address.toOutputScript(addr, network);
        return null;
    } catch (e) {
        return exceptions.BITCOIN_ADDRESS_WRONG;
    }
};

/**
 * @param {string} id - Lightning Id
 * @returns {string|null}
 */
const validateLightning = (id) => {
    if (!id) {
        return exceptions.FIELD_IS_REQUIRED;
    } else if (id.length !== LIGHTNING_ID_LENGTH) {
        return exceptions.LIGHTNING_ID_WRONG_LENGTH;
    } else if (!ONLY_LETTERS_AND_NUMBERS.test(id)) {
        return exceptions.LIGHTNING_ID_WRONG;
    }
    return null;
};

/**
 * @param {string} channelHost
 * @returns {string|null}
 */
const validateChannelHost = (channelHost) => {
    if (!channelHost) {
        return exceptions.FIELD_IS_REQUIRED;
    }
    const [lightningId, host] = channelHost.split("@");
    if (!lightningId || !host) {
        return exceptions.LIGHTNING_HOST_WRONG_FORMAT;
    }
    return validateLightning(lightningId);
};

/**
 * @param {string} pass
 * @returns {string|null}
 */
const validatePass = (pass) => {
    if (!pass) {
        return exceptions.FIELD_IS_REQUIRED;
    } else if (pass.length < MIN_PASS_LENGTH) {
        return exceptions.PASSWORD_WRONG_MIN_LENGTH;
    } else if (!VALIDATE_PASS_REGEXP.test(pass)) {
        return exceptions.PASSWORD_WRONG_FORMAT;
    }
    return null;
};

/**
 * @param {string} seed
 * @param {string} seedCompare
 * @returns {string|null}
 */
const validatePassSeed = (seed, seedCompare) => {
    if (!seed) {
        return exceptions.FIELD_IS_REQUIRED;
    } else if (seedCompare && seed !== seedCompare) {
        return exceptions.PASSWORD_SEED_MISMATCH;
    }
    return null;
};

/**
 * @param {string} newPass
 * @param {string} confPass
 * @returns {string|null}
 */
const validatePassMismatch = (newPass, confPass) => {
    if (!confPass) {
        return exceptions.FIELD_IS_REQUIRED;
    } else if (newPass !== confPass) {
        return exceptions.PASSWORD_MISMATCH;
    }
    return null;
};

/**
 * @param {string} oldPass
 * @param {string} newPass
 * @returns {string|null}
 */
const validatePassDiff = (oldPass, newPass) => {
    if (oldPass === newPass) {
        return exceptions.PASSWORD_DIFF;
    }
    return null;
};

/**
 * @param {string} name
 * @param {boolean} required
 * @param {boolean} withSpace
 * @param {boolean} allUnicodeLettersAndNumbers
 * @param {number} maxChars
 * @param {boolean} withSeparators
 * @returns {string|null}
 */
const validateName = (
    name,
    required = false,
    withSpace = true,
    allUnicodeLettersAndNumbers = true,
    maxChars = WALLET_NAME_MAX_LENGTH,
    withSeparators = false,
) => {
    let tempName = name;
    if (required && !tempName) {
        return exceptions.FIELD_IS_REQUIRED;
    } else if (!tempName) {
        return null;
    }
    if (withSpace) {
        tempName = tempName.replace(/\s/g, "");
    }
    if (tempName.length > maxChars) {
        return exceptions.WALLET_NAME_WRONG_MAX_LENGTH(maxChars);
    }
    if (withSeparators) {
        tempName = tempName.replace(/[!-\/:-@[-`{-~]/g, ""); // eslint-disable-line
    }
    if (allUnicodeLettersAndNumbers) {
        if (!ONLY_UNICODE_LETTERS_AND_NUMBERS.test(tempName)) {
            return exceptions.WALLET_NAME_WRONG_FORMAT(withSpace, withSeparators);
        }
    } else if (!ONLY_LETTERS_AND_NUMBERS.test(tempName)) {
        return exceptions.WALLET_NAME_WRONG_FORMAT(withSpace, withSeparators);
    }
    return null;
};

const validateUserExistence = async (walletName) => {
    const invalidName = validateName(walletName, true, false, false);
    if (invalidName) {
        return invalidName;
    }
    const { ok } = await window.ipcClient("checkWalletName", { walletName });
    if (!ok) {
        return exceptions.WALLET_NAME_EXISTS;
    }
    return null;
};

/**
 * @param {array} seed
 * @returns {string|null}
 */
const validateSeed = (seed) => {
    if (!seed.length) {
        return exceptions.FIELD_IS_REQUIRED;
    } else if (seed.length !== SEED_COUNT) {
        return exceptions.PASSWORD_SEED_COUNT_MISMATCH;
    } else if (!seed.every(s => /^[a-z]+$/.test(s))) {
        return exceptions.PASSWORD_SEED_WRONG_FORMAT;
    }
    return null;
};

const validateLndPath = async (lndPath) => {
    if (!lndPath) {
        return exceptions.FIELD_IS_REQUIRED;
    }
    const response = await window.ipcClient("validateLndPath", { lndPath });
    if (!response.ok) {
        return exceptions.FOLDER_UNAVAILABLE;
    }
    return null;
};

export {
    validateBitcoinAddr,
    validateChannelHost,
    validateName,
    validateLightning,
    validatePass,
    validatePassDiff,
    validatePassMismatch,
    validatePassSeed,
    validateSeed,
    validateUserExistence,
    validateLndPath,
};
