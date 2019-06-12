import keyBy from "lodash/keyBy";
import has from "lodash/has";
import isEqual from "lodash/isEqual";
import { exceptions } from "config";
import { appOperations, appActions, appTypes } from "modules/app";
import { accountOperations, accountTypes } from "modules/account";
import { db, successPromise, errorPromise, logger } from "additional";
import { CHANNEL_CLOSE_CONFIRMATION, CHANNEL_LEFT_AMOUNT_TO_NOTIFY } from "config/consts";
import { onChainOperations } from "modules/onchain";
import * as actions from "./actions";
import * as types from "./types";
import * as selectors from "./selectors";

// TODO: move this to store
let creatingChannelPoint;

function openStreamWarningModal() {
    return dispatch => dispatch(appActions.setModalState(types.MODAL_WARNING));
}

function openNewChannelModal() {
    return dispatch => dispatch(appActions.setModalState(types.MODAL_STATE_NEW_CHANNEL));
}

function openDeleteChannelModal() {
    return dispatch => dispatch(appActions.setModalState(types.MODAL_STATE_DELETE_CHANNEL));
}

function openEditChannelModal() {
    return dispatch => dispatch(appActions.setModalState(types.MODAL_STATE_EDIT_CHANNEL));
}

function openForceDeleteChannelModal() {
    return dispatch => dispatch(appActions.setModalState(types.MODAL_STATE_FORCE_DELETE_CHANNEL));
}

async function getDbChannels() {
    const response = await db.channelsBuilder()
        .getMany();

    return keyBy(response, "fundingTxid");
}

