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

const lndSynced = payload => ({
    payload,
    type: types.LND_SYNCED,
});

const setLndInitStatus = payload => ({
    payload,
    type: types.SET_LND_INIT_STATUS,
});

const setLndBlocksHeight = payload => ({
    payload,
    type: types.SET_LND_BLOCKS_HEIGHT,
});

const setLndBlocksHeightOnLogin = payload => ({
    payload,
    type: types.SET_LND_BLOCKS_HEIGHT_ON_LOGIN,
});

export {
    startInitLnd,
    lndInitingSuccess,
    lndInitingError,
    lndSynced,
    setLndBlocksHeight,
    setLndBlocksHeightOnLogin,
    setLndInitStatus,
};
