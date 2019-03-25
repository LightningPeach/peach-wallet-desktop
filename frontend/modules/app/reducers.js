import { INIT_LISTEN_PORT } from "config/node-settings";
import * as accountTypes from "modules/account/types";
import * as types from "./types";

export const initStateApp = {
    appAsDefaultStatus: false,
    dbStatus: types.DB_CLOSED,
    forceLogoutError: null,
    modalFlow: [],
    modalState: types.CLOSE_MODAL_STATE,
    peerPort: INIT_LISTEN_PORT,
    usdPerBtc: 0,
};

const defaultState = JSON.parse(JSON.stringify(initStateApp));

const appReducer = (state = defaultState, action) => {
    switch (action.type) {
        case accountTypes.LOGOUT_ACCOUNT:
            return { ...defaultState, appAsDefaultStatus: state.appAsDefaultStatus };
        case types.SET_MODAL_STATE:
            return { ...state, modalState: action.payload };
        case types.SET_APP_AS_DEFAULT_STATUS:
            return { ...state, appAsDefaultStatus: action.payload };
        case types.USD_PER_BTC:
            return { ...state, usdPerBtc: action.payload };
        case types.DB_SET_STATUS:
            return { ...state, dbStatus: action.payload };
        case types.SET_FORCE_LOGOUT_ERROR:
            return { ...state, forceLogoutError: action.payload };
        case types.SET_PEER_PORT:
            return { ...state, peerPort: action.payload };
        case types.ADD_MODAL_TO_FLOW:
            return { ...state, modalFlow: [...state.modalFlow, ...action.payload] };
        case types.MODAL_FLOW_POP_FIRST:
            return { ...state, modalFlow: state.modalFlow.filter((item, index) => index) };
        default:
            return state;
    }
};

export default appReducer;