function getChannels(initAccount = false) {
    return async (dispatch, getState) => {
        if (getState().app.dbStatus !== appTypes.DB_OPENED || getState().channels.creatingNewChannel) {
            return;
        }
        let emptyChannelIndex = 1;
        await dispatch(onChainOperations.getOnchainHistory());
        const getActiveChannels = async (dbChannels, blockHeight) => {
            const response = await window.ipcClient("listChannels");
            const sort = (a, b) => {
                const aChan = a.chan_id;
                const bChan = b.chan_id;
                return aChan < bChan ? -1 : 1;
            };
            const keyByListChannels = keyBy(response.response.channels, channel => channel.channel_point.split(":")[0]);
            Object.values(dbChannels).forEach((dbChan) => {
                // Check if channel in database marked as active, not found in listchannels
                // and channel hasn't been closed from our side(not in delete queue, while tx not in pool)
                // then show notification about channel closing by counterparty
                if (
                    dbChan.status === "active"
                    && !has(keyByListChannels, dbChan.fundingTxid)
                    && getState().channels.deleteQueue.filter(channel =>
                        channel.split(":")[0] === dbChan.fundingTxid).length === 0
                ) {
                    dispatch(appOperations.sendSystemNotification({
                        body: "Channel has been closed by counterparty",
                        title: dbChan.name,
                    }));
                    db.channelsBuilder()
                        .update()
                        .set({
                            activeStatus: false,
                            status: "deleted",
                        })
                        .where("fundingTxid = :txID", { txID: dbChan.fundingTxid })
                        .execute();
                }
            });
            return response.response.channels.sort(sort)
                .map((channel) => {
                    const status = channel.active ? types.CHANNEL_STATUS_ACTIVE : types.CHANNEL_STATUS_NOT_ACTIVE;
                    const maturity = blockHeight;
                    let chanName;
                    const chanTxid = channel.channel_point.split(":")[0];
                    const totalBalance = parseInt(channel.local_balance, 10) + parseInt(channel.remote_balance, 10);
                    if (has(dbChannels, chanTxid)) {
                        const dbChan = dbChannels[chanTxid];
                        chanName = dbChan.name;
                        if (dbChan.status === "pending") {
                            dispatch(appOperations.sendSystemNotification({
                                body: "Channel has been opened",
                                title: chanName,
                            }));
                        }
                        if (!initAccount && dbChan.status === "active" && !!dbChan.activeStatus !== channel.active) {
                            if (channel.active) {
                                dispatch(appOperations.sendSystemNotification({
                                    body: "Channel becomes active",
                                    title: chanName,
                                }));
                            } else {
                                dispatch(appOperations.sendSystemNotification({
                                    body: "Channel becomes inactive",
                                    title: chanName,
                                }));
                            }
                        }

                        if (
                            dbChan.localBalance / totalBalance > CHANNEL_LEFT_AMOUNT_TO_NOTIFY
                            && parseInt(channel.local_balance, 10) / totalBalance <= CHANNEL_LEFT_AMOUNT_TO_NOTIFY
                        ) {
                            const amount = dispatch(appOperations.convertSatoshiToCurrentMeasure(parseInt(
                                channel.local_balance,
                                10,
                            )));
                            const measure = getState().account.bitcoinMeasureType;
                            dispatch(appOperations.sendSystemNotification({
                                body: `You have only ${amount} ${measure} left in the channel`,
                                title: chanName,
                            }));
                        }
                        if (dbChan.status === "active" && dbChan.localBalance < parseInt(channel.local_balance, 10)) {
                            const amount = dispatch(appOperations.convertSatoshiToCurrentMeasure(parseInt(channel.local_balance, 10) - dbChan.localBalance)); // eslint-disable-line max-len
                            dispatch(appOperations.sendSystemNotification({
                                body: `You received ${amount} ${getState().account.bitcoinMeasureType}`,
                                title: chanName,
                            }));
                        }
                        if (
                            dbChan.status !== "active"
                            || !!dbChan.activeStatus !== channel.active
                            || dbChan.localBalance !== parseInt(channel.local_balance, 10)
                            || dbChan.remoteBalance !== parseInt(channel.remote_balance, 10)
                        ) {
                            db.channelsBuilder()
                                .update()
                                .set({
                                    activeStatus: channel.active,
                                    localBalance: channel.local_balance,
                                    remoteBalance: channel.remote_balance,
                                    status: "active",
                                })
                                .where("fundingTxid = :txID", { txID: chanTxid })
                                .execute();
                        }
                    } else {
                        const notInUseChannelName = selectors.getFirstNotInUseDefaultChannelName(
                            getState().channels.channels,
                            emptyChannelIndex,
                        );
                        chanName = `CHANNEL ${notInUseChannelName}`;
                        emptyChannelIndex += 1;
                        // TODO: time race between creating channel and getchannels
                        if (!getState().channels.creatingNewChannel && chanTxid !== creatingChannelPoint) {
                            db.channelsBuilder()
                                .insert()
                                .values({
                                    activeStatus: channel.active,
                                    fundingTxid: chanTxid,
                                    localBalance: channel.local_balance,
                                    name: chanName,
                                    remoteBalance: channel.remote_balance,
                                    status: "active",
                                })
                                .execute();
                        }
                    }
                    return {
                        capacity: parseInt(channel.capacity, 10),
                        chan_id: parseInt(channel.chan_id, 10),
                        channel_point: channel.channel_point,
                        commit_fee: parseInt(channel.commit_fee, 10),
                        commit_weight: parseInt(channel.commit_weight, 10),
                        fee_per_kw: parseInt(channel.fee_per_kw, 10),
                        local_balance: parseInt(channel.local_balance, 10),
                        maturity,
                        name: chanName,
                        remote_balance: parseInt(channel.remote_balance, 10),
                        remote_pubkey: channel.remote_pubkey,
                        status,
                    };
                });
        };
        const getPendingChannels = async (dbChannels) => {
            const response = await window.ipcClient("pendingChannels");
            return response.response.pending_open_channels.map((channel) => {
                let chanName;
                let maturity = 0;
                const chanTxid = channel.channel.channel_point.split(":")[0];
                if (has(dbChannels, chanTxid)) {
                    const dbChan = dbChannels[chanTxid];
                    chanName = dbChan.name;
                    // Return maturity of current channels' opening transaction
                    maturity = getState().onchain.history
                        .filter(txn => txn.tx_hash === dbChan.fundingTxid)
                        .reduce((mat, txn) => mat !== 0 ? mat : parseInt(txn.num_confirmations, 10), 0);
                    if (
                        dbChan.status !== "pending"
                        || !!dbChan.activeStatus !== false
                        || dbChan.localBalance !== parseInt(channel.channel.local_balance, 10)
                        || dbChan.remoteBalance !== parseInt(channel.channel.remote_balance, 10)
                    ) {
                        db.channelsBuilder()
                            .update()
                            .set({
                                activeStatus: false,
                                localBalance: channel.channel.local_balance,
                                remoteBalance: channel.channel.remote_balance,
                                status: "pending",
                            })
                            .where("fundingTxid = :txID", { txID: chanTxid })
                            .execute();
                    }
                } else {
                    const notInUseChannelName =
                        selectors.getFirstNotInUseDefaultChannelName(getState().channels.channels, emptyChannelIndex);
                    emptyChannelIndex += 1;
                    chanName = `CHANNEL ${notInUseChannelName}`;
                    // TODO: time race between creating channel and pendingchannels
                    if (!getState().channels.creatingNewChannel && chanTxid !== creatingChannelPoint) {
                        db.channelsBuilder()
                            .insert()
                            .values({
                                activeStatus: false,
                                fundingTxid: chanTxid,
                                localBalance: channel.channel.local_balance,
                                name: chanName,
                                remoteBalance: channel.channel.remote_balance,
                                status: "pending",
                            })
                            .execute();
                    }
                }
                return {
                    capacity: parseInt(channel.channel.capacity, 10),
                    chan_id: 0,
                    channel_point: channel.channel.channel_point,
                    commit_fee: parseInt(channel.commit_fee, 10),
                    commit_weight: parseInt(channel.commit_weight, 10),
                    fee_per_kw: parseInt(channel.fee_per_kw, 10),
                    local_balance: parseInt(channel.channel.local_balance, 10),
                    maturity,
                    name: chanName,
                    remote_balance: parseInt(channel.channel.remote_balance, 10),
                    remote_pubkey: channel.channel.remote_node_pub,
                    status: types.CHANNEL_STATUS_PENDING,
                };
            });
        };

        const info = await window.ipcClient("getInfo");
        if (!info.ok) {
            logger.error(info);
            return;
        }
        const dbChans = await getDbChannels();
        const pending = await getPendingChannels(dbChans, info.response.block_height);
        const active = await getActiveChannels(dbChans, info.response.block_height);
        const chans = [...active, ...pending];
        const stateChannels = getState().channels.channels;

        if (!isEqual(stateChannels, chans)) {
            dispatch(actions.setChannels(chans));
        }
    };
}

