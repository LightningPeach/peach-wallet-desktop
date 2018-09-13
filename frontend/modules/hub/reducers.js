import * as accountTypes from "modules/account/types";
import * as types from "./types";

export const initStateHub = {
    merchantsData: [],
    merchantsError: null,
    merchantsRequest: false,
};

const hubReducer = (state = initStateHub, action) => {
    switch (action.type) {
        case accountTypes.LOGOUT_ACCOUNT:
            return initStateHub;
        case types.MERCHANTS_REQUEST:
            return { ...state, merchantsError: null, merchantsRequest: true };
        case types.MERCHANTS_SUCCESS:
            return { ...state, merchantsData: action.payload, merchantsRequest: false };
        case types.MERCHANTS_FAIL:
            return { ...state, merchantsError: action.payload, merchantsRequest: false };
        default:
            return state;
    }
};

export default hubReducer;
