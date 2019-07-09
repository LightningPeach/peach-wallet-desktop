import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import omit from "lodash/omit";

import { exceptions, consts } from "config";
import {
    lightningActions as actions,
    lightningTypes as types,
    lightningOperations as operations,
} from "modules/lightning";
import lightningReducer, { initStateLightning } from "modules/lightning/reducers";
import { accountOperations, accountTypes } from "modules/account";
import { appTypes } from "modules/app";
import { streamPaymentTypes } from "modules/streamPayments";
import { store as defaultStore } from "store/configure-store";
import { db, errorPromise, successPromise } from "additional";

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe("Lightning Unit Tests", () => {
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

        it("should create an error payment action", () => {
            expectedData.type = types.ERROR_PAYMENT;
            expect(actions.errorPayment(data)).to.deep.equal(expectedData);
        });

        it("should create an action to clear single payment details", () => {
            expectedData = {
                type: types.CLEAR_SINGLE_PAYMENT_DETAILS,
            };
            expect(actions.clearSinglePaymentDetails()).to.deep.equal(expectedData);
        });

        it("should create a payment preparing action", () => {
            data = {
                lightningID: "foo",
                amount: "bar",
                comment: "baz",
                pay_req: "qux",
                pay_req_decoded: "goofy",
                name: "quux",
                contact_name: "corge",
                fee: "uier",
            };
            expectedData = {
                payload: data,
                type: types.PAYMENT_PREPARING,
            };
            expect(actions.paymentPreparing(
                data.lightningID,
                data.amount,
                data.comment,
                data.pay_req,
                data.pay_req_decoded,
                data.name,
                data.contact_name,
                data.fee,
            )).to.deep.equal(expectedData);
        });

        it("should create an action to set pending status", () => {
            expectedData = {
                type: types.PENDING_PAYMENT,
            };
            expect(actions.pendingPayment()).to.deep.equal(expectedData);
        });

        it("should create an action to set history", () => {
            expectedData.type = types.SET_HISTORY;
            expect(actions.setHistory(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set success status", () => {
            expectedData = {
                type: types.SUCCESS_PAYMENT,
            };
            expect(actions.successPayment()).to.deep.equal(expectedData);
        });

        it("should create an action to create payment request", () => {
            data = {
                paymentRequest: "foo",
                paymentRequestAmount: "bar",
            };
            expectedData = {
                payload: data,
                type: types.PAYMENT_REQUEST_CREATOR,
            };
            expect(actions.paymentRequestCreator(
                data.paymentRequest,
                data.paymentRequestAmount,
            )).to.deep.equal(expectedData);
        });

        it("should create an error payment request action", () => {
            expectedData.type = types.PAYMENT_REQUEST_ERROR_CREATOR;
            expect(actions.paymentRequestErrorCreator(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set external payment request", () => {
            expectedData.type = types.SET_EXTERNAL_PAYMENT_REQUEST;
            expect(actions.setExternalPaymentRequest(data)).to.deep.equal(expectedData);
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
            expectedData = JSON.parse(JSON.stringify(initStateLightning));
            state = undefined;
        });

        it("should return the initial state", () => {
            expect(lightningReducer(state, {})).to.deep.equal(expectedData);
        });

        it("should handle LOGOUT_ACCOUNT action", () => {
            action = {
                type: accountTypes.LOGOUT_ACCOUNT,
            };
            state = JSON.parse(JSON.stringify(initStateLightning));
            state.paymentDetails = ["foo"];
            state.paymentRequestError = "bar";
            expect(lightningReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle CLEAR_SINGLE_PAYMENT_DETAILS action", () => {
            action = {
                type: types.CLEAR_SINGLE_PAYMENT_DETAILS,
            };
            state = JSON.parse(JSON.stringify(initStateLightning));
            state.paymentDetails = ["foo"];
            expect(lightningReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle ERROR_PAYMENT action", () => {
            action.type = types.ERROR_PAYMENT;
            expectedData.paymentStatus = "failed";
            expectedData.paymentStatusDetails = data;
            expect(lightningReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle PAYMENT_PREPARING action", () => {
            action.type = types.PAYMENT_PREPARING;
            expectedData.paymentDetails = [data];
            expect(lightningReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle PENDING_PAYMENT action", () => {
            action = {
                type: types.PENDING_PAYMENT,
            };
            expectedData.paymentStatus = "pending";
            expectedData.paymentStatusDetails = "";
            expect(lightningReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_HISTORY action", () => {
            action.type = types.SET_HISTORY;
            expectedData.history = data;
            expect(lightningReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SUCCESS_PAYMENT action", () => {
            action = {
                type: types.SUCCESS_PAYMENT,
            };
            expectedData.paymentStatus = "success";
            expectedData.paymentStatusDetails = "";
            expect(lightningReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle PAYMENT_REQUEST_ERROR_CREATOR action", () => {
            action.type = types.PAYMENT_REQUEST_ERROR_CREATOR;
            expectedData.paymentRequestError = data;
            expect(lightningReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle PAYMENT_REQUEST_CREATOR action", () => {
            action.type = types.PAYMENT_REQUEST_CREATOR;
            expectedData = {
                ...expectedData,
                ...action.payload,
                paymentRequestError: null,
            };
            expect(lightningReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_EXTERNAL_PAYMENT_REQUEST action", () => {
            action.type = types.SET_EXTERNAL_PAYMENT_REQUEST;
            expectedData.externalPaymentRequest = data;
            expect(lightningReducer(state, action)).to.deep.equal(expectedData);
        });
    });

    describe("Operations tests", () => {
        const lightningID = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
        const amount = 500;
        let fakeDB;
        let fakeAccount;
        let data;
        let store;
        let initState;
        let expectedActions;
        let expectedData;
        let errorResp;
        let successResp;
        let fakeDispatchReturnError;
        let fakeDispatchReturnSuccess;
        let fakeStore;

        beforeEach(async () => {
            errorResp = await errorPromise(undefined, { name: undefined });
            successResp = await successPromise();
            fakeDispatchReturnError = () => errorResp;
            fakeDispatchReturnSuccess = () => successResp;
            window.ipcClient.resetHistory();
            window.ipcRenderer.send.resetHistory();
            fakeDB = sinon.stub(db);
            fakeAccount = sinon.stub(accountOperations);
            fakeStore = sinon.stub(defaultStore);
            data = {
                lightningBuilder: {
                    getMany: sinon.stub(),
                    insert: sinon.stub(),
                    values: sinon.stub(),
                    execute: sinon.stub(),
                },
                streamBuilder: {
                    update: sinon.stub(),
                    set: sinon.stub(),
                    where: sinon.stub(),
                    execute: sinon.stub(),
                    leftJoinAndSelect: sinon.stub(),
                    getMany: sinon.stub(),
                    leftJoinAndSelectAttr: ["stream.parts", "stream_part"],

                },
            };
            initState = {
                lightning: initStateLightning,
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
            let invoices;
            let payments;
            let dbPayments;
            let dbStreams;

            beforeEach(() => {
                fakeStore.dispatch = store.dispatch;
                fakeStore.getState = store.getState;
            });

            it("invoicesUpdate()", async () => {
                invoices = [
                    {
                        settled: true,
                        payment_request: "foo",
                        memo: "bar",
                        value: 100,
                        creation_date: 200,
                    },
                ];
                payments = [
                    {
                        payment_hash: "baz",
                        path: ["baz"],
                        value: 303,
                        creation_date: 203,
                    },
                ];
                dbPayments = [];
                dbStreams = [];
                fakeDB.lightningBuilder.returns({
                    getMany: data.lightningBuilder.getMany.returns(dbPayments),
                });
                fakeDB.streamBuilder.returns({
                    leftJoinAndSelect: data.streamBuilder.leftJoinAndSelect.returns({
                        getMany: data.streamBuilder.getMany.returns(dbStreams),
                    }),
                });
                window.ipcClient
                    .withArgs("listInvoices")
                    .returns({
                        ok: true,
                        response: {
                            first_index_offset: 1,
                            invoices,
                            last_index_offset: 2,
                        },
                    })
                    .withArgs("decodePayReq")
                    .returns({
                        ok: true,
                        response: {
                            destination: "corge",
                            payment_hash: "uier",
                        },
                    })
                    .withArgs("listPayments")
                    .returns({
                        ok: true,
                        response: {
                            payments,
                        },
                    });
                fakeAccount.checkBalance.returns(fakeDispatchReturnSuccess);
                window.ipcRenderer.send("invoices-update");
                expect(window.ipcRenderer.on).to.be.called.calledWith("transactions-update");
                expect(fakeAccount.checkBalance).to.be.calledOnce;
            });
        });

        it("subscribeInvoices()", async () => {
            expect(await store.dispatch(operations.subscribeInvoices())).to.deep.equal(expectedData);
            expect(store.getActions()).to.deep.equal(expectedActions);
            expect(window.ipcRenderer.send).to.be.calledWith("subscribeInvoices");
            expect(window.ipcRenderer.send).to.be.calledOnce;
        });

        it("unSubscribeInvoices()", async () => {
            expect(await store.dispatch(operations.unSubscribeInvoices())).to.deep.equal(expectedData);
            expect(store.getActions()).to.deep.equal(expectedActions);
            expect(window.ipcClient).to.be.calledWith("unsubscribeInvoices");
            expect(window.ipcClient).to.be.calledOnce;
        });

        describe("Modal Windows", () => {
            beforeEach(() => {
                expectedData = { type: appTypes.SET_MODAL_STATE };
            });

            it("openPaymentDetailsModal()", async () => {
                expectedData.payload = types.MODAL_STATE_PAYMENT_DETAILS;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.openPaymentDetailsModal())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("channelWarningModal()", async () => {
                expectedData.payload = types.MODAL_STATE_CHANNEL_WARNING;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.channelWarningModal())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });
        });

        it("pendingPayment()", async () => {
            expectedData = {
                type: types.PENDING_PAYMENT,
            };
            expectedActions = [expectedData];
            expect(await store.dispatch(operations.pendingPayment())).to.deep.equal(expectedData);
            expect(store.getActions()).to.deep.equal(expectedActions);
        });

        it("clearSinglePayment()", async () => {
            expectedActions = [
                {
                    type: types.CLEAR_SINGLE_PAYMENT_DETAILS,
                },
            ];
            expect(await store.dispatch(operations.clearSinglePayment())).to.deep.equal(expectedData);
            expect(store.getActions()).to.deep.equal(expectedActions);
        });

        describe("decodePaymentRequest()", () => {
            beforeEach(() => {
                data.attr = "foo";
                window.ipcClient
                    .withArgs("decodePayReq")
                    .returns({
                        ok: true,
                        response: "bar",
                    });
            });

            it("ipc error", async () => {
                window.ipcClient
                    .withArgs("decodePayReq")
                    .returns({
                        ok: false,
                        error: "bar",
                    });
                expectedData = {
                    ...errorResp,
                    error: "bar",
                    f: "decodePaymentRequest",
                };
                expect(await store.dispatch(operations.decodePaymentRequest(data.attr))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith(
                    "decodePayReq",
                    {
                        pay_req: data.attr,
                    },
                );
            });

            it("success", async () => {
                expectedData = {
                    ...successResp,
                    response: "bar",
                };
                expect(await store.dispatch(operations.decodePaymentRequest(data.attr))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith(
                    "decodePayReq",
                    {
                        pay_req: data.attr,
                    },
                );
            });
        });

        describe("generatePaymentRequest()", () => {
            beforeEach(() => {
                initState.account = {
                    bitcoinMeasureMultiplier: 1,
                };
                store = mockStore(initState);
                window.ipcClient
                    .withArgs("addInvoice")
                    .returns({
                        ok: true,
                        response: {
                            payment_request: "bar",
                        },
                    });
            });

            it("ipc error", async () => {
                window.ipcClient
                    .withArgs("addInvoice")
                    .returns({
                        ok: false,
                        error: "bar",
                    });
                expectedData = {
                    ...errorResp,
                    error: "bar",
                    f: "generatePaymentRequest",
                };
                expectedActions = [
                    {
                        payload: "bar",
                        type: types.PAYMENT_REQUEST_ERROR_CREATOR,
                    },
                ];
                expect(await store.dispatch(operations.generatePaymentRequest(amount))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith(
                    "addInvoice",
                    {
                        value: amount,
                    },
                );
            });

            it("success", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: {
                            paymentRequest: "bar",
                            paymentRequestAmount: amount,
                        },
                        type: types.PAYMENT_REQUEST_CREATOR,
                    },
                ];
                expect(await store.dispatch(operations.generatePaymentRequest(amount))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith(
                    "addInvoice",
                    {
                        value: amount,
                    },
                );
            });
        });

        describe("getLightningFee()", () => {
            it("ipc error", async () => {
                window.ipcClient
                    .withArgs("queryRoutes")
                    .returns({
                        ok: false,
                        error: "bar",
                    });
                expectedData = {
                    ...errorResp,
                    error: "bar",
                    f: "getLightningFee",
                };
                expect(await store.dispatch(operations.getLightningFee(
                    lightningID,
                    amount,
                ))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith(
                    "queryRoutes",
                    {
                        amt: amount,
                        pub_key: lightningID,
                        num_routes: consts.LIGHTNING_NUM_ROUTES,
                    },
                );
            });

            it("no routes", async () => {
                window.ipcClient
                    .withArgs("queryRoutes")
                    .returns({
                        ok: true,
                        response: {
                            routes: [],
                        },
                    });
                expectedData = {
                    ...successResp,
                    response: {
                        fee: {
                            avg: 0,
                            max: 0,
                            min: 0,
                        },
                    },
                };
                expect(await store.dispatch(operations.getLightningFee(
                    lightningID,
                    amount,
                ))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith(
                    "queryRoutes",
                    {
                        amt: amount,
                        pub_key: lightningID,
                        num_routes: consts.LIGHTNING_NUM_ROUTES,
                    },
                );
            });

            it("success", async () => {
                window.ipcClient
                    .withArgs("queryRoutes")
                    .returns({
                        ok: true,
                        response: {
                            routes: [
                                {
                                    total_fees: 100,
                                    extra: "foo",
                                },
                                {
                                    total_fees: 200,
                                    extra: "bar",
                                },
                            ],
                        },
                    });
                expectedData = {
                    ...successResp,
                    response: {
                        fee: {
                            avg: 150,
                            max: 200,
                            min: 100,
                        },
                    },
                };
                expect(await store.dispatch(operations.getLightningFee(
                    lightningID,
                    amount,
                ))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith(
                    "queryRoutes",
                    {
                        amt: amount,
                        pub_key: lightningID,
                        num_routes: consts.LIGHTNING_NUM_ROUTES,
                    },
                );
            });
        });

        describe("preparePayment()", () => {
            it("ipc error", async () => {
                window.ipcClient
                    .withArgs("queryRoutes")
                    .returns({
                        ok: false,
                        error: "bar",
                    });
                expectedData = {
                    ...errorResp,
                    error: "bar",
                    f: "preparePayment",
                };
                expect(await store.dispatch(operations.preparePayment(
                    lightningID,
                    amount,
                    "foo",
                ))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("getLihtningFee() error", async () => {
                window.ipcClient
                    .withArgs("queryRoutes")
                    .returns({
                        ok: true,
                        response: {
                            routes: [
                                {
                                    total_fees: 100,
                                    extra: "foo",
                                },
                                {
                                    total_fees: 200,
                                    extra: "bar",
                                },
                            ],
                        },
                    });
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: {
                            amount,
                            comment: "foo",
                            contact_name: null,
                            fee: {
                                avg: 150,
                                max: 200,
                                min: 100,
                            },
                            lightningID,
                            name: "Payment",
                            pay_req: null,
                            pay_req_decoded: null,
                        },
                        type: types.PAYMENT_PREPARING,
                    },
                ];
                expect(await store.dispatch(operations.preparePayment(
                    lightningID,
                    amount,
                    "foo",
                ))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });
        });

        describe("pay()", () => {
            beforeEach(() => {
                data.attr = {
                    pay_req: "foo",
                    name: "corge",
                };
                fakeDB.lightningBuilder.returns({
                    insert: data.lightningBuilder.insert.returns({
                        values: data.lightningBuilder.values.returns({
                            execute: data.lightningBuilder.execute,
                        }),
                    }),
                });
                fakeAccount.checkBalance.returns(fakeDispatchReturnSuccess);
                window.ipcClient
                    .withArgs("sendPayment")
                    .returns({
                        ok: true,
                        payment_hash: "bar",
                    });
            });

            it("ipc error", async () => {
                window.ipcClient
                    .withArgs("sendPayment")
                    .returns({
                        ok: false,
                        error: "bar",
                    });
                expectedData = {
                    ...errorResp,
                    error: "bar",
                    f: "pay",
                };
                expectedActions = [
                    {
                        payload: "bar",
                        type: types.ERROR_PAYMENT,
                    },
                ];
                expect(await store.dispatch(operations.pay(data.attr))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith(
                    "sendPayment",
                    {
                        details: {
                            payment_request: data.attr.pay_req,
                        },
                        isPayReq: true,
                    },
                );
                expect(fakeDB.lightningBuilder).not.to.be.calledOnce;
            });

            it("success", async () => {
                data.attr.amount = "baz";
                expectedData = {
                    ...successResp,
                    response: {
                        amount: "baz",
                        payment_hash: "bar",
                    },
                };
                expectedActions = [
                    {
                        type: types.SUCCESS_PAYMENT,
                    },
                ];
                expect(await store.dispatch(operations.pay(data.attr))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith(
                    "sendPayment",
                    {
                        details: {
                            payment_request: data.attr.pay_req,
                        },
                        isPayReq: true,
                    },
                );
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.lightningBuilder).to.be.calledOnce;
                expect(data.lightningBuilder.insert).to.be.calledOnce;
                expect(data.lightningBuilder.insert).to.be.calledImmediatelyAfter(fakeDB.lightningBuilder);
                expect(data.lightningBuilder.values).to.be.calledOnce;
                expect(data.lightningBuilder.values).to.be.calledImmediatelyAfter(data.lightningBuilder.insert);
                expect(data.lightningBuilder.values).to.be.calledWith({
                    name: data.attr.name,
                    paymentHash: "bar",
                });
                expect(data.lightningBuilder.execute).to.be.calledOnce;
                expect(data.lightningBuilder.execute).to.be.calledImmediatelyAfter(data.lightningBuilder.values);
            });
        });

        describe("addInvoiceRemote()", () => {
            beforeEach(() => {
                initState.account = { lightningID: "uier" };
                store = mockStore(initState);
                window.ipcClient
                    .withArgs("addInvoiceRemote")
                    .returns({
                        ok: true,
                    });
            });

            it("ipc error", async () => {
                window.ipcClient
                    .withArgs("addInvoiceRemote")
                    .returns({
                        ok: false,
                        error: "foo",
                    });
                expectedData = {
                    ...errorResp,
                    error: "foo",
                    f: "addInvoiceRemote",
                };
                expect(await store.dispatch(operations.addInvoiceRemote(
                    lightningID,
                    amount,
                ))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith(
                    "addInvoiceRemote",
                    {
                        lightning_id: lightningID,
                        memo: "uier",
                        value: `${amount}`,
                    },
                );
            });

            it("ipc error - invalid json response handle", async () => {
                window.ipcClient
                    .withArgs("addInvoiceRemote")
                    .returns({
                        ok: false,
                        error: "invalid json response body",
                    });
                expectedData = {
                    ...errorResp,
                    error: exceptions.REMOTE_OFFLINE,
                    f: "addInvoiceRemote",
                };
                expect(await store.dispatch(operations.addInvoiceRemote(
                    lightningID,
                    amount,
                ))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith(
                    "addInvoiceRemote",
                    {
                        lightning_id: lightningID,
                        memo: "uier",
                        value: `${amount}`,
                    },
                );
            });

            it("success", async () => {
                expectedData = {
                    ok: true,
                };
                expect(await store.dispatch(operations.addInvoiceRemote(
                    lightningID,
                    amount,
                ))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith(
                    "addInvoiceRemote",
                    {
                        lightning_id: lightningID,
                        memo: "uier",
                        value: `${amount}`,
                    },
                );
            });
        });

        describe("makePayment()", () => {
            beforeEach(() => {
                initState = {
                    account: {
                        lightningID,
                    },
                    lightning: {
                        paymentDetails: [
                            {
                                pay_req: "foo",
                                amount: "bar",
                                comment: "baz",
                                lightningID: "qux",
                                name: "quux",
                                pay_req_decoded: null,
                            },
                        ],
                    },
                };
                store = mockStore(initState);
                window.ipcClient
                    .withArgs("addInvoiceRemote")
                    .returns({
                        ok: true,
                    })
                    .withArgs("sendPayment")
                    .returns({
                        ok: true,
                        payment_hash: "uier",
                    });
                fakeDB.lightningBuilder.returns({
                    insert: data.lightningBuilder.insert.returns({
                        values: data.lightningBuilder.values.returns({
                            execute: data.lightningBuilder.execute,
                        }),
                    }),
                });
                fakeAccount.checkBalance.returns(successResp);
            });

            it("payment request present", async () => {
                expectedData = {
                    ...successResp,
                    response: {
                        amount: "bar",
                        payment_hash: "uier",
                    },
                };
                expectedActions = [
                    {
                        type: types.PENDING_PAYMENT,
                    },
                    {
                        type: types.SUCCESS_PAYMENT,
                    },
                    { ...successResp },
                ];
                expect(await store.dispatch(operations.makePayment(
                    lightningID,
                    amount,
                ))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith(
                    "sendPayment",
                    {
                        details: {
                            payment_request: "foo",
                        },
                        isPayReq: true,
                    },
                );
                expect(fakeDB.lightningBuilder).to.be.calledOnce;
                expect(data.lightningBuilder.insert).to.be.calledOnce;
                expect(data.lightningBuilder.insert).to.be.calledImmediatelyAfter(fakeDB.lightningBuilder);
                expect(data.lightningBuilder.values).to.be.calledOnce;
                expect(data.lightningBuilder.values).to.be.calledImmediatelyAfter(data.lightningBuilder.insert);
                expect(data.lightningBuilder.values).to.be.calledWith({
                    name: "quux",
                    paymentHash: "uier",
                });
                expect(data.lightningBuilder.execute).to.be.calledOnce;
                expect(data.lightningBuilder.execute).to.be.calledImmediatelyAfter(data.lightningBuilder.values);
            });

            it("payment request with updated amount", async () => {
                initState.lightning.paymentDetails[0].amount = "fooNew";
                initState.lightning.paymentDetails[0].pay_req_decoded = {
                    destination: "goofy",
                    cltv_expiry: "mickey",
                    payment_hash: "donald",
                };
                store = mockStore(initState);
                expectedData = {
                    ...successResp,
                    response: {
                        amount: "fooNew",
                        payment_hash: "uier",
                    },
                };
                expectedActions = [
                    {
                        type: types.PENDING_PAYMENT,
                    },
                    {
                        type: types.SUCCESS_PAYMENT,
                    },
                    { ...successResp },
                ];
                expect(await store.dispatch(operations.makePayment(
                    lightningID,
                    amount,
                ))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith(
                    "sendPayment",
                    {
                        details: {
                            amt: "fooNew",
                            dest_string: "goofy",
                            final_cltv_delta: "mickey",
                            payment_hash_string: "donald",
                        },
                        isPayReq: false,
                    },
                );
                expect(fakeDB.lightningBuilder).to.be.calledOnce;
                expect(data.lightningBuilder.insert).to.be.calledOnce;
                expect(data.lightningBuilder.insert).to.be.calledImmediatelyAfter(fakeDB.lightningBuilder);
                expect(data.lightningBuilder.values).to.be.calledOnce;
                expect(data.lightningBuilder.values).to.be.calledImmediatelyAfter(data.lightningBuilder.insert);
                expect(data.lightningBuilder.values).to.be.calledWith({
                    name: "quux",
                    paymentHash: "uier",
                });
                expect(data.lightningBuilder.execute).to.be.calledOnce;
                expect(data.lightningBuilder.execute).to.be.calledImmediatelyAfter(data.lightningBuilder.values);
            });

            it("no payment request -> addInvoiceRemote error", async () => {
                initState.lightning.paymentDetails[0].pay_req = null;
                store = mockStore(initState);
                window.ipcClient
                    .withArgs("addInvoiceRemote")
                    .returns({
                        ok: false,
                        error: "foo",
                    });
                expectedData = {
                    ...errorResp,
                    error: "foo",
                    f: "makePayment",
                };
                expectedActions = [
                    {
                        type: types.PENDING_PAYMENT,
                    },
                    {
                        payload: "foo",
                        type: types.ERROR_PAYMENT,
                    },
                    { ...successResp },
                ];
                expect(await store.dispatch(operations.makePayment(
                    data.lightningID,
                    data.amount,
                ))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith(
                    "addInvoiceRemote",
                    {
                        lightning_id: "qux",
                        memo: lightningID,
                        value: "bar",
                    },
                );
                expect(fakeDB.lightningBuilder).not.to.be.called;
            });

            it("no payment request -> success", async () => {
                initState.lightning.paymentDetails[0].pay_req = null;
                store = mockStore(initState);
                window.ipcClient
                    .withArgs("addInvoiceRemote")
                    .returns({
                        ok: true,
                        response: {
                            payment_request: "uier",
                        },
                    });
                expectedData = {
                    ...successResp,
                    response: {
                        amount: "bar",
                        payment_hash: "uier",
                    },
                };
                expectedActions = [
                    {
                        type: types.PENDING_PAYMENT,
                    },
                    {
                        type: types.SUCCESS_PAYMENT,
                    },
                    { ...successResp },
                ];
                expect(await store.dispatch(operations.makePayment(
                    data.lightningID,
                    data.amount,
                ))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledTwice;
                expect(window.ipcClient).to.be.calledWith(
                    "addInvoiceRemote",
                    {
                        lightning_id: "qux",
                        memo: lightningID,
                        value: "bar",
                    },
                );
                expect(window.ipcClient).to.be.calledWith(
                    "sendPayment",
                    {
                        details: {
                            payment_request: "uier",
                        },
                        isPayReq: true,
                    },
                );
                expect(fakeDB.lightningBuilder).to.be.calledOnce;
                expect(data.lightningBuilder.insert).to.be.calledOnce;
                expect(data.lightningBuilder.insert).to.be.calledImmediatelyAfter(fakeDB.lightningBuilder);
                expect(data.lightningBuilder.values).to.be.calledOnce;
                expect(data.lightningBuilder.values).to.be.calledImmediatelyAfter(data.lightningBuilder.insert);
                expect(data.lightningBuilder.values).to.be.calledWith({
                    name: "quux",
                    paymentHash: "uier",
                });
                expect(data.lightningBuilder.execute).to.be.calledOnce;
                expect(data.lightningBuilder.execute).to.be.calledImmediatelyAfter(data.lightningBuilder.values);
            });
        });

        describe("getInvoices()", () => {
            let invoices;

            beforeEach(() => {
                invoices = [
                    {
                        settled: false,
                        state: 0,
                    },
                    {
                        settled: true,
                        state: 1,
                        payment_request: "foo",
                        memo: "bar",
                        value: 100,
                        creation_date: 200,
                    },
                    {
                        settled: true,
                        state: 1,
                        payment_request: "bar",
                        memo: "stream_payment_baz",
                        value: 101,
                        creation_date: 201,
                    },
                ];
                window.ipcClient
                    .withArgs("listInvoices")
                    .returns({
                        ok: true,
                        response: {
                            first_index_offset: 1,
                            invoices,
                            last_index_offset: 3,
                        },
                    })
                    .withArgs("decodePayReq")
                    .returns({
                        ok: true,
                        response: {
                            destination: "corge",
                            payment_hash: "uier",
                        },
                    });
            });

            it("ipc error", async () => {
                window.ipcClient
                    .withArgs("listInvoices")
                    .returns({
                        ok: false,
                    });
                expectedData = [];
                expect(await operations.getInvoices()).to.deep.equal(expectedData);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("listInvoices");
            });

            it("success", async () => {
                expectedData = [
                    {
                        amount: 100,
                        date: 200000,
                        lightningID: "corge",
                        memo: "bar",
                        name: "Incoming payment",
                        payment_hash: "uier",
                        type: "invoice",
                    },
                    {
                        amount: 101,
                        date: 201000,
                        lightningID: "corge",
                        memo: "stream_payment_baz",
                        name: consts.INCOMING_RECURRING_NAME,
                        payment_hash: "uier",
                        type: "stream",
                        currency: "BTC",
                        delay: -1,
                        partsPaid: 1,
                        price: 101,
                        status: streamPaymentTypes.STREAM_PAYMENT_FINISHED,
                        totalAmount: 101,
                        totalParts: 1,
                    },
                ];
                expect(await operations.getInvoices()).to.deep.equal(expectedData);
                expect(window.ipcClient).to.be.calledThrice;
                expect(window.ipcClient).to.be.calledWith("listInvoices");
                expect(window.ipcClient).to.be.calledWith("decodePayReq", { pay_req: "foo" });
                expect(window.ipcClient).to.be.calledWith("decodePayReq", { pay_req: "bar" });
            });
        });

        describe("getPayments()", () => {
            let payments;
            let dbPayments;
            let dbStreams;

            beforeEach(() => {
                payments = [
                    {
                        payment_hash: "1",
                        creation_date: 201,
                        value: 301,
                        path: ["foo"],
                    },
                    {
                        payment_hash: "2",
                        creation_date: 202,
                        value: 302,
                        path: ["bar"],
                    },
                    {
                        payment_hash: "baz",
                        path: ["baz"],
                        value: 303,
                        creation_date: 203,
                    },
                ];
                dbPayments = [
                    {
                        paymentHash: "2",
                        name: "name-bar",
                    },
                ];
                dbStreams = [
                    {
                        id: 103,
                        parts: [{ payment_hash: "no-bar" }],
                        status: streamPaymentTypes.STREAM_PAYMENT_FINISHED,
                        partsPaid: 0,
                    },
                    {
                        id: 101,
                        status: streamPaymentTypes.STREAM_PAYMENT_PAUSED,
                        parts: [{ payment_hash: "1" }],
                        name: "name-foo",
                        partsPaid: 0,
                    },
                    {
                        id: 102,
                        status: streamPaymentTypes.STREAM_PAYMENT_FINISHED,
                        parts: [{ payment_hash: "2" }],
                        name: "name-bar",
                        price: 502,
                        date: 602,
                        lightningID: "qux",
                        partsPaid: 0,
                    },
                    {
                        id: 104,
                        status: streamPaymentTypes.STREAM_PAYMENT_FINISHED,
                        parts: [{ payment_hash: "4" }],
                        name: "name-quux",
                        price: 504,
                        date: 604,
                        lightningID: "quux",
                        partsPaid: 0,
                    },
                ];
                window.ipcClient
                    .withArgs("listPayments")
                    .returns({
                        ok: true,
                        response: {
                            payments,
                        },
                    });
                fakeDB.lightningBuilder.returns({
                    getMany: data.lightningBuilder.getMany.returns(dbPayments),
                });
                fakeDB.streamBuilder.returns({
                    leftJoinAndSelect: data.streamBuilder.leftJoinAndSelect.returns({
                        getMany: data.streamBuilder.getMany.returns(dbStreams),
                    }),
                    update: data.streamBuilder.update.returns({
                        set: data.streamBuilder.set.returns({
                            where: data.streamBuilder.where.returns({
                                execute: data.streamBuilder.execute,
                            }),
                        }),
                    }),
                });
            });

            it("ipc error", async () => {
                window.ipcClient
                    .withArgs("listPayments")
                    .returns({
                        ok: false,
                    });
                expectedData = [];
                expect(await operations.getPayments()).to.deep.equal(expectedData);
                expect(fakeDB.lightningBuilder).not.to.be.called;
                expect(fakeDB.streamBuilder).not.to.be.called;
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("listPayments");
            });

            it("success", async () => {
                expectedData = [
                    {
                        amount: -303,
                        date: 203000,
                        lightningID: "baz",
                        name: "Outgoing payment",
                        payment_hash: "baz",
                        type: "payment",
                    },
                    {
                        price: 502,
                        date: 602,
                        lightningID: "qux",
                        name: "name-bar",
                        type: "stream",
                        id: 102,
                        partsPaid: 1,
                        status: streamPaymentTypes.STREAM_PAYMENT_FINISHED,
                    },
                    {
                        status: streamPaymentTypes.STREAM_PAYMENT_FINISHED,
                        partsPaid: 0,
                        id: 103,
                        type: "stream",
                    },
                    {
                        id: 104,
                        price: 504,
                        date: 604,
                        lightningID: "quux",
                        name: "name-quux",
                        status: streamPaymentTypes.STREAM_PAYMENT_FINISHED,
                        partsPaid: 0,
                        type: "stream",
                    },
                ];
                expect(await operations.getPayments()).to.deep.equal(expectedData);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("listPayments");
                expect(data.streamBuilder.update).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.calledOnce;
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set)
                    .to.be.calledWithExactly({ partsPaid: 1 });
                expect(data.streamBuilder.where).to.be.calledOnce;
                expect(data.streamBuilder.where).to.be.calledImmediatelyAfter(data.streamBuilder.set);
                expect(data.streamBuilder.where).to.be.calledWithExactly("id = :id", { id: 102 });
                expect(data.streamBuilder.execute).to.be.calledOnce;
                expect(data.streamBuilder.execute).to.be.calledImmediatelyAfter(data.streamBuilder.where);
            });
        });

        describe("getHistory()", () => {
            let invoices;
            let payments;
            let dbPayments;
            let dbStreams;

            beforeEach(() => {
                invoices = [
                    {
                        settled: true,
                        state: 1,
                        payment_request: "foo",
                        memo: "bar",
                        value: 100,
                        creation_date: 200,
                    },
                ];
                payments = [
                    {
                        payment_hash: "baz",
                        path: ["baz"],
                        value: 303,
                        creation_date: 203,
                    },
                ];
                dbPayments = [];
                dbStreams = [];
                fakeDB.lightningBuilder.returns({
                    getMany: data.lightningBuilder.getMany.returns(dbPayments),
                });
                fakeDB.streamBuilder.returns({
                    leftJoinAndSelect: data.streamBuilder.leftJoinAndSelect.returns({
                        getMany: data.streamBuilder.getMany.returns(dbStreams),
                    }),
                });
                window.ipcClient
                    .withArgs("listInvoices")
                    .returns({
                        ok: true,
                        response: {
                            first_index_offset: 1,
                            invoices,
                            last_index_offset: 2,
                        },
                    })
                    .withArgs("decodePayReq")
                    .returns({
                        ok: true,
                        response: {
                            destination: "corge",
                            payment_hash: "uier",
                        },
                    })
                    .withArgs("listPayments")
                    .returns({
                        ok: true,
                        response: {
                            payments,
                        },
                    });
            });

            it("getPayments error", async () => {
                window.ipcClient
                    .withArgs("listPayments")
                    .throws(new Error("foo"));
                expectedData = {
                    ...errorResp,
                    f: "getHistory",
                };
                expect(omit(await store.dispatch(operations.getHistory()), "error"))
                    .to.deep.equal(omit(expectedData, "error"));
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("success", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: [
                            {
                                amount: -303,
                                date: 203000,
                                lightningID: "baz",
                                name: "Outgoing payment",
                                payment_hash: "baz",
                                type: "payment",
                            },
                            {
                                amount: 100,
                                date: 200000,
                                lightningID: "corge",
                                memo: "bar",
                                name: "Incoming payment",
                                payment_hash: "uier",
                                type: "invoice",
                            },
                        ],
                        type: types.SET_HISTORY,
                    },
                ];
                expect(await store.dispatch(operations.getHistory())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });
        });

        describe("getPaginatedInvoices()", () => {
            beforeEach(() => {
                window.ipcClient
                    .withArgs("listInvoices")
                    .returns({
                        ok: true,
                        response: {
                            first_index_offset: 1,
                            invoices: [{ foo: "bar" }],
                            last_index_offset: 3,
                        },
                    });
            });

            it("ipc error", async () => {
                window.ipcClient
                    .withArgs("listInvoices")
                    .returns({
                        ok: false,
                    });
                expectedData = [];
                expect(await operations.getPaginatedInvoices()).to.deep.equal(expectedData);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("listInvoices");
            });

            it("success", async () => {
                expectedData = [{ foo: "bar" }];
                expect(await operations.getPaginatedInvoices()).to.deep.equal(expectedData);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("listInvoices");
            });

            it("success 2 page", async () => {
                window.ipcClient
                    .withArgs("listInvoices")
                    .onCall(0)
                    .returns({
                        ok: true,
                        response: {
                            first_index_offset: 1,
                            invoices: [{ foo: "bar" }],
                            last_index_offset: consts.DEFAULT_MAX_INVOICES,
                        },
                    })
                    .onCall(1)
                    .returns({
                        ok: true,
                        response: {
                            first_index_offset: consts.DEFAULT_MAX_INVOICES + 1,
                            invoices: [{ foo: "bar" }],
                            last_index_offset: consts.DEFAULT_MAX_INVOICES + 2,
                        },
                    });
                expectedData = [{ foo: "bar" }, { foo: "bar" }];
                expect(await operations.getPaginatedInvoices()).to.deep.equal(expectedData);
                expect(window.ipcClient).to.be.calledTwice;
                expect(window.ipcClient).to.be.calledWith("listInvoices");
            });
        });
    });
});
