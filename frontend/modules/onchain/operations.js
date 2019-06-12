import { exceptions } from "config";
import { appOperations, appActions } from "modules/app";
import { accountOperations, accountTypes } from "modules/account";
import { db, successPromise, errorPromise, unsuccessPromise, logger } from "additional";
import { MAX_DB_NUM_CONFIRMATIONS, TX_NUM_CONFIRMATIONS_TO_SHOW_NOTIFY } from "config/consts";
import { store } from "store/configure-store";
import orderBy from "lodash/orderBy";
import keyBy from "lodash/keyBy";
import uniq from "lodash/uniq";
import has from "lodash/has";
import * as actions from "./actions";
import * as types from "./types";

function openSendCoinsModal() {
    return dispatch => dispatch(appActions.setModalState(types.MODAL_STATE_SEND_COINS));
}

function openWarningModal() {
    return dispatch => dispatch(appActions.setModalState(types.MODAL_STATE_WARNING));
}

async function getChainTxns() {
    logger.log("LND ON-CHAIN TRANSACTIONS");
    const response = await window.ipcClient("getTransactions");
    if (!response.ok) {
        logger.error(response);
        return errorPromise(response.error, getChainTxns);
    }
    logger.log(response);
    return successPromise({ chainTxns: keyBy(response.response.transactions, "tx_hash") });
}

async function getDbTxns() {
    const response = await db.onchainBuilder()
        .getMany();
    return keyBy(response, "txHash");
}

function getOnchainHistory() {
    return async (dispatch, getState) => {
        try {
            const response = await getChainTxns();
            if (!response.ok) {
                return errorPromise(response.error, getOnchainHistory);
            }
            const { chainTxns } = response.response;
            const dbTxns = await getDbTxns();
            const uniqTxns = uniq([...Object.keys(chainTxns), ...Object.keys(dbTxns)]);
            let txns = uniqTxns.map((txn) => {
                let amount;
                let status;
                let address = "-";
                let date;
                let numConfirmations;
                let txHash;
                let blockHash;
                let blockHeight;
                let totalFees;
                if (has(chainTxns, txn)) {
                    amount = parseInt(chainTxns[txn].amount, 10);
                    status = "sended";
                    date = new Date(parseInt(chainTxns[txn].time_stamp, 10) * 1000);
                    numConfirmations = parseInt(chainTxns[txn].num_confirmations, 10);
                    txHash = chainTxns[txn].tx_hash;
                    blockHash = chainTxns[txn].block_hash;
                    blockHeight = chainTxns[txn].block_height;
                    totalFees = parseInt(chainTxns[txn].total_fees, 10);
                    if (!has(dbTxns, txn)) {
                        if (amount > 0 && numConfirmations >= TX_NUM_CONFIRMATIONS_TO_SHOW_NOTIFY) {
                            const convertedAmount = dispatch(appOperations.convertSatoshiToCurrentMeasure(amount, 10));
                            dispatch(appOperations.sendSystemNotification({
                                body: `You received ${convertedAmount} ${getState().account.bitcoinMeasureType}`,
                                title: "Incoming On-chain transaction",
                            }));
                        }
                        db.onchainBuilder()
                            .insert()
                            .values({
                                address,
                                amount,
                                blockHash,
                                blockHeight,
                                name: "Regular payment",
                                numConfirmations: Math.min(numConfirmations, MAX_DB_NUM_CONFIRMATIONS),
                                status,
                                timeStamp: chainTxns[txn].time_stamp,
                                totalFees,
                                txHash: txn,
                            })
                            .execute();
                    } else if (
                        dbTxns[txn].amount !== amount
                        || dbTxns[txn].blockHeight !== blockHeight
                        || dbTxns[txn].blockHash !== blockHash
                        || dbTxns[txn].status !== status
                        || dbTxns[txn].timeStamp !== chainTxns[txn].time_stamp
                        || dbTxns[txn].totalFees !== totalFees
                        || dbTxns[txn].name === ""
                        || (
                            dbTxns[txn].numConfirmations < MAX_DB_NUM_CONFIRMATIONS
                            && dbTxns[txn].numConfirmations !== numConfirmations
                        )
                    ) {
                        if (
                            amount > 0
                            && (!dbTxns[txn].numConfirmations
                                || dbTxns[txn].numConfirmations < TX_NUM_CONFIRMATIONS_TO_SHOW_NOTIFY)
                            && numConfirmations >= TX_NUM_CONFIRMATIONS_TO_SHOW_NOTIFY
                        ) {
                            const convertedAmount = dispatch(appOperations.convertSatoshiToCurrentMeasure(amount, 10));
                            dispatch(appOperations.sendSystemNotification({
                                body: `You received ${convertedAmount} ${getState().account.bitcoinMeasureType}`,
                                title: "Incoming On-chain transaction",
                            }));
                        }
                        db.onchainBuilder()
                            .update()
                            .set({
                                amount,
                                blockHash,
                                blockHeight,
                                name: dbTxns[txn].name ? dbTxns[txn].name : "Regular payment",
                                numConfirmations: Math.min(numConfirmations, MAX_DB_NUM_CONFIRMATIONS),
                                status,
                                timeStamp: chainTxns[txn].time_stamp,
                                totalFees,
                                txHash: txn,
                            })
                            .where("txHash = :txID", { txID: txn })
                            .execute();
                    }
                } else {
                    amount = parseInt(dbTxns[txn].amount, 10);
                    ({
                        address, blockHash, blockHeight, status, txHash,
                    } = dbTxns[txn]);
                    date = new Date(parseInt(dbTxns[txn].timeStamp, 10) * 1000);
                    numConfirmations = 0;
                    totalFees = 0;
                }
                return {
                    amount,
                    block_hash: blockHash,
                    block_height: blockHeight,
                    date,
                    name: has(dbTxns, txn) && dbTxns[txn].name ? dbTxns[txn].name : "Regular payment",
                    num_confirmations: numConfirmations,
                    status,
                    to: has(dbTxns, txn) ? dbTxns[txn].address : "-",
                    total_fees: totalFees,
                    tx_hash: txHash,
                };
            });
            txns = orderBy(txns, "date", "desc");
            dispatch(actions.setOnChainHistory(txns));
            return successPromise();
        } catch (error) {
            return errorPromise(error, getOnchainHistory);
        }
    };
}

