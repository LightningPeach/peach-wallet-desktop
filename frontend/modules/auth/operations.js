import { exceptions, consts, routes } from "config";
import { errorPromise, successPromise, logger, helpers } from "additional";
import { accountActions, accountOperations } from "modules/account";
import { lndOperations } from "modules/lnd";
import { appOperations } from "modules/app";
import { streamPaymentOperations } from "modules/streamPayments";
import * as actions from "./actions";

function setForm(currentForm) {
    return dispatch => dispatch(actions.setCurrentForm(currentForm));
}

function setAuthStep(step) {
    return dispatch => dispatch(actions.setAuthStep(step));
}

function setTempWalletName(tempWalletName) {
    return dispatch => dispatch(actions.setTempWalletName(tempWalletName));
}

function setHashedPassword(password) {
    return dispatch => dispatch(actions.setPassword(helpers.hash(password)));
}

function regStartLnd(walletName) {
    return async (dispatch) => {
        dispatch(accountActions.createAccount());
        dispatch(lndOperations.setClearLndData(true));
        let response = await window.ipcClient("checkUser", { walletName });
        if (response.ok) {
            const error = "User already exist";
            dispatch(accountActions.errorCreateNewAccount(error));
            return errorPromise(error, regStartLnd);
        }
        response = await dispatch(lndOperations.startLnd(walletName, false));
        if (!response.ok) {
            dispatch(lndOperations.clearLndData());
            dispatch(accountActions.errorCreateNewAccount(response.error));
            return errorPromise(response.error, regStartLnd);
        }
        dispatch(accountActions.successCreatenewAccount());
        return successPromise();
    };
}

/**
 * Finish registration and start init account
 * @param {string} walletName - wallet name
 * @param {string} password - password
 * @param {array} seed - seed word for wallet
 * @param {boolean} [recovery = false] - recreate or not wallet
 * @returns {Function}
 */
function regFinish(walletName, password, seed, recovery = false) {
    return async (dispatch) => {
        dispatch(accountActions.startInitAccount());
        logger.log("Create lnd wallet");
        let response = await window.ipcClient("createLndWallet", { password, recovery, seed });
        logger.log(response);
        if (!response.ok) {
            dispatch(accountActions.finishInitAccount());
            return errorPromise(response.error, regFinish);
        }
        if (!recovery) {
            response = await dispatch(appOperations.openDb(walletName, password));
            if (!response.ok) {
                dispatch(accountActions.finishInitAccount());
                return errorPromise(response.error, regFinish);
            }
        }
        dispatch(lndOperations.setClearLndData(false));
        return successPromise();
    };
}

function restore(walletName, password, seed) {
    return async (dispatch) => {
        let response = await dispatch(regStartLnd(walletName));
        if (!response.ok) {
            return errorPromise(response.error, restore);
        }
        response = await dispatch(regFinish(walletName, password, seed, true));
        if (!response.ok) {
            dispatch(lndOperations.clearLndData());
            return errorPromise(response.error, restore);
        }
        response = await dispatch(appOperations.openDb(walletName, password));
        if (!response.ok) {
            dispatch(accountActions.finishInitAccount());
            return errorPromise(response.error, restore);
        }
        response = await dispatch(accountOperations.initAccount(walletName, true));
        if (!response.ok) {
            return errorPromise(response.error, restore);
        }
        return successPromise();
    };
}

function login(walletName, password) {
    return async (dispatch) => {
        dispatch(accountActions.startInitAccount());
        let response = await dispatch(lndOperations.startLnd(walletName));
        if (!response.ok) {
            dispatch(accountActions.finishInitAccount());
            return errorPromise(response.error, login);
        }
        logger.log("Unlock lnd");
        const params = { password };
        response = await window.ipcClient("unlockLnd", params);
        if (!response.ok) {
            const error = exceptions.WALLET_NAME_PASSWORD_WRONG;
            dispatch(accountActions.finishInitAccount());
            return errorPromise(error, login);
        }
        response = await dispatch(appOperations.openDb(walletName, password));
        if (!response.ok) {
            dispatch(accountActions.finishInitAccount());
            return errorPromise(response.error, login);
        }
        return dispatch(accountOperations.initAccount(walletName));
    };
}

export {
    setForm,
    setAuthStep,
    setTempWalletName,
    setHashedPassword,
    login,
    regStartLnd,
    regFinish,
    restore,
};
