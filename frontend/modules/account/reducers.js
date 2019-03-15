import { ALL_MEASURES } from "config/consts";
import * as types from "./types";

export const initStateAccount = {
    amountStatus: "undefined",
    analyticsMode: types.ANALYTICS_MODE.PENDING,
    bitcoinAccount: ["Wallet syncing"],
    bitcoinBalance: 0,
    bitcoinMeasureMultiplier: ALL_MEASURES[0].multiplier,
    bitcoinMeasureType: ALL_MEASURES[0].btc,
    channelDetails: [],
    channels: [],
    errorAmountEnter: "",
    expectedBitcoinBalance: 0,
    isConnectedToKernel: false,
    isIniting: false,
    isLogined: false,
    isLogouting: false,
    kernelConnectIndicator: "kernel-ind-none",
    lightningBalance: 0,
    lightningID: "",
    lightningMeasureType: ALL_MEASURES[0].ln,
    lisStatus: types.LIS_NONE,
    login: "",
    menuStatus: "menu-hidden",
    // TODO refactor
    newAccount: {
        creatingError: null,
        isCreating: false,
    },
    peers: [],
    signedMessage: null,
    systemNotifications: types.NOTIFICATIONS.DISABLED_LOUD_SHOW_AGAIN,
    termsMode: types.TERMS_MODE.PENDING,
    toFixedMeasure: ALL_MEASURES[0].toFixed,
    toFixedMeasureAll: ALL_MEASURES[0].toFixedAll,
    unConfirmedBitcoinBalance: 0,
    validatingLightningId: false,
    walletMode: types.WALLET_MODE.PENDING,
};

const defaultState = JSON.parse(JSON.stringify(initStateAccount));

const accountReducer = (state = defaultState, action) => {
    switch (action.type) {
        case types.CREATE_ACCOUNT:
            return { ...state, ...{ newAccount: { creatingError: null, isCreating: true } } };
        case types.SUCCESS_CREATE_NEW_ACCOUNT:
            return { ...state, ...{ newAccount: { creatingError: null, isCreating: false } } };
        case types.ERROR_CREATE_NEW_ACCOUNT:
            return { ...state, ...{ newAccount: { creatingError: action.payload, isCreating: false } } };
        case types.SET_LIGHTNING_ID:
            return { ...state, lightningID: action.payload };
        case types.LOGIN_ACCOUNT:
            return { ...state, ...action.payload, isLogined: true };
        case types.START_INIT_ACCOUNT:
            return { ...state, isIniting: true };
        case types.FINISH_INIT_ACCOUNT:
            return { ...state, isIniting: false };
        case types.LOGOUT_ACCOUNT:
            return defaultState;
        case types.START_LOGOUT:
            return { ...state, isLogouting: true };
        case types.FINISH_LOGOUT:
            return { ...state, isLogouting: false };
        case types.SUCCESS_CONNECT_KERNEL:
            return { ...state, isConnectedToKernel: true };
        case types.SUCCESS_SIGN_MESSAGE:
            return { ...state, signedMessage: action.payload };
        case types.SET_CONNECTED_KERNEL_CONNECT_INDICATOR:
        case types.SET_DISCONNECTED_KERNEL_CONNECT_INDICATOR:
            return { ...state, kernelConnectIndicator: action.payload };
        case types.SET_PEERS:
            return { ...state, peers: action.payload };
        case types.ADD_BITCOIN_ACCOUNT:
            return { ...state, bitcoinAccount: action.payload };
        case types.SUCCESS_GENERATE_QR_CODE:
            return { ...state, QRCode: action.payload };
        case types.SET_BITCOIN_MEASURE:
            return { ...state, ...action.payload };
        case types.UNDEFINED_LIGHTNING_ID:
            return { ...state, errorLightningIDEnter: "", lightningIDEnterStatus: "undefined" };
        case types.CORRECT_LIGHTNING_ID:
            return { ...state, errorLightningIDEnter: "", lightningIDEnterStatus: "correct" };
        case types.INCORRECT_LIGHTNING_ID:
            return { ...state, errorLightningIDEnter: action.payload, lightningIDEnterStatus: "incorrect" };
        case types.START_VALIDATING_LIGHTNING_ID:
            return { ...state, validatingLightningId: true };
        case types.END_VALIDATING_LIGHTNING_ID:
            return { ...state, validatingLightningId: false };
        case types.INCORRECT_PAYMENT_AMOUNT:
            return { ...state, amountStatus: "incorrect", errorAmountEnter: action.payload };
        case types.UNDEFINED_PAYMENT_AMOUNT:
            return { ...state, amountStatus: "undefined", errorAmountEnter: "" };
        case types.CORRECT_PAYMENT_AMOUNT:
            return { ...state, amountStatus: "correct", errorAmountEnter: "" };
        case types.SUCCESS_CHECK_BALANCE:
            return { ...state, ...action.payload };
        case types.SET_LIS_STATUS:
            return { ...state, lisStatus: action.payload };
        case types.SET_SYSTEM_NOTIFICATIONS_STATUS:
            return { ...state, systemNotifications: action.payload };
        case types.SET_ANALYTICS_MODE:
            return { ...state, analyticsMode: action.payload };
        case types.SET_TERMS_MODE:
            return { ...state, termsMode: action.payload };
        case types.SET_WALLET_MODE:
            return { ...state, walletMode: action.payload };
        default:
            return state;
    }
};

export default accountReducer;
