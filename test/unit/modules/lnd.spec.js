import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import nock from "nock";

import * as statusCodes from "config/status-codes";
import { lndActions as actions, lndTypes as types, lndOperations as operations } from "modules/lnd";
import lndReducer, { initStateLnd } from "modules/lnd/reducers";
import { accountTypes } from "modules/account";
import { appOperations } from "modules/app";
import { BLOCK_HEIGHT_HOST, BLOCK_HEIGHT_QUERY } from "config/node-settings";
import { db, errorPromise, successPromise, unsuccessPromise } from "additional";
import { store as defaultStore } from "store/configure-store";

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe("Lnd Unit Tests", () => {
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

        it("should create an action to set lnd start creation status", () => {
            expectedData = {
                type: types.START_INIT_LND,
            };
            expect(actions.startInitLnd()).to.deep.equal(expectedData);
        });

        it("should create an action to set lnd succesfully initialized status", () => {
            expectedData = {
                type: types.LND_INITING_SUCCESS,
            };
            expect(actions.lndInitingSuccess()).to.deep.equal(expectedData);
        });

        it("should create an action to set lnd creation error status", () => {
            expectedData.type = types.LND_INITING_ERROR;
            expect(actions.lndInitingError(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set lnd synced status", () => {
            expectedData.type = types.LND_SYNCED;
            expect(actions.lndSynced(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set lnd initialization status", () => {
            expectedData.type = types.SET_LND_INIT_STATUS;
            expect(actions.setLndInitStatus(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set network blocks height", () => {
            expectedData.type = types.SET_NETWORK_BLOCKS;
            expect(actions.setNetworkBlocksHeight(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set lnd blocks height", () => {
            expectedData.type = types.SET_LND_BLOCKS;
            expect(actions.setLndBlocksHeight(data)).to.deep.equal(expectedData);
        });
    });

    describe("Operations tests", () => {
        let sandbox;
        let data;
        let store;
        let initState;
        let expectedActions;
        let expectedData;
        let errorResp;
        let successResp;
        let unsuccessResp;
        let fakeDispatchReturnError;
        let fakeDispatchReturnSuccess;
        let fakeDispatchReturnUnsuccess;
        let fakeStore;
        let fakeApp;

        beforeEach(async () => {
            errorResp = await errorPromise(undefined, { name: undefined });
            successResp = await successPromise();
            unsuccessResp = await unsuccessPromise({ name: undefined });
            fakeDispatchReturnError = () => errorResp;
            fakeDispatchReturnSuccess = () => successResp;
            fakeDispatchReturnUnsuccess = () => unsuccessResp;
            sandbox = sinon.sandbox.create();
            window.ipcClient.reset();
            window.ipcRenderer.send.reset();
            fakeStore = sandbox.stub(defaultStore);
            fakeApp = sandbox.stub(appOperations);
            data = {};
            initState = {
                lnd: { ...initStateLnd },
            };
            expectedData = undefined;
            expectedActions = [];
            store = mockStore(initState);
            fakeStore.dispatch = store.dispatch;
            fakeStore.getState = store.getState;
        });

        afterEach(() => {
            sandbox.restore();
        });

        describe("ipcRenderer", () => {
            beforeEach(() => {
                fakeStore.dispatch = store.dispatch;
                fakeStore.getState = store.getState;
            });

            it("setLndInitStatus", async () => {
                window.ipcRenderer.send("setLndInitStatus", { status: "some status" });
                expectedActions = [
                    {
                        payload: "some status",
                        type: types.SET_LND_INIT_STATUS,
                    },
                ];
                expect(store.getActions()).to.deep.equal(expectedActions);
            });
        });

        it("clearLndData()", async () => {
            expect(await store.dispatch(operations.clearLndData())).to.deep.equal(expectedData);
            expect(store.getActions()).to.deep.equal(expectedActions);
            expect(window.ipcClient).to.be.calledOnce;
            expect(window.ipcClient).to.be.calledWith("clearLndData");
        });

        it("setClearLndData()", async () => {
            data.attr = "foo";
            expect(await store.dispatch(operations.setClearLndData(data.attr))).to.deep.equal(expectedData);
            expect(store.getActions()).to.deep.equal(expectedActions);
            expect(window.ipcClient).to.be.calledOnce;
            expect(window.ipcClient).to.be.calledWith("set-should-clear-data", { clearData: "foo" });
        });

        describe("getSeed()", () => {
            beforeEach(() => {
                window.ipcClient
                    .withArgs("genSeed")
                    .returns({
                        ok: true,
                        response: {
                            cipher_seed_mnemonic: "foo",
                        },
                    });
            });

            it("ipc error", async () => {
                window.ipcClient
                    .withArgs("genSeed")
                    .returns({
                        ok: false,
                    });
                expectedData = {
                    ...errorResp,
                    error: undefined,
                    f: "getSeed",
                };
                expect(await store.dispatch(operations.getSeed())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("genSeed");
            });

            it("success", async () => {
                expectedData = {
                    ...successResp,
                    response: {
                        seed: "foo",
                    },
                };
                expect(await store.dispatch(operations.getSeed())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("genSeed");
            });
        });

        describe("getBlocksHeight()", () => {
            it("error response", async () => {
                nock(BLOCK_HEIGHT_HOST).get(BLOCK_HEIGHT_QUERY).reply(404);
                expectedData = {
                    payload: 0,
                    type: types.SET_NETWORK_BLOCKS,
                };
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.getBlocksHeight())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("success", async () => {
                nock(BLOCK_HEIGHT_HOST).get(BLOCK_HEIGHT_QUERY).reply(200, { height: 1000000 });
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

        describe("waitLndSync()", () => {
            beforeEach(() => {
                window.ipcClient
                    .withArgs("getInfo")
                    .onFirstCall()
                    .returns({
                        ok: true,
                        response: {
                            synced_to_chain: false,
                            block_height: 50,
                        },
                    })
                    .onSecondCall()
                    .returns({
                        ok: true,
                        response: {
                            synced_to_chain: true,
                            block_height: 100,
                        },
                    });
            });

            it("ipc error", async () => {
                window.ipcClient
                    .withArgs("getInfo")
                    .onFirstCall()
                    .returns({
                        ok: false,
                    });
                expectedData = {
                    ...errorResp,
                    f: "waitLndSync",
                };
                expect(await store.dispatch(operations.waitLndSync())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("getInfo");
                expect(appOperations.sendSystemNotification).not.to.be.called;
            });

            it("not synced -> synced in retry", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: 50,
                        type: types.SET_LND_BLOCKS,
                    },
                    {
                        payload: statusCodes.STATUS_LND_SYNCING,
                        type: types.SET_LND_INIT_STATUS,
                    },
                    {
                        payload: 100,
                        type: types.SET_LND_BLOCKS,
                    },
                    {
                        payload: statusCodes.STATUS_LND_FULLY_SYNCED,
                        type: types.SET_LND_INIT_STATUS,
                    },
                    {
                        payload: true,
                        type: types.LND_SYNCED,
                    },
                ];
                expect(await store.dispatch(operations.waitLndSync())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledTwice;
                expect(window.ipcClient).to.be.calledWith("getInfo");
                expect(appOperations.sendSystemNotification).not.to.be.called;
            });
        });

        describe("checkLndSync()", () => {
            beforeEach(() => {
                window.ipcClient
                    .withArgs("getInfo")
                    .onFirstCall()
                    .returns({
                        ok: true,
                        response: {
                            synced_to_chain: false,
                            block_height: 50,
                        },
                    })
                    .onSecondCall()
                    .returns({
                        ok: true,
                        response: {
                            synced_to_chain: false,
                            block_height: 75,
                        },
                    })
                    .onThirdCall()
                    .returns({
                        ok: true,
                        response: {
                            synced_to_chain: true,
                            block_height: 100,
                        },
                    });
                fakeApp.sendSystemNotification.returns(fakeDispatchReturnSuccess);
            });

            it("ipc error", async () => {
                window.ipcClient
                    .withArgs("getInfo")
                    .onFirstCall()
                    .returns({
                        ok: false,
                    });
                expectedData = {
                    ...errorResp,
                    f: "checkLndSync",
                };
                expect(await store.dispatch(operations.checkLndSync())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("getInfo");
                expect(appOperations.sendSystemNotification).not.to.be.called;
            });

            it("not synced in check -> ipc error in wait sync", async () => {
                window.ipcClient
                    .withArgs("getInfo")
                    .onFirstCall()
                    .returns({
                        ok: true,
                        response: {
                            synced_to_chain: false,
                            block_height: 50,
                        },
                    })
                    .onSecondCall()
                    .returns({
                        ok: false,
                    });
                expectedData = {
                    ...errorResp,
                    f: "checkLndSync",
                };
                expectedActions = [
                    {
                        payload: 50,
                        type: types.SET_LND_BLOCKS,
                    },
                ];
                expect(await store.dispatch(operations.checkLndSync())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledTwice;
                expect(window.ipcClient).to.be.calledWith("getInfo");
                expect(appOperations.sendSystemNotification).not.to.be.called;
            });

            it("not synced in check -> synced in wait sync", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: 50,
                        type: types.SET_LND_BLOCKS,
                    },
                    {
                        payload: 75,
                        type: types.SET_LND_BLOCKS,
                    },
                    {
                        payload: false,
                        type: types.LND_SYNCED,
                    },
                    {
                        payload: statusCodes.STATUS_LND_SYNCING,
                        type: types.SET_LND_INIT_STATUS,
                    },
                    {
                        payload: 100,
                        type: types.SET_LND_BLOCKS,
                    },
                    {
                        payload: statusCodes.STATUS_LND_FULLY_SYNCED,
                        type: types.SET_LND_INIT_STATUS,
                    },
                    {
                        payload: true,
                        type: types.LND_SYNCED,
                    },
                ];
                expect(await store.dispatch(operations.checkLndSync())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledThrice;
                expect(window.ipcClient).to.be.calledWith("getInfo");
                expect(appOperations.sendSystemNotification).to.be.calledTwice;
                expect(appOperations.sendSystemNotification).to.be.calledWithExactly({
                    body: "Please wait for synchronization recovery",
                    title: "Synchronization is lost",
                });
                expect(appOperations.sendSystemNotification).to.be.calledWithExactly({
                    body: "The node has been fully synchronized with blockchain",
                    title: "Synchronization is recovered",
                });
            });
        });

        describe("startLnd()", () => {
            beforeEach(() => {
                data.attr = "foo";
                window.ipcClient
                    .withArgs("checkUser")
                    .returns({
                        ok: true,
                    })
                    .withArgs("startLnd")
                    .returns({
                        ok: true,
                    });
            });

            it("check user error", async () => {
                window.ipcClient
                    .withArgs("checkUser")
                    .returns({
                        ok: false,
                    });
                expectedData = {
                    ...errorResp,
                    f: "startLnd",
                };
                expectedActions = [
                    {
                        payload: "",
                        type: types.SET_LND_INIT_STATUS,
                    },
                ];
                expect(await store.dispatch(operations.startLnd(data.attr))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("checkUser", { username: data.attr });
            });

            it("lnd initializing error", async () => {
                window.ipcClient
                    .withArgs("startLnd")
                    .returns({
                        ok: false,
                        error: "bar",
                    });
                expectedData = {
                    ...errorResp,
                    error: "bar",
                    f: "startLnd",
                };
                expectedActions = [
                    {
                        type: types.START_INIT_LND,
                    },
                    {
                        payload: "",
                        type: types.SET_LND_INIT_STATUS,
                    },
                    {
                        payload: "bar",
                        type: types.LND_INITING_ERROR,
                    },
                ];
                expect(await store.dispatch(operations.startLnd(data))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledTwice;
                expect(window.ipcClient).to.be.calledWith("checkUser", { username: data });
                expect(window.ipcClient).to.be.calledWith("startLnd", { username: data });
            });

            it("success", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        type: types.START_INIT_LND,
                    },
                    {
                        type: types.LND_INITING_SUCCESS,
                    },
                ];
                expect(await store.dispatch(operations.startLnd(data))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledTwice;
                expect(window.ipcClient).to.be.calledWith("checkUser", { username: data });
                expect(window.ipcClient).to.be.calledWith("startLnd", { username: data });
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
            expectedData = JSON.parse(JSON.stringify(initStateLnd));
            state = undefined;
        });

        it("should return the initial state", () => {
            expect(lndReducer(state, {})).to.deep.equal(expectedData);
        });

        it("should handle LOGOUT_ACCOUNT action", () => {
            action.type = accountTypes.LOGOUT_ACCOUNT;
            state = JSON.parse(JSON.stringify(initStateLnd));
            state.initStatus = "foo";
            state.lndIniting = true;
            expect(lndReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle LND_SYNCED action", () => {
            action.type = types.LND_SYNCED;
            expectedData.lndSyncedToChain = data;
            expect(lndReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle LND_INITING_ERROR action", () => {
            action.type = types.LND_INITING_ERROR;
            expectedData.lndInitError = data;
            expectedData.lndIniting = false;
            expect(lndReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle START_INIT_LND action", () => {
            action = {
                type: types.START_INIT_LND,
            };
            expectedData.lndInitError = null;
            expectedData.lndIniting = true;
            expect(lndReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle LND_INITING_SUCCESS action", () => {
            action = {
                type: types.LND_INITING_SUCCESS,
            };
            state = JSON.parse(JSON.stringify(initStateLnd));
            state.lndIniting = true;
            expectedData.lndInitError = null;
            expectedData.lndIniting = false;
            expect(lndReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_LND_INIT_STATUS action", () => {
            action.type = types.SET_LND_INIT_STATUS;
            expectedData.initStatus = data;
            expect(lndReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_NETWORK_BLOCKS action", () => {
            action.type = types.SET_NETWORK_BLOCKS;
            action.payload = 10;
            expectedData.networkBlocks = 10;
            expect(lndReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_LND_BLOCKS action", () => {
            action.type = types.SET_LND_BLOCKS;
            action.payload = 10;
            expectedData.lndBlocks = 10;
            expect(lndReducer(state, action)).to.deep.equal(expectedData);
        });
    });
});
