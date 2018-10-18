import * as types from "./types";

const setRecurringFilter = payload => ({
    payload,
    type: types.SET_RECURRING_FILTER,
});

const setRegularFilter = payload => ({
    payload,
    type: types.SET_REGULAR_FILTER,
});

const setOnchainFilter = payload => ({
    payload,
    type: types.SET_ONCHAIN_FILTER,
});

const clearAllFilters = payload => ({
    type: types.CLEAR_ALL_FILTERS,
});

export {
    setRecurringFilter,
    setRegularFilter,
    setOnchainFilter,
    clearAllFilters,
};
