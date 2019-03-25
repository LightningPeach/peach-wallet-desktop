import moment from "moment";

import {
    filterActions as actions,
    filterTypes as types,
    filterOperations as operations,
} from "modules/filter";
import filterReducer, { initStateFilter } from "modules/filter/reducers";
import { accountTypes } from "modules/account";
import { appOperations } from "modules/app";
import { configureStore, persistedState } from "store/configure-store";
import { errorPromise, successPromise } from "additional";

describe("Filter Unit Tests", () => {
    describe("Action creators", () => {
        let data;
        let expectedData;

        beforeEach(() => {
            data = "foo";
            expectedData = {
                payload: data,
                type: undefined,
            };
        });

        it("should create an action to set reccuring filter part", () => {
            expectedData.type = types.SET_RECURRING_FILTER_PART;
            expect(actions.setRecurringFilterPart(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set regular filter part", () => {
            expectedData.type = types.SET_REGULAR_FILTER_PART;
            expect(actions.setRegularFilterPart(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set onchain filter part", () => {
            expectedData.type = types.SET_ONCHAIN_FILTER_PART;
            expect(actions.setOnchainFilterPart(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set contacts filter part", () => {
            expectedData.type = types.SET_CONTACTS_FILTER_PART;
            expect(actions.setContactsFilterPart(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set merchants filter part", () => {
            expectedData.type = types.SET_MERCHANTS_FILTER_PART;
            expect(actions.setMerchantsFilterPart(data)).to.deep.equal(expectedData);
        });

        it("should create an action to clear all filters", () => {
            expectedData = { type: types.CLEAR_ALL_FILTERS };
            expect(actions.clearAllFilters(data)).to.deep.equal(expectedData);
        });
    });

    describe("Reducer actions", () => {
        let data;
        let action;
        let expectedData;
        let state;

        beforeEach(() => {
            data = {
                date: {
                    from: 1,
                    to: 2,
                },
            };
            action = {
                payload: data,
                type: undefined,
            };
            expectedData = JSON.parse(JSON.stringify(initStateFilter));
            state = JSON.parse(JSON.stringify(initStateFilter));
        });

        it("should return the initial state", () => {
            expect(filterReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle LOGOUT_ACCOUNT action", () => {
            action = { type: accountTypes.LOGOUT_ACCOUNT };
            state = JSON.parse(JSON.stringify(initStateFilter));
            state.onchain = { ...state.onchain, ...data };
            expect(filterReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle CLEAR_ALL_FILTERS action", () => {
            action = { type: types.CLEAR_ALL_FILTERS };
            state = JSON.parse(JSON.stringify(initStateFilter));
            state.onchain = { ...state.onchain, ...data };
            expect(filterReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_REGULAR_FILTER_PART action", () => {
            action.type = types.SET_REGULAR_FILTER_PART;
            expectedData.regular = { ...expectedData.regular, ...data };
            expect(filterReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_RECURRING_FILTER_PART action", () => {
            action.type = types.SET_RECURRING_FILTER_PART;
            expectedData.recurring = { ...expectedData.recurring, ...data };
            expect(filterReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_CONTACTS_FILTER_PART action", () => {
            action.type = types.SET_CONTACTS_FILTER_PART;
            expectedData.contacts = { ...expectedData.contacts, ...data };
            expect(filterReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_MERCHANTS_FILTER_PART action", () => {
            action.type = types.SET_MERCHANTS_FILTER_PART;
            expectedData.merchants = { ...expectedData.merchants, ...data };
            expect(filterReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_ONCHAIN_FILTER_PART action", () => {
            action.type = types.SET_ONCHAIN_FILTER_PART;
            expectedData.onchain = { ...expectedData.onchain, ...data };
            expect(filterReducer(state, action)).to.deep.equal(expectedData);
        });
    });

    describe("Operations tests", () => {
        let data;
        let store;
        let initState;
        let expectedActions;
        let listActions;
        let expectedData;
        let errorResp;
        let successResp;
        let fakeDispatchReturnError;
        let fakeDispatchReturnSuccess;
        let fakeApp;

        beforeEach(async () => {
            errorResp = await errorPromise(undefined, { name: undefined });
            successResp = await successPromise();
            fakeDispatchReturnError = () => errorResp;
            fakeDispatchReturnSuccess = () => successResp;
            listActions = [];
            fakeApp = sinon.stub(appOperations);
            data = {};
            initState = JSON.parse(JSON.stringify(persistedState));
            store = configureStore(initState);
            expectedData = undefined;
            expectedActions = [];
        });

        afterEach(() => {
            sinon.restore();
        });

        describe("filter()", () => {
            beforeEach(() => {
                data.sourceFilter = {
                    date: {
                        from: moment("2011-11-11"),
                        to: moment("2011-11-12"),
                    },
                    price: {
                        currency: "Satoshi",
                        from: "1",
                        to: "2",
                    },
                    search: "a",
                    time: {
                        from: moment("1:1 AM", "h:m a"),
                        to: moment("2:2 AM", "h:m a"),
                    },
                    type: types.TYPE_PAYMENT_ALL,
                };
                fakeApp.convertUsdToSatoshi.returns(fakeDispatchReturnSuccess);
                fakeApp.convertToSatoshi.returns(fakeDispatchReturnSuccess);
            });

            it("pass price filter with USD currency", () => {
                data.sourceFilter.price.currency = "USD";
                data.itemFiltered = {
                    price: 1,
                };
                expectedData = true;
                expect(store.dispatch(operations.filter(
                    data.sourceFilter,
                    data.itemFiltered,
                ))).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
            });

            it("pass price filter with no filter values", () => {
                data.sourceFilter.price.from = null;
                data.sourceFilter.price.to = null;
                data.itemFiltered = {
                    price: 1,
                };
                expectedData = true;
                expect(store.dispatch(operations.filter(
                    data.sourceFilter,
                    data.itemFiltered,
                ))).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
            });

            it("time lower than filter, time.to filter disabled", () => {
                data.sourceFilter.time.to = null;
                data.itemFiltered = {
                    date: moment(moment("2011-11-11 1:00")),
                };
                expectedData = false;
                expect(store.dispatch(operations.filter(
                    data.sourceFilter,
                    data.itemFiltered,
                ))).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
            });

            it("time bigger than filter, time.from filter disabled", () => {
                data.sourceFilter.time.from = null;
                data.itemFiltered = {
                    date: moment(moment("2011-11-11 2:03")),
                };
                expectedData = false;
                expect(store.dispatch(operations.filter(
                    data.sourceFilter,
                    data.itemFiltered,
                ))).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
            });

            it("time bigger than filter", () => {
                data.sourceFilter.time.from = null;
                data.itemFiltered = {
                    date: moment(moment("2011-11-11 2:03")),
                };
                expectedData = false;
                expect(store.dispatch(operations.filter(
                    data.sourceFilter,
                    data.itemFiltered,
                ))).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
            });

            it("pass with time filter disabled", () => {
                data.sourceFilter.time.to = null;
                data.sourceFilter.time.from = null;
                data.itemFiltered = {
                    date: moment(moment("2011-11-11 1:00")),
                };
                expectedData = true;
                expect(store.dispatch(operations.filter(
                    data.sourceFilter,
                    data.itemFiltered,
                ))).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
            });

            it("pass all filters", () => {
                data.itemFiltered = {
                    type: types.TYPE_PAYMENT_ALL,
                    date: moment(moment("2011-11-11 1:02")),
                    search: "A",
                    price: 1,
                };
                expectedData = true;
                expect(store.dispatch(operations.filter(
                    data.sourceFilter,
                    data.itemFiltered,
                ))).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
            });

            it("pass all filters, values passed as arrays", () => {
                data.itemFiltered = {
                    type: [types.TYPE_PAYMENT_ALL],
                    date: [moment(moment("2011-11-11 1:02"))],
                    search: ["A"],
                    price: [1],
                };
                expectedData = true;
                expect(store.dispatch(operations.filter(
                    data.sourceFilter,
                    data.itemFiltered,
                ))).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
            });
        });
    });
});
