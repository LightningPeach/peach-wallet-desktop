import * as statusCodes from "config/status-codes";
import fetch from "isomorphic-fetch";
import { delay, successPromise, errorPromise } from "additional";
import { store } from "store/configure-store";
import { BLOCK_HEIGHT_URL } from "config/node-settings";
import * as actions from "./actions";

function getBlocksHeight() {
    return async (dispatch) => {
        let response;
        try {
            response = await fetch(BLOCK_HEIGHT_URL, { method: "GET" });
            response = await response.json();
        } catch (e) {
            return dispatch(actions.setNetworkBlocksHeight(0));
        }
        dispatch(actions.setNetworkBlocksHeight(response.height));
        return successPromise();
    };
}

function waitLndSync() {
    return async (dispatch, getState) => {
        let synced = false;
        while (!synced) {
            const response = await window.ipcClient("getInfo"); // eslint-disable-line
            if (!response.ok) {
                return errorPromise(response.error, waitLndSync);
            }
            synced = response.response.synced_to_chain;
            dispatch(actions.setLndBlocksHeight(response.response.block_height));
            console.log("LND SYNCED: ", synced);
            if (!synced) {
                dispatch(actions.setLndInitStatus(statusCodes.STATUS_LND_SYNCING));
                await delay(window.LND_SYNC_TIMEOUT); // eslint-disable-line
            } else {
                dispatch(actions.setLndInitStatus(statusCodes.STATUS_LND_FULLY_SYNCED));
            }
        }
        dispatch(actions.lndSynced());
        return successPromise();
    };
}

function startLnd(username, toCheckUser = true) {
    return async (dispatch) => {
        console.log("Check user existance");
        let response;
        if (toCheckUser) {
            response = await window.ipcClient("checkUser", { username });
            console.log(response);
            if (!response.ok) {
                dispatch(actions.setLndInitStatus(""));
                return errorPromise(response.error, startLnd);
            }
        }
        dispatch(actions.startInitLnd());
        console.log("Lnd start resp");
        response = await window.ipcClient("startLnd", { username });
        console.log(response);
        if (!response.ok) {
            dispatch(actions.setLndInitStatus(""));
            dispatch(actions.lndInitingError(response.error));
            return errorPromise(response.error, startLnd);
        }
        dispatch(actions.lndInitingSuccess());
        return successPromise();
    };
}

function getSeed() {
    return async () => {
        console.log("Get seed");
        const response = await window.ipcClient("genSeed");
        console.log(response);
        if (!response.ok) {
            return errorPromise(response.error, getSeed);
        }
        return successPromise({ seed: response.response.cipher_seed_mnemonic });
    };
}

function clearLndData() {
    return (dispatch, getState) => {
        window.ipcClient("clearLndData");
    };
}

function setClearLndData(shouldClear) {
    return (dispatch, getState) => {
        window.ipcClient("set-should-clear-data", { clearData: shouldClear });
    };
}

window.ipcRenderer.on("setLndInitStatus", (event, status) => {
    store.dispatch(actions.setLndInitStatus(status));
});

export {
    getBlocksHeight,
    waitLndSync,
    getSeed,
    clearLndData,
    startLnd,
    setClearLndData,
};
