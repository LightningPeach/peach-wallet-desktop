import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import omit from "lodash/omit";

import "../../utils";
import * as statusCodes from "config/status-codes";
import {
    streamPaymentActions as actions,
    streamPaymentTypes as types,
    streamPaymentOperations as operations,
    streamPaymentSelectors as selectors,
} from "modules/streamPayments";
import streamPaymentReducer, { initStateStreamPayment } from "modules/streamPayments/reducers";
import { accountOperations, accountTypes } from "modules/account";
import { appTypes } from "modules/app";
import { notificationsTypes } from "modules/notifications";
import { lightningOperations } from "modules/lightning";
import { store as defaultStore } from "store/configure-store";
import { SUCCESS_RESPONSE } from "config/consts";
import { db, errorPromise, successPromise } from "additional";

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

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

        it("should create an action to set stream current sec", () => {
            data = {
                streamId: "foo",
                partsPaid: "bar",
            };
            expectedData = {
                payload: data,
                type: types.CHANGE_STREAM_PARTS_PAID,
            };
            expect(actions.changeStreamPartsPaid(data.streamId, data.partsPaid)).to.deep.equal(expectedData);
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
            state.streamId = "bar";
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
                    streamId: "bar",
                },
                {
                    status: "baz",
                    streamId: "qux",
                },
            ];
            expectedData.streams = [
                {
                    status: "foo",
                    streamId: "bar",
                },
                {
                    status: "quux",
                    streamId: "qux",
                },
            ];
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle PREPARE_STREAM_PAYMENT action", () => {
            action.type = types.PREPARE_STREAM_PAYMENT;
            expectedData.streamDetails = data;
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle CHANGE_STREAM_PARTS_PAID action", () => {
            data = {
                streamId: "qux",
                partsPaid: "quux",
            };
            action = {
                payload: data,
                type: types.CHANGE_STREAM_PARTS_PAID,
            };
            state = JSON.parse(JSON.stringify(initStateStreamPayment));
            state.streams = [
                {
                    partsPaid: "foo",
                    streamId: "bar",
                },
                {
                    partsPaid: "baz",
                    streamId: "qux",
                },
            ];
            expectedData.streams = [
                {
                    partsPaid: "foo",
                    streamId: "bar",
                },
                {
                    partsPaid: "quux",
                    streamId: "qux",
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
    });

    describe("Operations tests", () => {
        const lightningID = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
        let sandbox;
        let fakeDB;
        let data;
        let store;
        let initState;
        let expectedActions;
        let expectedData;
        let errorResp;
        let successResp;
        let fakeLightning;
        let fakeDispatchReturnError;
        let fakeDispatchReturnSuccess;
        let fakeStore;
        let fakeAccount;

        beforeEach(async () => {
            errorResp = await errorPromise(undefined, { name: undefined });
            successResp = await successPromise();
            fakeDispatchReturnError = () => errorResp;
            fakeDispatchReturnSuccess = () => successResp;
            sandbox = sinon.sandbox.create();
            fakeDB = sandbox.stub(db);
            fakeAccount = sandbox.stub(accountOperations);
            fakeStore = sandbox.stub(defaultStore);
            window.ipcClient.reset();
            window.ipcRenderer.send.reset();
            fakeLightning = sandbox.stub(lightningOperations);
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
            initState = {
                account: {
                    kernelConnectIndicator: accountTypes.KERNEL_CONNECTED,
                },
                streamPayment: { ...initStateStreamPayment },
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

        describe("Modal windows", () => {
            beforeEach(() => {
                expectedData = { type: appTypes.SET_MODAL_STATE };
            });

            it("openStreamPaymentDetailsModal()", async () => {
                expectedData.payload = types.MODAL_STATE_STREAM_PAYMENT_DETAILS;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.openStreamPaymentDetailsModal())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
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
            expect(store.getActions()).to.deep.equal(expectedActions);
        });

        describe("prepareStreamPayment()", () => {
            let successRespTest;

            beforeEach(async () => {
                data.lightningID = lightningID;
                data.price = 10;
                successRespTest = await successPromise({ fee: "fee" });
                fakeDispatchReturnSuccess = () => successRespTest;
                fakeLightning.getLightningFee.returns(fakeDispatchReturnSuccess);
            });

            it("kernel disconnected", async () => {
                initState.account.kernelConnectIndicator = accountTypes.KERNEL_DISCONNECTED;
                store = mockStore(initState);
                expectedData = {
                    ...errorResp,
                    error: statusCodes.EXCEPTION_ACCOUNT_NO_KERNEL,
                    f: "prepareStreamPayment",
                };
                expect(await store.dispatch(operations.prepareStreamPayment(
                    data.lightningID,
                    data.price,
                ))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
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
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("success", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: {
                            contact_name: "",
                            partsPaid: 0,
                            delay: 1000,
                            fee: "fee",
                            lightningID: data.lightningID,
                            name: "Stream payment",
                            price: 10,
                            status: types.STREAM_PAYMENT_PAUSED,
                            totalParts: 0,
                        },
                        type: types.PREPARE_STREAM_PAYMENT,
                    },
                ];
                expect(await store.dispatch(operations.prepareStreamPayment(
                    data.lightningID,
                    data.price,
                ))).to.deep.equal(expectedData);
                const storeActions = store.getActions();
                storeActions[0].payload = omit(storeActions[0].payload, ["date", "uuid", "streamId", "memo", "id"]);
                expect(storeActions).to.deep.equal(expectedActions);
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
                initState.streamPayment.streams = [
                    {
                        body: "foo-body",
                        streamId: "foo",
                        uuid: "foo-uuid",
                        partsPaid: 0,
                    },
                    {
                        body: "bar-body",
                        streamId: "bar",
                        uuid: "bar-uuid",
                        partsPaid: 0,
                    },
                ];
                store = mockStore(initState);
                fakeStore.dispatch = store.dispatch;
                fakeStore.getState = store.getState;
            });

            it("empty streams list", async () => {
                initState.streamPayment.streams = [];
                expect(await store.dispatch(operations.pauseStreamPayment(data.streamId))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.streamBuilder).not.to.be.called;
            });

            it("success", async () => {
                expectedActions = [
                    {
                        payload: {
                            status: types.STREAM_PAYMENT_PAUSED,
                            streamId: "foo-uuid",
                        },
                        type: types.SET_STREAM_PAYMENT_STATUS,
                    },
                ];
                expect(await store.dispatch(operations.pauseStreamPayment(data.streamId))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.streamBuilder).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.calledOnce;
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set)
                    .to.be.calledWithExactly({ partsPaid: 0, status: "pause" });
                expect(data.streamBuilder.where).to.be.calledOnce;
                expect(data.streamBuilder.where).to.be.calledImmediatelyAfter(data.streamBuilder.set);
                expect(data.streamBuilder.where).to.be.calledWithExactly("id = :id", { id: "foo-uuid" });
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
                initState.streamPayment.streams = [
                    {
                        body: "foo-body",
                        streamId: "foo",
                        uuid: "foo-uuid",
                        partsPaid: 0,
                        status: types.STREAM_PAYMENT_STREAMING,
                    },
                    {
                        body: "bar-body",
                        streamId: "bar",
                        uuid: "bar-uuid",
                        partsPaid: 0,
                        status: types.STREAM_PAYMENT_PAUSED,
                    },
                ];
                store = mockStore(initState);
                fakeStore.dispatch = store.dispatch;
                fakeStore.getState = store.getState;
            });

            it("empty streams list", async () => {
                initState.streamPayment.streams = [];
                expect(await store.dispatch(operations.pauseAllStreams(data.streamId))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.streamBuilder).not.to.be.called;
            });

            it("success", async () => {
                expectedActions = [
                    {
                        payload: {
                            status: types.STREAM_PAYMENT_PAUSED,
                            streamId: "foo-uuid",
                        },
                        type: types.SET_STREAM_PAYMENT_STATUS,
                    },
                ];
                expect(await store.dispatch(operations.pauseAllStreams(data.streamId))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.streamBuilder).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.calledOnce;
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set)
                    .to.be.calledWithExactly({ partsPaid: 0, status: "pause" });
                expect(data.streamBuilder.where).to.be.calledOnce;
                expect(data.streamBuilder.where).to.be.calledImmediatelyAfter(data.streamBuilder.set);
                expect(data.streamBuilder.where).to.be.calledWithExactly("id = :id", { id: "foo-uuid" });
                expect(data.streamBuilder.execute).to.be.calledOnce;
                expect(data.streamBuilder.execute).to.be.calledImmediatelyAfter(data.streamBuilder.where);
            });
        });

        it("loadStreams()", async () => {
            const streams = [
                {
                    date: 1,
                    status: "end",
                    lightningID: "foo",
                    id: 1,
                    extra: "buz",
                },
                {
                    date: 2,
                    status: "run",
                    lightningID: "bar",
                    id: 2,
                },
                {
                    date: 3,
                    status: "pause",
                    lightningID: "baz",
                    id: 3,
                },
            ];
            fakeDB.streamBuilder.returns({
                getMany: data.streamBuilder.getMany.returns(streams),
            });
            store = mockStore(initState);
            expectedData = { ...successResp };
            expectedActions = [
                {
                    payload: [
                        {
                            contact_name: "",
                            date: 3,
                            id: 3,
                            lightningID: "baz",
                            status: types.STREAM_PAYMENT_PAUSED,
                            uuid: 3,
                            streamId: 3,
                        },
                        {
                            contact_name: "",
                            date: 2,
                            id: 2,
                            lightningID: "bar",
                            status: types.STREAM_PAYMENT_STREAMING,
                            uuid: 2,
                            streamId: 2,
                        },
                    ],
                    type: types.SET_STREAM_PAYMENTS,
                },
            ];
            expect(await store.dispatch(operations.loadStreams())).to.deep.equal(expectedData);
            expect(store.getActions()).to.deep.equal(expectedActions);
            expect(window.ipcRenderer.send).not.to.be.called;
            expect(fakeDB.streamBuilder).to.be.calledOnce;
            expect(data.streamBuilder.getMany).to.be.calledOnce;
            expect(data.streamBuilder.getMany).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
        });

        describe("addStreamPaymentToList()", () => {
            let details;

            beforeEach(() => {
                details = {};
                initState.streamPayment.streamDetails = details;
                store = mockStore(initState);
                fakeDB.streamBuilder.returns({
                    insert: data.streamBuilder.insert.returns({
                        values: data.streamBuilder.values.returns({
                            execute: data.streamBuilder.execute.returns(),
                        }),
                    }),
                });
            });

            it("no stream details", async () => {
                details = null;
                initState.streamPayment.streamDetails = details;
                store = mockStore(initState);
                expectedData = {
                    ...errorResp,
                    error: statusCodes.EXCEPTION_STREAM_DETAILS_REQUIRED,
                    f: "addStreamPaymentToList",
                };
                expect(await store.dispatch(operations.addStreamPaymentToList())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.streamBuilder).not.to.be.called;
            });

            it("success", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        type: types.ADD_STREAM_PAYMENT_TO_LIST,
                    },
                ];
                expect(await store.dispatch(operations.addStreamPaymentToList())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
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
            let streams;

            beforeEach(() => {
                streams = [
                    {
                        date: 1,
                        status: "end",
                        lightningID: "foo",
                        id: 1,
                        uuid: "baz",
                        streamId: "baz",
                        partsPaid: 1,
                    },
                ];
                initState.streamPayment.streams = streams;
                store = mockStore(initState);
                fakeDB.streamBuilder.returns({
                    update: data.streamBuilder.update.returns({
                        set: data.streamBuilder.set.returns({
                            where: data.streamBuilder.where.returns({
                                execute: data.streamBuilder.execute,
                            }),
                        }),
                    }),
                });
                fakeStore.dispatch = store.dispatch;
                fakeStore.getState = store.getState;
            });

            it("no payment", async () => {
                streams = [];
                initState.streamPayment.streams = streams;
                store = mockStore(initState);
                expect(await store.dispatch(operations.finishStreamPayment(0))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
            });

            it("success", async () => {
                expectedActions = [
                    {
                        payload: {
                            status: types.STREAM_PAYMENT_FINISHED,
                            streamId: "baz",
                        },
                        type: types.SET_STREAM_PAYMENT_STATUS,
                    },
                ];
                expect(await store.dispatch(operations.finishStreamPayment("baz"))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.streamBuilder).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.calledOnce;
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set).to.be.calledWithExactly({ partsPaid: 1, status: "end" });
                expect(data.streamBuilder.where).to.be.calledOnce;
                expect(data.streamBuilder.where).to.be.calledImmediatelyAfter(data.streamBuilder.set);
                expect(data.streamBuilder.where).to.be.calledWithExactly("id = :id", { id: "baz" });
                expect(data.streamBuilder.execute).to.be.calledOnce;
                expect(data.streamBuilder.execute).to.be.calledImmediatelyAfter(data.streamBuilder.where);
            });
        });

        describe("startStreamPayment()", () => {
            let streams;

            beforeEach(() => {
                streams = [
                    {
                        partsPaid: 1,
                        delay: 1000,
                        totalParts: 2,
                        uuid: "baz",
                        streamId: "baz",
                    },
                ];
                initState.streamPayment.streams = streams;
                store = mockStore(initState);
                fakeDB.streamBuilder.returns({
                    update: data.streamBuilder.update.returns({
                        set: data.streamBuilder.set.returns({
                            where: data.streamBuilder.where.returns({
                                execute: data.streamBuilder.execute,
                            }),
                        }),
                    }),
                });
                fakeStore.dispatch = store.dispatch;
                fakeStore.getState = store.getState;
            });

            it("no payment", async () => {
                streams = [];
                initState.streamPayment.streams = streams;
                store = mockStore(initState);
                expect(await store.dispatch(operations.startStreamPayment(0))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
            });

            it("success", async () => {
                expectedActions = [
                    {
                        payload: {
                            status: types.STREAM_PAYMENT_STREAMING,
                            streamId: "baz",
                        },
                        type: types.SET_STREAM_PAYMENT_STATUS,
                    },
                ];
                expect(await store.dispatch(operations.startStreamPayment("baz"))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
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
