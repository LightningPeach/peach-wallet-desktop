import * as types from "./types";

const prepareStreamPayment = streamDetails => ({
    payload: streamDetails,
    type: types.PREPARE_STREAM_PAYMENT,
});

const setStreamPaymentStatus = (streamId, status) => ({
    payload: {
        status,
        streamId,
    },
    type: types.SET_STREAM_PAYMENT_STATUS,
});

const setStreamCurrentIteration = (streamId, sec) => ({
    payload: {
        currentPart: sec,
        streamId,
    },
    type: types.SET_STREAM_CURRENT_ITERATION,
});

const addStreamPaymentToList = () => ({
    type: types.ADD_STREAM_PAYMENT_TO_LIST,
});

const setStreamPayments = streams => ({
    payload: streams,
    type: types.SET_STREAM_PAYMENTS,
});

export {
    prepareStreamPayment,
    setStreamPaymentStatus,
    setStreamCurrentIteration,
    addStreamPaymentToList,
    setStreamPayments,
};
