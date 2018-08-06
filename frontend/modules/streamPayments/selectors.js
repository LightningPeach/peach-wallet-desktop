import * as types from "./types";

function isActiveStreamRunning(state) {
    const filterActive = (isActive, stream) => isActive || stream.status === types.STREAM_PAYMENT_STREAMING;
    return state.streamPayment.streams.reduce(filterActive, false);
}

export { isActiveStreamRunning }; // eslint-disable-line import/prefer-default-export
