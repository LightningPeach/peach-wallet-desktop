import { getCookie } from "additional";
import { ALL_MEASURES } from "config/consts";
import * as types from "./types";

export const setLisStatus = lisStatus => ({
    payload: lisStatus,
    type: types.SET_LIS_STATUS,
});

export const setLightningID = payload => ({
    payload,
    type: types.SET_LIGHTNING_ID,
});

export const createAccount = () => ({
    type: types.CREATE_ACCOUNT,
});

export const successCreatenewAccount = () => ({
    type: types.SUCCESS_CREATE_NEW_ACCOUNT,
});

export const errorCreateNewAccount = payload => ({
    payload,
    type: types.ERROR_CREATE_NEW_ACCOUNT,
});

export const logoutAcount = (keepModalState = false) => ({
    payload: keepModalState,
    type: types.LOGOUT_ACCOUNT,
});

export const successLogout = () => ({
    type: types.SUCCESS_LOGOUT_ACCOUNT,
});

export const startLogout = () => ({
    type: types.START_LOGOUT,
});

export const finishLogout = () => ({
    type: types.FINISH_LOGOUT,
});

export const loginAccount = (login, password) => ({
    payload: {
        login,
        password,
    },
    type: types.LOGIN_ACCOUNT,
});

export const errorAuthOnServer = error => ({
    payload: error,
    type: types.ERROR_AUTH_ON_SERVER,
});

export const startInitAccount = () => ({
    type: types.START_INIT_ACCOUNT,
});

export const finishInitAccount = () => {
    document.body.style.cursor = "default";
    const redirect = getCookie("redirect_params");
    /* istanbul ignore if */
    if (redirect) {
        window.location.href = redirect.replace(/^\/|"/g, "");
    }
    return {
        type: types.FINISH_INIT_ACCOUNT,
    };
};

export const errorConnectKernel = error => ({
    payload: error,
    type: types.ERROR_CONNECT_KERNEL,
});

export const successConnectKernel = () => ({
    type: types.SUCCESS_CONNECT_KERNEL,
});

export const successSignMessage = signedMessage => ({
    payload: signedMessage,
    type: types.SUCCESS_SIGN_MESSAGE,
});

export const setConnectedKernelConnectIndicator = () => ({
    payload: types.KERNEL_CONNECTED,
    type: types.SET_CONNECTED_KERNEL_CONNECT_INDICATOR,
});

export const setDisconnectedKernelConnectIndicator = () => ({
    payload: types.KERNEL_DISCONNECTED,
    type: types.SET_DISCONNECTED_KERNEL_CONNECT_INDICATOR,
});

export const setPeers = (peers) => {
    const processedPeers = [];
    for (let i = 0, l = peers.length; i < l; i += 1) {
        processedPeers.push({
            address: peers[i].address,
            lightningID: peers[i].pub_key,
            peerID: peers[i].peer_id,
        });
    }
    return {
        payload: processedPeers,
        type: types.SET_PEERS,
    };
};

export const errorPeers = error => ({
    payload: error,
    type: types.ERROR_PEERS,
});

export const addBitcoinAccount = address => ({
    payload: [{ address }],
    type: types.ADD_BITCOIN_ACCOUNT,
});

export const successGenerateQRCode = QRCode => ({
    payload: QRCode,
    type: types.SUCCESS_GENERATE_QR_CODE,
});

export const setBitcoinMeasure = (bitcoinMeasureType) => {
    const payload = {};
    payload.bitcoinMeasureType = bitcoinMeasureType;
    payload.bitcoinMeasureMultiplier = ALL_MEASURES[0].multiplier;
    payload.lightningMeasureType = ALL_MEASURES[0].ln;
    payload.toFixedMeasure = ALL_MEASURES[0].toFixed;
    payload.toFixedMeasureAll = ALL_MEASURES[0].toFixedAll;
    for (let i = 0, l = ALL_MEASURES.length; i < l; i += 1) {
        if (bitcoinMeasureType === ALL_MEASURES[i].btc) {
            payload.bitcoinMeasureMultiplier = ALL_MEASURES[i].multiplier;
            payload.lightningMeasureType = ALL_MEASURES[i].ln;
            payload.toFixedMeasure = ALL_MEASURES[i].toFixed;
            payload.toFixedMeasureAll = ALL_MEASURES[i].toFixedAll;
            break;
        }
    }
    window.ipcClient("set-bitcoin-measure", {
        multiplier: payload.bitcoinMeasureMultiplier,
        toFixed: payload.toFixedMeasure,
        type: payload.bitcoinMeasureType,
    });
    return {
        payload,
        type: types.SET_BITCOIN_MEASURE,
    };
};

export const undefinedLightningID = () => ({
    type: types.UNDEFINED_LIGHTNING_ID,
});

export const correctLightningID = () => ({
    type: types.CORRECT_LIGHTNING_ID,
});

export const incorrectLightningID = errorLightningIDEnter => ({
    payload: errorLightningIDEnter.error,
    type: types.INCORRECT_LIGHTNING_ID,
});

export const startValidatingLightningID = () => ({
    type: types.START_VALIDATING_LIGHTNING_ID,
});

export const endValidatingLightningID = () => ({
    type: types.END_VALIDATING_LIGHTNING_ID,
});

export const incorrectPaymentAmount = errorAmountEnter => ({
    payload: errorAmountEnter,
    type: types.INCORRECT_PAYMENT_AMOUNT,
});

export const undefinedPaymentAmount = () => ({
    type: types.UNDEFINED_PAYMENT_AMOUNT,
});

export const correctPaymentAmount = () => ({
    type: types.CORRECT_PAYMENT_AMOUNT,
});

export const successCheckBalance = (bitcoinBalance, lightningBalance, unConfirmedBitcoinBalance) => ({
    payload: {
        bitcoinBalance,
        lightningBalance,
        unConfirmedBitcoinBalance,
    },
    type: types.SUCCESS_CHECK_BALANCE,
});

export const errorCheckBalance = error => ({
    payload: error,
    type: types.ERROR_CHECK_BALANCE,
});

export const setSystemNotificationsStatus = status => ({
    payload: status,
    type: types.SET_SYSTEM_NOTIFICATIONS_STATUS,
});

export const setAnalyticsMode = payload => ({
    payload,
    type: types.SET_ANALYTICS_MODE,
});

export const setWalletMode = payload => ({
    payload,
    type: types.SET_WALLET_MODE,
});

export const setTermsMode = payload => ({
    payload,
    type: types.SET_TERMS_MODE,
});
