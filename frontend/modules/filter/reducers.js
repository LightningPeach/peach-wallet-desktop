import * as accountTypes from "modules/account/types";
import * as types from "./types";

export const initStateFilter = {
    onchain: {},
    recurring: {},
    regular: {},
};

const defaultState = JSON.parse(JSON.stringify(initStateFilter));

const filterReducer = (state = defaultState, action) => {
    switch (action.type) {
        case types.CLEAR_ALL_FILTERS:
        case accountTypes.LOGOUT_ACCOUNT:
            return defaultState;
        case accountTypes.SET_REGULAR_FILTER:
            return { ...state, regular: action.payload };
        case accountTypes.SET_RECURRING_FILTER:
            return { ...state, recurring: action.payload };
        case accountTypes.SET_ONCHAIN_FILTER:
            return { ...state, onchain: action.payload };
        default:
            return state;
    }
};

export default filterReducer;
