import omit from "lodash/omit";
import nock from "nock";
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";

import {
    serverActions as actions,
    serverTypes as types,
    serverOperations as operations,
} from "modules/server";
import serverReeducer, { initStateServer } from "modules/server/reducers";
import { notificationsTypes } from "modules/notifications";
import { PEACH_API_HOST } from "config/node-settings";
import { EXCEPTION_SERVER_UNAVAILABLE } from "config/status-codes";
import { accountTypes } from "modules/account";
import { store as defaultStore } from "store/configure-store";

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe("Contacts Unit Tests", () => {
    describe("Action creators", () => {
        let data;
        let expectedData;

        beforeEach(() => {
            data = EXCEPTION_SERVER_UNAVAILABLE;
            expectedData = {
                payload: data,
                type: undefined,
            };
        });

        it("should create an action for merchants request", () => {
            expectedData = { type: types.MERCHANTS_REQUEST };
            expect(actions.merchantsRequest()).to.deep.equal(expectedData);
        });

        it("should create an action for merchants request success", () => {
            data = [
                {
                    foo: "foo",
                    bar: "bar",
                },
                {
                    foo1: "foo1",
                    bar1: "bar1",
                },
            ];
            expectedData = {
                payload: data,
                type: types.MERCHANTS_SUCCESS,
            };
            expect(actions.merchantsSuccess(data)).to.deep.equal(expectedData);
        });

        it("should create an action for merchants request fail", () => {
            data = "No url given";
            expectedData.type = types.MERCHANTS_FAIL;
            expectedData.payload = data;
            expect(actions.merchantsFail(data)).to.deep.equal(expectedData);
        });
    });

    describe("Operations tests", () => {
        let sandbox;
        let data;
        let store;
        let expectedActions;
        let fakeStore;

        beforeEach(async () => {
            sandbox = sinon.sandbox.create();
            fakeStore = sandbox.stub(defaultStore);
            expectedActions = [];
            store = mockStore(initStateServer);
            fakeStore.dispatch = store.dispatch;
            fakeStore.getState = store.getState;
        });

        afterEach(() => {
            sandbox.restore();
        });

        describe("getMerchants()", () => {
            it("404 error response", async () => {
                nock(PEACH_API_HOST).get(types.ENDPOINT_MERCHANTS).reply(404);
                expectedActions = [
                    {
                        type: types.MERCHANTS_REQUEST,
                    },
                    {
                        payload: EXCEPTION_SERVER_UNAVAILABLE,
                        type: types.MERCHANTS_FAIL,
                    },
                    {
                        payload: {
                            autoDismiss: 0,
                            level: "error",
                            message: EXCEPTION_SERVER_UNAVAILABLE,
                            position: "bc",
                        },
                        type: notificationsTypes.SHOW_NOTIFICATION,
                    },
                ];
                await store.dispatch(operations.getMerchants());
                data = store.getActions();
                data[2].payload = omit(data[2].payload, "uid");
                expect(data).to.deep.equal(expectedActions);
            });

            it("404 error response", async () => {
                nock(PEACH_API_HOST).get(types.ENDPOINT_MERCHANTS).reply(200);
                expectedActions = [
                    {
                        type: types.MERCHANTS_REQUEST,
                    },
                    {
                        payload: EXCEPTION_SERVER_UNAVAILABLE,
                        type: types.MERCHANTS_FAIL,
                    },
                    {
                        payload: {
                            autoDismiss: 0,
                            level: "error",
                            message: EXCEPTION_SERVER_UNAVAILABLE,
                            position: "bc",
                        },
                        type: notificationsTypes.SHOW_NOTIFICATION,
                    },
                ];
                await store.dispatch(operations.getMerchants());
                data = store.getActions();
                data[2].payload = omit(data[2].payload, "uid");
                expect(data).to.deep.equal(expectedActions);
            });

            it("success", async () => {
                data = [
                    {
                        foo: "foo",
                        bar: "bar",
                    },
                    {
                        foo: "foo",
                        bar: "bar",
                    },
                ];
                nock(PEACH_API_HOST).get(types.ENDPOINT_MERCHANTS).reply(200, data);
                expectedActions = [
                    {
                        type: types.MERCHANTS_REQUEST,
                    },
                    {
                        payload: data,
                        type: types.MERCHANTS_SUCCESS,
                    },
                ];
                await store.dispatch(operations.getMerchants());
                expect(store.getActions()).to.deep.equal(expectedActions);
            });
        });
    });

    describe("Reducer actions", () => {
        let data;
        let action;
        let expectedData;
        let state;

        beforeEach(() => {
            data = "foo";
            action = {
                payload: data,
                type: undefined,
            };
            expectedData = initStateServer;
            state = undefined;
        });

        it("should return the initial state", () => {
            expect(serverReeducer(state, {})).to.deep.equal(expectedData);
        });

        it("should handle LOGOUT_ACCOUNT action", () => {
            action.type = accountTypes.LOGOUT_ACCOUNT;
            state = initStateServer;
            expect(serverReeducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle MERCHANTS_REQUEST action", () => {
            action = {
                type: types.MERCHANTS_REQUEST,
            };
            expectedData.merchantsData = [];
            expectedData.merchantsError = null;
            expectedData.merchantsRequest = true;
            expect(serverReeducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle MERCHANTS_SUCCESS action", () => {
            action.type = types.MERCHANTS_SUCCESS;
            expectedData.merchantsData = data;
            expectedData.merchantsError = null;
            expectedData.merchantsRequest = false;
            expect(serverReeducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle MERCHANTS_FAIL action", () => {
            action.type = types.MERCHANTS_FAIL;
            expectedData.merchantsData = [];
            expectedData.merchantsError = data;
            expectedData.merchantsRequest = false;
            expect(serverReeducer(state, action)).to.deep.equal(expectedData);
        });
    });
});
