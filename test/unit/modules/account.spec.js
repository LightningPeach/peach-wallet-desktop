import configureStore from "redux-mock-store";
import thunk from "redux-thunk";

import "../../utils";
import { statusCodes } from "config";
import {
    accountActions as actions,
    accountTypes as types,
    accountOperations as operations,
} from "modules/account";
import { notificationsTypes } from "modules/notifications";
import { lndOperations } from "modules/lnd";
import { streamPaymentOperations } from "modules/streamPayments";
import { lightningOperations } from "modules/lightning";
import { channelsOperations, channelsActions, channelsTypes } from "modules/channels";
import { onChainOperations } from "modules/onchain";
import { SATOSHI_MEASURE, MAX_PAYMENT_REQUEST } from "config/consts";
import accountReducer, { initStateAccount } from "modules/account/reducers";
import { appTypes, appOperations } from "modules/app";
import { db, errorPromise, successPromise, unsuccessPromise } from "additional";
import { store as defaultStore } from "store/configure-store";

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe("Account Unit Tests", () => {
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

        it("should create an action to set lis status", () => {
            expectedData.type = types.SET_LIS_STATUS;
            expect(actions.setLisStatus(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set lightningId", () => {
            expectedData.type = types.SET_LIGHTNING_ID;
            expect(actions.setLightningID(data)).to.deep.equal(expectedData);
        });

        it("should create an action to create accout", () => {
            expectedData = {
                type: types.CREATE_ACCOUNT,
            };
            expect(actions.createAccount()).to.deep.equal(expectedData);
        });

        it("should create an action to set successful status on account creation", () => {
            expectedData = {
                type: types.SUCCESS_CREATE_NEW_ACCOUNT,
            };
            expect(actions.successCreatenewAccount()).to.deep.equal(expectedData);
        });

        it("should create an action to set error status on account creation", () => {
            expectedData.type = types.ERROR_CREATE_NEW_ACCOUNT;
            expect(actions.errorCreateNewAccount(data)).to.deep.equal(expectedData);
        });

        it("should create an action to logout (without data)", () => {
            expectedData = {
                payload: false,
                type: types.LOGOUT_ACCOUNT,
            };
            expect(actions.logoutAcount()).to.deep.equal(expectedData);
        });

        it("should create an action to logout (with data)", () => {
            expectedData.type = types.LOGOUT_ACCOUNT;
            expect(actions.logoutAcount(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set successful status on logout", () => {
            expectedData = {
                type: types.SUCCESS_LOGOUT_ACCOUNT,
            };
            expect(actions.successLogout()).to.deep.equal(expectedData);
        });

        it("should create an action to set status of starting logout", () => {
            expectedData = {
                type: types.START_LOGOUT,
            };
            expect(actions.startLogout()).to.deep.equal(expectedData);
        });

        it("should create an action to set status of finishing logout", () => {
            expectedData = {
                type: types.FINISH_LOGOUT,
            };
            expect(actions.finishLogout()).to.deep.equal(expectedData);
        });

        it("should create an action to login account", () => {
            data = {
                login: "foo",
                password: "bar",
            };
            expectedData = {
                payload: data,
                type: types.LOGIN_ACCOUNT,
            };
            expect(actions.loginAccount(data.login, data.password)).to.deep.equal(expectedData);
        });

        it("should create an action to set error status on auth on server", () => {
            expectedData.type = types.ERROR_AUTH_ON_SERVER;
            expect(actions.errorAuthOnServer(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set status of start initializing account", () => {
            expectedData = {
                type: types.START_INIT_ACCOUNT,
            };
            expect(actions.startInitAccount()).to.deep.equal(expectedData);
        });

        it("should create an action to set status of finish initializing account", () => {
            expectedData = {
                type: types.FINISH_INIT_ACCOUNT,
            };
            expect(actions.finishInitAccount()).to.deep.equal(expectedData);
        });

        it("should create an action to set error status on kernel connection", () => {
            expectedData.type = types.ERROR_CONNECT_KERNEL;
            expect(actions.errorConnectKernel(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set success status on kernel connection", () => {
            expectedData = {
                type: types.SUCCESS_CONNECT_KERNEL,
            };
            expect(actions.successConnectKernel()).to.deep.equal(expectedData);
        });

        it("should create an action to set success sign message", () => {
            expectedData.type = types.SUCCESS_SIGN_MESSAGE;
            expect(actions.successSignMessage(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set connected kernel connect indicator", () => {
            expectedData = {
                payload: types.KERNEL_CONNECTED,
                type: types.SET_CONNECTED_KERNEL_CONNECT_INDICATOR,
            };
            expect(actions.setConnectedKernelConnectIndicator()).to.deep.equal(expectedData);
        });

        it("should create an action to set disconnected kernel connect indicator", () => {
            expectedData = {
                payload: types.KERNEL_DISCONNECTED,
                type: types.SET_DISCONNECTED_KERNEL_CONNECT_INDICATOR,
            };
            expect(actions.setDisconnectedKernelConnectIndicator()).to.deep.equal(expectedData);
        });

        it("should create an action to set peers", () => {
            data = [
                {
                    address: "foo",
                    pub_key: "bar",
                    peer_id: "baz",
                    extra: "qux",
                },
                {
                    address: "quux",
                    pub_key: "corge",
                    peer_id: "uier",
                    addressExtraa: "grault",
                },
            ];
            expectedData = {
                payload: [
                    {
                        address: "foo",
                        lightningID: "bar",
                        peerID: "baz",
                    },
                    {
                        address: "quux",
                        lightningID: "corge",
                        peerID: "uier",
                    },
                ],
                type: types.SET_PEERS,
            };
            expect(actions.setPeers(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set error status on peers", () => {
            expectedData.type = types.ERROR_PEERS;
            expect(actions.errorPeers(data)).to.deep.equal(expectedData);
        });

        it("should create an action to add bitcoin account", () => {
            expectedData.type = types.ERROR_PEERS;
            expect(actions.errorPeers(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set error status on peers", () => {
            expectedData = {
                payload: [
                    {
                        address: data,
                    },
                ],
                type: types.ADD_BITCOIN_ACCOUNT,
            };
            expect(actions.addBitcoinAccount(data)).to.deep.equal(expectedData);
        });

        it("should create an action to successfully set QR code", () => {
            expectedData.type = types.SUCCESS_GENERATE_QR_CODE;
            expect(actions.successGenerateQRCode(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set bitcoin measure", () => {
            data = SATOSHI_MEASURE.btc;
            expectedData = {
                payload: {
                    bitcoinMeasureType: SATOSHI_MEASURE.btc,
                    bitcoinMeasureMultiplier: SATOSHI_MEASURE.multiplier,
                    lightningMeasureType: SATOSHI_MEASURE.ln,
                    toFixedMeasure: SATOSHI_MEASURE.toFixed,
                    toFixedMeasureAll: SATOSHI_MEASURE.toFixedAll,
                },
                type: types.SET_BITCOIN_MEASURE,
            };
            expect(actions.setBitcoinMeasure(data)).to.deep.equal(expectedData);
            expect(window.ipcClient).to.have.been.calledWith(
                "set-bitcoin-measure",
                {
                    multiplier: SATOSHI_MEASURE.multiplier,
                    toFixed: SATOSHI_MEASURE.toFixed,
                    type: SATOSHI_MEASURE.btc,
                },
            );
        });

        it("should create an action to set undefined lightningID status", () => {
            expectedData = {
                type: types.UNDEFINED_LIGHTNING_ID,
            };
            expect(actions.undefinedLightningID()).to.deep.equal(expectedData);
        });

        it("should create an action to set correct lightningID status", () => {
            expectedData = {
                type: types.CORRECT_LIGHTNING_ID,
            };
            expect(actions.correctLightningID()).to.deep.equal(expectedData);
        });

        it("should create an action to set incorrect lightningID status", () => {
            data = {
                error: "foo",
            };
            expectedData = {
                payload: data.error,
                type: types.INCORRECT_LIGHTNING_ID,
            };
            expect(actions.incorrectLightningID(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set start validating lightningID status", () => {
            expectedData = {
                type: types.START_VALIDATING_LIGHTNING_ID,
            };
            expect(actions.startValidatingLightningID()).to.deep.equal(expectedData);
        });

        it("should create an action to set end validating lightningID status", () => {
            expectedData = {
                type: types.END_VALIDATING_LIGHTNING_ID,
            };
            expect(actions.endValidatingLightningID()).to.deep.equal(expectedData);
        });

        it("should create an action to set incorrect payment amount error", () => {
            expectedData.type = types.INCORRECT_PAYMENT_AMOUNT;
            expect(actions.incorrectPaymentAmount(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set undefined payment amount status", () => {
            expectedData = {
                type: types.UNDEFINED_PAYMENT_AMOUNT,
            };
            expect(actions.undefinedPaymentAmount()).to.deep.equal(expectedData);
        });

        it("should create an action to set correct payment amount status", () => {
            expectedData = {
                type: types.CORRECT_PAYMENT_AMOUNT,
            };
            expect(actions.correctPaymentAmount()).to.deep.equal(expectedData);
        });

        it("should create an action to successfully set check balance", () => {
            data = {
                bitcoinBalance: "foo",
                lightningBalance: "bar",
                unConfirmedBitcoinBalance: "baz",
            };
            expectedData = {
                payload: data,
                type: types.SUCCESS_CHECK_BALANCE,
            };
            expect(actions.successCheckBalance(
                data.bitcoinBalance,
                data.lightningBalance,
                data.unConfirmedBitcoinBalance,
            )).to.deep.equal(expectedData);
        });

        it("should create an action to set check balance error", () => {
            expectedData.type = types.ERROR_CHECK_BALANCE;
            expect(actions.errorCheckBalance(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set system notifications status", () => {
            expectedData.type = types.SET_SYSTEM_NOTIFICATIONS_STATUS;
            expect(actions.setSystemNotificationsStatus(data)).to.deep.equal(expectedData);
        });
    });

    describe("Operations tests", () => {
        const lightningId = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
        let sandbox;
        let data;
        let store;
        let initState;
        let expectedActions;
        let expectedData;
        let errorResp;
        let successResp;
        let unsuccessResp;
        let fakeDB;
        let fakeApp;
        let fakeLnd;
        let fakeLightning;
        let fakeChannels;
        let fakeOnchain;
        let fakeStreamOperations;
        let fakeDispatchReturnError;
        let fakeDispatchReturnSuccess;
        let fakeDispatchReturnUnsuccess;
        let fakeStore;

        beforeEach(async () => {
            errorResp = await errorPromise(undefined, { name: undefined });
            successResp = await successPromise();
            unsuccessResp = await unsuccessPromise({ name: undefined });
            fakeDispatchReturnError = () => errorResp;
            fakeDispatchReturnSuccess = () => successResp;
            fakeDispatchReturnUnsuccess = () => unsuccessResp;
            sandbox = sinon.sandbox.create();
            fakeDB = sandbox.stub(db);
            window.ipcClient.reset();
            window.ipcRenderer.send.resetHistory();
            data = {
                configBuilder: {
                    select: sinon.stub(),
                    insert: sinon.stub(),
                    update: sinon.stub(),
                    set: sinon.stub(),
                    values: sinon.stub(),
                    where: sinon.stub(),
                    execute: sinon.stub(),
                    getOne: sinon.stub(),
                    whereValue: ["lightningId = :lightningID", { lightningID: lightningId }],
                },
            };
            expectedData = undefined;
            expectedActions = [];
            initState = {
                account: {
                    ...initStateAccount,
                    lightningID: lightningId,
                    lisStatus: types.LIS_DOWN,
                },
                onchain: {
                    fee: 0,
                },
            };
            store = mockStore(initState);
            fakeStore = sandbox.stub(defaultStore);
            fakeStore.dispatch = store.dispatch;
            fakeStore.getState = store.getState;
        });

        afterEach(() => {
            sandbox.restore();
        });

        describe("ipcRenderer", () => {
            beforeEach(() => {
                initState.account.lisStatus = types.LIS_NONE;
                store = mockStore(initState);
                fakeStore.dispatch = store.dispatch;
                fakeStore.getState = store.getState;
            });

            it("should set lnd down status", async () => {
                window.ipcRenderer.send("lnd-down");
                expectedActions = [
                    {
                        payload: types.KERNEL_DISCONNECTED,
                        type: types.SET_DISCONNECTED_KERNEL_CONNECT_INDICATOR,
                    },
                ];
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.on).to.be.calledWith("lnd-down");
            });


            it("should set lnd up status", async () => {
                window.ipcRenderer.send("lnd-up");
                expectedActions = [
                    {
                        payload: types.KERNEL_CONNECTED,
                        type: types.SET_CONNECTED_KERNEL_CONNECT_INDICATOR,
                    },
                ];
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.on).to.be.calledWith("lnd-up");
            });

            it("should return void if lis is currently down", async () => {
                initState.account.lisStatus = types.LIS_DOWN;
                store = mockStore(initState);
                fakeStore.dispatch = store.dispatch;
                fakeStore.getState = store.getState;
                window.ipcRenderer.send("lis-down");
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.on).to.be.calledWith("lis-down");
            });

            it("should set lis down status", async () => {
                window.ipcRenderer.send("lis-down");
                expectedActions = [
                    {
                        payload: types.LIS_DOWN,
                        type: types.SET_LIS_STATUS,
                    },
                ];
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.on).to.be.calledWith("lis-down");
            });

            it("should return void if lis is currently up", async () => {
                initState.account.lisStatus = types.LIS_UP;
                store = mockStore(initState);
                fakeStore.dispatch = store.dispatch;
                fakeStore.getState = store.getState;
                window.ipcRenderer.send("lis-up");
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.on).to.be.calledWith("lis-up");
            });

            it("should set lis up status", async () => {
                window.ipcRenderer.send("lis-up");
                expectedActions = [
                    {
                        payload: types.LIS_UP,
                        type: types.SET_LIS_STATUS,
                    },
                ];
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.on).to.be.calledWith("lis-up");
            });
        });

        describe("Modal Windows", () => {
            beforeEach(() => {
                expectedData = { type: appTypes.SET_MODAL_STATE };
            });

            it("openPaymentDetailsModal()", async () => {
                expectedData.payload = types.MODAL_STATE_SYSTEM_NOTIFICATIONS;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.openSystemNotificationsModal())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });
        });

        describe("createNewBitcoinAccount()", () => {
            beforeEach(() => {
                data.btc_address = "new_address";
                window.ipcClient
                    .withArgs("newAddress")
                    .returns({
                        ok: true,
                        response: {
                            address: data.btc_address,
                        },
                    });
            });

            it("ipc error", async () => {
                window.ipcClient
                    .withArgs("newAddress")
                    .returns({ ok: false });
                expectedData = {
                    ...errorResp,
                    f: "createNewBitcoinAccount",
                };
                expect(await store.dispatch(operations.createNewBitcoinAccount())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal([]);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("newAddress");
            });

            it("success", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: [{ address: data.btc_address }],
                        type: types.ADD_BITCOIN_ACCOUNT,
                    },
                ];
                expect(await store.dispatch(operations.createNewBitcoinAccount())).to.deep.equal(successResp);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("newAddress");
            });
        });

        it("setInitConfig()", async () => {
            fakeDB.configBuilder.returns({
                insert: data.configBuilder.insert.returns({
                    values: data.configBuilder.values.returns({
                        execute: data.configBuilder.execute,
                    }),
                }),
            });
            const valuesWith = {
                activeMeasure: "mBTC",
                createChannelViewed: 0,
                lightningId,
                systemNotifications: 3,
            };
            expectedData = { ...successResp };
            expectedActions = [
                {
                    payload: {
                        bitcoinMeasureMultiplier: 0.00001,
                        bitcoinMeasureType: "mBTC",
                        lightningMeasureType: "mLN",
                        toFixedMeasure: 5,
                        toFixedMeasureAll: 5,
                    },
                    type: types.SET_BITCOIN_MEASURE,
                },
                {
                    payload: 3,
                    type: types.SET_SYSTEM_NOTIFICATIONS_STATUS,
                },
                {
                    payload: types.MODAL_STATE_SYSTEM_NOTIFICATIONS,
                    type: appTypes.SET_MODAL_STATE,
                },
            ];
            expect(await store.dispatch(operations.setInitConfig(lightningId))).to.deep.equal(expectedData);
            expect(store.getActions()).to.deep.equal(expectedActions);
            expect(fakeDB.configBuilder).to.be.calledOnce;
            expect(data.configBuilder.insert).to.be.calledOnce;
            expect(data.configBuilder.insert).to.be.calledImmediatelyAfter(fakeDB.configBuilder);
            expect(data.configBuilder.values).to.be.calledOnce;
            expect(data.configBuilder.values).to.be.calledImmediatelyAfter(data.configBuilder.insert);
            expect(data.configBuilder.values).to.be.calledWith(valuesWith);
            expect(data.configBuilder.execute).to.be.calledOnce;
            expect(data.configBuilder.execute).to.be.calledImmediatelyAfter(data.configBuilder.values);
        });

        describe("loadAccountSettings()", () => {
            let error;

            beforeEach(() => {
                error = "error";
                data.selectWhere = ["lightningId = :lightningID", { lightningID: lightningId }];
                data.insertValues = {
                    activeMeasure: "mBTC",
                    createChannelViewed: 0,
                    lightningId,
                    systemNotifications: 3,
                };
                data.getOneValues = {
                    activeMeasure: "BTC",
                    createChannelViewed: 0,
                    lightningId,
                    systemNotifications: 3,
                };
                fakeDB.configBuilder.returns({
                    insert: data.configBuilder.insert.returns({
                        values: data.configBuilder.values.returns({
                            execute: data.configBuilder.execute,
                        }),
                    }),
                    select: data.configBuilder.select.returns({
                        where: data.configBuilder.where.returns({
                            getOne: data.configBuilder.getOne.returns(null),
                        }),
                    }),
                });
            });

            it("error", async () => {
                fakeDB.configBuilder.throws(new Error(error));
                expectedData = {
                    ...errorResp,
                    f: "loadAccountSettings",
                    error,
                };
                expect(await store.dispatch(operations.loadAccountSettings())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.configBuilder).to.be.calledOnce;
                expect(data.configBuilder.select).not.to.be.called;
            });

            it("success on no measure in db", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: {
                            bitcoinMeasureMultiplier: 0.00001,
                            bitcoinMeasureType: "mBTC",
                            lightningMeasureType: "mLN",
                            toFixedMeasure: 5,
                            toFixedMeasureAll: 5,

                        },
                        type: types.SET_BITCOIN_MEASURE,
                    },
                    {
                        payload: 3,
                        type: types.SET_SYSTEM_NOTIFICATIONS_STATUS,
                    },
                    {
                        payload: types.MODAL_STATE_SYSTEM_NOTIFICATIONS,
                        type: appTypes.SET_MODAL_STATE,
                    },
                ];
                expect(await store.dispatch(operations.loadAccountSettings())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.configBuilder).to.be.calledTwice;
                expect(data.configBuilder.select).to.be.calledOnce;
                expect(data.configBuilder.where).to.be.calledOnce;
                expect(data.configBuilder.where).to.be.calledImmediatelyAfter(data.configBuilder.select);
                expect(data.configBuilder.where).to.be.calledWith(...data.selectWhere);
                expect(data.configBuilder.getOne).to.be.calledOnce;
                expect(data.configBuilder.getOne).to.be.calledImmediatelyAfter(data.configBuilder.where);
                expect(data.configBuilder.insert).to.be.calledOnce;
                expect(data.configBuilder.insert).to.be.calledImmediatelyAfter(fakeDB.configBuilder);
                expect(data.configBuilder.values).to.be.calledOnce;
                expect(data.configBuilder.values).to.be.calledImmediatelyAfter(data.configBuilder.insert);
                expect(data.configBuilder.values).to.be.calledWith(data.insertValues);
                expect(data.configBuilder.execute).to.be.calledOnce;
                expect(data.configBuilder.execute).to.be.calledImmediatelyAfter(data.configBuilder.values);
            });

            it("success on all default measures in db", async () => {
                fakeDB.configBuilder.returns({
                    select: data.configBuilder.select.returns({
                        where: data.configBuilder.where.returns({
                            getOne: data.configBuilder.getOne.returns(data.getOneValues),
                        }),
                    }),
                });
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: {
                            bitcoinMeasureMultiplier: 1e-8,
                            bitcoinMeasureType: "BTC",
                            lightningMeasureType: "LN",
                            toFixedMeasure: 8,
                            toFixedMeasureAll: 8,

                        },
                        type: types.SET_BITCOIN_MEASURE,
                    },
                    {
                        payload: 3,
                        type: types.SET_SYSTEM_NOTIFICATIONS_STATUS,
                    },
                    {
                        payload: types.MODAL_STATE_SYSTEM_NOTIFICATIONS,
                        type: appTypes.SET_MODAL_STATE,
                    },
                ];
                expect(await store.dispatch(operations.loadAccountSettings())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.configBuilder).to.be.calledOnce;
                expect(data.configBuilder.select).to.be.calledOnce;
                expect(data.configBuilder.select).to.be.calledImmediatelyAfter(fakeDB.configBuilder);
                expect(data.configBuilder.where).to.be.calledOnce;
                expect(data.configBuilder.where).to.be.calledImmediatelyAfter(data.configBuilder.select);
                expect(data.configBuilder.where).to.be.calledWith(...data.selectWhere);
                expect(data.configBuilder.getOne).to.be.calledOnce;
                expect(data.configBuilder.getOne).to.be.calledImmediatelyAfter(data.configBuilder.where);
                expect(data.configBuilder.insert).not.to.be.called;
            });

            it("success on updated measures in db", async () => {
                data.getOneValues = {
                    activeMeasure: "BTC",
                    createChannelViewed: 1,
                    lightningId,
                    systemNotifications: 6,
                };
                fakeDB.configBuilder.returns({
                    select: data.configBuilder.select.returns({
                        where: data.configBuilder.where.returns({
                            getOne: data.configBuilder.getOne.returns(data.getOneValues),
                        }),
                    }),
                });
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: {
                            bitcoinMeasureMultiplier: 1e-8,
                            bitcoinMeasureType: "BTC",
                            lightningMeasureType: "LN",
                            toFixedMeasure: 8,
                            toFixedMeasureAll: 8,

                        },
                        type: types.SET_BITCOIN_MEASURE,
                    },
                    {
                        payload: channelsTypes.HIDE,
                        type: channelsTypes.UPDATE_CREATE_TUTORIAL_STATUS,
                    },
                    {
                        payload: 6,
                        type: types.SET_SYSTEM_NOTIFICATIONS_STATUS,
                    },
                ];
                expect(await store.dispatch(operations.loadAccountSettings())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.configBuilder).to.be.calledOnce;
                expect(data.configBuilder.select).to.be.calledOnce;
                expect(data.configBuilder.select).to.be.calledImmediatelyAfter(fakeDB.configBuilder);
                expect(data.configBuilder.where).to.be.calledOnce;
                expect(data.configBuilder.where).to.be.calledImmediatelyAfter(data.configBuilder.select);
                expect(data.configBuilder.where).to.be.calledWith(...data.selectWhere);
                expect(data.configBuilder.getOne).to.be.calledOnce;
                expect(data.configBuilder.getOne).to.be.calledImmediatelyAfter(data.configBuilder.where);
                expect(data.configBuilder.insert).not.to.be.called;
            });
        });

        describe("initAccount()", () => {
            beforeEach(() => {
                data.login = "test_acc";
                fakeLnd = sandbox.stub(lndOperations);
                fakeLnd.getBlocksHeight.returns(fakeDispatchReturnSuccess);
                fakeLnd.waitLndSync.returns(fakeDispatchReturnSuccess);
                fakeApp = sandbox.stub(appOperations);
                fakeApp.closeDb.returns(fakeDispatchReturnSuccess);
                fakeApp.closeModal.returns(fakeDispatchReturnSuccess);
                fakeApp.usdBtcRate.returns(fakeDispatchReturnSuccess);
                fakeStreamOperations = sandbox.stub(streamPaymentOperations);
                fakeStreamOperations.pauseAllStreams.returns(fakeDispatchReturnSuccess);
                fakeStreamOperations.loadStreams.returns(fakeDispatchReturnSuccess);
                fakeLightning = sandbox.stub(lightningOperations);
                fakeLightning.getHistory.returns(fakeDispatchReturnSuccess);
                fakeLightning.subscribeInvoices.returns(fakeDispatchReturnSuccess);
                fakeLightning.unSubscribeInvoices.returns(fakeDispatchReturnSuccess);
                fakeChannels = sandbox.stub(channelsOperations);
                fakeChannels.getChannels.returns(fakeDispatchReturnSuccess);
                fakeChannels.shouldShowCreateTutorial.returns(fakeDispatchReturnSuccess);
                fakeChannels.shouldShowLightningTutorial.returns(fakeDispatchReturnSuccess);
                fakeOnchain = sandbox.stub(onChainOperations);
                fakeOnchain.unSubscribeTransactions.returns(fakeDispatchReturnSuccess);
                fakeOnchain.subscribeTransactions.returns(fakeDispatchReturnSuccess);
                window.ipcClient
                    .withArgs("listChannels")
                    .returns({
                        ok: false,
                        error: "foo",
                    });
            });

            it("error lndSync", async () => {
                fakeLnd.waitLndSync.returns(fakeDispatchReturnError);
                expectedData = {
                    ...errorResp,
                    f: "initAccount",
                };
                expectedActions = [
                    {
                        type: types.FINISH_INIT_ACCOUNT,
                    },
                    {
                        type: types.START_LOGOUT,
                    },
                    {
                        payload: true,
                        type: types.LOGOUT_ACCOUNT,
                    },
                    {
                        type: types.FINISH_LOGOUT,
                    },
                    {
                        type: notificationsTypes.REMOVE_ALL_NOTIFICATIONS,
                    },
                ];
                expect(await store.dispatch(operations.initAccount(data.login))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeOnchain.unSubscribeTransactions).to.be.calledOnce;
                expect(fakeLnd.waitLndSync).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("logout");
            });

            it("error startLis", async () => {
                window.ipcClient
                    .withArgs("startLis")
                    .returns({ ok: false });
                expectedData = { ...errorResp, f: "initAccount" };
                expectedActions = [
                    {
                        type: types.FINISH_INIT_ACCOUNT,
                    },
                    {
                        type: types.START_LOGOUT,
                    },
                    {
                        payload: true,
                        type: types.LOGOUT_ACCOUNT,
                    },
                    {
                        type: types.FINISH_LOGOUT,
                    },
                    {
                        type: notificationsTypes.REMOVE_ALL_NOTIFICATIONS,
                    },
                ];
                expect(await store.dispatch(operations.initAccount(data.login))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledTwice;
                expect(window.ipcClient).to.be.calledWith("startLis");
                expect(window.ipcClient).to.be.calledWith("logout");
                expect(fakeOnchain.unSubscribeTransactions).to.be.calledOnce;
                expect(fakeLnd.waitLndSync).to.be.calledOnce;
            });

            it("error getLightningID", async () => {
                window.ipcClient
                    .withArgs("startLis")
                    .returns({ ok: true })
                    .withArgs("getInfo")
                    .returns({ ok: false });
                expectedData = { ...errorResp, f: "initAccount" };
                expectedActions = [
                    {
                        type: types.FINISH_INIT_ACCOUNT,
                    },
                    {
                        type: types.START_LOGOUT,
                    },
                    {
                        payload: true,
                        type: types.LOGOUT_ACCOUNT,
                    },
                    {
                        type: types.FINISH_LOGOUT,
                    },
                    {
                        type: notificationsTypes.REMOVE_ALL_NOTIFICATIONS,
                    },
                ];
                expect(await store.dispatch(operations.initAccount(data.login))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.callCount(3);
                expect(window.ipcClient).to.be.calledWith("startLis");
                expect(window.ipcClient).to.be.calledWith("getInfo");
                expect(window.ipcClient).to.be.calledWith("logout");
                expect(fakeOnchain.unSubscribeTransactions).to.be.calledOnce;
                expect(fakeLnd.waitLndSync).to.be.calledOnce;
            });

            it("error getHistory", async () => {
                window.ipcClient
                    .withArgs("startLis")
                    .returns({ ok: true })
                    .withArgs("getInfo")
                    .returns({ ok: true, response: { identity_pubkey: lightningId } });
                fakeLightning.getHistory.returns(fakeDispatchReturnError);
                expectedData = { ...errorResp, f: "initAccount" };
                expectedActions = [
                    {
                        payload: lightningId,
                        type: types.SET_LIGHTNING_ID,
                    },
                    {
                        type: types.FINISH_INIT_ACCOUNT,
                    },
                    {
                        type: types.START_LOGOUT,
                    },
                    {
                        payload: true,
                        type: types.LOGOUT_ACCOUNT,
                    },
                    {
                        type: types.FINISH_LOGOUT,
                    },
                    {
                        type: notificationsTypes.REMOVE_ALL_NOTIFICATIONS,
                    },
                ];
                expect(await store.dispatch(operations.initAccount(data.login))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.callCount(3);
                expect(window.ipcClient).to.be.calledWith("startLis");
                expect(window.ipcClient).to.be.calledWith("getInfo");
                expect(window.ipcClient).to.be.calledWith("logout");
                expect(fakeOnchain.unSubscribeTransactions).to.be.calledOnce;
                expect(fakeLnd.waitLndSync).to.be.calledOnce;
                expect(fakeLightning.getHistory).to.be.calledOnce;
            });

            it("error connectKernel", async () => {
                window.ipcClient
                    .withArgs("startLis")
                    .returns({ ok: true })
                    .withArgs("getInfo")
                    .onFirstCall()
                    .returns({ ok: true, response: { identity_pubkey: lightningId } })
                    .onSecondCall()
                    .returns({ ok: false });
                expectedData = { ...errorResp, f: "initAccount" };
                expectedActions = [
                    {
                        payload: lightningId,
                        type: types.SET_LIGHTNING_ID,
                    },
                    {
                        payload: undefined,
                        type: types.ERROR_CONNECT_KERNEL,
                    },
                    {
                        type: types.FINISH_INIT_ACCOUNT,
                    },
                    {
                        type: types.START_LOGOUT,
                    },
                    {
                        payload: true,
                        type: types.LOGOUT_ACCOUNT,
                    },
                    {
                        type: types.FINISH_LOGOUT,
                    },
                    {
                        type: notificationsTypes.REMOVE_ALL_NOTIFICATIONS,
                    },
                ];
                expect(await store.dispatch(operations.initAccount(data.login))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.callCount(4);
                expect(window.ipcClient).to.be.calledWith("startLis");
                expect(window.ipcClient).to.be.calledWith("getInfo");
                expect(window.ipcClient).to.be.calledWith("logout");
                expect(fakeOnchain.unSubscribeTransactions).to.be.calledOnce;
                expect(fakeLnd.waitLndSync).to.be.calledOnce;
                expect(fakeLightning.getHistory).to.be.calledOnce;
            });

            it("success", async () => {
                data.new_adress = "test";
                window.ipcClient
                    .withArgs("startLis")
                    .returns({ ok: true })
                    .withArgs("getInfo")
                    .returns({ ok: true, response: { identity_pubkey: lightningId } })
                    .withArgs("newAddress")
                    .returns({ ok: true, response: { address: data.new_adress } });
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: lightningId,
                        type: types.SET_LIGHTNING_ID,
                    },
                    {
                        type: types.SUCCESS_CONNECT_KERNEL,
                    },
                    {
                        type: types.FINISH_INIT_ACCOUNT,
                    },
                    {
                        payload: { login: data.login, password: "" },
                        type: types.LOGIN_ACCOUNT,
                    },
                    {
                        payload: types.KERNEL_CONNECTED,
                        type: types.SET_CONNECTED_KERNEL_CONNECT_INDICATOR,
                    },
                    {
                        type: notificationsTypes.REMOVE_ALL_NOTIFICATIONS,
                    },
                    {
                        payload: [{ address: data.new_adress }],
                        type: types.ADD_BITCOIN_ACCOUNT,
                    },
                    {
                        payload: "foo",
                        type: types.ERROR_CHECK_BALANCE,
                    },
                ];
                expect(await store.dispatch(operations.initAccount(data.login))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.callCount(5);
                expect(window.ipcClient).to.be.calledWith("startLis");
                expect(window.ipcClient).to.be.calledWith("getInfo");
                expect(window.ipcClient).to.be.calledWith("newAddress");
                expect(window.ipcClient).to.be.calledWith("listChannels");
                expect(fakeOnchain.subscribeTransactions).to.be.calledOnce;
                expect(fakeLnd.waitLndSync).to.be.calledOnce;
                expect(fakeLightning.getHistory).to.be.calledOnce;
                expect(fakeLightning.subscribeInvoices).to.be.calledOnce;
                expect(fakeChannels.getChannels).to.be.calledOnce;
                expect(fakeChannels.shouldShowCreateTutorial).to.be.calledOnce;
                expect(fakeChannels.shouldShowLightningTutorial).to.be.calledOnce;
                expect(fakeApp.usdBtcRate).to.be.calledOnce;
                expect(fakeStreamOperations.loadStreams).to.be.calledOnce;
            });
        });

        describe("connectKernel()", () => {
            it("ipc error", async () => {
                window.ipcClient.returns({ ok: false });
                expectedData = {
                    ...errorResp,
                    error: undefined,
                    f: "connectKernel",
                };
                expectedActions = [
                    {
                        payload: undefined,
                        type: types.ERROR_CONNECT_KERNEL,
                    },
                ];
                expect(await store.dispatch(operations.connectKernel())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("getInfo");
            });

            it("success", async () => {
                window.ipcClient.returns({ ok: true });
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        type: types.SUCCESS_CONNECT_KERNEL,
                    },
                ];
                expect(await store.dispatch(operations.connectKernel())).to.deep.equal(successResp);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("getInfo");
            });
        });

        describe("connectServerLnd()", () => {
            it("ipc error", async () => {
                window.ipcClient.returns({ ok: false });
                expectedData = {
                    ...errorResp,
                    error: undefined,
                    f: "connectServerLnd",
                };
                expect(await store.dispatch(operations.connectServerLnd())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal([]);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("connectServerLnd");
            });

            it("success", async () => {
                window.ipcClient.returns({ ok: true });
                expectedData = { ...successResp };
                expect(await store.dispatch(operations.connectServerLnd())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal([]);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("connectServerLnd");
            });
        });

        describe("getLightningID()", () => {
            it("ipc error", async () => {
                window.ipcClient.returns({ ok: false });
                expectedData = {
                    ...errorResp,
                    error: undefined,
                    f: "getLightningID",
                };
                expect(await store.dispatch(operations.getLightningID())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal([]);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("getInfo");
            });

            it("success", async () => {
                window.ipcClient.returns({ ok: true, response: { identity_pubkey: lightningId } });
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: lightningId,
                        type: types.SET_LIGHTNING_ID,
                    },
                ];
                expect(await store.dispatch(operations.getLightningID())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("getInfo");
            });
        });

        describe("logout()", () => {
            beforeEach(() => {
                data.closeServerSocket = sinon.stub();
                initState = {
                    account: {
                        ...initStateAccount,
                        serverSocket: {
                            close: data.closeServerSocket,
                        },
                    },
                    streamPayment: { streams: [] },
                };
                store = mockStore(initState);
            });

            it("should return error if already logouting", async () => {
                initState.account.isLogouting = true;
                store = mockStore(initState);
                expectedData = {
                    ...unsuccessResp,
                    f: "logout",
                };
                expect(await store.dispatch(operations.logout())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal([]);
            });

            it("should logout with keepModalState = false && handle success server socket close", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        type: types.START_LOGOUT,
                    },
                    {
                        payload: appTypes.DB_CLOSING,
                        type: appTypes.DB_SET_STATUS,
                    },
                    {
                        payload: appTypes.DB_CLOSED,
                        type: appTypes.DB_SET_STATUS,
                    },
                    {
                        payload: false,
                        type: types.LOGOUT_ACCOUNT,
                    },
                    {
                        type: types.FINISH_LOGOUT,
                    },
                    {
                        type: notificationsTypes.REMOVE_ALL_NOTIFICATIONS,
                    },
                ];
                expect(await store.dispatch(operations.logout())).to.deep.equal(successResp);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledThrice;
                expect(window.ipcClient).to.be.calledWith("unsubscribeTransactions");
                expect(window.ipcClient).to.be.calledWith("unsubscribeInvoices");
                expect(window.ipcClient).to.be.calledWith("logout");
                expect(data.closeServerSocket).to.be.calledOnce;
            });

            it("should logout with keepModalState = true && handle error on server socket close", async () => {
                data.closeServerSocket = sinon.stub().throws(new Error());
                initState.account.serverSocket.close = data.closeServerSocket;
                store = mockStore(initState);
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        type: types.START_LOGOUT,
                    },
                    {
                        payload: appTypes.DB_CLOSING,
                        type: appTypes.DB_SET_STATUS,
                    },
                    {
                        payload: appTypes.DB_CLOSED,
                        type: appTypes.DB_SET_STATUS,
                    },
                    {
                        payload: true,
                        type: types.LOGOUT_ACCOUNT,
                    },
                    {
                        type: types.FINISH_LOGOUT,
                    },
                    {
                        type: notificationsTypes.REMOVE_ALL_NOTIFICATIONS,
                    },
                ];
                expect(await store.dispatch(operations.logout(true))).to.deep.equal(successResp);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledThrice;
                expect(window.ipcClient).to.be.calledWith("unsubscribeTransactions");
                expect(window.ipcClient).to.be.calledWith("unsubscribeInvoices");
                expect(window.ipcClient).to.be.calledWith("logout");
                expect(data.closeServerSocket).to.be.calledOnce;
            });
        });

        describe("signMessage()", () => {
            beforeEach(() => {
                data.message = "test_msg";
                data.signedMessage = "signed";
            });

            it("ipc error", async () => {
                window.ipcClient.returns({ ok: false });
                expectedData = {
                    ...errorResp,
                    error: undefined,
                    f: "signMessage",
                };
                expectedActions = [
                    {
                        payload: undefined,
                        type: types.ERROR_PEERS,
                    },
                ];
                expect(await store.dispatch(operations.signMessage(data.message))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal([]);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("signMessage", { message: data.message });
            });

            it("success", async () => {
                window.ipcClient.returns({
                    ok: true,
                    response: {
                        signature: data.signedMessage,
                    },
                });
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: data.signedMessage,
                        type: types.SUCCESS_SIGN_MESSAGE,
                    },
                ];
                expect(await store.dispatch(operations.signMessage(data.message))).to.deep.equal(successResp);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("signMessage", { message: data.message });
            });
        });

        describe("setBitcoinMeasure", () => {
            beforeEach(() => {
                data.unexistedMeasure = "Some value";
                data.existedMeasure = "BTC";
                data.defaultPayload = {
                    bitcoinMeasureMultiplier: 1e-5,
                    bitcoinMeasureType: data.unexistedMeasure,
                    lightningMeasureType: "mLN",
                    toFixedMeasure: 5,
                    toFixedMeasureAll: 5,
                };
                data.btcPayload = {
                    bitcoinMeasureMultiplier: 1e-8,
                    bitcoinMeasureType: "BTC",
                    lightningMeasureType: "LN",
                    toFixedMeasure: 8,
                    toFixedMeasureAll: 8,
                };
                fakeDB.configBuilder.returns({
                    update: data.configBuilder.update.returns({
                        set: data.configBuilder.set.returns({
                            where: data.configBuilder.where.returns({
                                execute: data.configBuilder.execute,
                            }),
                        }),
                    }),
                });
            });

            it("error save to db", async () => {
                fakeDB.configBuilder.throws(new Error("undefined"));
                expectedData = {
                    ...errorResp,
                    f: "setBitcoinMeasure",
                    error: "undefined",
                };
                expectedActions = [
                    {
                        payload: data.btcPayload,
                        type: types.SET_BITCOIN_MEASURE,
                    },
                ];
                expect(await store.dispatch(operations.setBitcoinMeasure("BTC"))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("set-bitcoin-measure");
                expect(fakeDB.configBuilder).to.be.calledOnce;
                expect(data.configBuilder.update).not.to.be.called;
            });

            it("with unexisted measure", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: data.defaultPayload,
                        type: types.SET_BITCOIN_MEASURE,
                    },
                ];
                expect(await store.dispatch(operations.setBitcoinMeasure(data.unexistedMeasure)))
                    .to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("set-bitcoin-measure");
                expect(fakeDB.configBuilder).to.be.calledOnce;
                expect(data.configBuilder.update).to.be.calledOnce;
                expect(data.configBuilder.update).to.be.calledImmediatelyAfter(fakeDB.configBuilder);
                expect(data.configBuilder.set).to.be.calledOnce;
                expect(data.configBuilder.set).to.be.calledImmediatelyAfter(data.configBuilder.update);
                expect(data.configBuilder.set).to.be.calledWith({ activeMeasure: data.unexistedMeasure });
                expect(data.configBuilder.where).to.be.calledOnce;
                expect(data.configBuilder.where).to.be.calledImmediatelyAfter(data.configBuilder.set);
                expect(data.configBuilder.where).to.be.calledWith(...data.configBuilder.whereValue);
                expect(data.configBuilder.execute).to.be.calledOnce;
                expect(data.configBuilder.execute).to.be.calledImmediatelyAfter(data.configBuilder.where);
            });

            it("success save to db", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: data.btcPayload,
                        type: types.SET_BITCOIN_MEASURE,
                    },
                ];
                expect(await store.dispatch(operations.setBitcoinMeasure("BTC"))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("set-bitcoin-measure");
                expect(fakeDB.configBuilder).to.be.calledOnce;
                expect(data.configBuilder.update).to.be.calledOnce;
                expect(data.configBuilder.update).to.be.calledImmediatelyAfter(fakeDB.configBuilder);
                expect(data.configBuilder.set).to.be.calledOnce;
                expect(data.configBuilder.set).to.be.calledImmediatelyAfter(data.configBuilder.update);
                expect(data.configBuilder.set).to.be.calledWith({ activeMeasure: data.existedMeasure });
                expect(data.configBuilder.where).to.be.calledOnce;
                expect(data.configBuilder.where).to.be.calledImmediatelyAfter(data.configBuilder.set);
                expect(data.configBuilder.where).to.be.calledWith(...data.configBuilder.whereValue);
                expect(data.configBuilder.execute).to.be.calledOnce;
                expect(data.configBuilder.execute).to.be.calledImmediatelyAfter(data.configBuilder.where);
            });
        });

        describe("setSystemNotificationsStatus()", () => {
            let error;

            beforeEach(() => {
                error = "error";
                data.value = 6;
                fakeDB.configBuilder.returns({
                    update: data.configBuilder.update.returns({
                        set: data.configBuilder.set.returns({
                            where: data.configBuilder.where.returns({
                                execute: data.configBuilder.execute,
                            }),
                        }),
                    }),
                });
            });

            it("db error", async () => {
                fakeDB.configBuilder.throws(new Error(error));
                expectedData = {
                    ...errorResp,
                    f: "setSystemNotificationsStatus",
                    error,
                };
                expectedActions = [
                    {
                        payload: data.value,
                        type: types.SET_SYSTEM_NOTIFICATIONS_STATUS,
                    },
                ];
                expect(await store.dispatch(operations.setSystemNotificationsStatus(data.value)))
                    .to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.configBuilder).to.be.calledOnce;
                expect(data.configBuilder.update).not.to.be.called;
            });

            it("success", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: data.value,
                        type: types.SET_SYSTEM_NOTIFICATIONS_STATUS,
                    },
                ];
                expect(await store.dispatch(operations.setSystemNotificationsStatus(data.value)))
                    .to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.configBuilder).to.be.calledOnce;
                expect(data.configBuilder.update).to.be.calledOnce;
                expect(data.configBuilder.update).to.be.calledImmediatelyAfter(fakeDB.configBuilder);
                expect(data.configBuilder.set).to.be.calledOnce;
                expect(data.configBuilder.set).to.be.calledImmediatelyAfter(data.configBuilder.update);
                expect(data.configBuilder.set).to.be.calledWithExactly({
                    systemNotifications: data.value,
                });
                expect(data.configBuilder.where).to.be.calledOnce;
                expect(data.configBuilder.where).to.be.calledImmediatelyAfter(data.configBuilder.set);
                expect(data.configBuilder.where).to.be.calledWithExactly(
                    "lightningId = :lightningID",
                    {
                        lightningID: lightningId,
                    },
                );
                expect(data.configBuilder.execute).to.be.calledOnce;
                expect(data.configBuilder.execute).to.be.calledImmediatelyAfter(data.configBuilder.where);
            });
        });

        describe("getPeers()", () => {
            beforeEach(() => {
                data.peers = [
                    {
                        pub_key: "pub_key1",
                        address: "address1",
                        peer_id: "peer_id1",
                    }, {
                        pub_key: "pub_key2",
                        address: "address2",
                        peer_id: "peer_id2",
                    },
                ];
                window.ipcClient
                    .withArgs("listPeers")
                    .returns({
                        ok: true,
                        response: {
                            peers: data.peers,
                        },
                    });
            });

            it("ipc error", async () => {
                window.ipcClient
                    .withArgs("listPeers")
                    .returns({ ok: false });
                expectedData = {
                    ...errorResp,
                    error: undefined,
                    f: "getPeers",
                };
                expectedActions = [
                    {
                        payload: undefined,
                        type: types.ERROR_PEERS,
                    },
                ];
                expect(await store.dispatch(operations.getPeers())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("listPeers");
            });

            it("success", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: data.peers.map(peer => ({
                            address: peer.address,
                            lightningID: peer.pub_key,
                            peerID: peer.peer_id,
                        })),
                        type: types.SET_PEERS,
                    },
                ];
                expect(await store.dispatch(operations.getPeers())).to.deep.equal(successResp);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("listPeers");
            });
        });

        describe("checkLightningID", () => {
            beforeEach(async () => {
                initState.account.lightningID = lightningId;
                store = mockStore(initState);
            });

            it("error with undefined lightning id", async () => {
                expectedData = {
                    ...unsuccessResp,
                    f: "checkLightningID",
                };
                expectedActions = [
                    {
                        type: types.START_VALIDATING_LIGHTNING_ID,
                    },
                    {
                        type: types.UNDEFINED_LIGHTNING_ID,
                    },
                    {
                        type: types.END_VALIDATING_LIGHTNING_ID,
                    },
                ];
                expect(await store.dispatch(operations.checkLightningID())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("error with personal lightning id", async () => {
                expectedData = {
                    ...unsuccessResp,
                    f: "checkLightningID",
                };
                expectedActions = [
                    {
                        type: types.START_VALIDATING_LIGHTNING_ID,
                    },
                    {
                        payload: statusCodes.EXCEPTION_LIGHTNING_ID_WRONG_SELF,
                        type: types.INCORRECT_LIGHTNING_ID,
                    },
                    {
                        type: types.END_VALIDATING_LIGHTNING_ID,
                    },
                ];
                expect(await store.dispatch(operations.checkLightningID(lightningId))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("error with incorrect lightning id", async () => {
                expectedData = {
                    ...unsuccessResp,
                    f: "checkLightningID",
                };
                expectedActions = [
                    {
                        type: types.START_VALIDATING_LIGHTNING_ID,
                    },
                    {
                        payload: statusCodes.EXCEPTION_LIGHTNING_ID_WRONG_LENGTH,
                        type: types.INCORRECT_LIGHTNING_ID,
                    },
                    {
                        type: types.END_VALIDATING_LIGHTNING_ID,
                    },
                ];
                expect(await store.dispatch(operations.checkLightningID(lightningId[0]))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("valid lightning id", async () => {
                const validLightningId = lightningId.replace("x", "X");
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        type: types.START_VALIDATING_LIGHTNING_ID,
                    },
                    {
                        type: types.CORRECT_LIGHTNING_ID,
                    },
                    {
                        type: types.END_VALIDATING_LIGHTNING_ID,
                    },
                ];
                expect(await store.dispatch(operations.checkLightningID(validLightningId))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });
        });

        describe("checkAmount()", () => {
            beforeEach(async () => {
                initState = {
                    account: {
                        bitcoinBalance: 1e5,
                        lightningBalance: 1e5,
                        unConfirmedBitcoinBalance: 1e5,
                        bitcoinMeasureMultiplier: 1e-5,
                        bitcoinMeasureType: "mBTC",
                        toFixedMeasure: 5,
                    },
                    onchain: { fee: 11468 },
                };
                store = mockStore(initState);
            });

            it("should check if amount present", () => {
                const resp = store.dispatch(operations.checkAmount());
                expect(resp).to.equal(statusCodes.EXCEPTION_FIELD_IS_REQUIRED);
            });

            it("should check if amount is number", () => {
                const resp = store.dispatch(operations.checkAmount("test"));
                expect(resp).to.equal(statusCodes.EXCEPTION_FIELD_DIGITS_ONLY);
            });

            it("should check if amount negative", () => {
                const resp = store.dispatch(operations.checkAmount(-1));
                expect(resp).to.equal(statusCodes.EXCEPTION_AMOUNT_NEGATIVE);
            });

            it("should check if amount equals zero", () => {
                const resp = store.dispatch(operations.checkAmount(0));
                expect(resp).to.equal(statusCodes.EXCEPTION_AMOUNT_EQUAL_ZERO());
            });

            it("should check lightning balance without errors", () => {
                const resp = store.dispatch(operations.checkAmount(1e-3));
                expect(resp).to.equal(null);
            });

            it("should check lightning balance with insufficient funds error", () => {
                const resp = store.dispatch(operations.checkAmount(1e6));
                expect(resp).to.equal(statusCodes.EXCEPTION_AMOUNT_LIGHTNING_NOT_ENOUGH_FUNDS);
            });

            it("should check lightning balance with max payment error", () => {
                initState = {
                    account: {
                        bitcoinBalance: 1e5,
                        lightningBalance: 1e8,
                        unConfirmedBitcoinBalance: 1e5,
                        bitcoinMeasureMultiplier: 1e-5,
                        bitcoinMeasureType: "mBTC",
                        toFixedMeasure: 5,
                    },
                    onchain: { fee: 11468 },
                };
                store = mockStore(initState);
                const resp = store.dispatch(operations.checkAmount(50));
                expect(resp)
                    .to.equal(statusCodes.EXCEPTION_AMOUNT_MORE_MAX((MAX_PAYMENT_REQUEST * 1e-5).toFixed(5)));
            });

            it("should check bitcoin balance without errors", () => {
                const resp = store.dispatch(operations.checkAmount(1, "bitcoin"));
                expect(resp).to.equal(null);
            });

            it("should check bitcoin balance with insufficient funds error", () => {
                const resp = store.dispatch(operations.checkAmount(2, "bitcoin"));
                expect(resp).to.equal(statusCodes.EXCEPTION_AMOUNT_ONCHAIN_NOT_ENOUGH_FUNDS);
            });

            it("should check bitcoin balance with low payment error", () => {
                const resp = store.dispatch(operations.checkAmount(1e-4, "bitcoin"));
                expect(resp).to.equal(statusCodes.EXCEPTION_AMOUNT_LESS_THAN_FEE(0.11468));
            });
        });

        describe("checkBalance()", () => {
            beforeEach(() => {
                window.ipcClient
                    .withArgs("listChannels")
                    .returns({
                        ok: true,
                        response: {
                            channels: [
                                { local_balance: 100, capacity: 100 },
                                { local_balance: 0, capacity: 2 },
                                { local_balance: 120, capacity: 300 },
                            ],
                        },
                    })
                    .withArgs("walletBalance")
                    .returns({
                        ok: true,
                        response: {
                            confirmed_balance: 30,
                            unconfirmed_balance: 10,
                        },
                    });
            });

            it("listChannels ipc error", async () => {
                window.ipcClient
                    .withArgs("listChannels")
                    .returns({ ok: false });
                expectedData = {
                    ...unsuccessResp,
                    f: "checkBalance",
                };
                expectedActions = [
                    {
                        payload: undefined,
                        type: types.ERROR_CHECK_BALANCE,
                    },
                ];
                expect(await store.dispatch(operations.checkBalance())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("listChannels");
            });

            it("walletBalance ipc error", async () => {
                window.ipcClient
                    .withArgs("walletBalance")
                    .returns({ ok: false });
                expectedData = {
                    ...unsuccessResp,
                    f: "checkBalance",
                };
                expectedActions = [
                    {
                        payload: undefined,
                        type: types.ERROR_CHECK_BALANCE,
                    },
                ];
                expect(await store.dispatch(operations.checkBalance())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledTwice;
                expect(window.ipcClient).to.be.calledWith("listChannels");
                expect(window.ipcClient).to.be.calledWith("walletBalance");
            });

            it("success", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: {
                            bitcoinBalance: 30,
                            lightningBalance: 220,
                            unConfirmedBitcoinBalance: 10,
                        },
                        type: types.SUCCESS_CHECK_BALANCE,
                    },
                ];
                expect(await store.dispatch(operations.checkBalance())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledTwice;
                expect(window.ipcClient).to.be.calledWith("listChannels");
                expect(window.ipcClient).to.be.calledWith("walletBalance");
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
            expectedData = JSON.parse(JSON.stringify(initStateAccount));
            state = undefined;
        });

        it("should return the initial state", () => {
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle CREATE_ACCOUNT action", () => {
            action = {
                type: types.CREATE_ACCOUNT,
            };
            expectedData.newAccount = {
                creatingError: null,
                isCreating: true,
            };
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SUCCESS_CREATE_NEW_ACCOUNT action", () => {
            action = {
                type: types.SUCCESS_CREATE_NEW_ACCOUNT,
            };
            state = JSON.parse(JSON.stringify(initStateAccount));
            state.newAccount = {
                creatingError: "foo",
                isCreating: true,
            };
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle ERROR_CREATE_NEW_ACCOUNT action", () => {
            action.type = types.ERROR_CREATE_NEW_ACCOUNT;
            expectedData.newAccount = {
                creatingError: data,
                isCreating: false,
            };
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_LIGHTNING_ID action", () => {
            action.type = types.SET_LIGHTNING_ID;
            expectedData.lightningID = data;
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle LOGIN_ACCOUNT action", () => {
            data = {
                isConnectedToKernel: true,
                bitcoinBalance: 10,
            };
            action = {
                payload: data,
                type: types.LOGIN_ACCOUNT,
            };
            expectedData = {
                ...expectedData,
                ...data,
                isLogined: true,
            };
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle START_INIT_ACCOUNT action", () => {
            action = {
                type: types.START_INIT_ACCOUNT,
            };
            expectedData.isIniting = true;
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle FINISH_INIT_ACCOUNT action", () => {
            action = {
                type: types.FINISH_INIT_ACCOUNT,
            };
            state = JSON.parse(JSON.stringify(initStateAccount));
            state.isIniting = true;
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle LOGOUT_ACCOUNT action", () => {
            action = {
                type: types.LOGOUT_ACCOUNT,
            };
            state = JSON.parse(JSON.stringify(initStateAccount));
            state.isLoginned = true;
            state.bitcoinBalance = 10;
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle START_LOGOUT action", () => {
            action = {
                type: types.START_LOGOUT,
            };
            expectedData.isLogouting = true;
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle FINISH_LOGOUT action", () => {
            action = {
                type: types.FINISH_LOGOUT,
            };
            state = JSON.parse(JSON.stringify(initStateAccount));
            state.isLogouting = true;
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SUCCESS_CONNECT_KERNEL action", () => {
            action = {
                type: types.SUCCESS_CONNECT_KERNEL,
            };
            expectedData.isConnectedToKernel = true;
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SUCCESS_SIGN_MESSAGE action", () => {
            action.type = types.SUCCESS_SIGN_MESSAGE;
            expectedData.signedMessage = data;
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_CONNECTED_KERNEL_CONNECT_INDICATOR action", () => {
            action.type = types.SET_CONNECTED_KERNEL_CONNECT_INDICATOR;
            expectedData.kernelConnectIndicator = data;
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_DISCONNECTED_KERNEL_CONNECT_INDICATOR action", () => {
            action.type = types.SET_DISCONNECTED_KERNEL_CONNECT_INDICATOR;
            expectedData.kernelConnectIndicator = data;
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_PEERS action", () => {
            action.type = types.SET_PEERS;
            expectedData.peers = data;
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle ADD_BITCOIN_ACCOUNT action", () => {
            action.type = types.ADD_BITCOIN_ACCOUNT;
            expectedData.bitcoinAccount = data;
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SUCCESS_GENERATE_QR_CODE action", () => {
            action.type = types.SUCCESS_GENERATE_QR_CODE;
            expectedData.QRCode = data;
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_BITCOIN_MEASURE action", () => {
            data = {
                bitcoinMeasureType: "foo",
                bitcoinMeasureMultiplier: "bar",
                lightningMeasureType: "baz",
                toFixedMeasure: "qux",
                toFixedMeasureAll: "quux",
            };
            action = {
                payload: data,
                type: types.SET_BITCOIN_MEASURE,
            };
            expectedData = {
                ...expectedData,
                ...data,
            };
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle UNDEFINED_LIGHTNING_ID action", () => {
            action = {
                type: types.UNDEFINED_LIGHTNING_ID,
            };
            expectedData.errorLightningIDEnter = "";
            expectedData.lightningIDEnterStatus = "undefined";
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle CORRECT_LIGHTNING_ID action", () => {
            action = {
                type: types.CORRECT_LIGHTNING_ID,
            };
            expectedData.errorLightningIDEnter = "";
            expectedData.lightningIDEnterStatus = "correct";
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle INCORRECT_LIGHTNING_ID action", () => {
            action.type = types.INCORRECT_LIGHTNING_ID;
            expectedData.errorLightningIDEnter = data;
            expectedData.lightningIDEnterStatus = "incorrect";
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle START_VALIDATING_LIGHTNING_ID action", () => {
            action = {
                type: types.START_VALIDATING_LIGHTNING_ID,
            };
            expectedData.validatingLightningId = true;
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle END_VALIDATING_LIGHTNING_ID action", () => {
            action = {
                type: types.END_VALIDATING_LIGHTNING_ID,
            };
            state = JSON.parse(JSON.stringify(initStateAccount));
            state.validatingLightningId = true;
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle INCORRECT_PAYMENT_AMOUNT action", () => {
            action.type = types.INCORRECT_PAYMENT_AMOUNT;
            expectedData.errorAmountEnter = data;
            expectedData.amountStatus = "incorrect";
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle UNDEFINED_PAYMENT_AMOUNT action", () => {
            action = {
                type: types.UNDEFINED_PAYMENT_AMOUNT,
            };
            expectedData.errorAmountEnter = "";
            expectedData.amountStatus = "undefined";
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle CORRECT_PAYMENT_AMOUNT action", () => {
            action = {
                type: types.CORRECT_PAYMENT_AMOUNT,
            };
            expectedData.errorAmountEnter = "";
            expectedData.amountStatus = "correct";
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SUCCESS_CHECK_BALANCE action", () => {
            data = {
                bitcoinBalance: "foo",
                lightningBalance: "bar",
                unConfirmedBitcoinBalance: "baz",
            };
            action = {
                payload: data,
                type: types.SUCCESS_CHECK_BALANCE,
            };
            expectedData = {
                ...expectedData,
                ...data,
            };
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_LIS_STATUS action", () => {
            action.type = types.SET_LIS_STATUS;
            expectedData.lisStatus = data;
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_SYSTEM_NOTIFICATIONS_STATUS action", () => {
            action.type = types.SET_SYSTEM_NOTIFICATIONS_STATUS;
            expectedData.systemNotifications = data;
            expect(accountReducer(state, action)).to.deep.equal(expectedData);
        });
    });
});
