import { hashHistory } from "react-router";
import { appOperations, appActions } from "modules/app";
import { accountActions, accountTypes } from "modules/account";
import { lndActions, lndOperations } from "modules/lnd";
import { serverOperations } from "modules/server";
import { notificationsActions } from "modules/notifications";
import { channelsOperations, channelsActions, channelsTypes } from "modules/channels";
import { lightningOperations } from "modules/lightning";
import { contactsOperations } from "modules/contacts";
import { onChainOperations } from "modules/onchain";
import { streamPaymentOperations } from "modules/streamPayments";
import { store } from "store/configure-store";
import {
    errorPromise,
    db,
    successPromise,
    unsuccessPromise,
    logger,
    delay,
} from "additional";
import {
    MAX_PAYMENT_REQUEST,
    ALL_MEASURES,
    LOGOUT_ACCOUNT_TIMEOUT,
} from "config/consts";
import { statusCodes } from "config";

window.ipcRenderer.on("lnd-down", () => {
    store.dispatch(accountActions.setDisconnectedKernelConnectIndicator());
});

window.ipcRenderer.on("lnd-up", () => {
    store.dispatch(accountActions.setConnectedKernelConnectIndicator());
});

window.ipcRenderer.on("lis-up", () => {
    if (store.getState().account.lisStatus === accountTypes.LIS_UP) {
        return;
    }
    store.dispatch(accountActions.setLisStatus(accountTypes.LIS_UP));
});

window.ipcRenderer.on("lis-down", () => {
    if (store.getState().account.lisStatus === accountTypes.LIS_DOWN) {
        return;
    }
    store.dispatch(accountActions.setLisStatus(accountTypes.LIS_DOWN));
});

function openSystemNotificationsModal() {
    return dispatch => dispatch(appActions.setModalState(accountTypes.MODAL_STATE_SYSTEM_NOTIFICATIONS));
}

function checkBalance() {
    return async (dispatch, getState) => {
        const responseChannels = await window.ipcClient("listChannels");
        if (!responseChannels.ok) {
            dispatch(accountActions.errorCheckBalance(responseChannels.error));
            return unsuccessPromise(checkBalance);
        }
        let lightningBalance = 0;
        const { channels } = responseChannels.response;
        channels.forEach((channel) => {
            if (!channel.local_balance) {
                return;
            }
            lightningBalance += parseInt(channel.local_balance, 10);
        });
        const responseWallet = await window.ipcClient("walletBalance");
        if (!responseWallet.ok) {
            dispatch(accountActions.errorCheckBalance(responseWallet.error));
            return unsuccessPromise(checkBalance);
        }
        const bitcoinBalance = parseInt(responseWallet.response.confirmed_balance, 10);
        const unConfirmedBitcoinBalance = parseInt(responseWallet.response.unconfirmed_balance, 10);
        const lBalanceEqual = getState().account.lightningBalance === lightningBalance;
        const bBalanceEqual = getState().account.bitcoinBalance === bitcoinBalance;
        const ubBalanceEqual = getState().account.unConfirmedBitcoinBalance === unConfirmedBitcoinBalance;
        if (!lBalanceEqual || !bBalanceEqual || !ubBalanceEqual) {
            dispatch(accountActions.successCheckBalance(bitcoinBalance, lightningBalance, unConfirmedBitcoinBalance));
        }
        return successPromise();
    };
}

function createNewBitcoinAccount() {
    return async (dispatch, getState) => {
        const response = await window.ipcClient("newAddress", { type: 1 });
        if (response.ok) {
            dispatch(accountActions.addBitcoinAccount(response.response.address));
            return successPromise();
        }
        return errorPromise(response.error, createNewBitcoinAccount);
    };
}

function setInitConfig(lightningId) {
    return async (dispatch) => {
        await db.configBuilder()
            .insert()
            .values({
                activeMeasure: ALL_MEASURES[0].btc,
                createChannelViewed: 0,
                lightningId,
                systemNotifications: 3,
            })
            .execute();
        dispatch(accountActions.setBitcoinMeasure(ALL_MEASURES[0].btc));
        dispatch(accountActions.setSystemNotificationsStatus(accountTypes.NOTIFICATIONS.DISABLED_LOUD_SHOW_AGAIN));
        dispatch(openSystemNotificationsModal());
        return successPromise();
    };
}

function loadAccountSettings() {
    return async (dispatch, getState) => {
        try {
            const { lightningID } = getState().account;
            const response = await db.configBuilder()
                .select()
                .where("lightningId = :lightningID", { lightningID })
                .getOne();
            if (response) {
                dispatch(accountActions.setBitcoinMeasure(response.activeMeasure));
                if (response.createChannelViewed) {
                    dispatch(channelsActions.updateCreateTutorialStatus(channelsTypes.HIDE));
                }
                dispatch(accountActions.setSystemNotificationsStatus(response.systemNotifications));
                if (response.systemNotifications === 3) {
                    dispatch(openSystemNotificationsModal());
                }
            } else {
                await dispatch(setInitConfig(lightningID));
            }
            return successPromise();
        } catch (e) {
            return errorPromise(e.message, loadAccountSettings);
        }
    };
}

