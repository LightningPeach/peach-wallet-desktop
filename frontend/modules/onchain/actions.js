import * as types from "./types";

const setOnChainHistory = history => ({
    payload: history,
    type: types.SET_ONCHAIN_HISTORY,
});

const sendCoinsPreparing = (recepient, amount, name) => ({
    payload: {
        amount,
        name: name || "",
        recepient,
    },
    type: types.SEND_COINS_PREPARING,
});

const clearSendCoinsPreparing = () => ({
    type: types.CLEAR_SEND_COINS_PREPARING,
});

const setOnChainFee = fee => ({
    payload: fee,
    type: types.SET_ONCHAIN_FEE,
});

const setSendCoinsPaymentDetails = message => ({
    payload: message,
    type: types.SET_SEND_COINS_PAYMENT_DETAILS,
});

export {
    setOnChainHistory,
    sendCoinsPreparing,
    clearSendCoinsPreparing,
    setOnChainFee,
    setSendCoinsPaymentDetails,
};
