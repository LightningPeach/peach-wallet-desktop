import { hashHistory } from "react-router";

import { appOperations, appActions } from "modules/app";
import { accountActions as actions, accountTypes as types } from "modules/account";
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
    clearIntervalLong,
    setAsyncIntervalLong,
} from "additional";
import {
    MAX_PAYMENT_REQUEST,
    ALL_MEASURES,
    LOGOUT_ACCOUNT_TIMEOUT,
    CHANNELS_INTERVAL_TIMEOUT,
    BALANCE_INTERVAL_TIMEOUT,
    USD_PER_BTC_INTERVAL_TIMEOUT,
    LND_SYNC_STATUS_INTERVAL_TIMEOUT,
    GET_MERCHANTS_INTERVAL_TIMEOUT,
} from "config/consts";
import { exceptions } from "config";

window.ipcRenderer.on("lnd-down", /* istanbul ignore next */ () => {
    store.dispatch(actions.setDisconnectedKernelConnectIndicator());
});

window.ipcRenderer.on("lnd-up", /* istanbul ignore next */ () => {
    store.dispatch(actions.setConnectedKernelConnectIndicator());
});

window.ipcRenderer.on("lis-up", /* istanbul ignore next */ () => {
    if (store.getState().account.lisStatus === types.LIS_UP) {
        return;
    }
    store.dispatch(actions.setLisStatus(types.LIS_UP));
});

window.ipcRenderer.on("lis-down", /* istanbul ignore next */ () => {
    if (store.getState().account.lisStatus === types.LIS_DOWN) {
        return;
    }
    store.dispatch(actions.setLisStatus(types.LIS_DOWN));
});

function openSystemNotificationsModal() {
    return dispatch => dispatch(appActions.setModalState(types.MODAL_STATE_SYSTEM_NOTIFICATIONS));
}

function openWalletModeModal() {
    return dispatch => dispatch(appActions.setModalState(types.MODAL_STATE_WALLET_MODE));
}

function checkBalance() {
    return async (dispatch, getState) => {
        const { isLogouting, isLogined } = getState().account;
        if (isLogouting || !isLogined) {
            return successPromise();
        }
        const responseChannels = await window.ipcClient("listChannels");
        if (!responseChannels.ok) {
            dispatch(actions.errorCheckBalance(responseChannels.error));
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
            dispatch(actions.errorCheckBalance(responseWallet.error));
            return unsuccessPromise(checkBalance);
        }
        const bitcoinBalance = parseInt(responseWallet.response.confirmed_balance, 10);
        const unConfirmedBitcoinBalance = parseInt(responseWallet.response.unconfirmed_balance, 10);
        const lBalanceEqual = getState().account.lightningBalance === lightningBalance;
        const bBalanceEqual = getState().account.bitcoinBalance === bitcoinBalance;
        const ubBalanceEqual = getState().account.unConfirmedBitcoinBalance === unConfirmedBitcoinBalance;
        if (!lBalanceEqual || !bBalanceEqual || !ubBalanceEqual) {
            dispatch(actions.successCheckBalance(bitcoinBalance, lightningBalance, unConfirmedBitcoinBalance));
        }
        return successPromise();
    };
}

function createNewBitcoinAccount() {
    return async (dispatch, getState) => {
        const response = await window.ipcClient("newAddress", { type: 1 });
        if (response.ok) {
            dispatch(actions.addBitcoinAccount(response.response.address));
            return successPromise();
        }
        return errorPromise(response.error, createNewBitcoinAccount);
    };
}

function startLis() {
    return async (dispatch, getState) => {
        const {
            walletMode,
            termsMode,
            lisStatus,
            lightningID,
        } = getState().account;
        if (
            walletMode !== types.WALLET_MODE.EXTENDED
            || termsMode !== types.TERMS_MODE.ACCEPTED
            || lisStatus === types.LIS_UP
        ) {
            return successPromise();
        }
        const response = await window.ipcClient("startLis");
        if (!response.ok) {
            dispatch(actions.setWalletMode(types.WALLET_MODE.STANDARD));
            db.configBuilder()
                .update()
                .set({ walletMode: types.WALLET_MODE.STANDARD })
                .where("lightningId = :lightningID", { lightningID })
                .execute();
            return errorPromise(response.error, startLis);
        }
        return successPromise();
    };
}

