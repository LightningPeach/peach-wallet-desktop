import React from "react";
import orderBy from "lodash/orderBy";
import pick from "lodash/pick";
import { exceptions } from "config";
import { appActions, appOperations } from "modules/app";
import { lightningOperations } from "modules/lightning";
import { channelsOperations } from "modules/channels";
import { store } from "store/configure-store";
import {
    db, helpers, successPromise, errorPromise,
    logger, delay as Timeout, clearDelay, setIntervalLong,
    clearIntervalLong,
} from "additional";
import { error, info } from "modules/notifications";
import { accountOperations, accountTypes } from "modules/account";
import { RECURRING_MEMO_PREFIX, STREAM_INFINITE_TIME_VALUE } from "config/consts";
import { streamPaymentActions as actions, streamPaymentTypes as types } from "modules/streamPayments";

const streamIdBorrowed = streamId => `${streamId}_borrowed`;

const streamIdLend = streamId => `${streamId}_lend`;

function pauseDbStreams() {
    try {
        db.streamBuilder()
            .update()
            .set({ status: types.STREAM_PAYMENT_PAUSED })
            .where("status = :status", { status: types.STREAM_PAYMENT_STREAMING })
            .execute();
    } catch (e) {
        logger.error(e);
    }
}

function openStreamPaymentDetailsModal() {
    return dispatch => dispatch(appActions.setModalState(types.MODAL_STATE_STREAM_PAYMENT_DETAILS));
}

function openActiveRecurringWarningModal() {
    return dispatch => dispatch(appActions.setModalState(types.MODAL_STATE_ACTIVE_RECURRING_WARNING));
}

function openEditStreamModal() {
    return dispatch => dispatch(appActions.setModalState(types.MODAL_STATE_EDIT_STREAM_PAYMENT));
}

function clearPrepareStreamPayment() {
    return async (dispatch, getState) => {
        dispatch(actions.prepareStreamPayment(null));
    };
}

function prepareStreamPayment(
    lightningID,
    price,
    delay = 1000,
    totalParts = STREAM_INFINITE_TIME_VALUE,
    paymentName = null,
    contact_name = "",
    currency = "BTC",
    partsPaid = 0,
    date = Date.now(),
) {
    return async (dispatch, getState) => {
        if (getState().account.kernelConnectIndicator !== accountTypes.KERNEL_CONNECTED) {
            return errorPromise(exceptions.ACCOUNT_NO_KERNEL, prepareStreamPayment);
        }
        const name = paymentName || "Recurring payment";
        const id = btoa(unescape(encodeURIComponent(`${name}_${Date.now()}`)));
        const memo = `${RECURRING_MEMO_PREFIX}${id}`;
        let amount;
        switch (currency) {
            case "USD":
                amount = dispatch(appOperations.convertUsdToSatoshi(price));
                break;
            default:
                amount = price;
                break;
        }
        const fees = await dispatch(lightningOperations.getLightningFee(lightningID, amount));
        if (!fees.ok) {
            return errorPromise(fees.error, prepareStreamPayment);
        }
        const details = {
            contact_name,
            currency,
            date,
            delay,
            fee: fees.response.fee,
            id,
            lastPayment: 0,
            lightningID,
            memo,
            name,
            partsPaid,
            partsPending: 0,
            price,
            status: types.STREAM_PAYMENT_PAUSED,
            totalAmount: 0,
            totalParts,
        };
        dispatch(actions.prepareStreamPayment(details));
        return successPromise();
    };
}

