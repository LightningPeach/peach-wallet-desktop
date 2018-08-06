import * as types from "./types";

const setModalState = modalState => ({
    payload: modalState,
    type: types.SET_MODAL_STATE,
});

const setAppAsDefaultStatus = status => ({
    payload: status,
    type: types.SET_APP_AS_DEFAULT_STATUS,
});

const setUsdPerBtc = usdPerBtc => ({
    payload: usdPerBtc,
    type: types.USD_PER_BTC,
});

const dbSetStatus = payload => ({
    payload,
    type: types.DB_SET_STATUS,
});

const setForceLogoutError = payload => ({
    payload,
    type: types.SET_FORCE_LOGOUT_ERROR,
});

const setPeerPort = payload => ({
    payload,
    type: types.SET_PEER_PORT,
});

export {
    setForceLogoutError,
    setModalState,
    setUsdPerBtc,
    setPeerPort,
    setAppAsDefaultStatus,
    dbSetStatus,
};
