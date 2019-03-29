import * as accountTypes from "modules/account/types";
import * as types from "./types";

export const initStateLnd = {
    initStatus: "",
    lndBlocks: 0,
    lndBlocksOnLogin: 0,
    lndInitError: null,
    lndIniting: false,
    lndSyncedToChain: false,
};

const defaultState = JSON.parse(JSON.stringify(initStateLnd));

const lndReducer = (state = defaultState, action) => {
    switch (action.type) {
        case accountTypes.LOGOUT_ACCOUNT:
            return defaultState;
        case types.LND_SYNCED:
            return { ...state, ...state, lndSyncedToChain: action.payload };
        case types.LND_INITING_ERROR:
            return { ...state, lndInitError: action.payload, lndIniting: false };
        case types.START_INIT_LND:
            return { ...state, lndInitError: null, lndIniting: true };
        case types.LND_INITING_SUCCESS:
            return { ...state, lndInitError: null, lndIniting: false };
        case types.SET_LND_INIT_STATUS:
            return { ...state, initStatus: action.payload };
        case types.SET_LND_BLOCKS_HEIGHT:
            return { ...state, lndBlocks: parseInt(action.payload, 10) };
        case types.SET_LND_BLOCKS_HEIGHT_ON_LOGIN:
            return { ...state, lndBlocksOnLogin: parseInt(action.payload, 10) };
        default:
            return state;
    }
};

export default lndReducer;
