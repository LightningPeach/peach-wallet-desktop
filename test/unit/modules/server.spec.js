import omit from "lodash/omit";
import nock from "nock";
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";

import {
    serverActions as actions,
    serverTypes as types,
    serverOperations as operations,
} from "modules/server";
import { errorPromise, successPromise } from "additional";
import serverReducer, { initStateServer } from "modules/server/reducers";
import { notificationsTypes } from "modules/notifications";
import { PEACH_API_HOST } from "config/node-settings";
import { exceptions } from "config";
import { accountTypes } from "modules/account";
import { store as defaultStore } from "store/configure-store";

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe("Server Unit Tests", () => {
    describe("Action creators", () => {
        let data;
        let expectedData;

        beforeEach(() => {
            data = exceptions.SERVER_UNAVAILABLE;
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

        it("should create an action to set network blocks height", () => {
            expectedData.type = types.SET_NETWORK_BLOCKS;
            expect(actions.setNetworkBlocksHeight(data)).to.deep.equal(expectedData);
        });
    });

    describe("Operations tests", () => {
        let data;
        let store;
        let expectedActions;
        let expectedData;
        let fakeStore;
        let errorResp;
        let successResp;

        beforeEach(async () => {
            errorResp = await errorPromise(undefined, { name: undefined });
            successResp = await successPromise();
            fakeStore = sinon.stub(defaultStore);
            expectedActions = [];
            expectedData = undefined;
            store = mockStore(initStateServer);
            fakeStore.dispatch = store.dispatch;
            fakeStore.getState = store.getState;
        });

        afterEach(() => {
            sinon.restore();
        });

        describe("getMerchants()", () => {
            it("404 error response", async () => {
                nock(PEACH_API_HOST).get(types.ENDPOINT_MERCHANTS).reply(404);
                expectedActions = [
                    {
                        type: types.MERCHANTS_REQUEST,
                    },
                    {
                        payload: exceptions.SERVER_UNAVAILABLE,
                        type: types.MERCHANTS_FAIL,
                    },
                    {
                        payload: {
                            autoDismiss: 0,
                            level: "error",
                            message: exceptions.SERVER_UNAVAILABLE,
                            position: "bc",
                        },
                        type: notificationsTypes.SHOW_NOTIFICATION,
                    },
                ];
                await store.dispatch(operations.getMerchants());
                const storeActions = store.getActions();
                storeActions[2].payload = omit(storeActions[2].payload, "uid");
                expect(storeActions).to.deep.equal(expectedActions);
            });

            it("404 error response", async () => {
                nock(PEACH_API_HOST).get(types.ENDPOINT_MERCHANTS).reply(200);
                expectedActions = [
                    {
                        type: types.MERCHANTS_REQUEST,
                    },
                    {
                        payload: exceptions.SERVER_UNAVAILABLE,
                        type: types.MERCHANTS_FAIL,
                    },
                    {
                        payload: {
                            autoDismiss: 0,
                            level: "error",
                            message: exceptions.SERVER_UNAVAILABLE,
                            position: "bc",
                        },
                        type: notificationsTypes.SHOW_NOTIFICATION,
                    },
                ];
                await store.dispatch(operations.getMerchants());
                const storeActions = store.getActions();
                storeActions[2].payload = omit(storeActions[2].payload, "uid");
                expect(storeActions).to.deep.equal(expectedActions);
            });

            it("success", async () => {
                data = [
                    {
                        foo: "foo",
                        bar: "bar",
                        logo: "/logo1",
                    },
                    {
                        foo: "foo",
                        bar: "bar",
                        logo: "/logo",
                    },
                ];
                nock(PEACH_API_HOST).get(types.ENDPOINT_MERCHANTS).reply(200, data);
                data = [
                    {
                        foo: "foo",
                        bar: "bar",
                        logo: "/logo1",
                    },
                    {
                        foo: "foo",
                        bar: "bar",
                        logo: "/logo",
                    },
                ];
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

        describe("getBlocksHeight()", () => {
            it("error response", async () => {
                nock(PEACH_API_HOST).get(types.ENDPOINT_BLOCK_HEIGHT).reply(404);
                expectedData = {
                    payload: 0,
                    type: types.SET_NETWORK_BLOCKS,
                };
                expectedActions = [
                    {
                        payload: {
                            autoDismiss: 0,
                            level: "error",
                            message: exceptions.SERVER_UNAVAILABLE,
                            position: "bc",
                        },
                        type: notificationsTypes.SHOW_NOTIFICATION,
                    },
                    expectedData,
                ];
                expect(await store.dispatch(operations.getBlocksHeight())).to.deep.equal(expectedData);
                const storeActions = store.getActions();
                storeActions[0].payload = omit(storeActions[0].payload, "uid");
                expect(storeActions).to.deep.equal(expectedActions);
            });

            it("success", async () => {
                nock(PEACH_API_HOST).get(types.ENDPOINT_BLOCK_HEIGHT).reply(200, { height: 1000000 });
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: 1000000,
                        type: types.SET_NETWORK_BLOCKS,
                    },
                ];
                expect(await store.dispatch(operations.getBlocksHeight())).to.deep.equal(expectedData);
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
            expect(serverReducer(state, {})).to.deep.equal(expectedData);
        });

        it("should handle LOGOUT_ACCOUNT action", () => {
            action.type = accountTypes.LOGOUT_ACCOUNT;
            state = initStateServer;
            expect(serverReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle MERCHANTS_REQUEST action", () => {
            action = {
                type: types.MERCHANTS_REQUEST,
            };
            expectedData.merchantsData = [];
            expectedData.merchantsError = null;
            expectedData.merchantsRequest = true;
            expect(serverReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle MERCHANTS_SUCCESS action", () => {
            action.type = types.MERCHANTS_SUCCESS;
            expectedData.merchantsData = data;
            expectedData.merchantsError = null;
            expectedData.merchantsRequest = false;
            expect(serverReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle MERCHANTS_FAIL action", () => {
            action.type = types.MERCHANTS_FAIL;
            expectedData.merchantsData = [];
            expectedData.merchantsError = data;
            expectedData.merchantsRequest = false;
            expect(serverReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_NETWORK_BLOCKS action", () => {
            action.type = types.SET_NETWORK_BLOCKS;
            action.payload = 10;
            expectedData.networkBlocks = 10;
            expect(serverReducer(state, action)).to.deep.equal(expectedData);
        });
    });
});
