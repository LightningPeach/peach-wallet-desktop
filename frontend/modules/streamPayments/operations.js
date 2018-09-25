import React from "react";
import orderBy from "lodash/orderBy";
import * as statusCodes from "config/status-codes";
import { appActions } from "modules/app";
import { lightningOperations } from "modules/lightning";
import { channelsOperations } from "modules/channels";
import { store } from "store/configure-store";
import { db, successPromise, errorPromise, delay as Timeout } from "additional";
import { error, info } from "modules/notifications";
import { accountOperations, accountTypes } from "modules/account";
import { STREAM_ERROR_TIMEOUT, STREAM_INFINITE_TIME_VALUE } from "config/consts";
import { streamPaymentActions as actions, streamPaymentTypes as types } from "modules/streamPayments";

async function pauseDbStreams() {
    try {
        await db.streamBuilder()
            .update()
            .set({ status: "pause" })
            .where("status = :status", { status: "run" })
            .execute();
    } catch (e) {
        console.error(e);
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
        const fees = await dispatch(lightningOperations.getLightningFee(lightningID, price));
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
            return errorPromise(statusCodes.EXCEPTION_STREAM_DETAILS_REQUIRED, addStreamPaymentToList);
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
            console.error(statusCodes.EXCEPTION_EXTRA, e);
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
        dispatch(actions.setStreamPaymentStatus(payment.uuid, types.STREAM_PAYMENT_PAUSED));
        dispatch(actions.setStreamPaymentIntervalId(payment.streamId, null));
        if (pauseInDb) {
            db.streamBuilder()
                .update()
                .set({ partsPaid: payment.partsPaid, status: "pause" })
                .where("id = :id", { id: payment.uuid })
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
        clearInterval(payment.paymentIntervalId);
        dispatch(actions.setStreamPaymentIntervalId(payment.streamId, null));
        dispatch(actions.setStreamPaymentStatus(payment.streamId, types.STREAM_PAYMENT_FINISHED));
        db.streamBuilder()
            .update()
            .set({ partsPaid: payment.partsPaid, status: "end" })
            .where("id = :id", { id: payment.uuid })
            .execute();
    };
}

function startStreamPayment(streamId) {
    return async (dispatch, getState) => {
        let errorShowed = false;
        let errorTimeout;
        const convertUsdToSatoshi = amount => Math.round((amount * 1e8) / getState().app.usdPerBtc);
        const handleStreamError = (err = statusCodes.EXCEPTION_LND_NOT_RESPONDING) => {
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
            if (!payment) {
                handleStreamError(statusCodes.EXCEPTION_STREAM_NOT_IN_STORE);
                return;
            }
            const startTime = shouldStartAt || Date.now();
            if ((payment.totalParts !== STREAM_INFINITE_TIME_VALUE
                && payment.partsPaid + payment.partsPending >= payment.totalParts)
                || payment.status === types.STREAM_PAYMENT_FINISHED) {
                clearTimeout(errorTimeout);
                dispatch(finishStreamPayment(streamId));
                return;
            }
            if (payment.status !== types.STREAM_PAYMENT_STREAMING) {
                clearTimeout(errorTimeout);
                dispatch(pauseStreamPayment(streamId));
                return;
            }
            let amount;
            switch (payment.currency) {
                case "USD":
                    amount = convertUsdToSatoshi(payment.price);
                    break;
                default:
                    amount = payment.price;
                    break;
            }
            errorTimeout = setTimeout(handleStreamError, STREAM_ERROR_TIMEOUT);
            let response = await dispatch(lightningOperations.addInvoiceRemote(
                payment.lightningID,
                amount,
                payment.memo,
            ));
            if (!response.ok) {
                handleStreamError(response.error.toLowerCase().indexOf("invalid json response") !== -1
                    ? statusCodes.EXCEPTION_REMOTE_OFFLINE
                    : response.error);
                return;
            }
            dispatch(actions.changeStreamPartsPending(streamId, 1));
            response = await window.ipcClient("sendPayment", { payment_request: response.response.payment_request });
            clearTimeout(errorTimeout);
            dispatch(actions.changeStreamPartsPending(streamId, -1));
            if (!response.ok) {
                handleStreamError(response.error);
                return;
            }
            console.log("STREAM ITERATION MADE,", payment.name);
            console.log("Payment hash,", response.payment_hash);
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
                    .where("id = :id", { id: payment.uuid })
                    .execute();
                db.streamPartBuilder()
                    .insert()
                    .values({
                        payment_hash: response.payment_hash,
                        stream: payment.uuid,
                    })
                    .execute();
            } catch (e) {
                /* istanbul ignore next */
                console.error(statusCodes.EXCEPTION_EXTRA, e);
            }
            if (payment.totalParts !== STREAM_INFINITE_TIME_VALUE
                && payment.partsPaid + payment.partsPending >= payment.totalParts) {
                clearTimeout(errorTimeout);
                dispatch(finishStreamPayment(streamId));
                dispatch(info({
                    message: <span>Stream <strong>{payment.name}</strong> ended</span>,
                    uid: streamId,
                }));
            }
        };

        const payment = getState().streamPayment.streams.filter(item => item.streamId === streamId)[0];
        dispatch(actions.setStreamPaymentStatus(payment.streamId, types.STREAM_PAYMENT_STREAMING));
        db.streamBuilder()
            .update()
            .set({ partsPaid: payment.partsPaid, status: "run" })
            .where("id = :id", { id: payment.uuid })
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
        const paymentIntervalId = setInterval(makeStreamIteration, payment.delay);
        dispatch(actions.setStreamPaymentIntervalId(payment.streamId, paymentIntervalId));
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
                dispatch(startStreamPayment(stream.streamId));
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
