import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import omit from "lodash/omit";

import { exceptions } from "config";
import { onChainActions as actions, onChainTypes as types, onChainOperations as operations } from "modules/onchain";
import onChainReducer, { initStateOnchain } from "modules/onchain/reducers";
import { accountTypes, accountOperations } from "modules/account";
import { appOperations, appTypes } from "modules/app";
import { store as defaultStore } from "store/configure-store";
import { db, errorPromise, successPromise, unsuccessPromise } from "additional";

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe("OnChain Unit Tests", () => {
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

        it("should create an action to set history", () => {
            expectedData.type = types.SET_ONCHAIN_HISTORY;
            expect(actions.setOnChainHistory(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set coins preparation (name included)", () => {
            data = {
                recepient: "foo",
                amount: "bar",
                name: "baz",
            };
            expectedData = {
                payload: data,
                type: types.SEND_COINS_PREPARING,
            };
            expect(actions.sendCoinsPreparing(
                data.recepient,
                data.amount,
                data.name,
            )).to.deep.equal(expectedData);
        });

        it("should create an action to set coins preparation (no name passed)", () => {
            data = {
                recepient: "foo",
                amount: "bar",
                name: "",
            };
            expectedData = {
                payload: data,
                type: types.SEND_COINS_PREPARING,
            };
            expect(actions.sendCoinsPreparing(
                data.recepient,
                data.amount,
            )).to.deep.equal(expectedData);
        });

        it("should create an action to clear preparation", () => {
            expectedData = {
                type: types.CLEAR_SEND_COINS_PREPARING,
            };
            expect(actions.clearSendCoinsPreparing()).to.deep.equal(expectedData);
        });

        it("should create an action to set onChain fee", () => {
            expectedData.type = types.SET_ONCHAIN_FEE;
            expect(actions.setOnChainFee(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set sending coins details", () => {
            expectedData.type = types.SET_SEND_COINS_PAYMENT_DETAILS;
            expect(actions.setSendCoinsPaymentDetails(data)).to.deep.equal(expectedData);
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
            expectedData = JSON.parse(JSON.stringify(initStateOnchain));
            state = undefined;
        });

        it("should return the initial state", () => {
            expect(onChainReducer(state, {})).to.deep.equal(expectedData);
        });

        it("should handle LOGOUT_ACCOUNT action", () => {
            action.type = accountTypes.LOGOUT_ACCOUNT;
            state = JSON.parse(JSON.stringify(initStateOnchain));
            state.history = ["foo"];
            state.sendCoinsDetails = "bar";
            expect(onChainReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_ONCHAIN_HISTORY action", () => {
            action.type = types.SET_ONCHAIN_HISTORY;
            expectedData.history = data;
            expect(onChainReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SEND_COINS_PREPARING action", () => {
            action.type = types.SEND_COINS_PREPARING;
            expectedData.sendCoinsDetails = data;
            expect(onChainReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle CLEAR_SEND_COINS_PREPARING action", () => {
            action = {
                type: types.CLEAR_SEND_COINS_PREPARING,
            };
            state = JSON.parse(JSON.stringify(initStateOnchain));
            state.sendCoinsDetails = "bar";
            expect(onChainReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_ONCHAIN_FEE action", () => {
            action.type = types.SET_ONCHAIN_FEE;
            expectedData.fee = data;
            expect(onChainReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_SEND_COINS_PAYMENT_DETAILS action", () => {
            action.type = types.SET_SEND_COINS_PAYMENT_DETAILS;
            expectedData.sendCoinsPaymentDetails = data;
            expect(onChainReducer(state, action)).to.deep.equal(expectedData);
        });
    });

    describe("Operations tests", () => {
        let fakeDB;
        let data;
        let store;
        let initState;
        let expectedActions;
        let expectedData;
        let errorResp;
        let successResp;
        let unsuccessResp;
        let fakeAccount;
        let fakeApp;
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
            window.ipcClient.resetHistory();
            window.ipcRenderer.send.resetHistory();
            fakeAccount = sinon.stub(accountOperations);
            fakeApp = sinon.stub(appOperations);
            fakeDB = sinon.stub(db);
            fakeStore = sinon.stub(defaultStore);
            data = {
                onchainBuilder: {
                    update: sinon.stub(),
                    set: sinon.stub(),
                    where: sinon.stub(),
                    insert: sinon.stub(),
                    values: sinon.stub(),
                    execute: sinon.stub(),
                    getMany: sinon.stub(),
                },
            };
            initState = {
                account: {
                    bitcoinMeasureType: "mBTC",
                },
                onchain: { ...initStateOnchain },
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

        describe("ipcRenderer()", () => {
            beforeEach(() => {
                fakeStore.dispatch = store.dispatch;
                fakeStore.getState = store.getState;
            });

            it("transactionsUpdate()", async () => {
                const dbTxns = [];
                const chainTxns = {
                    response: {
                        transactions: [
                            {
                                tx_hash: "foo",
                                amount: 101,
                                time_stamp: 201,
                                num_confirmations: 301,
                                block_hash: 401,
                                block_height: 501,
                                total_fees: 601,
                            },
                        ],
                    },
                };
                fakeDB.onchainBuilder.returns({
                    getMany: data.onchainBuilder.getMany.returns(dbTxns),
                });
                window.ipcClient
                    .withArgs("getTransactions")
                    .returns(chainTxns);
                fakeAccount.checkBalance.returns(fakeDispatchReturnSuccess);
                window.ipcRenderer.send("transactions-update");
                expect(window.ipcRenderer.on).to.be.called.calledWith("transactions-update");
                expect(fakeAccount.checkBalance).to.be.calledOnce;
            });
        });

        describe("Modal windows", () => {
            beforeEach(() => {
                expectedData = { type: appTypes.SET_MODAL_STATE };
            });

            it("openSendCoinsModal()", async () => {
                expectedData.payload = types.MODAL_STATE_SEND_COINS;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.openSendCoinsModal())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("openWarningModal()", async () => {
                expectedData.payload = types.MODAL_STATE_WARNING;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.openWarningModal())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });
        });

        it("subscribeTransactions()", async () => {
            expect(await store.dispatch(operations.subscribeTransactions())).to.deep.equal(expectedData);
            expect(store.getActions()).to.deep.equal(expectedActions);
            expect(window.ipcRenderer.send).to.be.calledWith("subscribeTransactions");
            expect(window.ipcRenderer.send).to.be.calledOnce;
        });

        it("unSubscribeTransactions()", async () => {
            expect(await store.dispatch(operations.unSubscribeTransactions())).to.deep.equal(expectedData);
            expect(store.getActions()).to.deep.equal(expectedActions);
            expect(window.ipcClient).to.be.calledWith("unsubscribeTransactions");
            expect(window.ipcClient).to.be.calledOnce;
        });

        it("clearSendCoinsError()", async () => {
            expectedData = {
                payload: "",
                type: types.SET_SEND_COINS_PAYMENT_DETAILS,
            };
            expectedActions = [expectedData];
            expect(await store.dispatch(operations.clearSendCoinsError())).to.deep.equal(expectedData);
            expect(store.getActions()).to.deep.equal(expectedActions);
        });

        it("clearSendCoinsDetails()", async () => {
            expectedActions = [
                {
                    type: types.CLEAR_SEND_COINS_PREPARING,
                },
            ];
            expect(await store.dispatch(operations.clearSendCoinsDetails())).to.deep.equal(expectedData);
            expect(store.getActions()).to.deep.equal(expectedActions);
        });

        describe("prepareSendCoins()", () => {
            beforeEach(() => {
                initState.account = {
                    kernelConnectIndicator: accountTypes.KERNEL_CONNECTED,
                };
                store = mockStore(initState);
                data.attr = {
                    recepient: "foo",
                    amount: "bar",
                    name: "baz",
                };
            });

            it("kernel disconnected", async () => {
                initState.account.kernelConnectIndicator = accountTypes.KERNEL_DISCONNECTED;
                store = mockStore(initState);
                expectedData = {
                    ...unsuccessResp,
                    f: "prepareSendCoins",
                };
                expect(await store.dispatch(operations.prepareSendCoins(
                    data.attr.recepient,
                    data.attr.amount,
                    data.attr.name,
                ))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("success", async () => {
                expectedActions = [
                    {
                        payload: data.attr,
                        type: types.SEND_COINS_PREPARING,
                    },
                ];
                expectedData = { ...successResp };
                expect(await store.dispatch(operations.prepareSendCoins(
                    data.attr.recepient,
                    data.attr.amount,
                    data.attr.name,
                ))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });
        });

        describe("sendCoins()", () => {
            beforeEach(() => {
                initState.onchain.sendCoinsDetails = {
                    recepient: "foo",
                    amount: "bar",
                    name: "baz",
                };
                store = mockStore(initState);
                window.ipcClient
                    .withArgs("sendCoins")
                    .returns({
                        ok: true,
                        response: {
                            txid: "qux",
                        },
                    });
                fakeDB.onchainBuilder.returns({
                    insert: data.onchainBuilder.insert.returns({
                        values: data.onchainBuilder.values.returns({
                            execute: data.onchainBuilder.execute.returns(),
                        }),
                    }),
                });
            });

            it("no details", async () => {
                initState.onchain.sendCoinsDetails = null;
                store = mockStore(initState);
                expectedData = {
                    ...errorResp,
                    error: exceptions.SEND_COINS_DETAILS_REQUIRED,
                    f: "sendCoins",
                };
                expect(await store.dispatch(operations.sendCoins())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).not.to.be.called;
                expect(fakeDB.onchainBuilder).not.to.be.called;
            });

            it("ipc error", async () => {
                window.ipcClient
                    .withArgs("sendCoins")
                    .returns({
                        ok: false,
                    });
                expectedData = {
                    ...errorResp,
                    error: undefined,
                    f: "sendCoins",
                };
                expectedActions = [
                    {
                        payload: undefined,
                        type: types.SET_SEND_COINS_PAYMENT_DETAILS,
                    },
                ];
                expect(await store.dispatch(operations.sendCoins())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.onchainBuilder).not.to.be.called;
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith(
                    "sendCoins",
                    {
                        addr: "foo",
                        amount: "bar",
                    },
                );
            });

            it("success", async () => {
                fakeAccount.checkBalance.returns(fakeDispatchReturnSuccess);
                expectedData = {
                    ...successResp,
                    response: {
                        amount: "bar",
                        tx_hash: "qux",
                    },
                };
                expectedActions = [];
                expect(await store.dispatch(operations.sendCoins())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith(
                    "sendCoins",
                    {
                        addr: "foo",
                        amount: "bar",
                    },
                );
                expect(fakeDB.onchainBuilder).to.be.calledOnce;
                expect(data.onchainBuilder.insert).to.be.calledOnce;
                expect(data.onchainBuilder.insert).to.be.calledImmediatelyAfter(fakeDB.onchainBuilder);
                expect(data.onchainBuilder.values).to.be.calledOnce;
                expect(data.onchainBuilder.values).to.be.calledImmediatelyAfter(data.onchainBuilder.insert);
                expect(data.onchainBuilder.execute).to.be.calledOnce;
                expect(data.onchainBuilder.execute).to.be.calledImmediatelyAfter(data.onchainBuilder.values);
            });
        });

        describe("getOnchainHistory()", () => {
            let dbTxns;
            let chainTxns;

            beforeEach(() => {
                dbTxns = [
                    {
                        txHash: "foo",
                        amount: 100,
                        timeStamp: 200,
                        blockHash: 400,
                        blockHeight: 500,
                        status: "sended",
                    },
                    {
                        txHash: "bar",
                        amount: 102,
                        timeStamp: 202,
                        blockHash: 402,
                        blockHeight: 502,
                        status: "not-sended",
                        numConfirmations: 2,
                    },
                ];
                chainTxns = {
                    ok: true,
                    response: {
                        transactions: [
                            {
                                tx_hash: "baz",
                                amount: 100,
                                time_stamp: 200,
                                num_confirmations: 300,
                                block_hash: 400,
                                block_height: 500,
                                total_fees: 600,
                            },
                            {
                                tx_hash: "foo",
                                amount: 101,
                                time_stamp: 201,
                                num_confirmations: 301,
                                block_hash: 401,
                                block_height: 501,
                                total_fees: 601,
                            },
                        ],
                    },
                };
                fakeDB.onchainBuilder.returns({
                    getMany: data.onchainBuilder.getMany.returns(dbTxns),
                    insert: data.onchainBuilder.insert.returns({
                        values: data.onchainBuilder.values.returns({
                            execute: data.onchainBuilder.execute,
                        }),
                    }),
                    update: data.onchainBuilder.insert.returns({
                        set: data.onchainBuilder.values.returns({
                            where: data.onchainBuilder.execute.returns({
                                execute: data.onchainBuilder.execute,
                            }),
                        }),
                    }),
                });
                window.ipcClient
                    .withArgs("getTransactions")
                    .returns(chainTxns);
                fakeApp.sendSystemNotification.returns(fakeDispatchReturnSuccess);
            });

            it("throw error", async () => {
                data.error = "Some error with ipc";
                window.ipcClient
                    .withArgs("getTransactions")
                    .throws(data.error);
                expectedData = {
                    ...errorResp,
                    f: "getOnchainHistory",
                };
                expectedActions = [];
                expect(omit(await store.dispatch(operations.getOnchainHistory()), "error"))
                    .to.deep.equal(omit(expectedData, "error"));
            });

            it("ipc error", async () => {
                window.ipcClient
                    .withArgs("getTransactions")
                    .returns({
                        response: null,
                    });
                expectedData = {
                    ...errorResp,
                    f: "getOnchainHistory",
                };
                expectedActions = [];
                expect(omit(await store.dispatch(operations.getOnchainHistory()), "error"))
                    .to.deep.equal(omit(expectedData, "error"));
            });

            it("success", async () => {
                fakeApp.convertSatoshiToCurrentMeasure
                    .returns(fakeDispatchReturnSuccess);
                fakeDB.onchainBuilder.returns({
                    getMany: data.onchainBuilder.getMany.returns(dbTxns),
                    insert: data.onchainBuilder.insert.returns({
                        values: data.onchainBuilder.values.returns({
                            execute: data.onchainBuilder.execute,
                        }),
                    }),
                    update: data.onchainBuilder.update.returns({
                        set: data.onchainBuilder.set.returns({
                            where: data.onchainBuilder.where.returns({
                                execute: data.onchainBuilder.execute,
                            }),
                        }),
                    }),
                });
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: [
                            {
                                amount: 102,
                                block_hash: 402,
                                block_height: 502,
                                date: new Date(202 * 1000),
                                name: "Regular payment",
                                num_confirmations: 0,
                                status: "not-sended",
                                to: undefined,
                                total_fees: 0,
                                tx_hash: "bar",
                            },
                            {
                                amount: 101,
                                block_hash: 401,
                                block_height: 501,
                                date: new Date(201 * 1000),
                                name: "Regular payment",
                                num_confirmations: 301,
                                status: "sended",
                                to: undefined,
                                total_fees: 601,
                                tx_hash: "foo",
                            },
                            {
                                amount: 100,
                                block_hash: 400,
                                block_height: 500,
                                date: new Date(200 * 1000),
                                name: "Regular payment",
                                num_confirmations: 300,
                                status: "sended",
                                to: "-",
                                total_fees: 600,
                                tx_hash: "baz",
                            },
                        ],
                        type: types.SET_ONCHAIN_HISTORY,
                    },
                ];
                expect(await store.dispatch(operations.getOnchainHistory())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.onchainBuilder).to.be.calledThrice;
                expect(data.onchainBuilder.getMany).to.be.calledOnce;
                expect(data.onchainBuilder.getMany).to.be.calledAfter(fakeDB.onchainBuilder);
                expect(data.onchainBuilder.insert).to.be.calledOnce;
                expect(data.onchainBuilder.insert).to.be.calledAfter(fakeDB.onchainBuilder);
                expect(data.onchainBuilder.values).to.be.calledOnce;
                expect(data.onchainBuilder.values).to.be.calledImmediatelyAfter(data.onchainBuilder.insert);
                expect(data.onchainBuilder.values).to.be.calledWithExactly({
                    address: "-",
                    amount: 100,
                    blockHash: 400,
                    blockHeight: 500,
                    name: "Regular payment",
                    numConfirmations: 6,
                    status: "sended",
                    timeStamp: 200,
                    totalFees: 600,
                    txHash: "baz",
                });
                expect(data.onchainBuilder.update).to.be.calledOnce;
                expect(data.onchainBuilder.update).to.be.calledImmediatelyAfter(fakeDB.onchainBuilder);
                expect(data.onchainBuilder.set).to.be.calledOnce;
                expect(data.onchainBuilder.set).to.be.calledImmediatelyAfter(data.onchainBuilder.update);
                expect(data.onchainBuilder.set).to.be.calledWithExactly({
                    amount: 101,
                    blockHash: 401,
                    blockHeight: 501,
                    name: "Regular payment",
                    numConfirmations: 6,
                    status: "sended",
                    timeStamp: 201,
                    totalFees: 601,
                    txHash: "foo",
                });
                expect(data.onchainBuilder.where).to.be.calledOnce;
                expect(data.onchainBuilder.where).to.be.calledImmediatelyAfter(data.onchainBuilder.set);
                expect(data.onchainBuilder.where).to.be.calledWithExactly("txHash = :txID", { txID: "foo" });
                expect(data.onchainBuilder.execute).to.be.calledTwice;
                expect(data.onchainBuilder.execute).to.be.calledAfter(data.onchainBuilder.values);
                expect(data.onchainBuilder.execute).to.be.calledImmediatelyAfter(data.onchainBuilder.where);
                expect(fakeApp.sendSystemNotification).to.be.calledTwice;
            });
        });
    });
});
