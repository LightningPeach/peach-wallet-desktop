import * as types from "./types";

const errorPayment = error => ({
    payload: error,
    type: types.ERROR_PAYMENT,
});

const clearSinglePaymentDetails = () => ({
    type: types.CLEAR_SINGLE_PAYMENT_DETAILS,
});

const paymentPreparing = (lightningID, amount, comment, payReq, payReqDecoded, name, contactName, fee) => ({
    payload: {
        amount,
        comment,
        contact_name: contactName,
        fee,
        lightningID,
        name,
        pay_req: payReq,
        pay_req_decoded: payReqDecoded,
    },
    type: types.PAYMENT_PREPARING,
});

const pendingPayment = () => ({
    type: types.PENDING_PAYMENT,
});

const setHistory = history => ({
    payload: history,
    type: types.SET_HISTORY,
});

const successPayment = () => ({
    type: types.SUCCESS_PAYMENT,
});

const paymentRequestCreator = (paymentRequest, paymentRequestAmount) => ({
    payload: {
        paymentRequest,
        paymentRequestAmount,
    },
    type: types.PAYMENT_REQUEST_CREATOR,
});

const paymentRequestErrorCreator = error => ({
    payload: error,
    type: types.PAYMENT_REQUEST_ERROR_CREATOR,
});

const setExternalPaymentRequest = payload => ({
    payload,
    type: types.SET_EXTERNAL_PAYMENT_REQUEST,
});

export {
    clearSinglePaymentDetails,
    errorPayment,
    paymentPreparing,
    pendingPayment,
    setHistory,
    successPayment,
    paymentRequestCreator,
    paymentRequestErrorCreator,
    setExternalPaymentRequest,
};
