import * as types from "./types";

const prepareStreamPayment = payload => ({
    payload,
    type: types.PREPARE_STREAM_PAYMENT,
});

const setStreamPaymentStatus = (streamId, status) => ({
    payload: {
        status,
        streamId,
    },
    type: types.SET_STREAM_PAYMENT_STATUS,
});

const setStreamLastPayment = (streamId, lastPayment) => ({
    payload: {
        lastPayment,
        streamId,
    },
    type: types.SET_STREAM_LAST_PAYMENT,
});

const changeStreamPartsPaid = (streamId, change) => ({
    payload: {
        change,
        streamId,
    },
    type: types.CHANGE_STREAM_PARTS_PAID,
});

const changeStreamPartsPending = (streamId, change) => ({
    payload: {
        change,
        streamId,
    },
    type: types.CHANGE_STREAM_PARTS_PENDING,
});

const addStreamPaymentToList = () => ({
    type: types.ADD_STREAM_PAYMENT_TO_LIST,
});

const setStreamPayments = payload => ({
    payload,
    type: types.SET_STREAM_PAYMENTS,
});

const setStreamPaymentIntervalId = (streamId, paymentIntervalId) => ({
    payload: {
        paymentIntervalId,
        streamId,
    },
    type: types.SET_STREAM_PAYMENT_INTERVAL_ID,
});

const setStreamErrorTimeoutId = (streamId, errorTimeoutId) => ({
    payload: {
        errorTimeoutId,
        streamId,
    },
    type: types.SET_STREAM_ERROR_TIMEOUT_ID,
});

export {
    prepareStreamPayment,
    setStreamPaymentStatus,
    changeStreamPartsPaid,
    changeStreamPartsPending,
    addStreamPaymentToList,
    setStreamPayments,
    setStreamPaymentIntervalId,
    setStreamLastPayment,
    setStreamErrorTimeoutId,
};