function connectKernel() {
    return async (dispatch, getState) => {
        const response = await window.ipcClient("getInfo");
        if (!response.ok) {
            dispatch(accountActions.errorConnectKernel(response.error));
            return errorPromise(response.error, connectKernel);
        }

        dispatch(accountActions.successConnectKernel());
        return successPromise();
    };
}

function connectServerLnd() {
    return async (dispatch, getState) => {
        const response = await window.ipcClient("connectServerLnd");
        if (response.ok) {
            return successPromise();
        }
        /*
        // TODO called before lnd fully synced
        if(response.error.includes("chain backend is still syncing")){
            return dispatch(connectServerLnd());
        }
        */
        return errorPromise(response.error, connectServerLnd);
    };
}

function getLightningID() {
    return async (dispatch, getState) => {
        const response = await window.ipcClient("getInfo");
        if (!response.ok) {
            return errorPromise(response.error, getLightningID);
        }
        dispatch(accountActions.setLightningID(response.response.identity_pubkey));
        return successPromise();
    };
}

function logout(keepModalState = false) {
    return async (dispatch, getState) => {
        if (getState().account.isLogouting) {
            return unsuccessPromise(logout);
        }
        dispatch(accountActions.startLogout());
        await dispatch(streamPaymentOperations.pauseAllStreams(false));
        if (getState().account.serverSocket) {
            try {
                getState()
                    .account
                    .serverSocket
                    .close();
            } catch (error) {
                logger.error(error);
            }
        }
        await dispatch(onChainOperations.unSubscribeTransactions());
        await dispatch(lightningOperations.unSubscribeInvoices());
        // Wait for some time to finish send data through rpc
        // Bug reason: prevent channel closing from our side after
        // lnd stop while sending data of outgoing lightning payment
        await delay(LOGOUT_ACCOUNT_TIMEOUT);
        await window.ipcClient("logout");
        await dispatch(appOperations.closeDb());
        dispatch(accountActions.logoutAcount(keepModalState));
        hashHistory.push("/");
        dispatch(accountActions.finishLogout());
        dispatch(notificationsActions.removeAllNotifications());
        return successPromise();
    };
}

function initAccount(login, newAccount = false) {
    let tempNewAcc = newAccount;
    const handleError = async (dispatch, getState, error) => {
        if (!tempNewAcc) {
            dispatch(accountActions.finishInitAccount());
            await dispatch(logout(true));
        }
        return errorPromise(error, initAccount);
    };
    return async (dispatch, getState) => {
        await dispatch(serverOperations.getBlocksHeight());
        logger.log("Check is LND synced to chain");
        let response = await dispatch(lndOperations.waitLndSync());
        if (!response.ok) {
            return handleError(dispatch, getState, response.error);
        }
        logger.log("LND synced succesfully");
        tempNewAcc = false;
        response = await window.ipcClient("startLis");
        logger.log("LIS start");
        if (!response.ok) {
            return handleError(dispatch, getState, response.error);
        }
        response = await dispatch(getLightningID());
        logger.log("Have got lightning id");
        logger.log(response);
        if (!response.ok) {
            return handleError(dispatch, getState, response.error);
        }
        response = await dispatch(lightningOperations.getHistory());
        logger.log("Have got history");
        logger.log(response);
        if (!response.ok) {
            return handleError(dispatch, getState, response.error);
        }
        response = await dispatch(connectKernel());
        if (!response.ok) {
            return handleError(dispatch, getState, response.error);
        }
        dispatch(accountActions.finishInitAccount());
        dispatch(accountActions.loginAccount(login, ""));
        dispatch(accountActions.setConnectedKernelConnectIndicator());
        dispatch(appOperations.closeModal());
        dispatch(notificationsActions.removeAllNotifications());
        dispatch(onChainOperations.subscribeTransactions());
        dispatch(lightningOperations.subscribeInvoices());
        await Promise.all([
            dispatch(contactsOperations.getContacts()),
            dispatch(channelsOperations.getChannels(true)),
            dispatch(channelsOperations.shouldShowCreateTutorial()),
            dispatch(channelsOperations.shouldShowLightningTutorial()),
            dispatch(appOperations.usdBtcRate()),
            dispatch(createNewBitcoinAccount()),
            dispatch(loadAccountSettings()),
        ]);
        dispatch(serverOperations.getMerchants());
        await dispatch(checkBalance());
        await dispatch(streamPaymentOperations.loadStreams());
        return successPromise();
    };
}

function signMessage(message) {
    return async (dispatch, getState) => {
        const response = await window.ipcClient("signMessage", { message });
        if (!response.ok) {
            logger.error("Error on signMessage", response.error);
            return errorPromise(response.error, signMessage);
        }
        dispatch(accountActions.successSignMessage(response.response.signature));
        return successPromise();
    };
}

