import * as types from "./types";

const setCurrentStream = payload => ({
    payload,
    type: types.SET_CURRENT_STREAM,
});

const prepareStreamPayment = payload => ({
    payload,
    type: types.PREPARE_STREAM_PAYMENT,
});

const updateStreamPayment = (streamId, details) => ({
    payload: {
        details,
        streamId,
    },
    type: types.UPDATE_STREAM_PAYMENT,
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

export {
    setCurrentStream,
    prepareStreamPayment,
    updateStreamPayment,
    changeStreamPartsPaid,
    changeStreamPartsPending,
    addStreamPaymentToList,
    setStreamPayments,
};
