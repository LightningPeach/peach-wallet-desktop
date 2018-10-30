import * as accountTypes from "modules/account/types";
import * as types from "./types";

export const initStateServer = {
    merchantsData: [],
    merchantsError: null,
    merchantsRequest: false,
};

const serverReducer = (state = initStateServer, action) => {
    switch (action.type) {
        case accountTypes.LOGOUT_ACCOUNT:
            return initStateServer;
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

export default serverReducer;