function setBitcoinMeasure(value) {
    return async (dispatch, getState) => {
        const { lightningID } = getState().account;
        dispatch(accountActions.setBitcoinMeasure(value));
        try {
            db.configBuilder()
                .update()
                .set({ activeMeasure: value })
                .where("lightningId = :lightningID", { lightningID })
                .execute();
            return successPromise();
        } catch (e) {
            return errorPromise(e.message, setBitcoinMeasure);
        }
    };
}

function setSystemNotificationsStatus(value) {
    return async (dispatch, getState) => {
        const { lightningID } = getState().account;
        dispatch(accountActions.setSystemNotificationsStatus(value));
        try {
            db.configBuilder()
                .update()
                .set({ systemNotifications: value })
                .where("lightningId = :lightningID", { lightningID })
                .execute();
            return successPromise();
        } catch (e) {
            return errorPromise(e.message, setSystemNotificationsStatus);
        }
    };
}

function getPeers() {
    return async (dispatch, getState) => {
        const response = await window.ipcClient("listPeers");
        if (response.ok) {
            dispatch(accountActions.setPeers(response.response.peers));
            return successPromise();
        }
        dispatch(accountActions.errorPeers(response.error));
        return errorPromise(response.error, getPeers);
    };
}

function checkLightningID(lightningID) {
    return (dispatch, getState) => {
        dispatch(accountActions.startValidatingLightningID());
        if (!lightningID) {
            dispatch(accountActions.undefinedLightningID());
            dispatch(accountActions.endValidatingLightningID());
            return unsuccessPromise(checkLightningID);
        }
        if (lightningID === getState().account.lightningID) {
            dispatch(accountActions.incorrectLightningID({ error: statusCodes.EXCEPTION_LIGHTNING_ID_WRONG_SELF }));
            dispatch(accountActions.endValidatingLightningID());
            return unsuccessPromise(checkLightningID);
        }
        if (lightningID.length !== getState().account.lightningID.length) {
            dispatch(accountActions.incorrectLightningID({ error: statusCodes.EXCEPTION_LIGHTNING_ID_WRONG_LENGTH }));
            dispatch(accountActions.endValidatingLightningID());
            return unsuccessPromise(checkLightningID);
        }
        dispatch(accountActions.correctLightningID());
        dispatch(accountActions.endValidatingLightningID());
        return successPromise();
    };
}

/**
 *
 * @param amount
 * @param {string} [type=lightning]
 * @return {function(*, *)}
 */
function checkAmount(amount, type = "lightning") {
    return (dispatch, getState) => {
        const {
            lightningBalance, bitcoinBalance, bitcoinMeasureType,
        } = getState().account;
        const { fee } = getState().onchain;

        const validateBitcoin = (am) => {
            if (am <= fee) {
                const currentFee = dispatch(appOperations.convertSatoshiToCurrentMeasure(fee));
                return statusCodes.EXCEPTION_AMOUNT_LESS_THAN_FEE(currentFee, bitcoinMeasureType);
            } else if (am > bitcoinBalance) {
                return statusCodes.EXCEPTION_AMOUNT_ONCHAIN_NOT_ENOUGH_FUNDS;
            }
            return null;
        };

        if (!amount && amount !== 0) {
            return statusCodes.EXCEPTION_FIELD_IS_REQUIRED;
        } else if (!Number.isFinite(amount)) {
            return statusCodes.EXCEPTION_FIELD_DIGITS_ONLY;
        }

        const satoshiAmount = dispatch(appOperations.convertToSatoshi(amount));
        if (!satoshiAmount) {
            return statusCodes.EXCEPTION_AMOUNT_EQUAL_ZERO(bitcoinMeasureType);
        } else if (satoshiAmount < 0) {
            return statusCodes.EXCEPTION_AMOUNT_NEGATIVE;
        }
        if (type === "bitcoin") {
            return validateBitcoin(satoshiAmount);
        }

        if (satoshiAmount > lightningBalance) {
            return statusCodes.EXCEPTION_AMOUNT_LIGHTNING_NOT_ENOUGH_FUNDS;
        } else if (satoshiAmount > MAX_PAYMENT_REQUEST) {
            const capacity = dispatch(appOperations.convertSatoshiToCurrentMeasure(MAX_PAYMENT_REQUEST));
            return statusCodes.EXCEPTION_AMOUNT_MORE_MAX(capacity, bitcoinMeasureType);
        }
        return null;
    };
}

export {
    setInitConfig,
    loadAccountSettings,
    connectKernel,
    connectServerLnd,
    getLightningID,
    initAccount,
    logout,
    signMessage,
    getPeers,
    createNewBitcoinAccount,
    checkLightningID,
    checkAmount,
    checkBalance,
    setBitcoinMeasure,
    openSystemNotificationsModal,
    setSystemNotificationsStatus,
};
