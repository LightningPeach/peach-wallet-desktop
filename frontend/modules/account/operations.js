import { hashHistory } from "react-router";
import { appOperations } from "modules/app";
import { lndActions, lndOperations } from "modules/lnd";
import { notificationsActions } from "modules/notifications";
import { channelsOperations } from "modules/channels";
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
} from "additional";
import {
    MAX_PAYMENT_REQUEST,
    ALL_MEASURES,
} from "config/consts";
import * as statusCodes from "config/status-codes";
import * as accountActions from "./actions";
import * as types from "./types";
import * as actions from "../channels/actions";

window.ipcRenderer.on("lnd-down", () => {
    store.dispatch(accountActions.setDisconnectedKernelConnectIndicator());
});

window.ipcRenderer.on("lnd-up", () => {
    store.dispatch(accountActions.setConnectedKernelConnectIndicator());
});

window.ipcRenderer.on("lis-up", () => {
    if (store.getState().account.lisStatus === types.LIS_UP) {
        return;
    }
    store.dispatch(accountActions.setLisStatus(types.LIS_UP));
});

window.ipcRenderer.on("lis-down", () => {
    if (store.getState().account.lisStatus === types.LIS_DOWN) {
        return;
    }
    store.dispatch(accountActions.setLisStatus(types.LIS_DOWN));
});

function createNewBitcoinAccount() {
    return async (dispatch, getState) => {
        const response = await window.ipcClient("newAddress");
        if (response.ok) {
            dispatch(accountActions.addBitcoinAccount(response.response.address));
            return successPromise();
        }
        return errorPromise(response.error, createNewBitcoinAccount);
    };
}

async function setInitConfig(lightningId) {
    await db.configBuilder()
        .insert()
        .values({
            activeMeasure: ALL_MEASURES[0].btc,
            createChannelViewed: 0,
            enableNotifications: 0,
            lightningId,
        })
        .execute();
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
                    dispatch(actions.updateCreateTutorialStatus(types.HIDE));
                }
                let notificationsStatus;
                switch (response.enableNotifications) {
                    case "disabledDontAsk":
                        notificationsStatus = types.DISABLED_DONT_ASK;
                        break;
                    case "enabled":
                        notificationsStatus = types.ENABLED;
                        break;
                    case "enabledSilent":
                        notificationsStatus = types.ENABLED_SILENT;
                        break;
                    case "disabledSilent":
                        notificationsStatus = types.DISABLED_SILENT;
                        break;
                    default:
                        notificationsStatus = types.DISABLED;
                }
                dispatch(accountActions.setSystemNotificationsStatus(notificationsStatus));
            } else {
                await setInitConfig(lightningID);
                dispatch(accountActions.setBitcoinMeasure(ALL_MEASURES[0].btc));
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
        await dispatch(streamPaymentOperations.pauseAllStream());
        if (getState().account.serverSocket) {
            try {
                getState()
                    .account
                    .serverSocket
                    .close();
            } catch (error) {
                console.error(error);
            }
        }
        await dispatch(onChainOperations.unSubscribeTransactions());
        await dispatch(lightningOperations.unSubscribeInvoices());
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
        await dispatch(lndOperations.getBlocksHeight());
        console.log("Check is LND synced to chain");
        let response = await dispatch(lndOperations.waitLndSync());
        if (!response.ok) {
            return handleError(dispatch, getState, response.error);
        }
        console.log("LND synced succesfully");
        tempNewAcc = false;
        response = await window.ipcClient("startLis");
        console.log("LIS start");
        if (!response.ok) {
            return handleError(dispatch, getState, response.error);
        }
        response = await window.ipcClient("startStreamManager");
        if (!response.ok) {
            return handleError(dispatch, getState, response.error);
        }
        response = await dispatch(getLightningID());
        console.log("Have got lightning id");
        console.log(response);
        if (!response.ok) {
            return handleError(dispatch, getState, response.error);
        }
        response = await dispatch(lightningOperations.getHistory());
        console.log("Have got history");
        console.log(response);
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
            dispatch(channelsOperations.getChannels()),
            dispatch(channelsOperations.shouldShowCreateTutorial()),
            dispatch(channelsOperations.shouldShowLightningTutorial()),
            dispatch(appOperations.usdBtcRate()),
            dispatch(createNewBitcoinAccount()),
            dispatch(loadAccountSettings()),
        ]);
        return successPromise();
    };
}

function signMessage(message) {
    return async (dispatch, getState) => {
        const response = await window.ipcClient("signMessage", { message });
        if (!response.ok) {
            console.error("Error on signMessage", response.error);
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
            lightningBalance, bitcoinBalance, bitcoinMeasureType, maximumPayment,
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
        } else if (satoshiAmount > maximumPayment || satoshiAmount > MAX_PAYMENT_REQUEST) {
            const capa = satoshiAmount > MAX_PAYMENT_REQUEST ? MAX_PAYMENT_REQUEST : maximumPayment;
            const capacity = dispatch(appOperations.convertSatoshiToCurrentMeasure(capa));
            return statusCodes.EXCEPTION_AMOUNT_MORE_MAX(capacity, bitcoinMeasureType);
        }
        return null;
    };
}

function checkBalance() {
    return async (dispatch, getState) => {
        const responseChannels = await window.ipcClient("listChannels");
        if (!responseChannels.ok) {
            dispatch(accountActions.errorCheckBalance(responseChannels.error));
            return unsuccessPromise(checkBalance);
        }
        let lightningBalance = 0;
        let maximumCapacity = 0;
        const { channels } = responseChannels.response;
        channels.forEach((channel) => {
            if (!channel.local_balance) {
                return;
            }
            lightningBalance += parseInt(channel.local_balance, 10);
            if (maximumCapacity < channel.local_balance) {
                maximumCapacity = parseInt(channel.local_balance, 10);
                // TODO maybe local problem, if all bad on server increase 1% to 1.1%
                // if reserve 1% of channel capacity, payment with remaining balance can't be sent 'cause of
                // "unable to route payment to destination: TemporaryChannelFailure"
                maximumCapacity -= (parseInt(channel.capacity, 10)) / 100;
            }
        });
        if (getState().account.maximumPayment !== maximumCapacity) {
            dispatch(accountActions.setMaximumPayment(maximumCapacity));
        }
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
};