function updateStreamPayment(
    streamId,
    lightningID,
    status,
    price,
    delay,
    totalParts,
    paymentName,
    currency,
) {
    return async (dispatch, getState) => {
        if (getState().account.kernelConnectIndicator !== accountTypes.KERNEL_CONNECTED) {
            return errorPromise(exceptions.ACCOUNT_NO_KERNEL, updateStreamPayment);
        }
        if (status !== types.STREAM_PAYMENT_FINISHED) {
            const payment = getState().streamPayment.streams.filter(item => item.id === streamId)[0];
            if (!payment) {
                return errorPromise(exceptions.RECURRING_NOT_IN_STORE, updateStreamPayment);
            }
        }
        const name = paymentName || "Recurring payment";
        let amount;
        switch (currency) {
            case "USD":
                amount = dispatch(appOperations.convertUsdToSatoshi(price));
                break;
            default:
                amount = price;
                break;
        }
        const fees = await dispatch(lightningOperations.getLightningFee(lightningID, amount));
        if (!fees.ok) {
            return errorPromise(fees.error, updateStreamPayment);
        }
        const details = {
            currency, delay, name, price, totalParts,
        };
        dispatch(actions.updateStreamPayment(streamId, details));
        try {
            db.streamBuilder()
                .update()
                .set(details)
                .where("id = :id", { id: streamId })
                .execute();
        } catch (err) {
            /* istanbul ignore next */
            logger.error(exceptions.EXTRA, err);
        }
        return successPromise();
    };
}

function addStreamPaymentToList() {
    return async (dispatch, getState) => {
        const details = getState().streamPayment.streamDetails;
        if (!details) {
            return errorPromise(exceptions.RECURRING_DETAILS_REQUIRED, addStreamPaymentToList);
        }
        dispatch(actions.addStreamPaymentToList());
        try {
            await db.streamBuilder()
                .insert()
                .values(pick(details, [
                    "currency",
                    "date",
                    "delay",
                    "id",
                    "lastPayment",
                    "lightningID",
                    "memo",
                    "name",
                    "partsPaid",
                    "price",
                    "totalAmount",
                    "status",
                    "totalParts",
                ]))
                .execute();
        } catch (e) {
            /* istanbul ignore next */
            logger.error(exceptions.EXTRA, e);
        }
        return successPromise();
    };
}

function pauseStreamPayment(streamId, pauseInDb = true) {
    return (dispatch, getState) => {
        const payment = getState().streamPayment.streams.filter(item => item.id === streamId)[0];
        if (!payment) {
            return;
        }
        clearIntervalLong(streamId);
        clearDelay(streamIdBorrowed(streamId));
        clearDelay(streamIdLend(streamId));
        if (payment.status === types.STREAM_PAYMENT_STREAMING) {
            dispatch(actions.updateStreamPayment(payment.id, { status: types.STREAM_PAYMENT_PAUSED }));
            if (pauseInDb) {
                try {
                    db.streamBuilder()
                        .update()
                        .set({
                            partsPaid: payment.partsPaid,
                            status: types.STREAM_PAYMENT_PAUSED,
                        })
                        .where("id = :id", { id: payment.id })
                        .execute();
                } catch (e) {
                    /* istanbul ignore next */
                    logger.error(exceptions.EXTRA, e);
                }
            }
        }
    };
}

function pauseAllStreams(pauseInDb = true) {
    return (dispatch, getState) => {
        getState()
            .streamPayment
            .streams
            .forEach((item, key) => {
                if (item.status === types.STREAM_PAYMENT_STREAMING) {
                    dispatch(pauseStreamPayment(item.id, pauseInDb));
                }
            });
    };
}

function finishStreamPayment(streamId) {
    return (dispatch, getState) => {
        const payment = getState().streamPayment.streams.filter(item => item.id === streamId)[0];
        if (!payment) {
            return;
        }
        clearIntervalLong(streamId);
        clearDelay(streamIdBorrowed(streamId));
        clearDelay(streamIdLend(streamId));
        if (payment.status !== types.STREAM_PAYMENT_FINISHED) {
            dispatch(actions.updateStreamPayment(payment.id, { status: types.STREAM_PAYMENT_FINISHED }));
            try {
                db.streamBuilder()
                    .update()
                    .set({ partsPaid: payment.partsPaid, status: types.STREAM_PAYMENT_FINISHED })
                    .where("id = :id", { id: payment.id })
                    .execute();
            } catch (e) {
                /* istanbul ignore next */
                logger.error(exceptions.EXTRA, e);
            }
        }
    };
}

