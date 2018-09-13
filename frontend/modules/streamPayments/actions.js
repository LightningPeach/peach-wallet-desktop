import * as types from "./types";

const streamPaymentPrepare = streamDetails => ({
    payload: streamDetails,
    type: types.STREAM_PAYMENT_PREPARE,
});

const streamPaymentSuccessFinish = streamId => ({
    payload: streamId,
    type: types.STREAM_PAYMENT_SUCCESS_FINISH,
});

const streamPaymentFailFinish = streamId => ({
    payload: streamId,
    type: types.STREAM_PAYMENT_FAIL_FINISH,
});

const streamPaymentStatus = (streamId, status) => ({
    payload: {
        status,
        streamId,
    },
    type: types.STREAM_PAYMENT_STATUS,
});

const streamCurrentSec = (streamId, sec) => ({
    payload: {
        currentPart: sec,
        streamId,
    },
    type: types.STREAM_CURRENT_SEC,
});

const addStreamToList = () => ({
    type: types.ADD_STREAM_TO_LIST,
});

const setStreams = streams => ({
    payload: streams,
    type: types.SET_STREAMS,
});

export {
    streamPaymentPrepare,
    streamPaymentSuccessFinish,
    streamPaymentFailFinish,
    streamPaymentStatus,
    streamCurrentSec,
    addStreamToList,
    setStreams,
};
