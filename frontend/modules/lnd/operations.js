import { exceptions, statuses } from "config";
import { delay, successPromise, errorPromise, logger } from "additional";
import { store } from "store/configure-store";
import { LND_SYNC_TIMEOUT } from "config/consts";
import { appOperations } from "modules/app";
import * as actions from "./actions";

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
            if (!restoreConnection && tickNumber === 1) {
                dispatch(actions.setLndBlocksHeightOnLogin(response.response.block_height));
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
                dispatch(actions.setLndInitStatus(statuses.LND_SYNCING));
                await delay(LND_SYNC_TIMEOUT); // eslint-disable-line
            } else if (!restoreConnection || tickNumber > 1) {
                dispatch(actions.setLndInitStatus(statuses.LND_FULLY_SYNCED));
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
            await delay(LND_SYNC_TIMEOUT);
            response = await dispatch(waitLndSync(true));
            if (!response.ok) {
                return errorPromise(response.error, checkLndSync);
            }
        }

        return successPromise();
    };
}

function startLnd(walletName, toCheckUser = true) {
    return async (dispatch) => {
        logger.log("Check user existance");
        let response;
        if (toCheckUser) {
            response = await window.ipcClient("checkUser", { walletName });
            logger.log(response);
            if (!response.ok) {
                dispatch(actions.setLndInitStatus(""));
                return errorPromise(response.error, startLnd);
            }
        }
        dispatch(actions.startInitLnd());
        logger.log("Lnd start resp");
        response = await window.ipcClient("startLnd", { walletName });
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
    waitLndSync,
    checkLndSync,
    getSeed,
    clearLndData,
    startLnd,
    setClearLndData,
};
