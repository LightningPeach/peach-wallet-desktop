import configureStore from "redux-mock-store";
import omit from "lodash/omit";
import thunk from "redux-thunk";

import { exceptions } from "config";
import {
    channelsActions as actions,
    channelsTypes as types,
    channelsOperations as operations,
    channelsSelectors as selectors,
} from "modules/channels";
import channelsReducer, { initStateChannels } from "modules/channels/reducers";
import { accountTypes } from "modules/account";
import { appTypes, appOperations } from "modules/app";
import { onChainOperations } from "modules/onchain";
import { db, errorPromise, successPromise } from "additional";

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe("Channels Unit Tests", () => {
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

        it("should create an action to set channels", () => {
            expectedData.type = types.SET_CHANNELS;
            expect(actions.setChannels(data)).to.deep.equal(expectedData);
        });

        it("should create an action for preparing new channel", () => {
            expectedData.type = types.NEW_CHANNEL_PREPARING;
            expect(actions.newChannelPreparing(data)).to.deep.equal(expectedData);
        });

        it("should create an action to clear preparing for new channels", () => {
            expectedData = {
                type: types.CLEAR_NEW_CHANNEL_PREPARING,
            };
            expect(actions.clearNewChannelPreparing()).to.deep.equal(expectedData);
        });

        it("should create an action to set current channels", () => {
            expectedData.type = types.SET_CURRENT_CHANNEL;
            expect(actions.setCurrentChannel(data)).to.deep.equal(expectedData);
        });

        it("should create an action to clear current channels", () => {
            expectedData = {
                type: types.CLEAR_CURRENT_CHANNEL,
            };
            expect(actions.clearCurrentChannel()).to.deep.equal(expectedData);
        });

        it("should create a channels error action", () => {
            expectedData = {
                error: data,
                type: types.ERROR_CHANNELS,
            };
            expect(actions.errorChannels(data)).to.deep.equal(expectedData);
        });

        it("should create an action to start create new channel", () => {
            expectedData = {
                type: types.START_CREATE_NEW_CHANNEL,
            };
            expect(actions.startCreateNewChannel()).to.deep.equal(expectedData);
        });

        it("should create an action to end create new channel", () => {
            expectedData = {
                type: types.END_CREATE_NEW_CHANNEL,
            };
            expect(actions.endCreateNewChannel()).to.deep.equal(expectedData);
        });

        it("should create an action after success channel creation", () => {
            expectedData.type = types.SUCCESS_CREATE_NEW_CHANNEL;
            expect(actions.successCreateNewChannel(data)).to.deep.equal(expectedData);
        });

        it("should create a new channel creation error action", () => {
            data = {
                error: "foo",
            };
            expectedData = {
                payload: {
                    newChannelStatus: "failed",
                    newChannelStatusDetails: data.error,
                },
                type: types.ERROR_CREATE_NEW_CHANNEL,
            };
            expect(actions.errorCreateNewChannel(data)).to.deep.equal(expectedData);
        });

        it("should create an action to update create tutorial status", () => {
            expectedData.type = types.UPDATE_CREATE_TUTORIAL_STATUS;
            expect(actions.updateCreateTutorialStatus(data)).to.deep.equal(expectedData);
        });

        it("should create an action for adding to delete", () => {
            expectedData.type = types.ADD_TO_DELETE;
            expect(actions.addToDelete(data)).to.deep.equal(expectedData);
        });

        it("should create an action for removing from delete", () => {
            expectedData.type = types.REMOVE_FROM_DELETE;
            expect(actions.removeFromDelete(data)).to.deep.equal(expectedData);
        });
    });

    describe("Operations tests", () => {
        const txId = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
        const name = "waldo";
        let data;
        let store;
        let initState;
        let expectedActions;
        let expectedData;
        let errorResp;
        let successResp;
        let fakeDispatchReturnError;
        let fakeDispatchReturnSuccess;
        let fakeOnchain;
        let fakeApp;
        let fakeDB;

        beforeEach(async () => {
            errorResp = await errorPromise(undefined, { name: undefined });
            successResp = await successPromise();
            fakeDispatchReturnError = () => errorResp;
            fakeDispatchReturnSuccess = () => successResp;
            fakeOnchain = sinon.stub(onChainOperations);
            fakeApp = sinon.stub(appOperations);
            fakeDB = sinon.stub(db);
            window.ipcClient.resetHistory();
            data = {
                configBuilder: {
                    update: sinon.stub(),
                    set: sinon.stub(),
                    execute: sinon.stub(),
                    select: sinon.stub(),
                    where: sinon.stub(),
                    getOne: sinon.stub(),
                },
                channelsBuilder: {
                    update: sinon.stub(),
                    set: sinon.stub(),
                    where: sinon.stub(),
                    insert: sinon.stub(),
                    values: sinon.stub(),
                    execute: sinon.stub(),
                    getMany: sinon.stub(),
                },
                onchainBuilder: {
                    update: sinon.stub(),
                    select: sinon.stub(),
                    insert: sinon.stub(),
                    set: sinon.stub(),
                    where: sinon.stub(),
                    getOne: sinon.stub(),
                    values: sinon.stub(),
                    execute: sinon.stub(),
                },
            };
            initState = {
                app: { dbStatus: appTypes.DB_OPENED },
                channels: { ...initStateChannels },
            };
            expectedData = undefined;
            expectedActions = [];
            store = mockStore(initState);
        });

        afterEach(() => {
            sinon.restore();
        });

        describe("Modal windows", () => {
            beforeEach(() => {
                expectedData = { type: appTypes.SET_MODAL_STATE };
            });
            it("openStreamWarningModal()", async () => {
                expectedData.payload = types.MODAL_WARNING;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.openStreamWarningModal())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("openNewChannelModal()", async () => {
                expectedData.payload = types.MODAL_STATE_NEW_CHANNEL;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.openNewChannelModal())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("openEditChannelModal()", async () => {
                expectedData.payload = types.MODAL_STATE_EDIT_CHANNEL;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.openEditChannelModal())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("openDeleteChannelModal()", async () => {
                expectedData.payload = types.MODAL_STATE_DELETE_CHANNEL;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.openDeleteChannelModal())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("openForceDeleteChannelModal()", async () => {
                expectedData.payload = types.MODAL_STATE_FORCE_DELETE_CHANNEL;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.openForceDeleteChannelModal())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });
        });

        it("getDbChannels()", async () => {
            const channs = [{ fundingTxid: 4 }, { fundingTxid: 1 }];
            fakeDB.channelsBuilder.returns({
                getMany: data.channelsBuilder.getMany.returns(channs),
            });
            expectedData = { 1: { fundingTxid: 1 }, 4: { fundingTxid: 4 } };
            expectedActions = [];
            expect(await operations.getDbChannels()).to.deep.equal(expectedData);
            expect(store.getActions()).to.deep.equal(expectedActions);
            expect(fakeDB.channelsBuilder).to.be.calledOnce;
        });

        describe("getChannels()", () => {
            let history;
            let channs;

            beforeEach(() => {
                fakeOnchain.getOnchainHistory.returns(successResp);
                fakeApp.sendSystemNotification.returns(successResp);
                fakeApp.convertSatoshiToCurrentMeasure.returns("amount");
                channs = [{ fundingTxid: 4 }, { fundingTxid: 1 }];
                fakeDB.channelsBuilder.returns({
                    getMany: data.channelsBuilder.getMany.returns(channs),
                    insert: data.channelsBuilder.insert.returns({
                        values: data.channelsBuilder.values.returns({
                            execute: data.channelsBuilder.execute,
                        }),
                    }),
                    update: data.channelsBuilder.update.returns({
                        set: data.channelsBuilder.set.returns({
                            where: data.channelsBuilder.where.returns({
                                execute: data.channelsBuilder.execute,
                            }),
                        }),
                    }),
                });
                history = [];
                initState = {
                    app: {
                        dbStatus: appTypes.DB_OPENED,
                    },
                    account: {
                        bitcoinMeasureType: "mBTC",
                    },
                    channels: {
                        ...initStateChannels,
                        creatingNewChannel: false,
                        channels: [],
                    },
                    onchain: {
                        history,
                    },
                };
                store = mockStore(initState);
                window.ipcClient
                    .withArgs("getInfo")
                    .returns({ ok: true, response: { block_height: 100 } })
                    .withArgs("pendingChannels")
                    .returns({ ok: true, response: { pending_open_channels: [] } })
                    .withArgs("listChannels")
                    .returns({ ok: true, response: { channels: [] } });
            });

            it("do nothing if db not opened", async () => {
                initState.app.dbStatus = appTypes.DB_CLOSED;
                store = mockStore(initState);
                expect(await store.dispatch(operations.getChannels())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.channelsBuilder).not.to.be.called;
                expect(fakeApp.sendSystemNotification).not.to.be.called;
            });

            it("do nothing if channel creation in process", async () => {
                initState.channels.creatingNewChannel = true;
                store = mockStore(initState);
                expect(await store.dispatch(operations.getChannels())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcRenderer.send).not.to.be.called;
                expect(fakeDB.channelsBuilder).not.to.be.called;
                expect(fakeApp.sendSystemNotification).not.to.be.called;
            });

            it("getInfo error", async () => {
                history = [
                    { tx_hash: "4", num_confirmations: "1" },
                    { tx_hash: "4", num_confirmations: "2" },
                ];
                initState.onchain = { history };
                store = mockStore(initState);
                window.ipcClient
                    .withArgs("getInfo")
                    .returns(errorResp);
                expectedActions = [successResp];
                expect(await store.dispatch(operations.getChannels())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("getInfo");
                expect(fakeApp.sendSystemNotification).not.to.be.called;
            });

            it("success with pending channels and closed channel by counterparty", async () => {
                history = [
                    { tx_hash: "4", num_confirmations: "1" },
                    { tx_hash: "4", num_confirmations: "2" },
                ];
                initState.onchain = { history };
                initState.channels.deleteQueue = ["4:1"];
                store = mockStore(initState);
                window.ipcClient
                    .withArgs("pendingChannels")
                    .returns({
                        ok: true,
                        response: {
                            pending_open_channels: [
                                {
                                    commit_fee: 11,
                                    commit_weight: 12,
                                    fee_per_kw: 13,
                                    channel: {
                                        capacity: 14,
                                        channel_point: "4",
                                        local_balance: 5,
                                        remote_balance: 15,
                                        remote_node_pub: "foo",
                                    },
                                },
                                {
                                    commit_fee: 21,
                                    commit_weight: 22,
                                    fee_per_kw: 23,
                                    channel: {
                                        capacity: 24,
                                        channel_point: "3",
                                        local_balance: 6,
                                        remote_balance: 25,
                                        remote_node_pub: "bar",
                                    },
                                },
                                {
                                    commit_fee: 21,
                                    commit_weight: 22,
                                    fee_per_kw: 23,
                                    channel: {
                                        capacity: 24,
                                        channel_point: "5",
                                        local_balance: 6,
                                        remote_balance: 25,
                                        remote_node_pub: "bar",
                                    },
                                },
                            ],
                        },
                    });
                channs = [
                    { fundingTxid: "4", name: "test" },
                    { fundingTxid: "1" },
                    { fundingTxid: "5", status: "active", name: "notify" },
                ];
                fakeDB.channelsBuilder.returns({
                    getMany: data.channelsBuilder.getMany.returns(channs),
                    insert: data.channelsBuilder.insert.returns({
                        values: data.channelsBuilder.values.returns({
                            execute: data.channelsBuilder.execute,
                        }),
                    }),
                    update: data.channelsBuilder.update.returns({
                        set: data.channelsBuilder.set.returns({
                            where: data.channelsBuilder.where.returns({
                                execute: data.channelsBuilder.execute,
                            }),
                        }),
                    }),
                });
                expectedActions = [
                    successResp,
                    successResp,
                    {
                        payload: [
                            {
                                capacity: 14,
                                chan_id: 0,
                                channel_point: "4",
                                commit_fee: 11,
                                commit_weight: 12,
                                fee_per_kw: 13,
                                local_balance: 5,
                                maturity: 1,
                                name: "test",
                                remote_balance: 15,
                                remote_pubkey: "foo",
                                status: types.CHANNEL_STATUS_PENDING,
                            },
                            {
                                capacity: 24,
                                chan_id: 0,
                                channel_point: "3",
                                commit_fee: 21,
                                commit_weight: 22,
                                fee_per_kw: 23,
                                local_balance: 6,
                                maturity: 0,
                                name: "CHANNEL 1",
                                remote_balance: 25,
                                remote_pubkey: "bar",
                                status: types.CHANNEL_STATUS_PENDING,
                            },
                            {
                                capacity: 24,
                                chan_id: 0,
                                channel_point: "5",
                                commit_fee: 21,
                                commit_weight: 22,
                                fee_per_kw: 23,
                                local_balance: 6,
                                maturity: 0,
                                name: "notify",
                                remote_balance: 25,
                                remote_pubkey: "bar",
                                status: types.CHANNEL_STATUS_PENDING,
                            },
                        ],
                        type: types.SET_CHANNELS,
                    },
                ];
                expect(await store.dispatch(operations.getChannels())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledThrice;
                expect(window.ipcClient).to.be.calledWith("getInfo");
                expect(window.ipcClient).to.be.calledWith("pendingChannels");
                expect(window.ipcClient).to.be.calledWith("listChannels");
                expect(fakeDB.channelsBuilder).to.be.callCount(5);
                expect(data.channelsBuilder.insert).to.be.calledOnce;
                expect(data.channelsBuilder.insert).to.be.calledAfter(fakeDB.channelsBuilder);
                expect(data.channelsBuilder.values).to.be.calledOnce;
                expect(data.channelsBuilder.values).to.be.calledImmediatelyAfter(data.channelsBuilder.insert);
                expect(data.channelsBuilder.values)
                    .to.be.calledWithExactly({
                        activeStatus: false,
                        fundingTxid: "3",
                        localBalance: 6,
                        name: "CHANNEL 1",
                        remoteBalance: 25,
                        status: "pending",
                    });
                expect(data.channelsBuilder.update).to.be.calledThrice;
                expect(data.channelsBuilder.update).to.be.calledImmediatelyAfter(fakeDB.channelsBuilder);
                expect(data.channelsBuilder.set).to.be.calledThrice;
                expect(data.channelsBuilder.set).to.be.calledImmediatelyAfter(data.channelsBuilder.update);
                expect(data.channelsBuilder.set)
                    .to.be.calledWithExactly({
                        activeStatus: false,
                        localBalance: 5,
                        remoteBalance: 15,
                        status: "pending",
                    });
                expect(data.channelsBuilder.where).to.be.calledThrice;
                expect(data.channelsBuilder.where).to.be.calledImmediatelyAfter(data.channelsBuilder.set);
                expect(data.channelsBuilder.where)
                    .to.be.calledWithExactly("fundingTxid = :txID", {
                        txID: "4",
                    });
                expect(data.channelsBuilder.execute).to.be.callCount(4);
                expect(data.channelsBuilder.execute).to.be.calledImmediatelyAfter(data.channelsBuilder.where);
                expect(data.channelsBuilder.execute).to.be.calledAfter(data.channelsBuilder.values);
                expect(data.channelsBuilder.getMany).to.be.calledOnce;
                expect(fakeApp.sendSystemNotification).to.be.calledOnce;
                expect(fakeApp.sendSystemNotification).to.be.calledWithExactly({
                    title: "notify",
                    body: "Channel has been closed by counterparty",
                });
            });

            it("success with active channels", async () => {
                window.ipcClient
                    .withArgs("listChannels")
                    .returns({
                        ok: true,
                        response: {
                            channels: [
                                {
                                    capacity: 14,
                                    chan_id: 2,
                                    channel_point: "4",
                                    commit_fee: 11,
                                    commit_weight: 12,
                                    fee_per_kw: 13,
                                    local_balance: 5,
                                    maturity: 1,
                                    name: "test",
                                    remote_balance: 15,
                                    remote_pubkey: "foo",
                                    active: true,
                                },
                                {
                                    capacity: 24,
                                    chan_id: 1,
                                    channel_point: "3",
                                    commit_fee: 21,
                                    commit_weight: 22,
                                    fee_per_kw: 23,
                                    local_balance: 6,
                                    maturity: 0,
                                    name: "CHANNEL 1",
                                    remote_balance: 25,
                                    remote_pubkey: "bar",
                                    active: false,
                                },
                            ],
                        },
                    });
                channs = [{ fundingTxid: "4", name: "test" }, { fundingTxid: "1" }];
                fakeDB.channelsBuilder.returns({
                    getMany: data.channelsBuilder.getMany.returns(channs),
                    insert: data.channelsBuilder.insert.returns({
                        values: data.channelsBuilder.values.returns({
                            execute: data.channelsBuilder.execute,
                        }),
                    }),
                    update: data.channelsBuilder.update.returns({
                        set: data.channelsBuilder.set.returns({
                            where: data.channelsBuilder.where.returns({
                                execute: data.channelsBuilder.execute,
                            }),
                        }),
                    }),
                });
                expectedActions = [
                    successResp,
                    {
                        payload: [
                            {
                                capacity: 24,
                                chan_id: 1,
                                channel_point: "3",
                                commit_fee: 21,
                                commit_weight: 22,
                                fee_per_kw: 23,
                                local_balance: 6,
                                maturity: 100,
                                name: "CHANNEL 1",
                                remote_balance: 25,
                                remote_pubkey: "bar",
                                status: types.CHANNEL_STATUS_NOT_ACTIVE,
                            },
                            {
                                capacity: 14,
                                chan_id: 2,
                                channel_point: "4",
                                commit_fee: 11,
                                commit_weight: 12,
                                fee_per_kw: 13,
                                local_balance: 5,
                                maturity: 100,
                                name: "test",
                                remote_balance: 15,
                                remote_pubkey: "foo",
                                status: types.CHANNEL_STATUS_ACTIVE,
                            },
                        ],
                        type: types.SET_CHANNELS,
                    },
                ];
                expect(await store.dispatch(operations.getChannels())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledThrice;
                expect(window.ipcClient).to.be.calledWith("getInfo");
                expect(window.ipcClient).to.be.calledWith("pendingChannels");
                expect(window.ipcClient).to.be.calledWith("listChannels");
                expect(fakeDB.channelsBuilder).to.be.calledThrice;
                expect(data.channelsBuilder.insert).to.be.calledOnce;
                expect(data.channelsBuilder.insert).to.be.calledAfter(fakeDB.channelsBuilder);
                expect(data.channelsBuilder.values).to.be.calledOnce;
                expect(data.channelsBuilder.values).to.be.calledImmediatelyAfter(data.channelsBuilder.insert);
                expect(data.channelsBuilder.values)
                    .to.be.calledWithExactly({
                        activeStatus: false,
                        fundingTxid: "3",
                        localBalance: 6,
                        name: "CHANNEL 1",
                        remoteBalance: 25,
                        status: "active",
                    });
                expect(data.channelsBuilder.update).to.be.calledOnce;
                expect(data.channelsBuilder.update).to.be.calledAfter(fakeDB.channelsBuilder);
                expect(data.channelsBuilder.set).to.be.calledOnce;
                expect(data.channelsBuilder.set).to.be.calledImmediatelyAfter(data.channelsBuilder.update);
                expect(data.channelsBuilder.set)
                    .to.be.calledWithExactly({
                        activeStatus: true,
                        localBalance: 5,
                        remoteBalance: 15,
                        status: "active",
                    });
                expect(data.channelsBuilder.where).to.be.calledOnce;
                expect(data.channelsBuilder.where).to.be.calledImmediatelyAfter(data.channelsBuilder.set);
                expect(data.channelsBuilder.where)
                    .to.be.calledWithExactly("fundingTxid = :txID", {
                        txID: "4",
                    });
                expect(data.channelsBuilder.execute).to.be.calledTwice;
                expect(data.channelsBuilder.execute).to.be.calledAfter(data.channelsBuilder.values);
                expect(data.channelsBuilder.execute).to.be.calledImmediatelyAfter(data.channelsBuilder.where);
                expect(data.channelsBuilder.getMany).to.be.calledOnce;
                expect(fakeApp.sendSystemNotification).not.to.be.called;
            });

            it("success with handling channels system notifications", async () => {
                fakeApp.convertSatoshiToCurrentMeasure.returns(successResp);
                channs = [
                    {
                        fundingTxid: "1",
                        name: "test1",
                        status: "pending",
                    },
                    {
                        fundingTxid: "2",
                        name: "test2",
                        activeStatus: true,
                        localBalance: 5,
                        status: "active",
                    },
                    {
                        fundingTxid: "3",
                        name: "test3",
                        activeStatus: false,
                        localBalance: 2000,
                        status: "active",
                    },
                ];
                fakeDB.channelsBuilder.returns({
                    getMany: data.channelsBuilder.getMany.returns(channs),
                    insert: data.channelsBuilder.insert.returns({
                        values: data.channelsBuilder.values.returns({
                            execute: data.channelsBuilder.execute,
                        }),
                    }),
                    update: data.channelsBuilder.update.returns({
                        set: data.channelsBuilder.set.returns({
                            where: data.channelsBuilder.where.returns({
                                execute: data.channelsBuilder.execute,
                            }),
                        }),
                    }),
                });
                window.ipcClient
                    .withArgs("listChannels")
                    .returns({
                        ok: true,
                        response: {
                            channels: [
                                {
                                    capacity: 14,
                                    chan_id: 2,
                                    channel_point: "2",
                                    commit_fee: 11,
                                    commit_weight: 12,
                                    fee_per_kw: 13,
                                    local_balance: 1,
                                    maturity: 1,
                                    remote_balance: 15,
                                    remote_pubkey: "foo",
                                    active: false,
                                },
                                {
                                    capacity: 24,
                                    chan_id: 1,
                                    channel_point: "1",
                                    commit_fee: 21,
                                    commit_weight: 22,
                                    fee_per_kw: 23,
                                    local_balance: 6,
                                    maturity: 0,
                                    remote_balance: 25,
                                    remote_pubkey: "bar",
                                    active: true,
                                },
                                {
                                    capacity: 34,
                                    chan_id: 3,
                                    channel_point: "3",
                                    commit_fee: 33,
                                    commit_weight: 35,
                                    fee_per_kw: 36,
                                    local_balance: 8000,
                                    maturity: 0,
                                    remote_balance: 25000,
                                    remote_pubkey: "bar",
                                    active: true,
                                },
                            ],
                        },
                    });
                expectedActions = [
                    successResp,
                    successResp,
                    successResp,
                    successResp,
                    successResp,
                    successResp,
                    successResp,
                    successResp,
                    {
                        payload: [
                            {
                                capacity: 24,
                                chan_id: 1,
                                channel_point: "1",
                                commit_fee: 21,
                                commit_weight: 22,
                                fee_per_kw: 23,
                                local_balance: 6,
                                maturity: 100,
                                name: "test1",
                                remote_balance: 25,
                                remote_pubkey: "bar",
                                status: types.CHANNEL_STATUS_ACTIVE,
                            },
                            {
                                capacity: 14,
                                chan_id: 2,
                                channel_point: "2",
                                commit_fee: 11,
                                commit_weight: 12,
                                fee_per_kw: 13,
                                local_balance: 1,
                                maturity: 100,
                                name: "test2",
                                remote_balance: 15,
                                remote_pubkey: "foo",
                                status: types.CHANNEL_STATUS_NOT_ACTIVE,
                            },
                            {
                                capacity: 34,
                                chan_id: 3,
                                channel_point: "3",
                                commit_fee: 33,
                                commit_weight: 35,
                                fee_per_kw: 36,
                                local_balance: 8000,
                                maturity: 100,
                                name: "test3",
                                remote_balance: 25000,
                                remote_pubkey: "bar",
                                status: types.CHANNEL_STATUS_ACTIVE,
                            },
                        ],
                        type: types.SET_CHANNELS,
                    },
                ];
                expect(await store.dispatch(operations.getChannels())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledThrice;
                expect(window.ipcClient).to.be.calledWith("getInfo");
                expect(window.ipcClient).to.be.calledWith("pendingChannels");
                expect(window.ipcClient).to.be.calledWith("listChannels");
                expect(fakeDB.channelsBuilder).to.be.callCount(4);
                expect(data.channelsBuilder.insert).not.to.be.called;
                expect(data.channelsBuilder.update).to.be.calledThrice;
                expect(data.channelsBuilder.update).to.be.calledAfter(fakeDB.channelsBuilder);
                expect(data.channelsBuilder.set).to.be.calledThrice;
                expect(data.channelsBuilder.set).to.be.calledImmediatelyAfter(data.channelsBuilder.update);
                expect(data.channelsBuilder.set)
                    .to.be.calledWithExactly({
                        activeStatus: true,
                        localBalance: 6,
                        remoteBalance: 25,
                        status: "active",
                    });
                expect(data.channelsBuilder.set)
                    .to.be.calledWithExactly({
                        activeStatus: false,
                        localBalance: 1,
                        remoteBalance: 15,
                        status: "active",
                    });
                expect(data.channelsBuilder.set)
                    .to.be.calledWithExactly({
                        activeStatus: true,
                        localBalance: 8000,
                        remoteBalance: 25000,
                        status: "active",
                    });
                expect(data.channelsBuilder.where).to.be.calledThrice;
                expect(data.channelsBuilder.where).to.be.calledImmediatelyAfter(data.channelsBuilder.set);
                expect(data.channelsBuilder.where)
                    .to.be.calledWithExactly("fundingTxid = :txID", {
                        txID: "1",
                    });
                expect(data.channelsBuilder.where)
                    .to.be.calledWithExactly("fundingTxid = :txID", {
                        txID: "2",
                    });
                expect(data.channelsBuilder.where)
                    .to.be.calledWithExactly("fundingTxid = :txID", {
                        txID: "3",
                    });
                expect(data.channelsBuilder.execute).to.be.calledThrice;
                expect(data.channelsBuilder.execute).to.be.calledImmediatelyAfter(data.channelsBuilder.where);
                expect(data.channelsBuilder.getMany).to.be.calledOnce;
                expect(fakeApp.sendSystemNotification).to.be.callCount(5);
            });

            it("success and not dispatch any actions if channels equivalent", async () => {
                expectedActions = [successResp];
                expect(await store.dispatch(operations.getChannels())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledThrice;
                expect(window.ipcClient).to.be.calledWith("getInfo");
                expect(window.ipcClient).to.be.calledWith("pendingChannels");
                expect(window.ipcClient).to.be.calledWith("listChannels");
                expect(fakeDB.channelsBuilder).to.be.calledOnce;
                expect(data.channelsBuilder.getMany).to.be.calledOnce;
                expect(data.channelsBuilder.getMany).to.be.calledImmediatelyAfter(fakeDB.channelsBuilder);
                expect(fakeApp.sendSystemNotification).not.to.be.called;
            });
        });

        describe("connectPeer()", () => {
            let error;

            beforeEach(() => {
                error = "error";
                data.lightningID = "lightningID";
                data.peer = "peer";
                data.ipcExpected = ["connectPeer", { addr: { host: data.peer, pubkey: data.lightningID } }];
                window.ipcClient
                    .withArgs("connectPeer")
                    .returns({ ok: true });
            });

            it("error", async () => {
                window.ipcClient
                    .withArgs("connectPeer")
                    .returns({ ok: false, error });
                expectedData = { ...errorResp, f: "connectPeer", error };
                expectedActions = [];
                expect(await store.dispatch(operations.connectPeer(data.lightningID, data.peer)))
                    .to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith(...data.ipcExpected);
            });

            it("success even if already connected error", async () => {
                error = "Already connected";
                window.ipcClient
                    .withArgs("connectPeer")
                    .returns({ ok: false, error });
                expectedData = { ...successResp };
                expect(await store.dispatch(operations.connectPeer(data.lightningID, data.peer)))
                    .to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith(...data.ipcExpected);
            });

            it("success", async () => {
                expectedData = { ...successResp };
                expect(await store.dispatch(operations.connectPeer(data.lightningID, data.peer)))
                    .to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith(...data.ipcExpected);
            });
        });

        describe("prepareNewChannel()", () => {
            beforeEach(() => {
                data.channelCapacity = 1000;
                data.channelLightningID = "lightningID";
                data.channelPeerAddress = "peer";
                data.channelName = "test";
                data.channelCutom = false;
                initState.account = { kernelConnectIndicator: accountTypes.KERNEL_CONNECTED };
            });

            it("error", async () => {
                initState.account.kernelConnectIndicator = accountTypes.KERNEL_DISCONNECTED;
                store = mockStore(initState);
                expectedData = {
                    ...errorResp,
                    f: "prepareNewChannel",
                    error: exceptions.ACCOUNT_NO_KERNEL,
                };
                expect(await store.dispatch(operations.prepareNewChannel(
                    data.channelLightningID,
                    data.channelCapacity,
                    data.channelPeerAddress,
                    data.channelName,
                    data.channelCutom,
                ))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("success", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: {
                            capacity: data.channelCapacity,
                            custom: data.channelCutom,
                            host: data.channelPeerAddress,
                            lightningID: data.channelLightningID,
                            name: "Channel 1",
                        },
                        type: types.NEW_CHANNEL_PREPARING,
                    },
                ];
                expect(await store.dispatch(operations.prepareNewChannel(
                    data.channelLightningID,
                    data.channelCapacity,
                    data.channelPeerAddress,
                    undefined,
                    data.channelCutom,
                ))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("success with custom name", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: {
                            capacity: data.channelCapacity,
                            custom: data.channelCutom,
                            host: data.channelPeerAddress,
                            lightningID: data.channelLightningID,
                            name: data.channelName,
                        },
                        type: types.NEW_CHANNEL_PREPARING,
                    },
                ];
                expect(await store.dispatch(operations.prepareNewChannel(
                    data.channelLightningID,
                    data.channelCapacity,
                    data.channelPeerAddress,
                    data.channelName,
                    data.channelCutom,
                ))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });
        });

        describe("setCurrentChannel()", () => {
            beforeEach(() => {
                data.channel = { name: "test" };
                initState.channels.channels = [data.channel];
                store = mockStore(initState);
            });

            it("errors", async () => {
                expectedData = {
                    ...errorResp,
                    f: "setCurrentChannel",
                    error: exceptions.CHANNEL_ABSENT,
                };
                expect(await store.dispatch(operations.setCurrentChannel(1))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("errors", async () => {
                expectedData = { ...successResp };
                expectedActions = [{
                    payload: data.channel,
                    type: types.SET_CURRENT_CHANNEL,
                }];
                expect(await store.dispatch(operations.setCurrentChannel(0))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });
        });

        it("clearCurrentChannel()", async () => {
            expectedData = { ...successResp };
            expectedActions = [{ type: types.CLEAR_CURRENT_CHANNEL }];
            expect(await store.dispatch(operations.clearCurrentChannel())).to.deep.equal(expectedData);
            expect(store.getActions()).to.deep.equal(expectedActions);
        });

        describe("closeChannel()", () => {
            beforeEach(() => {
                data.txid = "some_txid";
                data.error = "error";
                data.channel = {
                    name: "test",
                    channel_point: "some_point:0",
                    local_balance: 100,
                };
                data.closeChannel = {
                    channel_point: {
                        funding_txid_str: "some_point",
                        output_index: 0,
                    },
                    target_conf: 6,
                };
                data.channelsBuilder = {
                    ...data.channelsBuilder,
                    setValues: {
                        activeStatus: false,
                        status: "deleted",
                    },
                    whereValues: ["fundingTxid = :txID", { txID: data.channel.channel_point.split(":")[0] }],
                };
                data.onchainBuilder = {
                    ...data.onchainBuilder,
                    setValues: {
                        address: "-",
                        amount: data.channel.local_balance,
                        blockHash: "",
                        blockHeight: 0,
                        name: `Closing ${data.channel.name}`,
                        numConfirmations: 0,
                        status: "pending",
                        timeStamp: Math.floor(Date.now() / 1000),
                        totalFees: 0,
                        txHash: data.txid,
                    },
                };
                fakeDB.channelsBuilder.returns({
                    update: data.channelsBuilder.update.returns({
                        set: data.channelsBuilder.set.returns({
                            where: data.channelsBuilder.where.returns({
                                execute: data.channelsBuilder.execute,
                            }),
                        }),
                    }),
                });
                fakeDB.onchainBuilder.returns({
                    insert: data.onchainBuilder.insert.returns({
                        values: data.onchainBuilder.values.returns({
                            execute: data.onchainBuilder.execute,
                        }),
                    }),
                });
                window.ipcClient
                    .withArgs("closeChannel")
                    .returns({ ok: true, txid: data.txid });
            });

            it("error close channel", async () => {
                window.ipcClient
                    .withArgs("closeChannel")
                    .returns({ ok: false, error: data.error });
                expectedData = {
                    ...errorResp,
                    f: "closeChannel",
                    error: data.error,
                };
                expectedActions = [
                    {
                        payload: data.channel.channel_point,
                        type: types.ADD_TO_DELETE,
                    },
                    {

                        payload: data.channel.channel_point,
                        type: types.REMOVE_FROM_DELETE,
                    },
                ];
                expect(await store.dispatch(operations.closeChannel(data.channel))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("closeChannel", data.closeChannel);
            });

            it("error force close channel", async () => {
                window.ipcClient
                    .withArgs("closeChannel")
                    .returns({ ok: false, error: data.error });
                expectedData = {
                    ...errorResp,
                    f: "closeChannel",
                    error: data.error,
                };
                expectedActions = [
                    {
                        payload: data.channel.channel_point,
                        type: types.ADD_TO_DELETE,
                    },
                    {

                        payload: data.channel.channel_point,
                        type: types.REMOVE_FROM_DELETE,
                    },
                ];
                expect(await store.dispatch(operations.closeChannel(data.channel, true))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("closeChannel", { ...data.closeChannel, force: true });
            });

            it("success close channel", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: data.channel.channel_point,
                        type: types.ADD_TO_DELETE,
                    },
                    {

                        payload: data.channel.channel_point,
                        type: types.REMOVE_FROM_DELETE,
                    },
                ];
                expect(await store.dispatch(operations.closeChannel(data.channel, true))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith(
                    "closeChannel",
                    { ...omit(data.closeChannel, "timeStamp"), force: true },
                );
                expect(fakeDB.channelsBuilder).to.be.calledOnce;
                expect(data.channelsBuilder.update).to.be.calledOnce;
                expect(data.channelsBuilder.update).to.be.calledImmediatelyAfter(fakeDB.channelsBuilder);
                expect(data.channelsBuilder.set).to.be.calledOnce;
                expect(data.channelsBuilder.set).to.be.calledImmediatelyAfter(data.channelsBuilder.update);
                expect(data.channelsBuilder.set).to.be.calledWith(data.channelsBuilder.setValues);
                expect(data.channelsBuilder.where).to.be.calledOnce;
                expect(data.channelsBuilder.where).to.be.calledImmediatelyAfter(data.channelsBuilder.set);
                expect(data.channelsBuilder.where).to.be.calledWith(...data.channelsBuilder.whereValues);
                expect(data.channelsBuilder.execute).to.be.calledOnce;
                expect(data.channelsBuilder.execute).to.be.calledImmediatelyAfter(data.channelsBuilder.where);
                expect(fakeDB.onchainBuilder).to.be.calledOnce;
                expect(data.onchainBuilder.insert).to.be.calledOnce;
                expect(data.onchainBuilder.insert).to.be.calledImmediatelyAfter(fakeDB.onchainBuilder);
                expect(data.onchainBuilder.values).to.be.calledOnce;
                expect(data.onchainBuilder.values).to.be.calledImmediatelyAfter(data.onchainBuilder.insert);
                expect(data.onchainBuilder.values).to.be.calledWith(data.onchainBuilder.setValues);
                expect(data.onchainBuilder.execute).to.be.calledOnce;
                expect(data.onchainBuilder.execute).to.be.calledImmediatelyAfter(data.onchainBuilder.values);
            });
        });

        describe("createNewChannel()", () => {
            beforeEach(() => {
                data.channelName = "channel name";
                data.capacity = 100;
                data.lightningID = "xx";
                data.channelHost = "test@host";
                store = mockStore({
                    account: {
                        bitcoinBalance: 200,
                    },
                    channels: {
                        prepareNewChannel: {
                            name: data.channelName,
                            lightningID: data.lightningID,
                            capacity: data.capacity,
                            host: data.channelHost,
                        },
                    },
                });
                fakeDB.channelsBuilder.returns({
                    insert: data.channelsBuilder.insert.returns({
                        values: data.channelsBuilder.values.returns({
                            execute: data.channelsBuilder.execute,
                        }),
                    }),
                });
                fakeDB.onchainBuilder.returns({
                    select: data.onchainBuilder.select.returns({
                        where: data.onchainBuilder.where.returns({
                            getOne: data.onchainBuilder.getOne.returns({}),
                        }),
                    }),
                    insert: data.onchainBuilder.insert.returns({
                        values: data.onchainBuilder.values.returns({
                            execute: data.onchainBuilder.execute,
                        }),
                    }),
                });
            });

            it("peers error", async () => {
                data.error = "Peers error";
                window.ipcClient
                    .withArgs("listPeers")
                    .returns({ ok: false, error: data.error });
                expectedData = {
                    ...errorResp,
                    f: "createNewChannel",
                    error: data.error,
                };
                expectedActions = [
                    {
                        type: types.START_CREATE_NEW_CHANNEL,
                    },
                    {
                        payload: { newChannelStatus: "failed", newChannelStatusDetails: undefined },
                        type: types.ERROR_CREATE_NEW_CHANNEL,
                    },
                    {
                        type: types.END_CREATE_NEW_CHANNEL,
                    },
                ];
                expect(await store.dispatch(operations.createNewChannel())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("listPeers");
            });

            it("connect peer error", async () => {
                data.error = "error";
                window.ipcClient
                    .withArgs("connectPeer")
                    .returns({ ok: false, error: data.error })
                    .withArgs("listPeers")
                    .returns({ ok: true, response: { peers: [] } });
                expectedData = { ...errorResp, f: "createNewChannel", error: data.error };
                expectedActions = [
                    {
                        type: types.START_CREATE_NEW_CHANNEL,
                    },
                    {
                        type: types.END_CREATE_NEW_CHANNEL,
                    },
                ];
                expect(await store.dispatch(operations.createNewChannel())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledTwice;
                expect(window.ipcClient).to.be.calledWith("listPeers");
                expect(window.ipcClient)
                    .to.be.calledWith("connectPeer", { addr: { host: data.channelHost, pubkey: data.lightningID } });
            });

            it("open channel error", async () => {
                data.error = "error";
                window.ipcClient
                    .withArgs("listPeers")
                    .returns({ ok: true, response: { peers: [{ address: data.lightningID }] } })
                    .withArgs("openChannel")
                    .returns({ ok: false, error: data.error });
                expectedData = { ...errorResp, f: "createNewChannel", error: data.error };
                expectedActions = [
                    {
                        type: types.START_CREATE_NEW_CHANNEL,
                    },
                    {
                        payload: { newChannelStatus: "failed", newChannelStatusDetails: undefined },
                        type: types.ERROR_CREATE_NEW_CHANNEL,
                    },
                    {
                        type: types.END_CREATE_NEW_CHANNEL,
                    },
                ];
                expect(await store.dispatch(operations.createNewChannel())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledTwice;
                expect(window.ipcClient).to.be.calledWith("listPeers");
                expect(window.ipcClient)
                    .to.be.calledWith("openChannel", {
                        local_funding_amount: data.capacity, node_pubkey_string: data.lightningID,
                    });
            });

            it("success with not exists txn", async () => {
                data.error = "error";
                data.txid = "txid";
                data.blockHeight = 50;
                fakeDB.onchainBuilder.returns({
                    select: data.onchainBuilder.select.returns({
                        where: data.onchainBuilder.where.returns({
                            getOne: data.onchainBuilder.getOne.returns(null),
                        }),
                    }),
                });
                window.ipcClient
                    .withArgs("listPeers")
                    .returns({ ok: true, response: { peers: [{ address: data.lightningID }] } })
                    .withArgs("openChannel")
                    .returns({ ok: true, funding_txid_str: data.txid, block_height: data.blockHeight });
                expectedData = { ...successResp, response: { trnID: data.txid } };
                expectedActions = [
                    {
                        type: types.START_CREATE_NEW_CHANNEL,
                    },
                    {
                        payload: 100,
                        type: types.SUCCESS_CREATE_NEW_CHANNEL,
                    },
                    {
                        type: types.END_CREATE_NEW_CHANNEL,
                    },
                    {
                        type: types.CLEAR_NEW_CHANNEL_PREPARING,
                    },
                ];
                expect(await store.dispatch(operations.createNewChannel())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledTwice;
                expect(window.ipcClient).to.be.calledWith("listPeers");
                expect(window.ipcClient)
                    .to.be.calledWith("openChannel", {
                        local_funding_amount: data.capacity, node_pubkey_string: data.lightningID,
                    });
                expect(fakeDB.channelsBuilder).to.be.calledOnce;
                expect(data.channelsBuilder.insert).to.be.calledOnce;
                expect(data.channelsBuilder.insert).to.be.calledImmediatelyAfter(fakeDB.channelsBuilder);
                expect(data.channelsBuilder.values).to.be.calledOnce;
                expect(data.channelsBuilder.values)
                    .to.be.calledWith({
                        activeStatus: false,
                        fundingTxid: data.txid,
                        localBalance: 0,
                        name: data.channelName,
                        remoteBalance: 0,
                        status: "pending",
                    });
                expect(data.channelsBuilder.values).to.be.calledImmediatelyAfter(data.channelsBuilder.insert);
                expect(data.channelsBuilder.execute).to.be.calledOnce;
                expect(data.channelsBuilder.execute).to.be.calledImmediatelyAfter(data.channelsBuilder.values);
                expect(fakeDB.onchainBuilder).to.be.calledTwice;
            });

            it("success with exists txn", async () => {
                data.error = "error";
                data.txid = "txid";
                data.blockHeight = 50;
                window.ipcClient
                    .withArgs("listPeers")
                    .returns({ ok: true, response: { peers: [{ address: data.lightningID }] } })
                    .withArgs("openChannel")
                    .returns({ ok: true, funding_txid_str: data.txid, block_height: data.blockHeight });
                expectedData = { ...successResp, response: { trnID: data.txid } };
                expectedActions = [
                    {
                        type: types.START_CREATE_NEW_CHANNEL,
                    },
                    {
                        payload: 100,
                        type: types.SUCCESS_CREATE_NEW_CHANNEL,
                    },
                    {
                        type: types.END_CREATE_NEW_CHANNEL,
                    },
                    {
                        type: types.CLEAR_NEW_CHANNEL_PREPARING,
                    },
                ];
                expect(await store.dispatch(operations.createNewChannel())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledTwice;
                expect(window.ipcClient).to.be.calledWith("listPeers");
                expect(window.ipcClient)
                    .to.be.calledWith("openChannel", {
                        local_funding_amount: data.capacity, node_pubkey_string: data.lightningID,
                    });
                expect(fakeDB.channelsBuilder).to.be.calledOnce;
                expect(data.channelsBuilder.insert).to.be.calledOnce;
                expect(data.channelsBuilder.insert).to.be.calledImmediatelyAfter(fakeDB.channelsBuilder);
                expect(data.channelsBuilder.values).to.be.calledOnce;
                expect(data.channelsBuilder.values)
                    .to.be.calledWith({
                        activeStatus: false,
                        fundingTxid: data.txid,
                        localBalance: 0,
                        name: data.channelName,
                        remoteBalance: 0,
                        status: "pending",
                    });
                expect(data.channelsBuilder.values).to.be.calledImmediatelyAfter(data.channelsBuilder.insert);
                expect(data.channelsBuilder.execute).to.be.calledOnce;
                expect(data.channelsBuilder.execute).to.be.calledImmediatelyAfter(data.channelsBuilder.values);
                expect(fakeDB.onchainBuilder).to.be.calledTwice;
            });
        });

        describe("updateChannelOnServer()", () => {
            beforeEach(() => {
                data.response = [{ data: "foo" }];
                fakeDB.channelsBuilder.returns({
                    update: data.channelsBuilder.update.returns({
                        set: data.channelsBuilder.set.returns({
                            where: data.channelsBuilder.where.returns({
                                execute: data.channelsBuilder.execute.returns(data.response),
                            }),
                        }),
                    }),
                });
            });

            it("db error", async () => {
                fakeDB.channelsBuilder.throws(new Error("foo"));
                expectedData = {
                    ...errorResp,
                    error: "foo",
                    f: "updateChannelOnServer",
                };
                expect(await store.dispatch(operations.updateChannelOnServer(
                    name,
                    txId,
                ))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.channelsBuilder).to.be.calledOnce;
                expect(data.channelsBuilder.update).not.to.be.called;
            });

            it("success", async () => {
                expectedData = { ...successResp };
                expect(await store.dispatch(operations.updateChannelOnServer(
                    name,
                    txId,
                ))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.channelsBuilder).to.be.calledOnce;
                expect(data.channelsBuilder.update).to.be.calledOnce;
                expect(data.channelsBuilder.update).to.be.calledImmediatelyAfter(fakeDB.channelsBuilder);
                expect(data.channelsBuilder.set).to.be.calledOnce;
                expect(data.channelsBuilder.set).to.be.calledImmediatelyAfter(data.channelsBuilder.update);
                expect(data.channelsBuilder.set).to.be.calledWith({ name });
                expect(data.channelsBuilder.where).to.be.calledOnce;
                expect(data.channelsBuilder.where).to.be.calledImmediatelyAfter(data.channelsBuilder.set);
                expect(data.channelsBuilder.where).to.be.calledWith("fundingTxId = :txId", { txId });
                expect(data.channelsBuilder.execute).to.be.calledOnce;
                expect(data.channelsBuilder.execute).to.be.calledImmediatelyAfter(data.channelsBuilder.where);
            });
        });

        describe("shouldShowCreateTutorial()", () => {
            beforeEach(() => {
                initState.account = { lightningID: "foo" };
                initState.channels.skipCreateTutorial = types.HIDE;
                store = mockStore(initState);
                fakeDB.configBuilder.returns({
                    select: data.configBuilder.select.returns({
                        where: data.configBuilder.where.returns({
                            getOne: data.configBuilder.getOne.returns({ createChannelViewed: true }),
                        }),
                    }),
                });
            });

            it("should do nothing if tutorial hided", async () => {
                data.configBuilder.getOne.returns({ createChannelViewed: null });
                expectedData = { ...successResp };
                expect(await store.dispatch(operations.shouldShowCreateTutorial())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.configBuilder).to.be.calledOnce;
                expect(data.configBuilder.select).to.be.calledOnce;
                expect(data.configBuilder.select).to.be.calledImmediatelyAfter(fakeDB.configBuilder);
                expect(data.configBuilder.where).to.be.calledOnce;
                expect(data.configBuilder.where).to.be.calledImmediatelyAfter(data.configBuilder.select);
                expect(data.configBuilder.where).to.be.calledWith("lightningId = :lightningID", { lightningID: "foo" });
                expect(data.configBuilder.getOne).to.be.calledOnce;
                expect(data.configBuilder.getOne).to.be.calledImmediatelyAfter(data.configBuilder.where);
            });

            it("should update tutorial", async () => {
                expectedData = { ...successResp };
                expectedActions = [{
                    payload: types.HIDE,
                    type: types.UPDATE_CREATE_TUTORIAL_STATUS,
                }];
                expect(await store.dispatch(operations.shouldShowCreateTutorial())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.configBuilder).to.be.calledOnce;
                expect(data.configBuilder.select).to.be.calledOnce;
                expect(data.configBuilder.select).to.be.calledImmediatelyAfter(fakeDB.configBuilder);
                expect(data.configBuilder.where).to.be.calledOnce;
                expect(data.configBuilder.where).to.be.calledImmediatelyAfter(data.configBuilder.select);
                expect(data.configBuilder.where).to.be.calledWith("lightningId = :lightningID", { lightningID: "foo" });
                expect(data.configBuilder.getOne).to.be.calledOnce;
                expect(data.configBuilder.getOne).to.be.calledImmediatelyAfter(data.configBuilder.where);
            });
        });

        describe("hideShowCreateTutorial()", () => {
            beforeEach(() => {
                initState.account = { lightningID: "foo" };
                initState.channels.skipCreateTutorial = types.HIDE;
                store = mockStore(initState);
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

            it("should do nothing if tutorial hided", async () => {
                expectedData = { ...successResp };
                expect(await store.dispatch(operations.hideShowCreateTutorial())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.configBuilder).not.to.be.called;
            });

            it("should hide tutorial", async () => {
                initState.channels = {};
                store = mockStore(initState);
                expectedData = { ...successResp };
                expectedActions = [{
                    payload: types.HIDE,
                    type: types.UPDATE_CREATE_TUTORIAL_STATUS,
                }];
                expect(await store.dispatch(operations.hideShowCreateTutorial())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.configBuilder).to.be.calledOnce;
                expect(data.configBuilder.update).to.be.calledOnce;
                expect(data.configBuilder.update).to.be.calledImmediatelyAfter(fakeDB.configBuilder);
                expect(data.configBuilder.set).to.be.calledOnce;
                expect(data.configBuilder.set).to.be.calledImmediatelyAfter(data.configBuilder.update);
                expect(data.configBuilder.set).to.be.calledWith({ createChannelViewed: 1 });
                expect(data.configBuilder.where).to.be.calledOnce;
                expect(data.configBuilder.where).to.be.calledImmediatelyAfter(data.configBuilder.set);
                expect(data.configBuilder.where).to.be.calledWith("lightningId = :lightningID", { lightningID: "foo" });
                expect(data.configBuilder.execute).to.be.calledOnce;
                expect(data.configBuilder.execute).to.be.calledImmediatelyAfter(data.configBuilder.where);
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
            expectedData = JSON.parse(JSON.stringify(initStateChannels));
            state = undefined;
        });

        it("should return the initial state", () => {
            expect(channelsReducer(state, {})).to.deep.equal(expectedData);
        });

        it("should handle LOGOUT_ACCOUNT action", () => {
            action.type = accountTypes.LOGOUT_ACCOUNT;
            state = JSON.parse(JSON.stringify(initStateChannels));
            state.channels = ["foo"];
            state.currentChannel = "bar";
            expect(channelsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle NEW_CHANNEL_PREPARING action", () => {
            action.type = types.NEW_CHANNEL_PREPARING;
            expectedData.prepareNewChannel = data;
            expect(channelsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle CLEAR_NEW_CHANNEL_PREPARING action", () => {
            action = {
                type: types.CLEAR_NEW_CHANNEL_PREPARING,
            };
            expectedData.prepareNewChannel = null;
            expect(channelsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_CHANNELS action", () => {
            action.type = types.SET_CHANNELS;
            expectedData.channels = data;
            expect(channelsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SUCCESS_CREATE_NEW_CHANNEL action", () => {
            action.type = types.SUCCESS_CREATE_NEW_CHANNEL;
            expectedData.expectedBitcoinBalance = data;
            expect(channelsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle ERROR_CREATE_NEW_CHANNEL action", () => {
            data = {
                error: "foo",
            };
            action = {
                payload: {
                    newChannelStatus: "failed",
                    newChannelStatusDetails: data.error,
                },
                type: types.ERROR_CREATE_NEW_CHANNEL,
            };
            expectedData = {
                ...expectedData,
                ...action.payload,
            };
            expect(channelsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_CURRENT_CHANNEL action", () => {
            action.type = types.SET_CURRENT_CHANNEL;
            expectedData.currentChannel = data;
            expect(channelsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle CLEAR_CURRENT_CHANNEL action", () => {
            action = {
                type: types.CLEAR_CURRENT_CHANNEL,
            };
            expectedData.currentChannel = null;
            expect(channelsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle UPDATE_CREATE_TUTORIAL_STATUS action", () => {
            action.type = types.UPDATE_CREATE_TUTORIAL_STATUS;
            expectedData.skipCreateTutorial = data;
            expect(channelsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle START_CREATE_NEW_CHANNEL action", () => {
            action = {
                type: types.START_CREATE_NEW_CHANNEL,
            };
            expectedData.creatingNewChannel = true;
            expect(channelsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle END_CREATE_NEW_CHANNEL action", () => {
            action = {
                type: types.END_CREATE_NEW_CHANNEL,
            };
            expectedData.creatingNewChannel = false;
            expect(channelsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle ADD_TO_DELETE action", () => {
            action.type = types.ADD_TO_DELETE;
            expectedData.deleteQueue = [data];
            expect(channelsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle REMOVE_FROM_DELETE action (object not found)", () => {
            action.type = types.REMOVE_FROM_DELETE;
            state = JSON.parse(JSON.stringify(initStateChannels));
            state.deleteQueue = ["bar"];
            expectedData.deleteQueue = ["bar"];
            expect(channelsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle REMOVE_FROM_DELETE action (object found)", () => {
            action.type = types.REMOVE_FROM_DELETE;
            state = JSON.parse(JSON.stringify(initStateChannels));
            state.deleteQueue = [data];
            expect(channelsReducer(state, action)).to.deep.equal(expectedData);
        });
    });

    describe("Selectors Unit Tests", () => {
        let state;
        let channels;
        let expectedData;

        beforeEach(() => {
            state = {
                channels: {
                    ...initStateChannels,
                },
            };
            expectedData = {};
        });

        describe("isThereActiveChannel()", () => {
            it("no active channell", () => {
                state = {
                    channels: {
                        deleteQueue: [],
                        channels: [{ status: "not active" }],
                    },
                };
                expectedData = false;
                expect(selectors.isThereActiveChannel(state)).to.deep.equal(expectedData);
            });

            it("active channell in delete queue", () => {
                state = {
                    channels: {
                        deleteQueue: [1],
                        channels: [{ status: types.CHANNEL_STATUS_ACTIVE, channel_point: 1 }],
                    },
                };
                expectedData = false;
                expect(selectors.isThereActiveChannel(state)).to.deep.equal(expectedData);
            });

            it("active channell not in delete queue", () => {
                state = {
                    channels: {
                        deleteQueue: [1],
                        channels: [{ status: types.CHANNEL_STATUS_ACTIVE, channel_point: 2 }],
                    },
                };
                expectedData = true;
                expect(selectors.isThereActiveChannel(state)).to.deep.equal(expectedData);
            });
        });

        describe("getFirstNotInUseDefaultChannelName()", () => {
            it("no channels", () => {
                expectedData = 1;
                expect(selectors.getFirstNotInUseDefaultChannelName()).to.deep.equal(expectedData);
            });

            it("should return the only default name", () => {
                channels = [
                    { name: "CHANNEL 4" },
                    { name: "CHANEL 7" },
                    { name: "CHANNEL8" },
                    { name: "CHANNEL 8 R" },
                    { name: "CHANNEL 8 5" },
                    { name: "bar" },
                    { name: "" },
                    { name: "channel 6" },
                ];
                expectedData = 1;
                expect(selectors.getFirstNotInUseDefaultChannelName(channels)).to.deep.equal(expectedData);
            });

            it("should return correct position after sorting", () => {
                channels = [
                    { name: "CHANNEL 6" },
                    { name: "CHANNEL 2" },
                    { name: "CHANNEL 4" },
                    { name: "CHANNEL 1" },
                ];
                expectedData = 3;
                expect(selectors.getFirstNotInUseDefaultChannelName(channels)).to.deep.equal(expectedData);
            });

            it("should return correct name with all custom channels", () => {
                channels = [
                    { name: "test" },
                    { name: "" },
                ];
                expectedData = 1;
                expect(selectors.getFirstNotInUseDefaultChannelName(channels)).to.deep.equal(expectedData);
            });

            it("should return correct number empty name in second group", () => {
                channels = [
                    { name: "CHANNEL 1" },
                    { name: "CHANNEL 2" },
                    { name: "CHANNEL 4" },
                    { name: "CHANNEL 7" },
                ];
                expectedData = 6;
                expect(selectors.getFirstNotInUseDefaultChannelName(channels, 3)).to.deep.equal(expectedData);
            });

            it("should return correct number for first after last empty name", () => {
                channels = [
                    { name: "CHANNEL 1" },
                    { name: "CHANNEL 2" },
                    { name: "CHANNEL 4" },
                    { name: "CHANNEL 6" },
                ];
                expectedData = 7;
                expect(selectors.getFirstNotInUseDefaultChannelName(channels, 3)).to.deep.equal(expectedData);
            });

            it("should return correct number for high index", () => {
                channels = [
                    { name: "CHANNEL 1" },
                    { name: "CHANNEL 2" },
                    { name: "CHANNEL 4" },
                    { name: "CHANNEL 6" },
                ];
                expectedData = 104;
                expect(selectors.getFirstNotInUseDefaultChannelName(channels, 100)).to.deep.equal(expectedData);
            });
        });
    });
});
