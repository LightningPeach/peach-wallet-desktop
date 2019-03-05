import fetch from "isomorphic-fetch";
import urlParse from "url-parse";
import { push } from "react-router-redux";
import { statusCodes } from "config";
import {
    USD_PER_BTC_URL,
    LIGHTNING_ID_LENGTH,
    ONLY_LETTERS_AND_NUMBERS,
    BTC_MEASURE,
} from "config/consts";
import { store } from "store/configure-store";
import { db, errorPromise, successPromise, helpers, logger } from "additional";
import { info, error } from "modules/notifications";
import { lightningActions } from "modules/lightning";
import { authTypes } from "modules/auth";
import { WalletPath } from "routes";
import * as actions from "./actions";
import * as types from "./types";

function closeModal() {
    return dispatch => dispatch(actions.setModalState(types.CLOSE_MODAL_STATE));
}

function openLogoutModal() {
    return dispatch => dispatch(actions.setModalState(types.LOGOUT_MODAL_STATE));
}

function openForceLogoutModal() {
    return (dispatch, getState) => {
        if (getState().account.isLogined) {
            dispatch(actions.setModalState(types.MODAL_STATE_FORCE_LOGOUT));
        }
    };
}

function openDeepLinkLightningModal() {
    return dispatch => dispatch(actions.setModalState(types.DEEP_LINK_LIGHTNING_MODAL_STATE));
}

function openLegalModal() {
    return dispatch => dispatch(actions.setModalState(types.MODAL_STATE_LEGAL));
}

function openConnectRemoteQRModal() {
    return dispatch => dispatch(actions.setModalState(types.MODAL_STATE_CONNECT_REMOTE_QR));
}

function usdBtcRate() {
    return async (dispatch, getState) => {
        let response;
        try {
            response = await fetch(USD_PER_BTC_URL, { method: "GET" });
            response = await response.json();
        } catch (e) {
            dispatch(actions.setUsdPerBtc(0));
            return successPromise();
        }
        dispatch(actions.setUsdPerBtc(response.USD.last));
        return successPromise();
    };
}

function copyToClipboard(data, message = "") {
    return (dispatch) => {
        let newMsg = message;
        const textArea = document.createElement("textarea");
        textArea.value = data;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand("copy");
        } catch (err) {
            newMsg = "Error while copying to clipboard";
            logger.error(err);
        }
        document.body.removeChild(textArea);
        dispatch(info({
            message: helpers.formatNotificationMessage(newMsg || "Copied"),
            uid: newMsg.toString() || "Copied",
        }));
    };
}

function convertToSatoshi(value) {
    return (dispatch, getState) => {
        const currentMultiplier = getState().account.bitcoinMeasureMultiplier;
        return Math.round(parseFloat(value) / currentMultiplier);
    };
}

function convertSatoshiToCurrentMeasure(value) {
    return (dispatch, getState) => {
        const currentMultiplier = getState().account.bitcoinMeasureMultiplier;
        const toFixed = getState().account.toFixedMeasure;
        return helpers.noExponents(parseFloat((parseInt(value, 10) * currentMultiplier).toFixed(toFixed)));
    };
}

function convertUsdToSatoshi(amount) {
    return (dispatch, getState) => {
        const { usdPerBtc } = getState().app;
        return Math.round(parseFloat(amount) / (BTC_MEASURE.multiplier * usdPerBtc));
    };
}

function convertUsdToCurrentMeasure(amount) {
    return (dispatch, getState) => {
        const currentMultiplier = getState().account.bitcoinMeasureMultiplier;
        const toFixed = getState().account.toFixedMeasure;
        const satoshiAmount = dispatch(convertUsdToSatoshi(amount));
        return satoshiAmount * currentMultiplier;
    };
}

const validateLightning = lightningId => (dispatch, getState) => {
    if (!lightningId) {
        return statusCodes.EXCEPTION_FIELD_IS_REQUIRED;
    } else if (lightningId.length !== LIGHTNING_ID_LENGTH) {
        return statusCodes.EXCEPTION_LIGHTNING_ID_WRONG_LENGTH;
    } else if (lightningId === getState().account.lightningID) {
        return statusCodes.EXCEPTION_LIGHTNING_ID_WRONG_SELF;
    } else if (!ONLY_LETTERS_AND_NUMBERS.test(lightningId)) {
        return statusCodes.EXCEPTION_LIGHTNING_ID_WRONG;
    }
    return null;
};

function openDb(username, password) {
    return async (dispatch) => {
        const response = await db.dbStart(username, password);
        if (!response.ok) {
            dispatch(actions.dbSetStatus(types.DB_CLOSED));
            return errorPromise(response.error, openDb);
        }
        dispatch(actions.dbSetStatus(types.DB_OPENED));
        return successPromise();
    };
}

function closeDb() {
    return async (dispatch) => {
        dispatch(actions.dbSetStatus(types.DB_CLOSING));
        await db.dbClose();
        dispatch(actions.dbSetStatus(types.DB_CLOSED));
    };
}

function sendSystemNotification(sender) {
    return (dispatch, getState) => {
        const notifications = getState().account.systemNotifications;
        const access = (notifications >> 2) & 1; // eslint-disable-line
        const sound = (notifications >> 1) & 1; // eslint-disable-line
        if (access) {
            window.ipcRenderer.send("showNotification", {
                body: sender.body,
                silent: !sound,
                subtitle: sender.subtitle,
                title: sender.title,
            });
        }
    };
}

window.ipcRenderer.on("forceLogout", (event, status) => {
    store.dispatch(actions.setForceLogoutError(status));
    store.dispatch(openForceLogoutModal());
});

window.ipcRenderer.on("setPeerPort", (event, status) => {
    store.dispatch(actions.setPeerPort(status));
});

window.ipcRenderer.on("isDefaultLightningApp", (event, status) => {
    store.dispatch(actions.setAppAsDefaultStatus(status));
    if (!status) {
        store.dispatch(openDeepLinkLightningModal());
    }
});

window.ipcRenderer.on("handleUrlReceive", async (event, status) => {
    const parsed = urlParse(status);
    const paymentRequest = parsed.hostname || parsed.pathname;
    if (parsed.protocol !== "lightning:") {
        store.dispatch(error({ message: helpers.formatNotificationMessage("Incorrect payment protocol") }));
        return;
    }
    store.dispatch(lightningActions.setExternalPaymentRequest(paymentRequest));
    if (store.getState().account.isLogined && store.getState().auth.sessionStatus === authTypes.SESSION_ACTIVE) {
        store.dispatch(push(WalletPath));
    }
});

export {
    sendSystemNotification,
    closeModal,
    usdBtcRate,
    copyToClipboard,
    convertToSatoshi,
    convertUsdToSatoshi,
    convertUsdToCurrentMeasure,
    convertSatoshiToCurrentMeasure,
    openForceLogoutModal,
    openDeepLinkLightningModal,
    openLogoutModal,
    validateLightning,
    openDb,
    closeDb,
    openLegalModal,
    openConnectRemoteQRModal,
};
