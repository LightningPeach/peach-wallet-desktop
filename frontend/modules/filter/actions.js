import * as types from "./types";

const setRecurringFilterPart = payload => ({
    payload,
    type: types.SET_RECURRING_FILTER_PART,
});

const setRegularFilterPart = payload => ({
    payload,
    type: types.SET_REGULAR_FILTER_PART,
});

const setOnchainFilterPart = payload => ({
    payload,
    type: types.SET_ONCHAIN_FILTER_PART,
});

const setContactsFilterPart = payload => ({
    payload,
    type: types.SET_CONTACTS_FILTER_PART,
});

const setMerchantsFilterPart = payload => ({
    payload,
    type: types.SET_MERCHANTS_FILTER_PART,
});

const clearAllFilters = () => ({
    type: types.CLEAR_ALL_FILTERS,
});

export {
    setRecurringFilterPart,
    setRegularFilterPart,
    setOnchainFilterPart,
    setContactsFilterPart,
    setMerchantsFilterPart,
    clearAllFilters,
};
