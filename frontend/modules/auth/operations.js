import { statusCodes } from "config";
import { SESSION_EXPIRE_TIMEOUT } from "config/consts";
import { errorPromise, successPromise, logger, helpers } from "additional";
import { accountActions, accountOperations } from "modules/account";
import { lndOperations } from "modules/lnd";
import { appOperations } from "modules/app";
import { streamPaymentOperations } from "modules/streamPayments";
import { HomePath } from "routes";
import * as actions from "./actions";

function setForm(currentForm) {
    return dispatch => dispatch(actions.setCurrentForm(currentForm));
}

function setAuthStep(step) {
    return dispatch => dispatch(actions.setAuthStep(step));
}

function setTempUsername(tempUsername) {
    return dispatch => dispatch(actions.setTempUsername(tempUsername));
}

function setHashedPassword(password) {
    return dispatch => dispatch(actions.setPassword(helpers.hash(password)));
}

function regStartLnd(username) {
    return async (dispatch) => {
        dispatch(accountActions.createAccount());
        dispatch(lndOperations.setClearLndData(true));
        let response = await window.ipcClient("checkUser", { username });
        if (response.ok) {
            const error = "User already exist";
            dispatch(accountActions.errorCreateNewAccount(error));
            return errorPromise(error, regStartLnd);
        }
        response = await dispatch(lndOperations.startLnd(username, false));
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
 * @param {string} username - username
 * @param {string} password - password
 * @param {array} seed - seed word for wallet
 * @param {boolean} [recovery = false] - recreate or not wallet
 * @returns {Function}
 */
function regFinish(username, password, seed, recovery = false) {
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
            response = await dispatch(appOperations.openDb(username, password));
            if (!response.ok) {
                dispatch(accountActions.finishInitAccount());
                return errorPromise(response.error, regFinish);
            }
        }
        dispatch(lndOperations.setClearLndData(false));
        return successPromise();
    };
}

function restore(username, password, seed) {
    return async (dispatch) => {
        let response = await dispatch(regStartLnd(username));
        if (!response.ok) {
            return errorPromise(response.error, restore);
        }
        response = await dispatch(regFinish(username, password, seed, true));
        if (!response.ok) {
            dispatch(lndOperations.clearLndData());
            return errorPromise(response.error, restore);
        }
        response = await dispatch(appOperations.openDb(username, password));
        if (!response.ok) {
            dispatch(accountActions.finishInitAccount());
            return errorPromise(response.error, restore);
        }
        response = await dispatch(accountOperations.initAccount(username, true));
        if (!response.ok) {
            return errorPromise(response.error, restore);
        }
        return successPromise();
    };
}

function login(username, password) {
    return async (dispatch) => {
        dispatch(accountActions.startInitAccount());
        let response = await dispatch(lndOperations.startLnd(username));
        if (!response.ok) {
            dispatch(accountActions.finishInitAccount());
            return errorPromise(response.error, login);
        }
        logger.log("Unlock lnd");
        const params = { password };
        response = await window.ipcClient("unlockLnd", params);
        logger.log(response);
        if (!response.ok) {
            const error = statusCodes.EXCEPTION_USERNAME_PASSWORD_WRONG;
            dispatch(accountActions.finishInitAccount());
            return errorPromise(error, login);
        }
        response = await dispatch(appOperations.openDb(username, password));
        if (!response.ok) {
            dispatch(accountActions.finishInitAccount());
            return errorPromise(response.error, login);
        }
        return dispatch(accountOperations.initAccount(username));
    };
}

export {
    setForm,
    setAuthStep,
    setTempUsername,
    setHashedPassword,
    login,
    regStartLnd,
    regFinish,
    restore,
};