function connectPeer(lightningID, peerAddress) {
    return async (dispatch, getState) => {
        const response = await window.ipcClient("connectPeer", {
            addr: {
                host: peerAddress,
                pubkey: lightningID,
            },
        });
        if (!response.ok && !response.error.includes("connected")) {
            return errorPromise(response.error, connectPeer);
        }
        return successPromise();
    };
}

function prepareNewChannel(lightningID, capacity, peerAddress, name, custom) {
    return async (dispatch, getState) => {
        if (getState().account.kernelConnectIndicator !== accountTypes.KERNEL_CONNECTED) {
            return errorPromise(exceptions.ACCOUNT_NO_KERNEL, prepareNewChannel);
        }
        const newChannel = {
            capacity,
            custom,
            host: peerAddress,
            lightningID,
            name: name || `Channel ${selectors.getFirstNotInUseDefaultChannelName(getState().channels.channels)}`,
        };
        dispatch(actions.newChannelPreparing(newChannel));
        return successPromise();
    };
}

function setCurrentChannel(id) {
    return async (dispatch, getState) => {
        if (!getState().channels.channels[id]) {
            return errorPromise(exceptions.CHANNEL_ABSENT, setCurrentChannel);
        }
        dispatch(actions.setCurrentChannel(getState().channels.channels[id]));
        return successPromise();
    };
}

function clearCurrentChannel() {
    return async (dispatch, getState) => {
        dispatch(actions.clearCurrentChannel());
        return successPromise();
    };
}

function closeChannel(channel, force = false) {
    return async (dispatch, getState) => {
        dispatch(actions.addToDelete(channel.channel_point));
        const [txID, out] = channel.channel_point.split(":");
        const params = {
            channel_point: {
                funding_txid_str: txID,
                output_index: parseInt(out, 10),
            },
            target_conf: CHANNEL_CLOSE_CONFIRMATION,
        };
        if (force) {
            params.force = true;
        }
        const response = await window.ipcClient("closeChannel", params);
        if (!response.ok) {
            dispatch(actions.removeFromDelete(channel.channel_point));
            return errorPromise(response.error, closeChannel);
        }
        try {
            await db.channelsBuilder()
                .update()
                .set({
                    activeStatus: false,
                    status: "deleted",
                })
                .where("fundingTxid = :txID", { txID })
                .execute();
            await db.onchainBuilder()
                .insert()
                .values({
                    address: "-",
                    amount: channel.local_balance,
                    blockHash: "",
                    blockHeight: 0,
                    name: `Closing ${channel.name}`,
                    numConfirmations: 0,
                    status: "pending",
                    timeStamp: Math.floor(Date.now() / 1000),
                    totalFees: 0,
                    txHash: response.txid,
                })
                .execute();
        } catch (e) {
            /* istanbul ignore next */
            logger.error(exceptions.EXTRA, e);
        }
        dispatch(actions.removeFromDelete(channel.channel_point));
        return successPromise();
    };
}

