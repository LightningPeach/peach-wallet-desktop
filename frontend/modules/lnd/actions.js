import * as types from "./types";

const startInitLnd = () => ({
    type: types.START_INIT_LND,
});

const lndInitingSuccess = () => ({
    type: types.LND_INITING_SUCCESS,
});

const lndInitingError = error => ({
    payload: error,
    type: types.LND_INITING_ERROR,
});

const lndSynced = () => ({
    type: types.LND_SYNCED,
});

const setLndInitStatus = payload => ({
    payload,
    type: types.SET_LND_INIT_STATUS,
});

const setNetworkBlocksHeight = payload => ({
    payload,
    type: types.SET_NETWORK_BLOCKS,
});

const setLndBlocksHeight = payload => ({
    payload,
    type: types.SET_LND_BLOCKS,
});

export {
    startInitLnd,
    lndInitingSuccess,
    lndInitingError,
    lndSynced,
    setNetworkBlocksHeight,
    setLndBlocksHeight,
    setLndInitStatus,
};
