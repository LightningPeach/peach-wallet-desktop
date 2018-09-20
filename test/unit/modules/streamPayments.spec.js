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
import { channelsOperations } from "modules/channels";
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

        it("should create an action to set stream page", () => {
            expectedData.type = types.SET_STREAM_PAGE;
            expect(actions.setStreamPage(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set stream payment prepare details", () => {
            expectedData.type = types.STREAM_PAYMENT_PREPARE;
            expect(actions.streamPaymentPrepare(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set stream payment update details", () => {
            data = {
                streamId: "foo",
                title: "bar",
            };
            expectedData = {
                payload: data,
                type: types.STREAM_PAYMENT_UPDATE,
            };
            expect(actions.streamPaymentUpdate(data.streamId, data.title)).to.deep.equal(expectedData);
        });

        it("should create an action to stream deleted status ", () => {
            expectedData.type = types.STREAM_PAYMENT_DELETE;
            expect(actions.streamPaymentDelete(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set stream success finish status", () => {
            expectedData.type = types.STREAM_PAYMENT_SUCCESS_FINISH;
            expect(actions.streamPaymentSuccessFinish(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set stream fail finish status", () => {
            expectedData.type = types.STREAM_PAYMENT_FAIL_FINISH;
            expect(actions.streamPaymentFailFinish(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set stream payment status", () => {
            data = {
                streamId: "foo",
                status: "bar",
            };
            expectedData = {
                payload: data,
                type: types.STREAM_PAYMENT_STATUS,
            };
            expect(actions.streamPaymentStatus(data.streamId, data.status)).to.deep.equal(expectedData);
        });

        it("should create an action to set stream current sec", () => {
            data = {
                streamId: "foo",
                currentPart: "bar",
            };
            expectedData = {
                payload: data,
                type: types.STREAM_CURRENT_SEC,
            };
            expect(actions.streamCurrentSec(data.streamId, data.currentPart)).to.deep.equal(expectedData);
        });

        it("should create an action to add stream to list", () => {
            expectedData = {
                type: types.ADD_STREAM_TO_LIST,
            };
            expect(actions.addStreamToList(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set streams", () => {
            expectedData.type = types.SET_STREAMS;
            expect(actions.setStreams(data)).to.deep.equal(expectedData);
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

        it("should handle STREAM_PAYMENT_SUCCESS_FINISH action", () => {
            data = "qux";
            action = {
                payload: data,
                type: types.STREAM_PAYMENT_SUCCESS_FINISH,
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
                    status: types.FINISHED_STREAM_PAYMENT,
                    streamId: "qux",
                },
            ];
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle STREAM_PAYMENT_FAIL_FINISH action", () => {
            data = "qux";
            action = {
                payload: data,
                type: types.STREAM_PAYMENT_FAIL_FINISH,
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
                    status: types.FINISHED_STREAM_PAYMENT,
                    streamId: "qux",
                },
            ];
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_STREAM_PAGE action", () => {
            action.type = types.SET_STREAM_PAGE;
            expectedData.streamId = data;
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle STREAM_PAYMENT_STATUS action", () => {
            data = {
                streamId: "qux",
                status: "quux",
            };
            action = {
                payload: data,
                type: types.STREAM_PAYMENT_STATUS,
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

        it("should handle STREAM_PAYMENT_PREPARE action", () => {
            action.type = types.STREAM_PAYMENT_PREPARE;
            expectedData.streamDetails = data;
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle STREAM_PAYMENT_UPDATE action", () => {
            data = {
                streamId: "qux",
                title: "quux",
            };
            action = {
                payload: data,
                type: types.STREAM_PAYMENT_UPDATE,
            };
            state = JSON.parse(JSON.stringify(initStateStreamPayment));
            state.streams = [
                {
                    title: "foo",
                    streamId: "bar",
                },
                {
                    title: "baz",
                    streamId: "qux",
                },
            ];
            expectedData.streams = [
                {
                    title: "foo",
                    streamId: "bar",
                },
                {
                    title: "quux",
                    streamId: "qux",
                },
            ];
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle STREAM_PAYMENT_DELETE action", () => {
            data = "qux";
            action = {
                payload: data,
                type: types.STREAM_PAYMENT_DELETE,
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
                    status: types.DELETED_STREAM_PAYMENT,
                    streamId: "qux",
                },
            ];
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle STREAM_CURRENT_SEC action", () => {
            data = {
                streamId: "qux",
                currentPart: "quux",
            };
            action = {
                payload: data,
                type: types.STREAM_CURRENT_SEC,
            };
            state = JSON.parse(JSON.stringify(initStateStreamPayment));
            state.streams = [
                {
                    currentPart: "foo",
                    streamId: "bar",
                },
                {
                    currentPart: "baz",
                    streamId: "qux",
                },
            ];
            expectedData.streams = [
                {
                    currentPart: "foo",
                    streamId: "bar",
                },
                {
                    currentPart: "quux",
                    streamId: "qux",
                },
            ];
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle ADD_STREAM_TO_LIST action", () => {
            action = {
                type: types.ADD_STREAM_TO_LIST,
            };
            state = JSON.parse(JSON.stringify(initStateStreamPayment));
            state.streams = ["foo"];
            state.streamDetails = "bar";
            expectedData.streams = ["foo", "bar"];
            expect(streamPaymentReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_STREAMS action", () => {
            data = ["foo"];
            action = {
                payload: data,
                type: types.SET_STREAMS,
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
        let fakeChannels;

        beforeEach(async () => {
            errorResp = await errorPromise(undefined, { name: undefined });
            successResp = await successPromise();
            fakeDispatchReturnError = () => errorResp;
            fakeDispatchReturnSuccess = () => successResp;
            sandbox = sinon.sandbox.create();
            fakeDB = sandbox.stub(db);
            fakeAccount = sandbox.stub(accountOperations);
            fakeStore = sandbox.stub(defaultStore);
            window.ipcClient.resetHistory();
            window.ipcRenderer.send.resetHistory();
            fakeLightning = sandbox.stub(lightningOperations);
            fakeChannels = sandbox.stub(channelsOperations);
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

        describe("ipcRenderer()", () => {
            beforeEach(() => {
                data.streamPaymentHash = "streamPaymentHash";
                data.streamUuid = "stream_uuid";
                data.streamId = "test";
                data.streamCurrentPart = 0;
                data.streamTotalParts = 5;
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
                initState.streamPayment.streams = [
                    {
                        streamId: data.streamId,
                        currentPart: data.streamCurrentPart,
                        delay: 1000,
                        totalParts: data.streamTotalParts,
                        uuid: data.streamUuid,
                    },
                ];
                store = mockStore(initState);
                fakeStore.dispatch = store.dispatch;
                fakeStore.getState = store.getState;
            });

            it("ipcMain:pauseStream()", async () => {
                expectedActions = [];
                window.ipcRenderer.send("ipcMain:pauseStream", { streamId: data.streamId });
                expect(window.ipcRenderer.on).to.be.called.calledWith("ipcMain:pauseStream");
                expect(fakeDB.streamBuilder).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.calledOnce;
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set)
                    .to.be.calledWithExactly({ currentPart: data.streamCurrentPart, status: "pause" });
                expect(data.streamBuilder.where).to.be.calledOnce;
                expect(data.streamBuilder.where).to.be.calledImmediatelyAfter(data.streamBuilder.set);
                expect(data.streamBuilder.where).to.be.calledWithExactly("id = :id", { id: data.streamUuid });
                expect(data.streamBuilder.execute).to.be.calledOnce;
                expect(data.streamBuilder.execute).to.be.calledImmediatelyAfter(data.streamBuilder.where);
            });

            it("ipcMain:endStream()", async () => {
                expectedActions = [];
                window.ipcRenderer.send("ipcMain:endStream", { streamId: data.streamId });
                expect(window.ipcRenderer.on).to.be.called.calledWith("ipcMain:endStream");
                expect(fakeDB.streamBuilder).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.calledOnce;
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set)
                    .to.be.calledWithExactly({ currentPart: data.streamCurrentPart, status: "end" });
                expect(data.streamBuilder.where).to.be.calledOnce;
                expect(data.streamBuilder.where).to.be.calledImmediatelyAfter(data.streamBuilder.set);
                expect(data.streamBuilder.where).to.be.calledWithExactly("id = :id", { id: data.streamUuid });
                expect(data.streamBuilder.execute).to.be.calledOnce;
                expect(data.streamBuilder.execute).to.be.calledImmediatelyAfter(data.streamBuilder.where);
            });

            it("ipcMain:finishStream()", async () => {
                expectedActions = [];
                window.ipcRenderer.send("ipcMain:finishStream", { streamId: data.streamId });
                expect(window.ipcRenderer.on).to.be.called.calledWith("ipcMain:finishStream");
                expect(fakeDB.streamBuilder).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.calledOnce;
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set)
                    .to.be.calledWithExactly({ currentPart: data.streamCurrentPart, status: "end" });
                expect(data.streamBuilder.where).to.be.calledOnce;
                expect(data.streamBuilder.where).to.be.calledImmediatelyAfter(data.streamBuilder.set);
                expect(data.streamBuilder.where).to.be.calledWithExactly("id = :id", { id: data.streamUuid });
                expect(data.streamBuilder.execute).to.be.calledOnce;
                expect(data.streamBuilder.execute).to.be.calledImmediatelyAfter(data.streamBuilder.where);
            });

            it("ipcMain:errorStream()", async () => {
                data.error = "Some awesome error";
                window.ipcRenderer.send("ipcMain:errorStream", { streamId: data.streamId, error: data.error });
                expect(window.ipcRenderer.on).to.be.called.calledWith("ipcMain:finishStream");
                expect(fakeDB.streamBuilder).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.calledOnce;
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set)
                    .to.be.calledWithExactly({ currentPart: data.streamCurrentPart, status: "pause" });
                expect(data.streamBuilder.where).to.be.calledOnce;
                expect(data.streamBuilder.where).to.be.calledImmediatelyAfter(data.streamBuilder.set);
                expect(data.streamBuilder.where).to.be.calledWithExactly("id = :id", { id: data.streamUuid });
                expect(data.streamBuilder.execute).to.be.calledOnce;
                expect(data.streamBuilder.execute).to.be.calledImmediatelyAfter(data.streamBuilder.where);
            });

            it("ipcMain:errorStream no stream in store()", async () => {
                data.error = "Some awesome error";
                data.errorStreamId = "123";
                window.ipcRenderer.send("ipcMain:errorStream", { streamId: data.errorStreamId, error: data.error });
                expectedActions = [];
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.on).to.be.called.calledWith("ipcMain:finishStream");
                expect(fakeDB.streamBuilder).to.be.callCount(0);
            });

            it("ipcMain:updateStreamSec()", async () => {
                data.streamId = "test";
                data.sec = 5;
                fakeAccount.checkBalance.returns({ ok: true, type: SUCCESS_RESPONSE });
                fakeChannels.getChannels.returns({ ok: true, type: SUCCESS_RESPONSE });
                window.ipcRenderer.send("ipcMain:updateStreamSec", { streamId: data.streamId, sec: data.sec });
                expectedActions = [
                    successResp,
                    {
                        payload: { currentPart: data.sec, streamId: data.streamId },
                        type: types.STREAM_CURRENT_SEC,
                    },
                    successResp,
                ];
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.on).to.be.called.calledWith("ipcMain:updateStreamSec");
            });

            it("ipcMain:saveStreamPart()", async () => {
                expectedActions = [];
                window.ipcRenderer.send("ipcMain:saveStreamPart", {
                    streamId: data.streamId, streamPaymentHash: data.streamPaymentHash,
                });
                expect(window.ipcRenderer.on).to.be.called.calledWith("ipcMain:saveStreamPart");
                expect(fakeDB.streamPartBuilder).to.be.calledOnce;
                expect(data.streamPartBuilder.insert).to.be.calledOnce;
                expect(data.streamPartBuilder.insert).to.be.calledImmediatelyAfter(fakeDB.streamPartBuilder);
                expect(data.streamPartBuilder.values).to.be.calledOnce;
                expect(data.streamPartBuilder.values).to.be.calledImmediatelyAfter(data.streamPartBuilder.insert);
                expect(data.streamPartBuilder.values)
                    .to.be.calledWithExactly({ payment_hash: data.streamPaymentHash, stream: data.streamUuid });
                expect(data.streamPartBuilder.execute).to.be.calledOnce;
                expect(data.streamPartBuilder.execute).to.be.calledImmediatelyAfter(data.streamPartBuilder.values);
            });
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
                    type: types.STREAM_PAYMENT_PREPARE,
                },
            ];
            expect(await store.dispatch(operations.clearPrepareStreamPayment())).to.deep.equal(expectedData);
            expect(store.getActions()).to.deep.equal(expectedActions);
        });

        it("updateStreamPayment()", async () => {
            data.streamId = "foo";
            data.title = "bar";
            expectedActions = [
                {
                    payload: {
                        streamId: data.streamId,
                        title: data.title,
                    },
                    type: types.STREAM_PAYMENT_UPDATE,
                },
            ];
            expect(await store.dispatch(operations.updateStreamPayment(
                data.streamId,
                data.title,
            ))).to.deep.equal(expectedData);
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
                            currentPart: 0,
                            delay: 1000,
                            fee: "fee",
                            lightningID: data.lightningID,
                            name: "Stream payment",
                            price: 10,
                            status: types.STREAM_PAYMENT_PAUSE,
                            totalParts: 0,
                        },
                        type: types.STREAM_PAYMENT_PREPARE,
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
                        currentPart: 0,
                    },
                    {
                        body: "bar-body",
                        streamId: "bar",
                        uuid: "bar-uuid",
                        currentPart: 0,
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
                            status: types.STREAM_PAYMENT_PAUSE,
                            streamId: "foo-uuid",
                        },
                        type: types.STREAM_PAYMENT_STATUS,
                    },
                ];
                expect(await store.dispatch(operations.pauseStreamPayment(data.streamId))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).to.be.calledOnce;
                expect(window.ipcRenderer.send).to.be.calledWith("pauseStream");
                expect(fakeDB.streamBuilder).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.calledOnce;
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set)
                    .to.be.calledWithExactly({ currentPart: 0, status: "pause" });
                expect(data.streamBuilder.where).to.be.calledOnce;
                expect(data.streamBuilder.where).to.be.calledImmediatelyAfter(data.streamBuilder.set);
                expect(data.streamBuilder.where).to.be.calledWithExactly("id = :id", { id: "foo-uuid" });
                expect(data.streamBuilder.execute).to.be.calledOnce;
                expect(data.streamBuilder.execute).to.be.calledImmediatelyAfter(data.streamBuilder.where);
            });
        });

        describe("pauseAllStream()", () => {
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
                        currentPart: 0,
                        status: types.STREAM_PAYMENT_STREAMING,
                    },
                    {
                        body: "bar-body",
                        streamId: "bar",
                        uuid: "bar-uuid",
                        currentPart: 0,
                        status: types.STREAM_PAYMENT_PAUSE,
                    },
                ];
                store = mockStore(initState);
                fakeStore.dispatch = store.dispatch;
                fakeStore.getState = store.getState;
            });

            it("empty streams list", async () => {
                initState.streamPayment.streams = [];
                expect(await store.dispatch(operations.pauseAllStream(data.streamId))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.streamBuilder).not.to.be.called;
            });

            it("success", async () => {
                expectedActions = [
                    {
                        payload: {
                            status: types.STREAM_PAYMENT_PAUSE,
                            streamId: "foo-uuid",
                        },
                        type: types.STREAM_PAYMENT_STATUS,
                    },
                ];
                expect(await store.dispatch(operations.pauseAllStream(data.streamId))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).to.be.calledOnce;
                expect(window.ipcRenderer.send).to.be.calledWith("pauseStream");
                expect(fakeDB.streamBuilder).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.calledOnce;
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set)
                    .to.be.calledWithExactly({ currentPart: 0, status: "pause" });
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
                            status: types.STREAM_PAYMENT_PAUSE,
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
                    type: types.SET_STREAMS,
                },
            ];
            expect(await store.dispatch(operations.loadStreams())).to.deep.equal(expectedData);
            expect(store.getActions()).to.deep.equal(expectedActions);
            expect(window.ipcRenderer.send).to.be.calledTwice;
            expect(window.ipcRenderer.send).to.be.calledWith("addStream");
            expect(fakeDB.streamBuilder).to.be.calledOnce;
            expect(data.streamBuilder.getMany).to.be.calledOnce;
            expect(data.streamBuilder.getMany).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
        });

        describe("submitStreamPayment()", () => {
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
                    f: "submitStreamPayment",
                };
                expect(await store.dispatch(operations.submitStreamPayment())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.streamBuilder).not.to.be.called;
            });

            it("success", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        type: types.ADD_STREAM_TO_LIST,
                    },
                ];
                expect(await store.dispatch(operations.submitStreamPayment())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).to.be.calledOnce;
                expect(window.ipcRenderer.send).to.be.calledWith("addStream");
                expect(fakeDB.streamBuilder).to.be.calledOnce;
                expect(data.streamBuilder.insert).to.be.calledOnce;
                expect(data.streamBuilder.insert).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.values).to.be.calledOnce;
                expect(data.streamBuilder.values).to.be.calledImmediatelyAfter(data.streamBuilder.insert);
                expect(data.streamBuilder.execute).to.be.calledOnce;
                expect(data.streamBuilder.execute).to.be.calledImmediatelyAfter(data.streamBuilder.values);
            });
        });

        describe("deleteStreamPayment()", () => {
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
                expect(await store.dispatch(operations.deleteStreamPayment(0))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.streamBuilder).not.to.be.called;
            });

            it("success", async () => {
                expectedActions = [
                    {
                        payload: "baz",
                        type: types.STREAM_PAYMENT_DELETE,
                    },
                ];
                expect(await store.dispatch(operations.deleteStreamPayment("baz"))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).to.be.calledOnce;
                expect(window.ipcRenderer.send).to.be.calledWith("endStream", { uuid: "baz" });
                expect(fakeDB.streamBuilder).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.calledOnce;
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set).to.be.calledWithExactly({ status: "end" });
                expect(data.streamBuilder.where).to.be.calledOnce;
                expect(data.streamBuilder.where).to.be.calledImmediatelyAfter(data.streamBuilder.set);
                expect(data.streamBuilder.where).to.be.calledWithExactly("id = :id", { id: "baz" });
                expect(data.streamBuilder.execute).to.be.calledOnce;
                expect(data.streamBuilder.execute).to.be.calledImmediatelyAfter(data.streamBuilder.where);
            });
        });

        describe("stopStreamPayment()", () => {
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
                        currentPart: 1,
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
                expect(await store.dispatch(operations.stopStreamPayment(0))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
            });

            it("success", async () => {
                expectedActions = [
                    {
                        payload: {
                            status: types.FINISHED_STREAM_PAYMENT,
                            streamId: "baz",
                        },
                        type: types.STREAM_PAYMENT_STATUS,
                    },
                ];
                expect(await store.dispatch(operations.stopStreamPayment("baz"))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).to.be.calledOnce;
                expect(window.ipcRenderer.send).to.be.calledWith("endStream", { uuid: "baz" });
                expect(fakeDB.streamBuilder).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledOnce;
                expect(data.streamBuilder.update).to.be.calledImmediatelyAfter(fakeDB.streamBuilder);
                expect(data.streamBuilder.set).to.be.calledOnce;
                expect(data.streamBuilder.set).to.be.calledImmediatelyAfter(data.streamBuilder.update);
                expect(data.streamBuilder.set).to.be.calledWithExactly({ currentPart: 1, status: "end" });
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
                        currentPart: 1,
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
                        type: types.STREAM_PAYMENT_STATUS,
                    },
                ];
                expect(await store.dispatch(operations.startStreamPayment("baz"))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).to.be.calledOnce;
                expect(window.ipcRenderer.send).to.be.calledWith(
                    "startStream",
                    {
                        currentPart: 1,
                        delay: 1000,
                        streamId: "baz",
                        totalParts: 2,
                        uuid: "baz",
                    },
                );
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
                        status: types.FINISHED_STREAM_PAYMENT,
                        extra: "bar",
                    },
                    {
                        status: types.STREAM_PAYMENT_PAUSE,
                        extra: "foo",
                    },
                ];
                expectedData = false;
                expect(selectors.isActiveStreamRunning(state)).to.deep.equal(expectedData);
            });

            it("contain streaming stream", () => {
                state.streamPayment.streams = [
                    {
                        status: types.STREAM_PAYMENT_PAUSE,
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
