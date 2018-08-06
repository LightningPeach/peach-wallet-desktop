import * as types from "./types";

const setStreamPage = streamId => ({
    payload: streamId,
    type: types.SET_STREAM_PAGE,
});

const streamPaymentPrepare = streamDetails => ({
    payload: streamDetails,
    type: types.STREAM_PAYMENT_PREPARE,
});

const streamPaymentUpdate = (streamId, title) => ({
    payload: {
        streamId,
        title,
    },
    type: types.STREAM_PAYMENT_UPDATE,
});

const streamPaymentDelete = streamId => ({
    payload: streamId,
    type: types.STREAM_PAYMENT_DELETE,
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
    setStreamPage,
    streamPaymentPrepare,
    streamPaymentUpdate,
    streamPaymentDelete,
    streamPaymentSuccessFinish,
    streamPaymentFailFinish,
    streamPaymentStatus,
    streamCurrentSec,
    addStreamToList,
    setStreams,
};
