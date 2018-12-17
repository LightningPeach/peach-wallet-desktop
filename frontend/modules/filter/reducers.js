import * as accountTypes from "modules/account/types";
import * as types from "./types";

export const initStatePartial = {
    date: {
        from: null,
        to: null,
    },
    price: {
        currency: null,
        from: null,
        to: null,
    },
    search: "",
    time: {
        from: null,
        to: null,
    },
    type: types.TYPE_PAYMENT_ALL,
};

export const initStateFilter = {
    contacts: initStatePartial,
    merchants: initStatePartial,
    onchain: initStatePartial,
    recurring: initStatePartial,
    regular: initStatePartial,
};

const defaultState = JSON.parse(JSON.stringify(initStateFilter));

const filterReducer = (state = defaultState, action) => {
    switch (action.type) {
        case types.CLEAR_ALL_FILTERS:
        case accountTypes.LOGOUT_ACCOUNT:
            return defaultState;
        case types.SET_REGULAR_FILTER_PART:
            return {
                ...state,
                regular: {
                    ...state.regular,
                    ...action.payload,
                },
            };
        case types.SET_RECURRING_FILTER_PART:
            return {
                ...state,
                recurring: {
                    ...state.recurring,
                    ...action.payload,
                },
            };
        case types.SET_ONCHAIN_FILTER_PART:
            return {
                ...state,
                onchain: {
                    ...state.onchain,
                    ...action.payload,
                },
            };
        case types.SET_CONTACTS_FILTER_PART:
            return {
                ...state,
                contacts: {
                    ...state.contacts,
                    ...action.payload,
                },
            };
        case types.SET_MERCHANTS_FILTER_PART:
            return {
                ...state,
                merchants: {
                    ...state.merchants,
                    ...action.payload,
                },
            };
        default:
            return state;
    }
};

export default filterReducer;
