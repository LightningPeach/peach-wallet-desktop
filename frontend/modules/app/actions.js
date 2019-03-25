import * as types from "./types";

export const setModalState = modalState => ({
    payload: modalState,
    type: types.SET_MODAL_STATE,
});

export const addModalToFlow = modal => ({
    payload: Array.isArray(modal) ? modal : [modal],
    type: types.ADD_MODAL_TO_FLOW,
});

export const modalFlowPopFirst = () => ({
    type: types.MODAL_FLOW_POP_FIRST,
});

export const setAppAsDefaultStatus = status => ({
    payload: status,
    type: types.SET_APP_AS_DEFAULT_STATUS,
});

export const setUsdPerBtc = usdPerBtc => ({
    payload: usdPerBtc,
    type: types.USD_PER_BTC,
});

export const dbSetStatus = payload => ({
    payload,
    type: types.DB_SET_STATUS,
});

export const setForceLogoutError = payload => ({
    payload,
    type: types.SET_FORCE_LOGOUT_ERROR,
});

export const setPeerPort = payload => ({
    payload,
    type: types.SET_PEER_PORT,
});
