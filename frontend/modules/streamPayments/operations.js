import React from "react";
import orderBy from "lodash/orderBy";
import * as statusCodes from "config/status-codes";
import { appActions, appOperations } from "modules/app";
import { lightningOperations } from "modules/lightning";
import { channelsOperations } from "modules/channels";
import { store } from "store/configure-store";
import { db, helpers, successPromise, errorPromise, logger, delay as Timeout } from "additional";
import { error, info } from "modules/notifications";
import { accountOperations, accountTypes } from "modules/account";
import { STREAM_ERROR_TIMEOUT, STREAM_INFINITE_TIME_VALUE } from "config/consts";
import { streamPaymentActions as actions, streamPaymentTypes as types } from "modules/streamPayments";

function pauseDbStreams() {
    try {
        db.streamBuilder()
            .update()
            .set({ status: "pause" })
            .where("status = :status", { status: "run" })
            .execute();
    } catch (e) {
        logger.error(e);
    }
}

function openStreamPaymentDetailsModal() {
    return dispatch => dispatch(appActions.setModalState(types.MODAL_STATE_STREAM_PAYMENT_DETAILS));
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
            return errorPromise(statusCodes.EXCEPTION_ACCOUNT_NO_KERNEL, prepareStreamPayment);
        }
        const name = paymentName || "Stream payment";
        const id = btoa(unescape(encodeURIComponent(`${name}_${new Date().getTime()}`)));
        const memo = `stream_payment_${new Date().getTime()}`;
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
            streamId: id,
            totalParts,
            uuid: id,
        };
        dispatch(actions.prepareStreamPayment(details));
        return successPromise();
    };
}

function addStreamPaymentToList() {
    return async (dispatch, getState) => {
        const details = getState().streamPayment.streamDetails;
        if (!details) {
            return errorPromise(statusCodes.EXCEPTION_RECURRING_DETAILS_REQUIRED, addStreamPaymentToList);
        }
        dispatch(actions.addStreamPaymentToList());
        try {
            await db.streamBuilder()
                .insert()
                .values({
                    currency: details.currency,
                    date: details.date,
                    delay: details.delay,
                    id: details.uuid,
                    lastPayment: details.lastPayment,
                    lightningID: details.lightningID,
                    memo: `stream_payment_${details.uuid}`,
                    name: details.name,
                    partsPaid: details.partsPaid,
                    price: details.price,
                    status: "pause",
                    totalParts: details.totalParts,
                })
                .execute();
        } catch (e) {
            /* istanbul ignore next */
            logger.error(statusCodes.EXCEPTION_EXTRA, e);
        }
        return successPromise();
    };
}

function pauseStreamPayment(streamId, pauseInDb = true) {
    return (dispatch, getState) => {
        const payment = getState().streamPayment.streams.filter(item => item.streamId === streamId)[0];
        if (!payment) {
            return;
        }
        clearInterval(payment.paymentIntervalId);
        dispatch(actions.setStreamPaymentStatus(payment.streamId, types.STREAM_PAYMENT_PAUSED));
        dispatch(actions.clearStreamPaymentIntervalId(payment.streamId));
        if (pauseInDb) {
            db.streamBuilder()
                .update()
                .set({ partsPaid: payment.partsPaid, status: "pause" })
                .where("id = :id", { id: payment.streamId })
                .execute();
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
                    dispatch(pauseStreamPayment(item.streamId, pauseInDb));
                }
            });
    };
}

function finishStreamPayment(streamId) {
    return (dispatch, getState) => {
        const payment = getState().streamPayment.streams.filter(item => item.streamId === streamId)[0];
        if (!payment) {
            return;
        }
        clearInterval(payment.paymentIntervalId);
        dispatch(actions.clearStreamPaymentIntervalId(payment.streamId));
        dispatch(actions.setStreamPaymentStatus(payment.streamId, types.STREAM_PAYMENT_FINISHED));
        db.streamBuilder()
            .update()
            .set({ partsPaid: payment.partsPaid, status: "end" })
            .where("id = :id", { id: payment.streamId })
            .execute();
    };
}

