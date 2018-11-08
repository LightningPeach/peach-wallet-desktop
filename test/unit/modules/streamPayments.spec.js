import omit from "lodash/omit";

import "../../utils";
import { statusCodes } from "config";
import {
    streamPaymentActions as actions,
    streamPaymentTypes as types,
    streamPaymentOperations as operations,
    streamPaymentSelectors as selectors,
} from "modules/streamPayments";
import streamPaymentReducer, { initStateStreamPayment } from "modules/streamPayments/reducers";
import { accountOperations, accountTypes } from "modules/account";
import { appTypes, appOperations } from "modules/app";
import { channelsOperations } from "modules/channels";
import { notificationsTypes } from "modules/notifications";
import { lightningOperations } from "modules/lightning";
import { configureStore, persistedState } from "store/configure-store";
import { SUCCESS_RESPONSE, STREAM_INFINITE_TIME_VALUE } from "config/consts";
import { db, errorPromise, successPromise, delay } from "additional";

describe("Stream Payment Unit Tests", () => {
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

        it("should create an action to set stream payment prepare details", () => {
            expectedData.type = types.PREPARE_STREAM_PAYMENT;
            expect(actions.prepareStreamPayment(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set current stream payment", () => {
            expectedData.type = types.SET_CURRENT_STREAM;
            expect(actions.setCurrentStream(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set stream payment status", () => {
            data = {
                streamId: "foo",
                details: "bar",
            };
            expectedData = {
                payload: data,
                type: types.UPDATE_STREAM_PAYMENT,
            };
            expect(actions.updateStreamPayment(data.streamId, data.details)).to.deep.equal(expectedData);
        });

        it("should create an action to set stream payment status", () => {
            data = {
                streamId: "foo",
                status: "bar",
            };
            expectedData = {
                payload: data,
                type: types.SET_STREAM_PAYMENT_STATUS,
            };
            expect(actions.setStreamPaymentStatus(data.streamId, data.status)).to.deep.equal(expectedData);
        });

        it("should create an action to set stream last payment data", () => {
            data = {
                streamId: "foo",
                lastPayment: 101,
            };
            expectedData = {
                payload: data,
                type: types.SET_STREAM_LAST_PAYMENT,
            };
            expect(actions.setStreamLastPayment(data.streamId, data.lastPayment)).to.deep.equal(expectedData);
        });

        it("should create an action to change stream parts paid", () => {
            data = {
                streamId: "foo",
                change: 1,
            };
            expectedData = {
                payload: data,
                type: types.CHANGE_STREAM_PARTS_PAID,
            };
            expect(actions.changeStreamPartsPaid(data.streamId, data.change)).to.deep.equal(expectedData);
        });

        it("should create an action to change stream parts pending", () => {
            data = {
                streamId: "foo",
                change: 1,
            };
            expectedData = {
                payload: data,
                type: types.CHANGE_STREAM_PARTS_PENDING,
            };
            expect(actions.changeStreamPartsPending(data.streamId, data.change)).to.deep.equal(expectedData);
        });

        it("should create an action to add stream to list", () => {
            expectedData = {
                type: types.ADD_STREAM_PAYMENT_TO_LIST,
            };
            expect(actions.addStreamPaymentToList(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set streams", () => {
            expectedData.type = types.SET_STREAM_PAYMENTS;
            expect(actions.setStreamPayments(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set stream intervalId", () => {
            data = {
                streamId: "foo",
                paymentIntervalId: 9,
            };
            expectedData = {
                payload: data,
                type: types.SET_STREAM_PAYMENT_INTERVAL_ID,
            };
            expect(actions.setStreamPaymentIntervalId(data.streamId, data.paymentIntervalId))
                .to.deep.equal(expectedData);
        });

        it("should create an action to clear stream intervalId", () => {
            expectedData.type = types.CLEAR_STREAM_PAYMENT_INTERVAL_ID;
            expect(actions.clearStreamPaymentIntervalId(data)).to.deep.equal(expectedData);
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
            expectedData = JSON.parse(JSON.stringify(initStateStreamPayment));
            state = undefined;
        });

        it("should return the initial state", () => {
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle LOGOUT_ACCOUNT action", () => {
            action.type = accountTypes.LOGOUT_ACCOUNT;
            state = JSON.parse(JSON.stringify(initStateStreamPayment));
            state.streamDetails = "foo";
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_STREAM_PAYMENT_STATUS action", () => {
            data = {
                streamId: "qux",
                status: "quux",
            };
            action = {
                payload: data,
                type: types.SET_STREAM_PAYMENT_STATUS,
            };
            state = JSON.parse(JSON.stringify(initStateStreamPayment));
            state.streams = [
                {
                    status: "foo",
                    id: "bar",
                },
                {
                    status: "baz",
                    id: "qux",
                },
            ];
            expectedData.streams = [
                {
                    status: "foo",
                    id: "bar",
                },
                {
                    status: "quux",
                    id: "qux",
                },
            ];
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle PREPARE_STREAM_PAYMENT action", () => {
            action.type = types.PREPARE_STREAM_PAYMENT;
            expectedData.streamDetails = data;
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_CURRENT_STREAM action", () => {
            action.type = types.SET_CURRENT_STREAM;
            expectedData.currentStream = data;
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle UPDATE_STREAM_PAYMENT action", () => {
            data = {
                streamId: "qux",
                details: {
                    some: 1,
                },
            };
            action = {
                payload: data,
                type: types.UPDATE_STREAM_PAYMENT,
            };
            state = JSON.parse(JSON.stringify(initStateStreamPayment));
            state.streams = [
                {
                    some: 2,
                    id: "bar",
                },
                {
                    some: 3,
                    id: "qux",
                },
            ];
            expectedData.streams = [
                {
                    some: 2,
                    id: "bar",
                },
                {
                    some: 1,
                    id: "qux",
                },
            ];
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle CHANGE_STREAM_PARTS_PAID action", () => {
            data = {
                streamId: "qux",
                change: 1,
            };
            action = {
                payload: data,
                type: types.CHANGE_STREAM_PARTS_PAID,
            };
            state = JSON.parse(JSON.stringify(initStateStreamPayment));
            state.streams = [
                {
                    partsPaid: 2,
                    id: "bar",
                },
                {
                    partsPaid: 3,
                    id: "qux",
                },
            ];
            expectedData.streams = [
                {
                    partsPaid: 2,
                    id: "bar",
                },
                {
                    partsPaid: 4,
                    id: "qux",
                },
            ];
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle CHANGE_STREAM_PARTS_PENDING action", () => {
            data = {
                streamId: "qux",
                change: 1,
            };
            action = {
                payload: data,
                type: types.CHANGE_STREAM_PARTS_PENDING,
            };
            state = JSON.parse(JSON.stringify(initStateStreamPayment));
            state.streams = [
                {
                    partsPending: 2,
                    id: "bar",
                },
                {
                    partsPending: 3,
                    id: "qux",
                },
            ];
            expectedData.streams = [
                {
                    partsPending: 2,
                    id: "bar",
                },
                {
                    partsPending: 4,
                    id: "qux",
                },
            ];
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle ADD_STREAM_PAYMENT_TO_LIST action", () => {
            action = {
                type: types.ADD_STREAM_PAYMENT_TO_LIST,
            };
            state = JSON.parse(JSON.stringify(initStateStreamPayment));
            state.streams = ["foo"];
            state.streamDetails = "bar";
            expectedData.streams = ["foo", "bar"];
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_STREAM_PAYMENTS action", () => {
            data = ["foo"];
            action = {
                payload: data,
                type: types.SET_STREAM_PAYMENTS,
            };
            expectedData.streams = data;
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_STREAM_PAYMENT_INTERVAL_ID action", () => {
            data = {
                streamId: "qux",
                paymentIntervalId: 5,
            };
            action = {
                payload: data,
                type: types.SET_STREAM_PAYMENT_INTERVAL_ID,
            };
            state = JSON.parse(JSON.stringify(initStateStreamPayment));
            state.streams = [
                {
                    paymentIntervalId: 1,
                    id: "bar",
                },
                {
                    paymentIntervalId: 2,
                    id: "qux",
                },
            ];
            expectedData.streams = [
                {
                    paymentIntervalId: 1,
                    id: "bar",
                },
                {
                    paymentIntervalId: 5,
                    id: "qux",
                },
            ];
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_STREAM_LAST_PAYMENT action", () => {
            data = {
                streamId: "qux",
                lastPayment: 5,
            };
            action = {
                payload: data,
                type: types.SET_STREAM_LAST_PAYMENT,
            };
            state = JSON.parse(JSON.stringify(initStateStreamPayment));
            state.streams = [
                {
                    lastPayment: 2,
                    id: "bar",
                },
                {
                    lastPayment: 3,
                    id: "qux",
                },
            ];
            expectedData.streams = [
                {
                    lastPayment: 2,
                    id: "bar",
                },
                {
                    lastPayment: 5,
                    id: "qux",
                },
            ];
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle CLEAR_STREAM_PAYMENT_INTERVAL_ID action", () => {
            action.type = types.CLEAR_STREAM_PAYMENT_INTERVAL_ID;
            state = JSON.parse(JSON.stringify(initStateStreamPayment));
            state.streams = [
                {
                    paymentIntervalId: 1,
                    id: "foo",
                },
                {
                    paymentIntervalId: 2,
                    id: "qux",
                },
            ];
            expectedData.streams = [
                {
                    paymentIntervalId: null,
                    id: "foo",
                },
                {
                    paymentIntervalId: 2,
                    id: "qux",
                },
            ];
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });
    });

    describe("Operations tests", () => {
        const lightningID = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
        let sandbox;
        let fakeDB;
        let data;
        let store;
        let initState;
        let expectedActions;
        let listActions;
        let expectedData;
        let errorResp;
        let successResp;
        let fakeLightning;
        let fakeDispatchReturnError;
        let fakeDispatchReturnSuccess;
        let fakeApp;
        let fakeAccount;
        let fakeChannels;

        beforeEach(async () => {
            errorResp = await errorPromise(undefined, { name: undefined });
            successResp = await successPromise();
            fakeDispatchReturnError = () => errorResp;
            fakeDispatchReturnSuccess = () => successResp;
            listActions = [];
            sandbox = sinon.sandbox.create();
            fakeDB = sandbox.stub(db);
            fakeApp = sandbox.stub(appOperations);
            fakeAccount = sandbox.stub(accountOperations);
            fakeLightning = sandbox.stub(lightningOperations);
            fakeChannels = sandbox.stub(channelsOperations);
            window.ipcClient.resetHistory();
            window.ipcRenderer.send.resetHistory();
            data = {
                streamBuilder: {
                    insert: sinon.stub(),
                    values: sinon.stub(),
                    update: sinon.stub(),
                    set: sinon.stub(),
                    where: sinon.stub(),
                    execute: sinon.stub(),
                    getMany: sinon.stub(),
                },
                streamPartBuilder: {
                    insert: sinon.stub(),
                    values: sinon.stub(),
                    execute: sinon.stub(),
                },
            };
            initState = JSON.parse(JSON.stringify(persistedState));
            initState.account.kernelConnectIndicator = accountTypes.KERNEL_CONNECTED;
            store = configureStore(initState);
            store.subscribe(() => listActions.push(store.getState().lastAction));
            expectedData = undefined;
            expectedActions = [];
        });

        afterEach(() => {
            sandbox.restore();
        });

        describe("Modal windows", () => {
            beforeEach(() => {
                expectedData = { type: appTypes.SET_MODAL_STATE };
            });

            it("openStreamPaymentDetailsModal()", async () => {
                expectedData.payload = types.MODAL_STATE_STREAM_PAYMENT_DETAILS;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.openStreamPaymentDetailsModal())).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
            });

            it("openActiveRecurringWarningModal()", async () => {
                expectedData.payload = types.MODAL_STATE_ACTIVE_RECURRING_WARNING;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.openActiveRecurringWarningModal())).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
            });

            it("openEditStreamModal()", async () => {
                expectedData.payload = types.MODAL_STATE_EDIT_STREAM_PAYMENT;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.openEditStreamModal())).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
            });
        });

        it("clearPrepareStreamPayment()", async () => {
            expectedActions = [
                {
                    payload: null,
                    type: types.PREPARE_STREAM_PAYMENT,
                },
            ];
            expect(await store.dispatch(operations.clearPrepareStreamPayment())).to.deep.equal(expectedData);
            expect(listActions).to.deep.equal(expectedActions);
        });

        describe("prepareStreamPayment()", () => {
            let successRespTest;

            beforeEach(async () => {
                data.lightningID = lightningID;
                data.price = 10;
                data.delay = 1000;
                data.totalParts = 10;
                data.paymentName = "foo";
                data.contact_name = "bar";
                data.currency = "USD";
                successRespTest = await successPromise({ fee: "fee" });
                fakeDispatchReturnSuccess = () => successRespTest;
                fakeLightning.getLightningFee.returns(fakeDispatchReturnSuccess);
            });

            it("kernel disconnected", async () => {
                initState.account.kernelConnectIndicator = accountTypes.KERNEL_DISCONNECTED;
                store = configureStore(initState);
                store.subscribe(() => listActions.push(store.getState().lastAction));
                expectedData = {
                    ...errorResp,
                    error: statusCodes.EXCEPTION_ACCOUNT_NO_KERNEL,
                    f: "prepareStreamPayment",
                };
                expect(await store.dispatch(operations.prepareStreamPayment(
                    data.lightningID,
                    data.price,
                ))).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
                expect(fakeLightning.getLightningFee).not.to.be.called;
            });

            it("error getLightningFee()", async () => {
                fakeLightning.getLightningFee.returns(fakeDispatchReturnError);
                expectedData = {
                    ...errorResp,
                    f: "prepareStreamPayment",
                };
                expect(await store.dispatch(operations.prepareStreamPayment(
                    data.lightningID,
                    data.price,
                ))).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
                expect(fakeLightning.getLightningFee).to.be.calledOnce;
            });

            it("success with BTC currency", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: {
                            contact_name: "",
                            currency: "BTC",
                            delay: 1000,
                            fee: "fee",
                            lastPayment: 0,
                            lightningID: data.lightningID,
                            name: "Recurring payment",
                            partsPaid: 0,
                            partsPending: 0,
                            paymentIntervalId: null,
                            price: 10,
                            status: types.STREAM_PAYMENT_PAUSED,
                            totalAmount: 0,
                            totalParts: STREAM_INFINITE_TIME_VALUE,
                        },
                        type: types.PREPARE_STREAM_PAYMENT,
                    },
                ];
                expect(await store.dispatch(operations.prepareStreamPayment(
                    data.lightningID,
                    data.price,
                ))).to.deep.equal(expectedData);
                listActions[0].payload = omit(listActions[0].payload, ["date", "memo", "id"]);
                expect(listActions).to.deep.equal(expectedActions);
                expect(fakeLightning.getLightningFee).to.be.calledOnce;
            });

            it("success with USD currency", async () => {
                fakeApp.convertUsdToSatoshi.returns(fakeDispatchReturnSuccess);
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: {
                            contact_name: "bar",
                            currency: "USD",
                            delay: 1000,
                            fee: "fee",
                            lastPayment: 0,
                            lightningID: data.lightningID,
                            name: "foo",
                            partsPaid: 0,
                            partsPending: 0,
                            paymentIntervalId: null,
                            price: 10,
                            status: types.STREAM_PAYMENT_PAUSED,
                            totalAmount: 0,
                            totalParts: 10,
                        },
                        type: types.PREPARE_STREAM_PAYMENT,
                    },
                ];
                expect(await store.dispatch(operations.prepareStreamPayment(
                    data.lightningID,
                    data.price,
                    data.delay,
                    data.totalParts,
                    data.paymentName,
                    data.contact_name,
                    data.currency,
                ))).to.deep.equal(expectedData);
                listActions[0].payload = omit(listActions[0].payload, ["date", "memo", "id"]);
                expect(listActions).to.deep.equal(expectedActions);
                expect(fakeLightning.getLightningFee).to.be.calledOnce;
            });
        });

        describe("updateStreamPayment()", () => {
            let successRespTest;

            beforeEach(async () => {
                data.streamId = "bar";
                data.lightningID = lightningID;
                data.status = types.STREAM_PAYMENT_FINISHED;
                data.price = 10;
                data.delay = 1000;
                data.totalParts = 10;
                data.paymentName = "foo";
                data.currency = "BTC";
                successRespTest = await successPromise({ fee: "fee" });
                fakeDispatchReturnSuccess = () => successRespTest;
                fakeLightning.getLightningFee.returns(fakeDispatchReturnSuccess);
                fakeDB.streamBuilder.returns({
                    update: data.streamBuilder.update.returns({
                        set: data.streamBuilder.set.returns({
                            where: data.streamBuilder.where.returns({
                                execute: data.streamBuilder.execute,
                            }),
                        }),
                    }),
                });
            });

            it("kernel disconnected", async () => {
                initState.account.kernelConnectIndicator = accountTypes.KERNEL_DISCONNECTED;
                store = configureStore(initState);
                store.subscribe(() => listActions.push(store.getState().lastAction));
                expectedData = {
                    ...errorResp,
                    error: statusCodes.EXCEPTION_ACCOUNT_NO_KERNEL,
                    f: "updateStreamPayment",
                };
                expect(await store.dispatch(operations.updateStreamPayment(
                    data.streamId,
                    data.lightningID,
                    data.status,
                    data.price,
                    data.delay,
                    data.totalParts,
                    data.paymentName,
                    data.currency,
                ))).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
                expect(fakeLightning.getLightningFee).not.to.be.called;
                expect(fakeDB.streamBuilder).not.to.be.called;
            });

            it("active stream not in store", async () => {
                data.status = types.STREAM_PAYMENT_PAUSED;
                initState.streamPayment.streams = [{ id: "foo" }];
                store = configureStore(initState);
                store.subscribe(() => listActions.push(store.getState().lastAction));
                expectedData = {
                    ...errorResp,
                    error: statusCodes.EXCEPTION_RECURRING_NOT_IN_STORE,
                    f: "updateStreamPayment",
                };
                expect(await store.dispatch(operations.updateStreamPayment(
                    data.streamId,
                    data.lightningID,
                    data.status,
                    data.price,
                    data.delay,
                    data.totalParts,
                    data.paymentName,
                    data.currency,
                ))).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
                expect(fakeLightning.getLightningFee).not.to.be.called;
                expect(fakeDB.streamBuilder).not.to.be.called;
            });

            it("error getLightningFee()", async () => {
                fakeLightning.getLightningFee.returns(fakeDispatchReturnError);
                expectedData = {
                    ...errorResp,
                    f: "updateStreamPayment",
                };
                expect(await store.dispatch(operations.updateStreamPayment(
                    data.streamId,
                    data.lightningID,
                    data.status,
                    data.price,
                    data.delay,
                    data.totalParts,
                    data.paymentName,
                    data.currency,
                ))).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
                expect(fakeDB.streamBuilder).not.to.be.called;
                expect(fakeLightning.getLightningFee).to.be.calledOnce;
            });

            it("success with BTC currency", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: {
                            streamId: data.streamId,
                            details: {
                                currency: data.currency,
                                delay: data.delay,
                                name: data.paymentName,
                                price: data.price,
                                totalParts: data.totalParts,
                            },
                        },
                        type: types.UPDATE_STREAM_PAYMENT,
                    },
                ];
                expect(await store.dispatch(operations.updateStreamPayment(
                    data.streamId,
                    data.lightningID,
                    data.status,
                    data.price,
                    data.delay,
                    data.totalParts,
                    data.paymentName,
                    data.currency,
                ))).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
                expect(fakeLightning.getLightningFee).to.be.calledOnce;
                expect(fakeDB.streamBuilder).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.calledOnce;
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set)
                    .to.be.calledWithExactly({
                        currency: data.currency,
                        delay: data.delay,
                        name: data.paymentName,
                        price: data.price,
                        totalParts: data.totalParts,
                    });
                expect(data.streamBuilder.where).to.be.calledOnce;
                expect(data.streamBuilder.where).to.be.calledImmediatelyAfter(data.streamBuilder.set);
                expect(data.streamBuilder.where).to.be.calledWithExactly("id = :id", { id: "bar" });
                expect(data.streamBuilder.execute).to.be.calledOnce;
                expect(data.streamBuilder.execute).to.be.calledImmediatelyAfter(data.streamBuilder.where);
            });

            it("success with USD currency", async () => {
                data.currency = "USD";
                fakeApp.convertUsdToSatoshi.returns(fakeDispatchReturnSuccess);
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: {
                            streamId: data.streamId,
                            details: {
                                currency: data.currency,
                                delay: data.delay,
                                name: data.paymentName,
                                price: data.price,
                                totalParts: data.totalParts,
                            },
                        },
                        type: types.UPDATE_STREAM_PAYMENT,
                    },
                ];
                expect(await store.dispatch(operations.updateStreamPayment(
                    data.streamId,
                    data.lightningID,
                    data.status,
                    data.price,
                    data.delay,
                    data.totalParts,
                    data.paymentName,
                    data.currency,
                ))).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
                expect(listActions).to.deep.equal(expectedActions);
                expect(fakeLightning.getLightningFee).to.be.calledOnce;
                expect(fakeDB.streamBuilder).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.calledOnce;
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set)
                    .to.be.calledWithExactly({
                        currency: data.currency,
                        delay: data.delay,
                        name: data.paymentName,
                        price: data.price,
                        totalParts: data.totalParts,
                    });
                expect(data.streamBuilder.where).to.be.calledOnce;
                expect(data.streamBuilder.where).to.be.calledImmediatelyAfter(data.streamBuilder.set);
                expect(data.streamBuilder.where).to.be.calledWithExactly("id = :id", { id: "bar" });
                expect(data.streamBuilder.execute).to.be.calledOnce;
                expect(data.streamBuilder.execute).to.be.calledImmediatelyAfter(data.streamBuilder.where);
            });
        });

        describe("pauseDbStreams()", () => {
            beforeEach(() => {
                data.streamId = "foo";
                fakeDB.streamBuilder.returns({
                    update: data.streamBuilder.update.returns({
                        set: data.streamBuilder.set.returns({
                            where: data.streamBuilder.where.returns({
                                execute: data.streamBuilder.execute,
                            }),
                        }),
                    }),
                });
            });

            it("db error", async () => {
                fakeDB.streamBuilder.throws(new Error("foo"));
                expect(await operations.pauseDbStreams()).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
                expect(fakeDB.streamBuilder).to.be.calledOnce;
                expect(data.streamBuilder.update).not.to.be.called;
            });

            it("success", async () => {
                expect(await operations.pauseDbStreams()).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.streamBuilder).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.calledOnce;
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set)
                    .to.be.calledWithExactly({ status: types.STREAM_PAYMENT_PAUSED });
                expect(data.streamBuilder.where).to.be.calledOnce;
                expect(data.streamBuilder.where).to.be.calledImmediatelyAfter(data.streamBuilder.set);
                expect(data.streamBuilder.where).to.be.calledWithExactly("status = :status", {
                    status: types.STREAM_PAYMENT_STREAMING,
                });
                expect(data.streamBuilder.execute).to.be.calledOnce;
                expect(data.streamBuilder.execute).to.be.calledImmediatelyAfter(data.streamBuilder.where);
            });
        });

        describe("pauseStreamPayment()", () => {
            beforeEach(() => {
                data.streamId = "foo";
                fakeDB.streamBuilder.returns({
                    update: data.streamBuilder.update.returns({
                        set: data.streamBuilder.set.returns({
                            where: data.streamBuilder.where.returns({
                                execute: data.streamBuilder.execute,
                            }),
                        }),
                    }),
                });
            });

            it("empty streams list", async () => {
                expect(await store.dispatch(operations.pauseStreamPayment(data.streamId))).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.streamBuilder).not.to.be.called;
            });

            it("success", async () => {
                initState.streamPayment.streams = [
                    {
                        paymentIntervalId: 1,
                        id: "foo",
                        partsPaid: 0,
                        status: types.STREAM_PAYMENT_STREAMING,
                    },
                    {
                        paymentIntervalId: 1,
                        id: "bar",
                        partsPaid: 0,
                        status: types.STREAM_PAYMENT_STREAMING,
                    },
                ];
                store = configureStore(initState);
                store.subscribe(() => listActions.push(store.getState().lastAction));
                expectedActions = [
                    {
                        payload: "foo",
                        type: types.CLEAR_STREAM_PAYMENT_INTERVAL_ID,
                    },
                    {
                        payload: {
                            status: types.STREAM_PAYMENT_PAUSED,
                            streamId: "foo",
                        },
                        type: types.SET_STREAM_PAYMENT_STATUS,
                    },
                ];
                expect(await store.dispatch(operations.pauseStreamPayment(data.streamId))).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.streamBuilder).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.calledOnce;
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set)
                    .to.be.calledWithExactly({ partsPaid: 0, status: types.STREAM_PAYMENT_PAUSED });
                expect(data.streamBuilder.where).to.be.calledOnce;
                expect(data.streamBuilder.where).to.be.calledImmediatelyAfter(data.streamBuilder.set);
                expect(data.streamBuilder.where).to.be.calledWithExactly("id = :id", { id: "foo" });
                expect(data.streamBuilder.execute).to.be.calledOnce;
                expect(data.streamBuilder.execute).to.be.calledImmediatelyAfter(data.streamBuilder.where);
            });
        });

        describe("pauseAllStreams()", () => {
            beforeEach(() => {
                data.streamId = "foo";
                fakeDB.streamBuilder.returns({
                    update: data.streamBuilder.update.returns({
                        set: data.streamBuilder.set.returns({
                            where: data.streamBuilder.where.returns({
                                execute: data.streamBuilder.execute,
                            }),
                        }),
                    }),
                });
            });

            it("empty streams list", async () => {
                expect(await store.dispatch(operations.pauseAllStreams(data.streamId))).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.streamBuilder).not.to.be.called;
            });

            it("success", async () => {
                initState.streamPayment.streams = [
                    {
                        id: "foo",
                        partsPaid: 0,
                        status: types.STREAM_PAYMENT_STREAMING,
                        paymentIntervalId: 1,
                    },
                    {
                        id: "bar",
                        partsPaid: 0,
                        status: types.STREAM_PAYMENT_PAUSED,
                        paymentIntervalId: 1,
                    },
                ];
                store = configureStore(initState);
                store.subscribe(() => listActions.push(store.getState().lastAction));
                expectedActions = [
                    {
                        payload: "foo",
                        type: types.CLEAR_STREAM_PAYMENT_INTERVAL_ID,
                    },
                    {
                        payload: {
                            status: types.STREAM_PAYMENT_PAUSED,
                            streamId: "foo",
                        },
                        type: types.SET_STREAM_PAYMENT_STATUS,
                    },
                ];
                expect(await store.dispatch(operations.pauseAllStreams(data.streamId))).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.streamBuilder).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.calledOnce;
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set)
                    .to.be.calledWithExactly({ partsPaid: 0, status: types.STREAM_PAYMENT_PAUSED });
                expect(data.streamBuilder.where).to.be.calledOnce;
                expect(data.streamBuilder.where).to.be.calledImmediatelyAfter(data.streamBuilder.set);
                expect(data.streamBuilder.where).to.be.calledWithExactly("id = :id", { id: "foo" });
                expect(data.streamBuilder.execute).to.be.calledOnce;
                expect(data.streamBuilder.execute).to.be.calledImmediatelyAfter(data.streamBuilder.where);
            });
        });

        it("loadStreams(): ", async () => {
            const streams = [
                {
                    date: 1,
                    status: types.STREAM_PAYMENT_FINISHED,
                    lightningID: "foo",
                    id: 1,
                    extra: "buz",
                },
                {
                    date: 2,
                    status: types.STREAM_PAYMENT_STREAMING,
                    lightningID: "bar",
                    id: 2,
                    totalParts: 1,
                    partsPending: 0,
                    partsPaid: 1,
                    lastPayment: 0,
                },
                {
                    date: 3,
                    status: types.STREAM_PAYMENT_PAUSED,
                    lightningID: "baz",
                    id: 3,
                },
            ];
            initState.streamPayment.streams = streams;
            store = configureStore(initState);
            store.subscribe(() => listActions.push(store.getState().lastAction));
            fakeDB.streamBuilder.returns({
                getMany: data.streamBuilder.getMany.returns(streams),
            });
            expectedData = { ...successResp };
            expectedActions = [
                {
                    payload: [
                        {
                            contact_name: "",
                            date: 3,
                            id: 3,
                            lightningID: "baz",
                            partsPending: 0,
                            paymentIntervalId: null,
                            status: types.STREAM_PAYMENT_PAUSED,
                        },
                        {
                            contact_name: "",
                            date: 2,
                            id: 2,
                            lastPayment: 0,
                            lightningID: "bar",
                            partsPaid: 1,
                            partsPending: 0,
                            paymentIntervalId: null,
                            status: types.STREAM_PAYMENT_STREAMING,
                            totalParts: 1,
                        },
                    ],
                    type: types.SET_STREAM_PAYMENTS,
                },
            ];
            expect(await store.dispatch(operations.loadStreams())).to.deep.equal(expectedData);
            expect(listActions).to.deep.equal(expectedActions);
            expect(window.ipcRenderer.send).not.to.be.called;
            expect(fakeDB.streamBuilder).to.be.calledOnce;
            expect(data.streamBuilder.getMany).to.be.calledOnce;
            expect(data.streamBuilder.getMany).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
        });

        describe("addStreamPaymentToList()", () => {
            beforeEach(() => {
                fakeDB.streamBuilder.returns({
                    insert: data.streamBuilder.insert.returns({
                        values: data.streamBuilder.values.returns({
                            execute: data.streamBuilder.execute.returns(),
                        }),
                    }),
                });
            });

            it("no stream details", async () => {
                expectedData = {
                    ...errorResp,
                    error: statusCodes.EXCEPTION_RECURRING_DETAILS_REQUIRED,
                    f: "addStreamPaymentToList",
                };
                expect(await store.dispatch(operations.addStreamPaymentToList())).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.streamBuilder).not.to.be.called;
            });

            it("success", async () => {
                const details = {};
                initState.streamPayment.streamDetails = details;
                store = configureStore(initState);
                store.subscribe(() => listActions.push(store.getState().lastAction));
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        type: types.ADD_STREAM_PAYMENT_TO_LIST,
                    },
                ];
                expect(await store.dispatch(operations.addStreamPaymentToList())).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.streamBuilder).to.be.calledOnce;
                expect(data.streamBuilder.insert).to.be.calledOnce;
                expect(data.streamBuilder.insert).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.values).to.be.calledOnce;
                expect(data.streamBuilder.values).to.be.calledImmediatelyAfter(data.streamBuilder.insert);
                expect(data.streamBuilder.execute).to.be.calledOnce;
                expect(data.streamBuilder.execute).to.be.calledImmediatelyAfter(data.streamBuilder.values);
            });
        });

        describe("finishStreamPayment()", () => {
            beforeEach(() => {
                fakeDB.streamBuilder.returns({
                    update: data.streamBuilder.update.returns({
                        set: data.streamBuilder.set.returns({
                            where: data.streamBuilder.where.returns({
                                execute: data.streamBuilder.execute,
                            }),
                        }),
                    }),
                });
            });

            it("no payment", async () => {
                expect(await store.dispatch(operations.finishStreamPayment(0))).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
            });

            it("success", async () => {
                const streams = [
                    {
                        date: 1,
                        status: types.STREAM_PAYMENT_PAUSED,
                        lightningID: "foo",
                        id: "baz",
                        partsPaid: 1,
                        paymentIntervalId: 1,
                    },
                ];
                initState.streamPayment.streams = streams;
                store = configureStore(initState);
                store.subscribe(() => listActions.push(store.getState().lastAction));
                expectedActions = [
                    {
                        payload: "baz",
                        type: types.CLEAR_STREAM_PAYMENT_INTERVAL_ID,
                    },
                    {
                        payload: {
                            status: types.STREAM_PAYMENT_FINISHED,
                            streamId: "baz",
                        },
                        type: types.SET_STREAM_PAYMENT_STATUS,
                    },
                ];
                expect(await store.dispatch(operations.finishStreamPayment("baz"))).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.streamBuilder).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.calledOnce;
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set).to.be.calledWithExactly({
                    partsPaid: 1,
                    status: types.STREAM_PAYMENT_FINISHED,
                });
                expect(data.streamBuilder.where).to.be.calledOnce;
                expect(data.streamBuilder.where).to.be.calledImmediatelyAfter(data.streamBuilder.set);
                expect(data.streamBuilder.where).to.be.calledWithExactly("id = :id", { id: "baz" });
                expect(data.streamBuilder.execute).to.be.calledOnce;
                expect(data.streamBuilder.execute).to.be.calledImmediatelyAfter(data.streamBuilder.where);
            });
        });

        describe("startStreamPayment()", () => {
            let successRespTest;
            let errorRespTest;

            beforeEach(async () => {
                errorRespTest = await errorPromise("error", { name: "something" });
                fakeDispatchReturnError = () => errorRespTest;
                fakeLightning.addInvoiceRemote.returns(fakeDispatchReturnError);
                fakeAccount.checkBalance.returns(fakeDispatchReturnSuccess);
                fakeChannels.getChannels.returns(fakeDispatchReturnSuccess);
                fakeApp.convertUsdToSatoshi.returns(fakeDispatchReturnSuccess);
                window.ipcClient
                    .withArgs("sendPayment")
                    .returns({
                        ok: false,
                    });
                fakeDB.streamBuilder.returns({
                    update: data.streamBuilder.update.returns({
                        set: data.streamBuilder.set.returns({
                            where: data.streamBuilder.where.returns({
                                execute: data.streamBuilder.execute,
                            }),
                        }),
                    }),
                });
                fakeDB.streamPartBuilder.returns({
                    insert: data.streamPartBuilder.insert.returns({
                        values: data.streamPartBuilder.values.returns({
                            execute: data.streamPartBuilder.execute,
                        }),
                    }),
                });
                initState.account.isLogined = true;
                initState.account.lightningBalance = Number.MAX_SAFE_INTEGER;
                store = configureStore(initState);
                store.subscribe(() => listActions.push(store.getState().lastAction));
            });

            it("no payment", async () => {
                expect(await store.dispatch(operations.startStreamPayment("foo"))).to.deep.equal(expectedData);
                expect(listActions).to.deep.equal(expectedActions);
                expect(window.ipcClient).not.to.be.called;
                expect(fakeDB.streamBuilder).not.to.be.called;
            });

            it("error insufficient funds on lightning balance", async () => {
                const streams = [
                    {
                        paymentIntervalId: null,
                        partsPaid: 1,
                        partsPending: 0,
                        delay: 100,
                        lastPayment: Date.now() - 50,
                        totalParts: 2,
                        id: "foo",
                        price: 100,
                        status: types.STREAM_PAYMENT_PAUSED,
                        currency: "BTC",
                    },
                ];
                initState.streamPayment.streams = streams;
                initState.account.lightningBalance = 50;
                store = configureStore(initState);
                store.subscribe(() => listActions.push(store.getState().lastAction));
                expectedActions = [
                    {
                        payload: {
                            status: types.STREAM_PAYMENT_STREAMING,
                            streamId: "foo",
                        },
                        type: types.SET_STREAM_PAYMENT_STATUS,
                    },
                    {
                        payload: {
                            status: types.STREAM_PAYMENT_PAUSED,
                            streamId: "foo",
                        },
                        type: types.SET_STREAM_PAYMENT_STATUS,
                    },
                    {
                        type: notificationsTypes.SHOW_NOTIFICATION,
                    },
                ];
                expect(await store.dispatch(operations.startStreamPayment("foo"))).to.deep.equal(expectedData);
                await delay(100);
                listActions[2] = omit(listActions[2], "payload");
                expect(listActions).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.streamBuilder).to.be.calledTwice;
                expect(data.streamBuilder.update).to.be.calledTwice;
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.calledTwice;
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set).to.be.calledWithExactly({
                    partsPaid: 1,
                    status: types.STREAM_PAYMENT_STREAMING,
                });
                expect(data.streamBuilder.set).to.be.calledWithExactly({
                    partsPaid: 1,
                    status: types.STREAM_PAYMENT_PAUSED,
                });
                expect(data.streamBuilder.where).to.be.calledTwice;
                expect(data.streamBuilder.where).to.be.calledImmediatelyAfter(data.streamBuilder.set);
                expect(data.streamBuilder.where).to.be.calledWithExactly("id = :id", { id: "foo" });
                expect(data.streamBuilder.execute).to.be.calledTwice;
                expect(data.streamBuilder.execute).to.be.calledImmediatelyAfter(data.streamBuilder.where);
                expect(fakeDB.streamPartBuilder).not.to.be.called;
            });

            it("error on get invoice from lis", async () => {
                const streams = [
                    {
                        paymentIntervalId: null,
                        partsPaid: 1,
                        partsPending: 0,
                        delay: 100,
                        lastPayment: Date.now() - 50,
                        totalParts: 2,
                        id: "foo",
                        price: 100,
                        status: types.STREAM_PAYMENT_PAUSED,
                        currency: "BTC",
                    },
                ];
                initState.streamPayment.streams = streams;
                store = configureStore(initState);
                store.subscribe(() => listActions.push(store.getState().lastAction));
                expectedActions = [
                    {
                        payload: {
                            status: types.STREAM_PAYMENT_STREAMING,
                            streamId: "foo",
                        },
                        type: types.SET_STREAM_PAYMENT_STATUS,
                    },
                    {
                        payload: {
                            change: 1,
                            streamId: "foo",
                        },
                        type: types.CHANGE_STREAM_PARTS_PENDING,
                    },
                    {
                        payload: {
                            change: -1,
                            streamId: "foo",
                        },
                        type: types.CHANGE_STREAM_PARTS_PENDING,
                    },
                    {
                        payload: {
                            status: types.STREAM_PAYMENT_PAUSED,
                            streamId: "foo",
                        },
                        type: types.SET_STREAM_PAYMENT_STATUS,
                    },
                    {
                        type: notificationsTypes.SHOW_NOTIFICATION,
                    },
                ];
                expect(await store.dispatch(operations.startStreamPayment("foo"))).to.deep.equal(expectedData);
                await delay(100);
                listActions[4] = omit(listActions[4], "payload");
                expect(listActions).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.streamBuilder).to.be.calledTwice;
                expect(data.streamBuilder.update).to.be.calledTwice;
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.calledTwice;
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set).to.be.calledWithExactly({
                    partsPaid: 1,
                    status: types.STREAM_PAYMENT_STREAMING,
                });
                expect(data.streamBuilder.set).to.be.calledWithExactly({
                    partsPaid: 1,
                    status: types.STREAM_PAYMENT_PAUSED,
                });
                expect(data.streamBuilder.where).to.be.calledTwice;
                expect(data.streamBuilder.where).to.be.calledImmediatelyAfter(data.streamBuilder.set);
                expect(data.streamBuilder.where).to.be.calledWithExactly("id = :id", { id: "foo" });
                expect(data.streamBuilder.execute).to.be.calledTwice;
                expect(data.streamBuilder.execute).to.be.calledImmediatelyAfter(data.streamBuilder.where);
                expect(fakeDB.streamPartBuilder).not.to.be.called;
            });

            it("error on sendPayment", async () => {
                successRespTest = await successPromise({
                    response: {
                        payment_request: "foo",
                    },
                });
                fakeDispatchReturnSuccess = () => successRespTest;
                fakeLightning.addInvoiceRemote.returns(fakeDispatchReturnSuccess);
                const streams = [
                    {
                        paymentIntervalId: null,
                        partsPaid: 1,
                        partsPending: 0,
                        delay: 100,
                        lastPayment: Date.now() - 50,
                        totalParts: 2,
                        id: "foo",
                        price: 100,
                        status: types.STREAM_PAYMENT_PAUSED,
                        currency: "BTC",
                    },
                ];
                initState.streamPayment.streams = streams;
                store = configureStore(initState);
                store.subscribe(() => listActions.push(store.getState().lastAction));
                expectedActions = [
                    {
                        payload: {
                            status: types.STREAM_PAYMENT_STREAMING,
                            streamId: "foo",
                        },
                        type: types.SET_STREAM_PAYMENT_STATUS,
                    },
                    {
                        payload: {
                            change: 1,
                            streamId: "foo",
                        },
                        type: types.CHANGE_STREAM_PARTS_PENDING,
                    },
                    {
                        payload: {
                            change: -1,
                            streamId: "foo",
                        },
                        type: types.CHANGE_STREAM_PARTS_PENDING,
                    },
                    {
                        payload: {
                            status: types.STREAM_PAYMENT_PAUSED,
                            streamId: "foo",
                        },
                        type: types.SET_STREAM_PAYMENT_STATUS,
                    },
                    {
                        type: notificationsTypes.SHOW_NOTIFICATION,
                    },
                ];
                expect(await store.dispatch(operations.startStreamPayment("foo"))).to.deep.equal(expectedData);
                await delay(100);
                listActions[4] = omit(listActions[4], "payload");
                expect(listActions).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.streamBuilder).to.be.calledTwice;
                expect(data.streamBuilder.update).to.be.calledTwice;
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.calledTwice;
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set).to.be.calledWithExactly({
                    partsPaid: 1,
                    status: types.STREAM_PAYMENT_STREAMING,
                });
                expect(data.streamBuilder.set).to.be.calledWithExactly({
                    partsPaid: 1,
                    status: types.STREAM_PAYMENT_PAUSED,
                });
                expect(data.streamBuilder.where).to.be.calledTwice;
                expect(data.streamBuilder.where).to.be.calledImmediatelyAfter(data.streamBuilder.set);
                expect(data.streamBuilder.where).to.be.calledWithExactly("id = :id", { id: "foo" });
                expect(data.streamBuilder.execute).to.be.calledTwice;
                expect(data.streamBuilder.execute).to.be.calledImmediatelyAfter(data.streamBuilder.where);
                expect(fakeDB.streamPartBuilder).not.to.be.called;
            });

            it("success with last payment close than delay, 2 payments left, interval started", async () => {
                successRespTest = await successPromise({
                    response: {
                        payment_request: "foo",
                    },
                });
                fakeDispatchReturnSuccess = () => successRespTest;
                fakeLightning.addInvoiceRemote.returns(fakeDispatchReturnSuccess);
                window.ipcClient
                    .withArgs("sendPayment")
                    .returns({
                        ok: true,
                    });
                const streams = [
                    {
                        paymentIntervalId: null,
                        partsPaid: 1,
                        partsPending: 0,
                        delay: 100,
                        lastPayment: Date.now() - 10,
                        totalParts: 3,
                        id: "foo",
                        price: 100,
                        status: types.STREAM_PAYMENT_PAUSED,
                        currency: "BTC",
                    },
                ];
                initState.streamPayment.streams = streams;
                store = configureStore(initState);
                store.subscribe(() => listActions.push(store.getState().lastAction));
                expectedActions = [
                    {
                        payload: {
                            status: types.STREAM_PAYMENT_STREAMING,
                            streamId: "foo",
                        },
                        type: types.SET_STREAM_PAYMENT_STATUS,
                    },
                    {
                        payload: {
                            change: 1,
                            streamId: "foo",
                        },
                        type: types.CHANGE_STREAM_PARTS_PENDING,
                    },
                    {
                        payload: {
                            streamId: "foo",
                        },
                        type: types.SET_STREAM_PAYMENT_INTERVAL_ID,
                    },
                    {
                        payload: {
                            change: -1,
                            streamId: "foo",
                        },
                        type: types.CHANGE_STREAM_PARTS_PENDING,
                    },
                    {
                        payload: {
                            change: 1,
                            streamId: "foo",
                        },
                        type: types.CHANGE_STREAM_PARTS_PAID,
                    },
                    {
                        payload: {
                            streamId: "foo",
                        },
                        type: types.SET_STREAM_LAST_PAYMENT,
                    },
                    {
                        payload: {
                            change: 1,
                            streamId: "foo",
                        },
                        type: types.CHANGE_STREAM_PARTS_PENDING,
                    },
                    {
                        payload: {
                            change: -1,
                            streamId: "foo",
                        },
                        type: types.CHANGE_STREAM_PARTS_PENDING,
                    },
                    {
                        payload: {
                            change: 1,
                            streamId: "foo",
                        },
                        type: types.CHANGE_STREAM_PARTS_PAID,
                    },
                    {
                        payload: {
                            streamId: "foo",
                        },
                        type: types.SET_STREAM_LAST_PAYMENT,
                    },
                    {
                        payload: "foo",
                        type: types.CLEAR_STREAM_PAYMENT_INTERVAL_ID,
                    },
                    {
                        payload: {
                            status: types.STREAM_PAYMENT_FINISHED,
                            streamId: "foo",
                        },
                        type: types.SET_STREAM_PAYMENT_STATUS,
                    },
                    {
                        type: notificationsTypes.SHOW_NOTIFICATION,
                    },
                ];
                expect(await store.dispatch(operations.startStreamPayment("foo"))).to.deep.equal(expectedData);
                await delay(200);
                listActions[2].payload = omit(listActions[2].payload, "paymentIntervalId");
                listActions[5].payload = omit(listActions[5].payload, "lastPayment");
                listActions[9].payload = omit(listActions[9].payload, "lastPayment");
                listActions[12] = omit(listActions[12], "payload");
                expect(listActions).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.streamBuilder).to.be.callCount(4);
                expect(data.streamBuilder.update).to.be.callCount(4);
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.callCount(4);
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set).to.be.calledWithExactly({
                    partsPaid: 1,
                    status: types.STREAM_PAYMENT_STREAMING,
                });
                expect(data.streamBuilder.set).to.be.calledWithExactly({
                    partsPaid: 3,
                    status: types.STREAM_PAYMENT_FINISHED,
                });
                expect(data.streamBuilder.where).to.be.callCount(4);
                expect(data.streamBuilder.where).to.be.calledImmediatelyAfter(data.streamBuilder.set);
                expect(data.streamBuilder.where).to.be.calledWithExactly("id = :id", { id: "foo" });
                expect(data.streamBuilder.execute).to.be.callCount(4);
                expect(data.streamBuilder.execute).to.be.calledImmediatelyAfter(data.streamBuilder.where);
                expect(fakeDB.streamPartBuilder).to.be.calledTwice;
                expect(data.streamPartBuilder.insert).to.be.calledTwice;
                expect(data.streamPartBuilder.insert).to.be.calledImmediatelyAfter(fakeDB.streamPartBuilder);
                expect(data.streamPartBuilder.values).to.be.calledTwice;
                expect(data.streamPartBuilder.values).to.be.calledImmediatelyAfter(data.streamPartBuilder.insert);
                expect(data.streamPartBuilder.values)
                    .to.be.calledWithExactly({ payment_hash: undefined, stream: "foo" });
                expect(data.streamPartBuilder.execute).to.be.calledTwice;
                expect(data.streamPartBuilder.execute).to.be.calledImmediatelyAfter(data.streamPartBuilder.values);
            });

            it("success with last payment between 1 and 2 delay periods, 1 payment left", async () => {
                successRespTest = await successPromise({
                    response: {
                        payment_request: "foo",
                    },
                });
                fakeDispatchReturnSuccess = () => successRespTest;
                fakeLightning.addInvoiceRemote.returns(fakeDispatchReturnSuccess);
                window.ipcClient
                    .withArgs("sendPayment")
                    .returns({
                        ok: true,
                    });
                const streams = [
                    {
                        paymentIntervalId: null,
                        partsPaid: 1,
                        partsPending: 0,
                        delay: 100,
                        lastPayment: Date.now() - 110,
                        totalParts: 2,
                        id: "foo",
                        price: 100,
                        status: types.STREAM_PAYMENT_PAUSED,
                        currency: "USD",
                    },
                ];
                initState.streamPayment.streams = streams;
                store = configureStore(initState);
                store.subscribe(() => listActions.push(store.getState().lastAction));
                expectedActions = [
                    {
                        payload: {
                            status: types.STREAM_PAYMENT_STREAMING,
                            streamId: "foo",
                        },
                        type: types.SET_STREAM_PAYMENT_STATUS,
                    },
                    {
                        payload: {
                            change: 1,
                            streamId: "foo",
                        },
                        type: types.CHANGE_STREAM_PARTS_PENDING,
                    },
                    {
                        payload: {
                            change: -1,
                            streamId: "foo",
                        },
                        type: types.CHANGE_STREAM_PARTS_PENDING,
                    },
                    {
                        payload: {
                            change: 1,
                            streamId: "foo",
                        },
                        type: types.CHANGE_STREAM_PARTS_PAID,
                    },
                    {
                        payload: {
                            streamId: "foo",
                        },
                        type: types.SET_STREAM_LAST_PAYMENT,
                    },
                    {
                        payload: {
                            status: types.STREAM_PAYMENT_FINISHED,
                            streamId: "foo",
                        },
                        type: types.SET_STREAM_PAYMENT_STATUS,
                    },
                    {
                        type: notificationsTypes.SHOW_NOTIFICATION,
                    },
                ];
                expect(await store.dispatch(operations.startStreamPayment("foo"))).to.deep.equal(expectedData);
                await delay(100);
                listActions[4].payload = omit(listActions[4].payload, "lastPayment");
                listActions[6] = omit(listActions[6], "payload");
                expect(listActions).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.streamBuilder).to.be.calledThrice;
                expect(data.streamBuilder.update).to.be.calledThrice;
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.calledThrice;
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set).to.be.calledWithExactly({
                    partsPaid: 1,
                    status: types.STREAM_PAYMENT_STREAMING,
                });
                expect(data.streamBuilder.set).to.be.calledWithExactly({
                    partsPaid: 2,
                    status: types.STREAM_PAYMENT_FINISHED,
                });
                expect(data.streamBuilder.where).to.be.calledThrice;
                expect(data.streamBuilder.where).to.be.calledImmediatelyAfter(data.streamBuilder.set);
                expect(data.streamBuilder.where).to.be.calledWithExactly("id = :id", { id: "foo" });
                expect(data.streamBuilder.execute).to.be.calledThrice;
                expect(data.streamBuilder.execute).to.be.calledImmediatelyAfter(data.streamBuilder.where);
                expect(fakeDB.streamPartBuilder).to.be.calledOnce;
                expect(data.streamPartBuilder.insert).to.be.calledOnce;
                expect(data.streamPartBuilder.insert).to.be.calledImmediatelyAfter(fakeDB.streamPartBuilder);
                expect(data.streamPartBuilder.values).to.be.calledOnce;
                expect(data.streamPartBuilder.values).to.be.calledImmediatelyAfter(data.streamPartBuilder.insert);
                expect(data.streamPartBuilder.values)
                    .to.be.calledWithExactly({ payment_hash: undefined, stream: "foo" });
                expect(data.streamPartBuilder.execute).to.be.calledOnce;
                expect(data.streamPartBuilder.execute).to.be.calledImmediatelyAfter(data.streamPartBuilder.values);
            });
        });
    });

    describe("Selectors Unit Tests", () => {
        let state;
        let expectedData;

        beforeEach(() => {
            state = {
                streamPayment: {
                    ...initStateStreamPayment,
                    streams: [],
                },
            };
            expectedData = {};
        });

        describe("isActiveStreamRunning()", () => {
            it("no streaming stream", () => {
                state.streamPayment.streams = [
                    {
                        status: types.STREAM_PAYMENT_FINISHED,
                        extra: "bar",
                    },
                    {
                        status: types.STREAM_PAYMENT_PAUSED,
                        extra: "foo",
                    },
                ];
                expectedData = false;
                expect(selectors.isActiveStreamRunning(state)).to.deep.equal(expectedData);
            });

            it("contain streaming stream", () => {
                state.streamPayment.streams = [
                    {
                        status: types.STREAM_PAYMENT_PAUSED,
                        extra: "bar",
                    },
                    {
                        status: types.STREAM_PAYMENT_STREAMING,
                        extra: "foo",
                    },
                ];
                expectedData = true;
                expect(selectors.isActiveStreamRunning(state)).to.deep.equal(expectedData);
            });
        });
    });
});
