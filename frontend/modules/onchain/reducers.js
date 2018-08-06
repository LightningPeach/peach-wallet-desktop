import * as accountTypes from "modules/account/types";
import * as types from "./types";

export const initStateOnchain = {
    fee: 11468,
    history: [],
    sendCoinsDetails: null,
    sendCoinsPaymentDetails: "",
};

const defaultState = JSON.parse(JSON.stringify(initStateOnchain));

const onChainReducer = (state = defaultState, action) => {
    switch (action.type) {
        case accountTypes.LOGOUT_ACCOUNT:
            return defaultState;
        case types.SET_ONCHAIN_HISTORY:
            return { ...state, history: action.payload };
        case types.SEND_COINS_PREPARING:
            return { ...state, sendCoinsDetails: action.payload };
        case types.CLEAR_SEND_COINS_PREPARING:
            return { ...state, sendCoinsDetails: null };
        case types.SET_ONCHAIN_FEE:
            return { ...state, fee: action.payload };
        case types.SET_SEND_COINS_PAYMENT_DETAILS:
            return { ...state, sendCoinsPaymentDetails: action.payload };
        default:
            return state;
    }
};

export default onChainReducer;