function startStreamPayment(streamId, forceStart = false) {
    return async (dispatch, getState) => {
        let errorShowed = false;
        const handleStreamError = (err = statusCodes.EXCEPTION_RECURRING_TIMEOUT) => {
            if (!errorShowed) {
                dispatch(pauseStreamPayment(streamId));
                const { isLogined, isLogouting } = getState().account;
                if (isLogined && !isLogouting) {
                    dispatch(error({
                        message: err,
                        uid: "stream_error",
                    }));
                }
                errorShowed = true;
            }
        };
        const makeStreamIteration = async (shouldStartAt) => {
            let payment = getState().streamPayment.streams.filter(item => item.streamId === streamId)[0];
            /* istanbul ignore next */
            if (!payment) {
                handleStreamError(statusCodes.EXCEPTION_RECURRING_NOT_IN_STORE);
                return;
            }
            const startTime = shouldStartAt || Date.now();
            if ((payment.totalParts !== STREAM_INFINITE_TIME_VALUE
                && payment.partsPaid + payment.partsPending >= payment.totalParts)
                || payment.status === types.STREAM_PAYMENT_FINISHED) {
                dispatch(finishStreamPayment(streamId));
                return;
            }
            /* istanbul ignore next */
            if (payment.status !== types.STREAM_PAYMENT_STREAMING) {
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
            dispatch(actions.changeStreamPartsPending(streamId, 1));
            let response = await dispatch(lightningOperations.addInvoiceRemote(
                payment.lightningID,
                amount,
                payment.memo,
            ));
            if (!response.ok) {
                dispatch(actions.changeStreamPartsPending(streamId, -1));
                handleStreamError(response.error.toLowerCase().indexOf("invalid json response") !== -1
                    ? statusCodes.EXCEPTION_REMOTE_OFFLINE
                    : response.error);
                return;
            }
            response = await window.ipcClient("sendPayment", { payment_request: response.response.payment_request });
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
            payment = getState().streamPayment.streams.filter(item => item.streamId === streamId)[0]; //eslint-disable-line
            const updateData = startTime > payment.lastPayment
                ? { lastPayment: startTime, partsPaid: payment.partsPaid }
                : { partsPaid: payment.partsPaid };
            if (startTime > payment.lastPayment) {
                dispatch(actions.setStreamLastPayment(payment.streamId, startTime));
            }
            try {
                db.streamBuilder()
                    .update()
                    .set(updateData)
                    .where("id = :id", { id: payment.streamId })
                    .execute();
                db.streamPartBuilder()
                    .insert()
                    .values({
                        payment_hash: response.payment_hash,
                        stream: payment.streamId,
                    })
                    .execute();
            } catch (e) {
                /* istanbul ignore next */
                logger.error(statusCodes.EXCEPTION_EXTRA, e);
            }
            if (payment.totalParts !== STREAM_INFINITE_TIME_VALUE
                && payment.partsPaid + payment.partsPending >= payment.totalParts) {
                dispatch(finishStreamPayment(streamId));
                dispatch(info({
                    message: <span>Stream <strong>{payment.name}</strong> ended</span>,
                    uid: streamId,
                }));
            }
        };

        let payment = getState().streamPayment.streams.filter(item => item.streamId === streamId)[0];
        if (
            !payment
            || (!forceStart && payment.status === types.STREAM_PAYMENT_STREAMING)
            || (payment.totalParts !== STREAM_INFINITE_TIME_VALUE
                && payment.partsPaid + payment.partsPending >= payment.totalParts)
        ) {
            return;
        }
        dispatch(actions.setStreamPaymentStatus(payment.streamId, types.STREAM_PAYMENT_STREAMING));
        db.streamBuilder()
            .update()
            .set({ partsPaid: payment.partsPaid, status: "run" })
            .where("id = :id", { id: payment.streamId })
            .execute();
        const timeSinceLastPayment = Date.now() - payment.lastPayment;
        if (payment.lastPayment !== 0 && timeSinceLastPayment < payment.delay) {
            await Timeout(payment.delay - timeSinceLastPayment);
        }
        const borrowTime =
            payment.lastPayment !== 0
                && timeSinceLastPayment < payment.delay * 2
                && timeSinceLastPayment > payment.delay
                ? (payment.delay * 2) - timeSinceLastPayment : null;
        if (borrowTime) {
            makeStreamIteration(payment.lastPayment + payment.delay);
            await Timeout(borrowTime);
        }
        makeStreamIteration();
        payment = getState().streamPayment.streams.filter(item => item.streamId === streamId)[0]; // eslint-disable-line
        if (!payment.paymentIntervalId) {
            const paymentIntervalId = setInterval(makeStreamIteration, payment.delay);
            dispatch(actions.setStreamPaymentIntervalId(payment.streamId, paymentIntervalId));
        }
    };
}

function loadStreams() {
    return async (dispatch) => {
        const response = await db.streamBuilder()
            .getMany();
        const streams = orderBy(response, "date", "desc")
            .reduce((reducedStreams, item) => {
                if (item.status === "end") {
                    return reducedStreams;
                }
                reducedStreams.push({
                    ...item,
                    contact_name: "",
                    partsPending: 0,
                    status: item.status === "run" ? types.STREAM_PAYMENT_STREAMING : types.STREAM_PAYMENT_PAUSED,
                    streamId: item.id,
                    uuid: item.id,
                });
                return reducedStreams;
            }, []);
        await dispatch(actions.setStreamPayments(streams));
        streams.forEach((stream) => {
            if (stream.status === types.STREAM_PAYMENT_STREAMING) {
                dispatch(startStreamPayment(stream.streamId, true));
            }
        });
        return successPromise();
    };
}

export {
    pauseDbStreams,
    prepareStreamPayment,
    startStreamPayment,
    finishStreamPayment,
    pauseStreamPayment,
    openStreamPaymentDetailsModal,
    addStreamPaymentToList,
    loadStreams,
    clearPrepareStreamPayment,
    pauseAllStreams,
};
