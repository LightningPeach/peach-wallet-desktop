import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import nock from "nock";
import omit from "lodash/omit";

import { exceptions, consts, routes } from "config";
import { appActions as actions, appTypes as types, appOperations as operations } from "modules/app";
import appReducer, { initStateApp } from "modules/app/reducers";
import { initStateAuth } from "modules/auth/reducers";
import { notificationsTypes } from "modules/notifications";
import { lightningTypes } from "modules/lightning";
import { accountTypes } from "modules/account";
import { errorPromise, successPromise, unsuccessPromise, db } from "additional";
import { store as defaultStore } from "store/configure-store";

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe("App Unit Tests", () => {
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

        it("should create an action to set modal state", () => {
            expectedData.type = types.SET_MODAL_STATE;
            expect(actions.setModalState(data)).to.deep.equal(expectedData);
        });

        it("should create an action to add modal to flow - single value", () => {
            expectedData = {
                payload: [data],
                type: types.ADD_MODAL_TO_FLOW,
            };
            expect(actions.addModalToFlow(data)).to.deep.equal(expectedData);
        });

        it("should create an action to add modal to flow - array value", () => {
            data = ["foo"];
            expectedData = {
                payload: data,
                type: types.ADD_MODAL_TO_FLOW,
            };
            expect(actions.addModalToFlow(data)).to.deep.equal(expectedData);
        });

        it("should create an action to pop first modal into flow", () => {
            expectedData = { type: types.MODAL_FLOW_POP_FIRST };
            expect(actions.modalFlowPopFirst()).to.deep.equal(expectedData);
        });

        it("should create an action to set app status as default", () => {
            expectedData.type = types.SET_APP_AS_DEFAULT_STATUS;
            expect(actions.setAppAsDefaultStatus(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set app status as default", () => {
            expectedData.type = types.SET_APP_AS_DEFAULT_STATUS;
            expect(actions.setAppAsDefaultStatus(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set usd to btc value", () => {
            expectedData.type = types.USD_PER_BTC;
            expect(actions.setUsdPerBtc(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set database status", () => {
            expectedData.type = types.DB_SET_STATUS;
            expect(actions.dbSetStatus(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set error causing force logout", () => {
            expectedData.type = types.SET_FORCE_LOGOUT_ERROR;
            expect(actions.setForceLogoutError(data)).to.deep.equal(expectedData);
        });
    });

    describe("Operations tests", () => {
        let data;
        let store;
        let initState;
        let expectedActions;
        let expectedData;
        let errorResp;
        let successResp;
        let unsuccessResp;
        let fakeDB;
        let fakeStore;

        beforeEach(async () => {
            errorResp = await errorPromise(undefined, { name: undefined });
            successResp = await successPromise();
            unsuccessResp = await unsuccessPromise({ name: undefined });
            window.ipcClient.resetHistory();
            window.ipcRenderer.send.resetHistory();
            fakeDB = sinon.stub(db);
            fakeStore = sinon.stub(defaultStore);
            data = {};
            initState = {
                account: {
                    bitcoinMeasureMultiplier: consts.MBTC_MEASURE.multiplier,
                    toFixedMeasure: consts.MBTC_MEASURE.toFixed,
                },
                auth: { ...initStateAuth },
                app: { ...initStateApp },
            };
            expectedData = undefined;
            expectedActions = [];
            store = mockStore(initState);
            fakeStore.dispatch = store.dispatch;
            fakeStore.getState = store.getState;
        });

        afterEach(() => {
            sinon.restore();
        });

        describe("ipcRenderer", () => {
            beforeEach(() => {
                fakeStore.dispatch = store.dispatch;
                fakeStore.getState = store.getState;
            });

            it("forceLogout, user logined", async () => {
                initState.account.isLogined = true;
                store = mockStore(initState);
                fakeStore.dispatch = store.dispatch;
                fakeStore.getState = store.getState;
                window.ipcRenderer.send("forceLogout", { status: "some status" });
                expectedActions = [
                    {
                        payload: "some status",
                        type: types.SET_FORCE_LOGOUT_ERROR,
                    },
                    {
                        payload: types.MODAL_STATE_FORCE_LOGOUT,
                        type: types.SET_MODAL_STATE,
                    },
                ];
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("forceLogout, user not logined", async () => {
                initState.account.isLogined = false;
                store = mockStore(initState);
                fakeStore.dispatch = store.dispatch;
                fakeStore.getState = store.getState;
                window.ipcRenderer.send("forceLogout", { status: "some status" });
                expectedActions = [
                    {
                        payload: "some status",
                        type: types.SET_FORCE_LOGOUT_ERROR,
                    },
                ];
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("setPeerPort", async () => {
                window.ipcRenderer.send("setPeerPort", { status: 9999 });
                expectedActions = [
                    {
                        payload: 9999,
                        type: types.SET_PEER_PORT,
                    },
                ];
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("isDefaultLightningApp, app not default", async () => {
                window.ipcRenderer.send("isDefaultLightningApp", { status: false });
                expectedActions = [
                    {
                        payload: false,
                        type: types.SET_APP_AS_DEFAULT_STATUS,
                    },
                    {
                        payload: types.DEEP_LINK_LIGHTNING_MODAL_STATE,
                        type: types.SET_MODAL_STATE,
                    },
                ];
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("isDefaultLightningApp, app is default", async () => {
                window.ipcRenderer.send("isDefaultLightningApp", { status: true });
                expectedActions = [
                    {
                        payload: true,
                        type: types.SET_APP_AS_DEFAULT_STATUS,
                    },
                ];
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("handleUrlReceive, wrong protocol error", async () => {
                window.ipcRenderer.send("handleUrlReceive", { status: "notlightning://xxxx" });
                expectedActions = [
                    {
                        payload: {
                            autoDismiss: 0,
                            level: "error",
                            position: "bc",
                        },
                        type: notificationsTypes.SHOW_NOTIFICATION,
                    },
                ];
                const storeActions = store.getActions();
                storeActions[0].payload = omit(storeActions[0].payload, ["uid", "message"]);
                expect(storeActions).to.deep.equal(expectedActions);
            });

            it("handleUrlReceive, account not logined", async () => {
                window.ipcRenderer.send("handleUrlReceive", { status: "lightning:xxxx" });
                expectedActions = [
                    {
                        payload: "xxxx",
                        type: lightningTypes.SET_EXTERNAL_PAYMENT_REQUEST,
                    },
                ];
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("handleUrlReceive, account logined", async () => {
                initState.account.isLogined = true;
                store = mockStore(initState);
                fakeStore.dispatch = store.dispatch;
                fakeStore.getState = store.getState;
                window.ipcRenderer.send("handleUrlReceive", { status: "lightning://xxxx" });
                expectedActions = [
                    {
                        payload: "xxxx",
                        type: lightningTypes.SET_EXTERNAL_PAYMENT_REQUEST,
                    },
                    {
                        payload: {
                            args: [routes.WalletPath],
                            method: "push",
                        },
                        type: "@@router/CALL_HISTORY_METHOD",
                    },
                ];
                expect(store.getActions()).to.deep.equal(expectedActions);
            });
        });

        describe("Modal windows", () => {
            beforeEach(() => {
                expectedData = { type: types.SET_MODAL_STATE };
            });

            it("openLogoutModal()", async () => {
                expectedData.payload = types.LOGOUT_MODAL_STATE;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.openLogoutModal())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("openDeepLinkLightningModal()", async () => {
                expectedData.payload = types.DEEP_LINK_LIGHTNING_MODAL_STATE;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.openDeepLinkLightningModal())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("openForceLogoutModal(), user not logined", async () => {
                expectedData = undefined;
                expect(await store.dispatch(operations.openForceLogoutModal())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("openForceLogoutModal(), user logined", async () => {
                initState.account.isLogined = true;
                store = mockStore(initState);
                expectedData.payload = types.MODAL_STATE_FORCE_LOGOUT;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.openForceLogoutModal())).to.deep.equal(undefined);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("openLegalModal()", async () => {
                expectedData.payload = types.MODAL_STATE_LEGAL;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.openLegalModal())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("openConnectRemoteQRModal()", async () => {
                expectedData.payload = types.MODAL_STATE_CONNECT_REMOTE_QR;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.openConnectRemoteQRModal())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("openPasswordRemoteQRModal()", async () => {
                expectedData.payload = types.MODAL_STATE_PASSWORD_REMOTE_QR;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.openPasswordRemoteQRModal())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });
        });

        describe("startModalFlow", () => {
            it("empty modal flow", async () => {
                expect(await store.dispatch(operations.startModalFlow(data))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
            });

            it("modal flow filled with two values", async () => {
                initState = {
                    app: {
                        modalFlow: ["foo", "bar"],
                    },
                };
                store = mockStore(initState);
                expectedActions = [
                    {
                        type: types.MODAL_FLOW_POP_FIRST,
                    },
                    {
                        payload: "foo",
                        type: types.SET_MODAL_STATE,
                    },
                ];
                expect(await store.dispatch(operations.startModalFlow(data))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
            });
        });

        describe("closeModal()", () => {
            it("empty modal flow", async () => {
                expectedActions = [
                    {
                        payload: types.CLOSE_MODAL_STATE,
                        type: types.SET_MODAL_STATE,
                    },
                ];
                expect(await store.dispatch(operations.closeModal())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("modal flow filled", async () => {
                initState = {
                    app: {
                        modalFlow: ["foo"],
                    },
                };
                store = mockStore(initState);
                expectedActions = [
                    {
                        type: types.MODAL_FLOW_POP_FIRST,
                    },
                    {
                        payload: "foo",
                        type: types.SET_MODAL_STATE,
                    },
                ];
                expect(await store.dispatch(operations.closeModal(data))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
            });
        });

        describe("sendSystemNotification", () => {
            beforeEach(() => {
                initState = {
                    account: {
                        systemNotifications: 6,
                    },
                    app: { ...initStateApp },
                };
                store = mockStore(initState);
                data = {
                    body: "body",
                    silent: false,
                    subtitle: "subtitle",
                    title: "title",
                };
            });

            it("notifications disabled", () => {
                initState = {
                    account: {
                        systemNotifications: 2,
                    },
                    app: { ...initStateApp },
                };
                store = mockStore(initState);
                expect(store.dispatch(operations.sendSystemNotification(data))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
            });

            it("notifications disabled", () => {
                expect(store.dispatch(operations.sendSystemNotification(data))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).to.be.calledOnce;
                expect(window.ipcRenderer.send).to.be.calledWithExactly("showNotification", data);
            });
        });

        describe("usdBtcRate()", () => {
            beforeEach(() => {
                expectedData = { ...successResp };
            });

            it("error response", async () => {
                data.code = 404;
                data.rate = 0;
                nock(consts.BLOCKCHAIN_INFO_HOST)
                    .get(consts.USD_PER_BTC_QUERY)
                    .reply(data.code);
                expectedActions = [{ payload: data.rate, type: types.USD_PER_BTC }];
                expect(await store.dispatch(operations.usdBtcRate())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("success", async () => {
                data.code = 200;
                data.rate = 9000;
                nock(consts.BLOCKCHAIN_INFO_HOST)
                    .get(consts.USD_PER_BTC_QUERY)
                    .reply(data.code, { USD: { last: data.rate } });
                expectedActions = [{ payload: data.rate, type: types.USD_PER_BTC }];
                expect(await store.dispatch(operations.usdBtcRate())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });
        });

        describe("copyToClipboard()", () => {
            beforeEach(() => {
                data.execCommand = "copy";
                data.value = "Test copy text";
                data.msg = "Copy notification msg";
            });

            it("error", () => {
                expectedActions = [
                    {
                        payload: {
                            autoDismiss: 5,
                            level: "info",
                            position: "bc",
                            uid: "Error while copying to clipboard",
                        },
                        type: notificationsTypes.SHOW_NOTIFICATION,
                    },
                ];
                store.dispatch(operations.copyToClipboard(data.value, data.msg));
                const storeActions = store.getActions();
                storeActions[0].payload = omit(storeActions[0].payload, "message");
                expect(storeActions).to.deep.equal(expectedActions);
            });

            it("success with empty msg", () => {
                document.execCommand = sinon.spy();
                expectedActions = [
                    {
                        payload: {
                            autoDismiss: 5,
                            level: "info",
                            position: "bc",
                            uid: "Copied",
                        },
                        type: notificationsTypes.SHOW_NOTIFICATION,
                    },
                ];
                store.dispatch(operations.copyToClipboard(data.value));
                const storeActions = store.getActions();
                storeActions[0].payload = omit(storeActions[0].payload, "message");
                expect(storeActions).to.deep.equal(expectedActions);
                expect(document.execCommand).to.be.calledOnce;
                expect(document.execCommand).to.be.calledWith(data.execCommand);
                document.execCommand = undefined;
            });

            it("success with custom msg", () => {
                document.execCommand = sinon.spy();
                expectedActions = [
                    {
                        payload: {
                            autoDismiss: 5,
                            level: "info",
                            position: "bc",
                            uid: "Copy notification msg",
                        },
                        type: notificationsTypes.SHOW_NOTIFICATION,
                    },
                ];
                store.dispatch(operations.copyToClipboard(data.value, data.msg));
                const storeActions = store.getActions();
                storeActions[0].payload = omit(storeActions[0].payload, "message");
                expect(storeActions).to.deep.equal(expectedActions);
                expect(document.execCommand).to.be.calledOnce;
                expect(document.execCommand).to.be.calledWith(data.execCommand);
                document.execCommand = undefined;
            });
        });

        it("convertUsdToSatoshi()", () => {
            initState.app.usdPerBtc = 100;
            store = mockStore(initState);
            data.value = 10;
            expectedData = 10000000;
            expect(store.dispatch(operations.convertUsdToSatoshi(data.value))).to.deep.equal(expectedData);
            expect(store.getActions()).to.deep.equal(expectedActions);
        });

        it("convertUsdToCurrentMeasure()", () => {
            initState.app.usdPerBtc = 100;
            store = mockStore(initState);
            data.value = 10;
            expectedData = 100;
            expect(Math.abs(store.dispatch(operations.convertUsdToCurrentMeasure(data.value)) - expectedData))
                .to.be.below(1e-8);
            expect(store.getActions()).to.deep.equal(expectedActions);
        });

        it("convertToSatoshi()", () => {
            data.mBTC = 1;
            expectedData = 100000; // 1mBTC in satoshi
            expect(store.dispatch(operations.convertToSatoshi(data.mBTC))).to.be.equal(expectedData);
        });

        it("convertSatoshiToCurrentMeasure()", () => {
            data.satoshi = 100000;
            expectedData = "1"; // 100000 satoshi in mBTC
            expect(store.dispatch(operations.convertSatoshiToCurrentMeasure(data.satoshi))).to.be.equal(expectedData);
        });

        describe("validateLightning()", () => {
            beforeEach(async () => {
                data.lightningId = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
                store = mockStore({
                    account: {
                        lightningID: data.lightningId,
                    },
                });
            });

            it("error with undefined lightning id", async () => {
                expectedData = exceptions.FIELD_IS_REQUIRED;
                expect(await store.dispatch(operations.validateLightning())).to.deep.equal(expectedData);
            });

            it("error with personal lightning id", async () => {
                expectedData = exceptions.LIGHTNING_ID_WRONG_SELF;
                expect(await store.dispatch(operations.validateLightning(data.lightningId)))
                    .to.deep.equal(expectedData);
            });

            it("error with incorrect lightning id", async () => {
                expectedData = exceptions.LIGHTNING_ID_WRONG_LENGTH;
                expect(await store.dispatch(operations.validateLightning(data.lightningId[0])))
                    .to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("error with incorrect symbol", async () => {
                data.lightningId = "x@xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
                expectedData = exceptions.LIGHTNING_ID_WRONG;
                expect(await store.dispatch(operations.validateLightning(data.lightningId)))
                    .to.deep.equal(expectedData);
            });

            it("valid lightning id", async () => {
                const validLightning = data.lightningId.replace("x", "X");
                expectedData = null;
                expect(await store.dispatch(operations.validateLightning(validLightning))).to.deep.equal(expectedData);
            });
        });

        describe("openDb()", () => {
            beforeEach(() => {
                data.dbName = "dbName";
            });

            it("error", async () => {
                data.error = { error: "Some error" };
                fakeDB.dbStart.returns({ ok: false, ...data.error });
                expectedData = {
                    ...errorResp,
                    ...data.error,
                    f: "openDb",
                };
                expectedActions = [
                    {
                        payload: types.DB_CLOSED,
                        type: types.DB_SET_STATUS,
                    },
                ];
                expect(await store.dispatch(operations.openDb(data.dbName))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("success", async () => {
                fakeDB.dbStart.returns({ ok: true });
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: types.DB_OPENED,
                        type: types.DB_SET_STATUS,
                    },
                ];
                expect(await store.dispatch(operations.openDb(data.dbName))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });
        });

        it("closeDb()", async () => {
            expectedActions = [
                {
                    payload: types.DB_CLOSING,
                    type: types.DB_SET_STATUS,
                },
                {
                    payload: types.DB_CLOSED,
                    type: types.DB_SET_STATUS,
                },
            ];
            await store.dispatch(operations.closeDb());
            expect(store.getActions()).to.deep.equal(expectedActions);
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
            expectedData = JSON.parse(JSON.stringify(initStateApp));
            state = undefined;
        });

        it("should return the initial state", () => {
            expect(appReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle LOGOUT_ACCOUNT action, app not deep link default", () => {
            action.type = accountTypes.LOGOUT_ACCOUNT;
            state = JSON.parse(JSON.stringify(initStateApp));
            state.dbStatus = types.DB_OPENED;
            state.usdPerBtc = "bar";
            expect(appReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle LOGOUT_ACCOUNT action, app is deep link default", () => {
            action.type = accountTypes.LOGOUT_ACCOUNT;
            state = JSON.parse(JSON.stringify(initStateApp));
            state.dbStatus = types.DB_OPENED;
            state.appAsDefaultStatus = true;
            expectedData.appAsDefaultStatus = true;
            expect(appReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_MODAL_STATE action", () => {
            action.type = types.SET_MODAL_STATE;
            expectedData.modalState = data;
            expect(appReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_APP_AS_DEFAULT_STATUS action", () => {
            action.type = types.SET_APP_AS_DEFAULT_STATUS;
            expectedData.appAsDefaultStatus = data;
            expect(appReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle USD_PER_BTC action", () => {
            action.type = types.USD_PER_BTC;
            expectedData.usdPerBtc = data;
            expect(appReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle DB_SET_STATUS action", () => {
            action.type = types.DB_SET_STATUS;
            expectedData.dbStatus = data;
            expect(appReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_FORCE_LOGOUT_ERROR action", () => {
            action.type = types.SET_FORCE_LOGOUT_ERROR;
            expectedData.forceLogoutError = data;
            expect(appReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_PEER_PORT action", () => {
            action.type = types.SET_PEER_PORT;
            expectedData.peerPort = data;
            expect(appReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle ADD_MODAL_TO_FLOW action - empty", () => {
            action.type = types.ADD_MODAL_TO_FLOW;
            action.payload = ["foo"];
            expectedData.modalFlow = action.payload;
            expect(appReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle ADD_MODAL_TO_FLOW action - pre-filled", () => {
            action.type = types.ADD_MODAL_TO_FLOW;
            action.payload = ["foo"];
            state = JSON.parse(JSON.stringify(initStateApp));
            state.modalFlow = ["bar"];
            expectedData.modalFlow = [...state.modalFlow, ...action.payload];
            expect(appReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle MODAL_FLOW_POP_FIRST action - empty", () => {
            state = JSON.parse(JSON.stringify(initStateApp));
            action = { type: types.MODAL_FLOW_POP_FIRST };
            expect(appReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle MODAL_FLOW_POP_FIRST action - pre-filled", () => {
            state = JSON.parse(JSON.stringify(initStateApp));
            state.modalFlow = ["foo", "bar"];
            action = { type: types.MODAL_FLOW_POP_FIRST };
            expectedData.modalFlow = ["bar"];
            expect(appReducer(state, action)).to.deep.equal(expectedData);
        });
    });
});
