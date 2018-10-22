import { filterActions as actions, filterTypes as types } from "modules/filter";
import filterReducer, { initStateFilter } from "modules/filter/reducers";
import { accountTypes } from "modules/account";

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

        it("should handle SET_ONCHAIN_FILTER_PART action", () => {
            action.type = types.SET_ONCHAIN_FILTER_PART;
            expectedData.onchain = { ...expectedData.onchain, ...data };
            expect(filterReducer(state, action)).to.deep.equal(expectedData);
        });
    });
});
