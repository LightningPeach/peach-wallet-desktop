import * as statusCodes from "config/status-codes";
import fetch from "isomorphic-fetch";
import { delay, successPromise, errorPromise, logger } from "additional";
import { store } from "store/configure-store";
import { BLOCK_HEIGHT_URL } from "config/node-settings";
import { appOperations } from "modules/app";
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

function waitLndSync(restoreConnection = false) {
    return async (dispatch, getState) => {
        let synced = false;
        let tickNumber = 0;
        while (!synced) {
            tickNumber += 1;
            const response = await window.ipcClient("getInfo"); // eslint-disable-line
            if (!response.ok) {
                return errorPromise(response.error, waitLndSync);
            }
            synced = response.response.synced_to_chain;
            dispatch(actions.setLndBlocksHeight(response.response.block_height));
            logger.log("LND SYNCED: ", synced);
            if (!synced) {
                if (tickNumber === 1 && restoreConnection) {
                    dispatch(actions.lndSynced(false));
                    dispatch(appOperations.sendSystemNotification({
                        body: "Please wait for synchronization recovery",
                        title: "Synchronization is lost",
                    }));
                }
                dispatch(actions.setLndInitStatus(statusCodes.STATUS_LND_SYNCING));
                await delay(window.LND_SYNC_TIMEOUT); // eslint-disable-line
            } else if (!restoreConnection || tickNumber > 1) {
                dispatch(actions.setLndInitStatus(statusCodes.STATUS_LND_FULLY_SYNCED));
            }
        }
        if (tickNumber > 1 && restoreConnection) {
            dispatch(appOperations.sendSystemNotification({
                body: "The node has been fully synchronized with blockchain",
                title: "Synchronization is recovered",
            }));
        }
        dispatch(actions.lndSynced(true));
        return successPromise();
    };
}

function checkLndSync() {
    return async (dispatch, getState) => {
        let response = await window.ipcClient("getInfo");
        if (!response.ok) {
            return errorPromise(response.error, checkLndSync);
        }
        const synced = response.response.synced_to_chain;
        dispatch(actions.setLndBlocksHeight(response.response.block_height));
        if (!synced) {
            await delay(window.LND_SYNC_TIMEOUT);
            response = await dispatch(waitLndSync(true));
            if (!response.ok) {
                return errorPromise(response.error, checkLndSync);
            }
        }
        return successPromise();
    };
}

function startLnd(username, toCheckUser = true) {
    return async (dispatch) => {
        logger.log("Check user existance");
        let response;
        if (toCheckUser) {
            response = await window.ipcClient("checkUser", { username });
            logger.log(response);
            if (!response.ok) {
                dispatch(actions.setLndInitStatus(""));
                return errorPromise(response.error, startLnd);
            }
        }
        dispatch(actions.startInitLnd());
        logger.log("Lnd start resp");
        response = await window.ipcClient("startLnd", { username });
        logger.log(response);
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
        logger.log("Get seed");
        const response = await window.ipcClient("genSeed");
        logger.log(response);
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
    checkLndSync,
    getSeed,
    clearLndData,
    startLnd,
    setClearLndData,
};