function prepareSendCoins(recepient, amount, name) {
    return async (dispatch, getState) => {
        if (getState().account.kernelConnectIndicator !== accountTypes.KERNEL_CONNECTED) {
            return unsuccessPromise(prepareSendCoins);
        }
        dispatch(actions.sendCoinsPreparing(recepient, amount, name));
        return successPromise();
    };
}

function clearSendCoinsDetails() {
    return async (dispatch, getState) => {
        dispatch(actions.clearSendCoinsPreparing());
    };
}

function sendCoins() {
    return async (dispatch, getState) => {
        if (!getState().onchain.sendCoinsDetails) {
            return errorPromise(exceptions.SEND_COINS_DETAILS_REQUIRED, sendCoins);
        }
        const { name, recepient, amount } = getState().onchain.sendCoinsDetails;
        const response = await window.ipcClient("sendCoins", {
            addr: recepient,
            amount,
        });
        if (response.ok) {
            dispatch(accountOperations.checkBalance());
            const txHash = response.response.txid;
            try {
                await db.onchainBuilder()
                    .insert()
                    .values({
                        address: recepient,
                        amount: -amount - getState().onchain.fee,
                        blockHash: "",
                        blockHeight: 0,
                        name: name || "Regular payment",
                        numConfirmations: 0,
                        status: "pending",
                        timeStamp: Math.floor(Date.now() / 1000),
                        totalFees: 0,
                        txHash,
                    })
                    .execute();
            } catch (e) {
                /* istanbul ignore next */
                logger.error(exceptions.EXTRA, e);
            }
            return successPromise({ amount, tx_hash: txHash });
        }
        dispatch(actions.setSendCoinsPaymentDetails(response.error));
        return errorPromise(response.error, sendCoins);
    };
}

function clearSendCoinsError() {
    return dispatch => dispatch(actions.setSendCoinsPaymentDetails(""));
}

function subscribeTransactions() {
    return (dispatch) => {
        window.ipcRenderer.send("subscribeTransactions");
    };
}

function unSubscribeTransactions() {
    return async (dispatch) => {
        await window.ipcClient("unsubscribeTransactions");
    };
}

window.ipcRenderer.on("transactions-update", (event) => {
    store.dispatch(accountOperations.checkBalance());
    store.dispatch(getOnchainHistory());
});

export {
    getOnchainHistory,
    openSendCoinsModal,
    prepareSendCoins,
    clearSendCoinsDetails,
    sendCoins,
    clearSendCoinsError,
    subscribeTransactions,
    unSubscribeTransactions,
    openWarningModal,
};