function startStreamPayment(streamId, forceStart = false) {
    return async (dispatch, getState) => {
        let errorShowed = false;
        const handleStreamError = (err = exceptions.RECURRING_TIMEOUT, helper = true) => {
            dispatch(pauseStreamPayment(streamId));
            if (!errorShowed) {
                const { isLogined, isLogouting } = getState().account;
                if (isLogined && !isLogouting) {
                    dispatch(error({
                        message: helpers.formatNotificationMessage(err, helper),
                        uid: "recurring_error",
                    }));
                }
                errorShowed = true;
            }
        };
        const makeStreamIteration = async (shouldStartAt) => {
            let payment = getState().streamPayment.streams.filter(item => item.id === streamId)[0];
            /* istanbul ignore next */
            if (!payment) {
                return;
            }
            const startTime = shouldStartAt || Date.now();
            /* istanbul ignore next */
            if ((payment.totalParts !== STREAM_INFINITE_TIME_VALUE
                && payment.partsPaid >= payment.totalParts)
                || payment.status === types.STREAM_PAYMENT_FINISHED) {
                dispatch(finishStreamPayment(streamId));
                return;
            }
            /* istanbul ignore next */
            if ((payment.totalParts !== STREAM_INFINITE_TIME_VALUE
                && payment.partsPaid + payment.partsPending >= payment.totalParts)
                || payment.status === types.STREAM_PAYMENT_PAUSED) {
                dispatch(pauseStreamPayment(streamId));
                return;
            }
            let amount;
            switch (payment.currency) {
                case "USD":
                    amount = dispatch(appOperations.convertUsdToSatoshi(payment.price));
                    break;
                default:
                    amount = payment.price;
                    break;
            }
            const { lightningBalance } = getState().account;
            if (lightningBalance < amount) {
                handleStreamError(exceptions.RECURRING_NO_FUNDS, false);
                return;
            }
            dispatch(actions.changeStreamPartsPending(streamId, 1));
            let response = await dispatch(lightningOperations.addInvoiceRemote(
                payment.lightningID,
                amount,
                payment.memo,
            ));
            if (!response.ok) {
                dispatch(actions.changeStreamPartsPending(streamId, -1));
                handleStreamError(response.error.toLowerCase().indexOf("invalid json response") !== -1
                    ? exceptions.REMOTE_OFFLINE
                    : response.error);
                return;
            }
            response = await window.ipcClient("sendPayment", {
                details: { payment_request: response.response.payment_request },
                isPayReq: true,
            });
            dispatch(actions.changeStreamPartsPending(streamId, -1));
            if (!response.ok) {
                handleStreamError(response.error);
                return;
            }
            logger.log("STREAM ITERATION MADE,", payment.name);
            logger.log("Payment hash,", response.payment_hash);
            dispatch(actions.changeStreamPartsPaid(streamId, 1));
            dispatch(accountOperations.checkBalance());
            dispatch(channelsOperations.getChannels());
            payment = getState().streamPayment.streams.filter(item => item.id === streamId)[0]; //eslint-disable-line
            const updateData = {
                partsPaid: payment.partsPaid,
                totalAmount: payment.totalAmount + payment.price,
            };
            if (startTime > payment.lastPayment) {
                updateData.lastPayment = startTime;
            }
            dispatch(actions.updateStreamPayment(payment.id, updateData));
            try {
                db.streamBuilder()
                    .update()
                    .set(updateData)
                    .where("id = :id", { id: payment.id })
                    .execute();
                db.streamPartBuilder()
                    .insert()
                    .values({
                        payment_hash: response.payment_hash,
                        stream: payment.id,
                    })
                    .execute();
            } catch (e) {
                /* istanbul ignore next */
                logger.error(exceptions.EXTRA, e);
            }
            if (payment.status !== types.STREAM_PAYMENT_FINISHED
                && payment.totalParts !== STREAM_INFINITE_TIME_VALUE
                && payment.partsPaid + payment.partsPending >= payment.totalParts) {
                dispatch(finishStreamPayment(streamId));
                dispatch(info({
                    message: <span>Stream <strong>{payment.name}</strong> ended</span>,
                    uid: streamId,
                }));
            }
        };

        let payment = getState().streamPayment.streams.filter(item => item.id === streamId)[0];
        if (
            !payment
            || (!forceStart && payment.status === types.STREAM_PAYMENT_STREAMING)
            || (payment.totalParts !== STREAM_INFINITE_TIME_VALUE
                && payment.partsPaid + payment.partsPending >= payment.totalParts)
        ) {
            return;
        }
        if (payment.status !== types.STREAM_PAYMENT_STREAMING) {
            dispatch(actions.updateStreamPayment(payment.id, { status: types.STREAM_PAYMENT_STREAMING }));
            try {
                db.streamBuilder()
                    .update()
                    .set({ partsPaid: payment.partsPaid, status: types.STREAM_PAYMENT_STREAMING })
                    .where("id = :id", { id: payment.id })
                    .execute();
            } catch (e) {
                /* istanbul ignore next */
                logger.error(exceptions.EXTRA, e);
            }
        }
        // If last payment was less time ago than the delay then wait for that time difference
        const timeSinceLastPayment = Date.now() - payment.lastPayment;
        if (payment.lastPayment !== 0 && timeSinceLastPayment < payment.delay) {
            await Timeout(payment.delay - timeSinceLastPayment, streamIdLend(streamId));
        }
        // If last payment was in range from 1x to 2x delay then:
        // We count previos payment as "borrowed" and make that payment as it was on 1x delay mark,
        // afterwards we wait till 2x delay position(which equals normal 2nd payment as it was on sheldule)
        // and make next payment
        const borrowTime =
            payment.lastPayment !== 0
                && timeSinceLastPayment < payment.delay * 2
                && timeSinceLastPayment > payment.delay
                ? (payment.delay * 2) - timeSinceLastPayment : null;
        if (borrowTime) {
            makeStreamIteration(payment.lastPayment + payment.delay);
            await Timeout(borrowTime, streamIdBorrowed(streamId));
        }
        makeStreamIteration();
        payment = getState().streamPayment.streams.filter(item => item.id === streamId)[0]; // eslint-disable-line
        if (payment
            && (payment.totalParts === STREAM_INFINITE_TIME_VALUE
                || payment.partsPaid + payment.partsPending < payment.totalParts)
            && payment.status === types.STREAM_PAYMENT_STREAMING
        ) {
            setIntervalLong(makeStreamIteration, payment.delay, streamId);
        }
    };
}

function loadStreams() {
    return async (dispatch) => {
        const response = await db.streamBuilder()
            .getMany();
        const streams = orderBy(response, "date", "desc")
            .reduce((reducedStreams, item) => {
                if (item.status === types.STREAM_PAYMENT_FINISHED) {
                    return reducedStreams;
                }
                reducedStreams.push({
                    ...item,
                    contact_name: "",
                    partsPending: 0,
                    status: item.status,
                });
                return reducedStreams;
            }, []);
        await dispatch(actions.setStreamPayments(streams));
        streams.forEach((stream) => {
            if (stream.status === types.STREAM_PAYMENT_STREAMING) {
                dispatch(startStreamPayment(stream.id, true));
            }
        });
        return successPromise();
    };
}

export {
    pauseDbStreams,
    prepareStreamPayment,
    updateStreamPayment,
    startStreamPayment,
    finishStreamPayment,
    pauseStreamPayment,
    openStreamPaymentDetailsModal,
    openActiveRecurringWarningModal,
    openEditStreamModal,
    addStreamPaymentToList,
    loadStreams,
    clearPrepareStreamPayment,
    pauseAllStreams,
};