function createNewChannel() {
    return async (dispatch, getState) => {
        dispatch(actions.startCreateNewChannel());
        const responsePeers = await window.ipcClient("listPeers");
        if (!responsePeers.ok) {
            dispatch(actions.errorCreateNewChannel(responsePeers.error));
            dispatch(actions.endCreateNewChannel());
            return errorPromise(responsePeers.error, createNewChannel);
        }
        const { peers } = responsePeers.response;
        const newChannelDetails = getState().channels.prepareNewChannel;
        const equal = address => address === newChannelDetails.lightningID;
        const founded = peers.reduce((isFounded, peer) => isFounded || equal(peer.address), false);
        if (!founded) {
            const peerConnect = await dispatch(connectPeer(newChannelDetails.lightningID, newChannelDetails.host));
            if (!peerConnect.ok) {
                dispatch(actions.endCreateNewChannel());
                return errorPromise(peerConnect.error, createNewChannel);
            }
        }
        const responseChannels = await window.ipcClient("openChannel", {
            local_funding_amount: newChannelDetails.capacity,
            node_pubkey_string: newChannelDetails.lightningID,
        });
        if (!responseChannels.ok) {
            dispatch(actions.errorCreateNewChannel(responseChannels.error));
            dispatch(actions.endCreateNewChannel());
            return errorPromise(responseChannels.error, createNewChannel);
        }
        const fundingTxid = responseChannels.funding_txid_str.split(":")[0];
        creatingChannelPoint = fundingTxid;
        try {
            await db.channelsBuilder()
                .insert()
                .values({
                    activeStatus: false,
                    fundingTxid,
                    localBalance: 0,
                    name: newChannelDetails.name,
                    remoteBalance: 0,
                    status: "pending",
                })
                .execute();
            const onchainTxnExists = await db.onchainBuilder()
                .select()
                .where("txHash = :txHash", { txHash: responseChannels.funding_txid_str })
                .getOne();
            if (onchainTxnExists) {
                await db.onchainBuilder()
                    .update()
                    .set({ name: `Opening ${newChannelDetails.name}` })
                    .where("txHash = :txHash", { txHash: responseChannels.funding_txid_str })
                    .execute();
            } else {
                await db.onchainBuilder()
                    .insert()
                    .values({
                        address: "-",
                        amount: -newChannelDetails.capacity,
                        blockHash: "",
                        blockHeight: 0,
                        name: `Opening ${newChannelDetails.name}`,
                        numConfirmations: 0,
                        status: "pending",
                        timeStamp: Math.floor(Date.now() / 1000),
                        totalFees: 0,
                        txHash: responseChannels.funding_txid_str,
                    })
                    .execute();
            }
            /* istanbul ignore next */
            creatingChannelPoint = null;
        } catch (e) {
            /* istanbul ignore next */
            logger.error(exceptions.EXTRA, e);
        }
        const expectedBitcoinBalance = getState().account.bitcoinBalance - newChannelDetails.capacity;
        dispatch(actions.successCreateNewChannel(expectedBitcoinBalance));
        dispatch(actions.endCreateNewChannel());
        dispatch(actions.clearNewChannelPreparing());
        logger.log(`TXN FOR CHANNEL OPENING: ${responseChannels.funding_txid_str}`);
        return successPromise({ trnID: responseChannels.funding_txid_str });
    };
}

function updateChannelOnServer(name, txId) {
    return async (dispatch, getState) => {
        try {
            await db.channelsBuilder()
                .update()
                .set({ name })
                .where("fundingTxId = :txId", { txId })
                .execute();
            return successPromise();
        } catch (e) {
            return errorPromise(e.message, updateChannelOnServer);
        }
    };
}

function shouldShowCreateTutorial() {
    return async (dispatch, getState) => {
        const { lightningID } = getState().account;
        const response = await db.configBuilder()
            .select()
            .where("lightningId = :lightningID", { lightningID })
            .getOne();
        if (response && response.createChannelViewed) {
            dispatch(actions.updateCreateTutorialStatus(types.HIDE));
        }
        return successPromise();
    };
}

function hideShowCreateTutorial() {
    return async (dispatch, getState) => {
        const { lightningID } = getState().account;
        if (getState().channels.skipCreateTutorial === types.HIDE) {
            return successPromise();
        }
        dispatch(actions.updateCreateTutorialStatus(types.HIDE));
        db.configBuilder()
            .update()
            .set({ createChannelViewed: 1 })
            .where("lightningId = :lightningID", { lightningID })
            .execute();
        return successPromise();
    };
}

export {
    openStreamWarningModal,
    openNewChannelModal,
    openDeleteChannelModal,
    openEditChannelModal,
    openForceDeleteChannelModal,
    getDbChannels,
    getChannels,
    connectPeer,
    prepareNewChannel,
    setCurrentChannel,
    clearCurrentChannel,
    closeChannel,
    createNewChannel,
    updateChannelOnServer,
    shouldShowCreateTutorial,
    hideShowCreateTutorial,
};