function shutDownLis() {
    return async (dispatch, getState) => {
        const { lisStatus } = getState().account;
        if (lisStatus !== types.LIS_UP) {
            return successPromise();
        }
        const response = await window.ipcClient("shutDownLis");
        if (!response.ok) {
            return errorPromise(response.error, shutDownLis);
        }
        return successPromise();
    };
}

function setInitConfig(lightningId) {
    return async (dispatch, getState) => {
        const { analyticsMode, termsMode, walletMode } = getState().account;
        const modalFlow = [];
        await db.configBuilder()
            .insert()
            .values({
                activeMeasure: ALL_MEASURES[0].btc,
                analytics: analyticsMode,
                createChannelViewed: 0,
                legalVersion: window.VERSION.Legal,
                lightningId,
                systemNotifications: types.NOTIFICATIONS.DISABLED_LOUD_SHOW_AGAIN,
                terms: termsMode,
                walletMode,
            })
            .execute();
        dispatch(actions.setBitcoinMeasure(ALL_MEASURES[0].btc));
        dispatch(actions.setSystemNotificationsStatus(types.NOTIFICATIONS.DISABLED_LOUD_SHOW_AGAIN));
        if (termsMode === types.TERMS_MODE.PENDING || analyticsMode === types.ANALYTICS_MODE.PENDING) {
            modalFlow.push(types.MODAL_STATE_TERMS_AND_CONDITIONS);
        }
        if (walletMode === types.WALLET_MODE.PENDING) {
            modalFlow.push(types.MODAL_STATE_WALLET_MODE);
        }
        modalFlow.push(types.MODAL_STATE_SYSTEM_NOTIFICATIONS);
        dispatch(appActions.addModalToFlow(modalFlow));
        dispatch(appOperations.startModalFlow());
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
                const modalFlow = [];
                dispatch(actions.setBitcoinMeasure(response.activeMeasure));
                dispatch(actions.setAnalyticsMode(response.analytics || types.ANALYTICS_MODE.PENDING));
                dispatch(actions.setWalletMode(response.walletMode || types.WALLET_MODE.PENDING));
                dispatch(actions.setTermsMode(response.terms || types.TERMS_MODE.PENDING));
                dispatch(actions.setSystemNotificationsStatus(response.systemNotifications));
                if (
                    !response.terms
                    || response.terms === types.TERMS_MODE.PENDING
                    || !response.analytics
                    || response.analytics === types.ANALYTICS_MODE.PENDING
                    || response.legalVersion !== window.VERSION.Legal
                ) {
                    modalFlow.push(types.MODAL_STATE_TERMS_AND_CONDITIONS);
                }
                if (!response.walletMode || response.walletMode === types.WALLET_MODE.PENDING) {
                    modalFlow.push(types.MODAL_STATE_WALLET_MODE);
                }
                if (response.createChannelViewed) {
                    dispatch(channelsActions.updateCreateTutorialStatus(channelsTypes.HIDE));
                }
                if (response.systemNotifications === types.NOTIFICATIONS.DISABLED_LOUD_SHOW_AGAIN) {
                    modalFlow.push(types.MODAL_STATE_SYSTEM_NOTIFICATIONS);
                }
                if (modalFlow.length) {
                    dispatch(appActions.addModalToFlow(modalFlow));
                    dispatch(appOperations.startModalFlow());
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
            dispatch(actions.errorConnectKernel(response.error));
            return errorPromise(response.error, connectKernel);
        }

        dispatch(actions.successConnectKernel());
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
        dispatch(actions.setLightningID(response.response.identity_pubkey));
        return successPromise();
    };
}

/* istanbul ignore next */
function startIntervalStatusChecks() {
    return (dispatch, getState) => {
        setAsyncIntervalLong(
            async () => {
                if (getState().account.isLogined) {
                    await dispatch(channelsOperations.getChannels());
                }
            },
            CHANNELS_INTERVAL_TIMEOUT,
            types.CHANNELS_INTERVAL_ID,
        );
        setAsyncIntervalLong(
            async () => {
                if (getState().account.isLogined) {
                    await dispatch(checkBalance());
                }
            },
            BALANCE_INTERVAL_TIMEOUT,
            types.BALANCE_INTERVAL_ID,
        );
        setAsyncIntervalLong(
            async () => {
                if (getState().account.isLogined) {
                    await dispatch(appOperations.usdBtcRate());
                }
            },
            USD_PER_BTC_INTERVAL_TIMEOUT,
            types.USD_PER_BTC_INTERVAL_ID,
        );
        setAsyncIntervalLong(
            async () => {
                if (getState().account.isLogined) {
                    await dispatch(lndOperations.checkLndSync());
                }
            },
            LND_SYNC_STATUS_INTERVAL_TIMEOUT,
            types.LND_SYNC_STATUS_INTERVAL_ID,
        );
        setAsyncIntervalLong(
            async () => {
                if (getState().account.isLogined) {
                    await dispatch(serverOperations.getMerchants());
                }
            },
            GET_MERCHANTS_INTERVAL_TIMEOUT,
            types.GET_MERCHANTS_INTERVAL_ID,
        );
    };
}

/* istanbul ignore next */
function finishIntervalStatusChecks() {
    clearIntervalLong(types.CHANNELS_INTERVAL_ID);
    clearIntervalLong(types.BALANCE_INTERVAL_ID);
    clearIntervalLong(types.USD_PER_BTC_INTERVAL_ID);
    clearIntervalLong(types.LND_SYNC_STATUS_INTERVAL_ID);
    clearIntervalLong(types.GET_MERCHANTS_INTERVAL_ID);
}

function logout(keepModalState = false, rebuilding = false) {
    return async (dispatch, getState) => {
        if (getState().account.isLogouting) {
            return unsuccessPromise(logout);
        }
        dispatch(actions.startLogout());
        await dispatch(streamPaymentOperations.pauseAllStreams(false));
        finishIntervalStatusChecks();
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
        if (!rebuilding) {
            dispatch(actions.logoutAcount(keepModalState));
            hashHistory.push("/");
        }
        dispatch(actions.finishLogout());
        dispatch(notificationsActions.removeAllNotifications());
        return successPromise();
    };
}

function initAccount(login, newAccount = false) {
    let tempNewAcc = newAccount;
    const handleError = async (dispatch, getState, error) => {
        if (!tempNewAcc) {
            dispatch(actions.finishInitAccount());
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
        dispatch(actions.finishInitAccount());
        dispatch(actions.loginAccount(login, ""));
        dispatch(actions.setConnectedKernelConnectIndicator());
        dispatch(appOperations.closeModal());
        dispatch(notificationsActions.removeAllNotifications());
        dispatch(onChainOperations.subscribeTransactions());
        dispatch(lightningOperations.subscribeInvoices());
        await Promise.all([
            dispatch(contactsOperations.getContacts()),
            dispatch(channelsOperations.getChannels(true)),
            dispatch(channelsOperations.shouldShowCreateTutorial()),
            dispatch(appOperations.usdBtcRate()),
            dispatch(createNewBitcoinAccount()),
            dispatch(loadAccountSettings()),
        ]);
        dispatch(serverOperations.getMerchants());
        await dispatch(startLis());
        await dispatch(checkBalance());
        await dispatch(streamPaymentOperations.loadStreams());
        dispatch(startIntervalStatusChecks());
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
        dispatch(actions.successSignMessage(response.response.signature));
        return successPromise();
    };
}

function setBitcoinMeasure(value) {
    return async (dispatch, getState) => {
        const { lightningID } = getState().account;
        dispatch(actions.setBitcoinMeasure(value));
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
        dispatch(actions.setSystemNotificationsStatus(value));
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

function setAnalyticsMode(value) {
    return async (dispatch, getState) => {
        const { lightningID } = getState().account;
        dispatch(actions.setAnalyticsMode(value));
        try {
            db.configBuilder()
                .update()
                .set({ analytics: value })
                .where("lightningId = :lightningID", { lightningID })
                .execute();
            return successPromise();
        } catch (e) {
            return errorPromise(e.message, setAnalyticsMode);
        }
    };
}

function setTermsMode(value) {
    return async (dispatch, getState) => {
        const { lightningID } = getState().account;
        dispatch(actions.setTermsMode(value));
        try {
            db.configBuilder()
                .update()
                .set({
                    legalVersion: window.VERSION.Legal,
                    terms: value,
                })
                .where("lightningId = :lightningID", { lightningID })
                .execute();
            return successPromise();
        } catch (e) {
            return errorPromise(e.message, setTermsMode);
        }
    };
}

function setWalletMode(value) {
    return async (dispatch, getState) => {
        const { lightningID } = getState().account;
        dispatch(actions.setWalletMode(value));
        try {
            db.configBuilder()
                .update()
                .set({ walletMode: value })
                .where("lightningId = :lightningID", { lightningID })
                .execute();
            if (value === types.WALLET_MODE.EXTENDED) {
                await dispatch(startLis());
            } else if (value === types.WALLET_MODE.STANDARD) {
                dispatch(streamPaymentOperations.pauseAllStreams());
                await dispatch(shutDownLis());
            }
            return successPromise();
        } catch (e) {
            return errorPromise(e.message, setWalletMode);
        }
    };
}

function getPeers() {
    return async (dispatch, getState) => {
        const response = await window.ipcClient("listPeers");
        if (response.ok) {
            dispatch(actions.setPeers(response.response.peers));
            return successPromise();
        }
        dispatch(actions.errorPeers(response.error));
        return errorPromise(response.error, getPeers);
    };
}

function checkLightningID(lightningID) {
    return (dispatch, getState) => {
        dispatch(actions.startValidatingLightningID());
        if (!lightningID) {
            dispatch(actions.undefinedLightningID());
            dispatch(actions.endValidatingLightningID());
            return unsuccessPromise(checkLightningID);
        }
        if (lightningID === getState().account.lightningID) {
            dispatch(actions.incorrectLightningID({ error: exceptions.LIGHTNING_ID_WRONG_SELF }));
            dispatch(actions.endValidatingLightningID());
            return unsuccessPromise(checkLightningID);
        }
        if (lightningID.length !== getState().account.lightningID.length) {
            dispatch(actions.incorrectLightningID({ error: exceptions.LIGHTNING_ID_WRONG_LENGTH }));
            dispatch(actions.endValidatingLightningID());
            return unsuccessPromise(checkLightningID);
        }
        dispatch(actions.correctLightningID());
        dispatch(actions.endValidatingLightningID());
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
                return exceptions.AMOUNT_LESS_THAN_FEE(currentFee, bitcoinMeasureType);
            } else if (am > bitcoinBalance) {
                return exceptions.AMOUNT_ONCHAIN_NOT_ENOUGH_FUNDS;
            }
            return null;
        };

        if (!amount && amount !== 0) {
            return exceptions.FIELD_IS_REQUIRED;
        } else if (!Number.isFinite(amount)) {
            return exceptions.FIELD_DIGITS_ONLY;
        }

        const satoshiAmount = dispatch(appOperations.convertToSatoshi(amount));
        if (!satoshiAmount) {
            return exceptions.AMOUNT_EQUAL_ZERO(bitcoinMeasureType);
        } else if (satoshiAmount < 0) {
            return exceptions.AMOUNT_NEGATIVE;
        }
        if (type === "bitcoin") {
            return validateBitcoin(satoshiAmount);
        }

        if (satoshiAmount > lightningBalance) {
            return exceptions.AMOUNT_LIGHTNING_NOT_ENOUGH_FUNDS;
        } else if (satoshiAmount > MAX_PAYMENT_REQUEST) {
            const capacity = dispatch(appOperations.convertSatoshiToCurrentMeasure(MAX_PAYMENT_REQUEST));
            return exceptions.AMOUNT_MORE_MAX(capacity, bitcoinMeasureType);
        }
        return null;
    };
}

/**
 * @return ${host}/n${macaroonsHex}/n${port}
 */
function getRemoteAccressString() {
    return async (dispatch, getState) => {
        const response = await window.ipcClient("generateRemoteAccessString", { username: getState().account.login });
        if (!response.ok) {
            logger.error("Error on getRemoteAccressString", response.error);
            return errorPromise(response.error, getRemoteAccressString);
        }

        return successPromise({
            remoteAccessString: response.remoteAccessString,
        });
    };
}

function rebuildCertificate() {
    return async (dispatch, getState) => {
        await dispatch(logout(true, true));
        const response = await window.ipcClient("rebuildLndCerts", { username: getState().account.login });
        if (!response.ok) {
            logger.error("Error on rebuildCertificate", response.error);
            return errorPromise(response.error, rebuildCertificate);
        }
        return successPromise();
    };
}

export {
    setInitConfig,
    loadAccountSettings,
    connectKernel,
    connectServerLnd,
    startLis,
    shutDownLis,
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
    openWalletModeModal,
    setSystemNotificationsStatus,
    startIntervalStatusChecks,
    finishIntervalStatusChecks,
    setAnalyticsMode,
    setTermsMode,
    setWalletMode,
    getRemoteAccressString,
    rebuildCertificate,
};
