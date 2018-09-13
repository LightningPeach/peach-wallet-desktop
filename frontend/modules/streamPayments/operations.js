import * as statusCodes from "config/status-codes";
import { appActions } from "modules/app";
import { lightningOperations } from "modules/lightning";
import { channelsOperations } from "modules/channels";
import { store } from "store/configure-store";
import { db, successPromise, errorPromise } from "additional";
import orderBy from "lodash/orderBy";
import { error } from "modules/notifications";
import { accountOperations, accountTypes } from "modules/account";
import * as actions from "./actions";
import * as types from "./types";

async function afterCrash() {
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

function pauseStreamPayment(streamId) {
    return ((dispatch, getState) => {
        const payment = getState().streamPayment.streams.filter(item => item.streamId === streamId);
        if (!payment[0]) {
            return;
        }
        dispatch(actions.streamPaymentStatus(payment[0].uuid, types.STREAM_PAYMENT_PAUSE));
        window.ipcRenderer.send("pauseStream", { uuid: payment[0].uuid });
        db.streamBuilder()
            .update()
            .set({ currentPart: payment[0].currentPart, status: "pause" })
            .where("id = :id", { id: payment[0].uuid })
            .execute();
    });
}

function pauseAllStream() {
    return (dispatch, getState) => {
        getState()
            .streamPayment
            .streams
            .forEach((item, key) => {
                if (item.status === types.STREAM_PAYMENT_STREAMING) {
                    dispatch(pauseStreamPayment(item.streamId));
                }
            });
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
                window.ipcRenderer.send("addStream", { ...item, uuid: item.id });
                reducedStreams.push({
                    ...item,
                    contact_name: "",
                    lightningID: item.lightningID,
                    status: item.status === "run" ? types.STREAM_PAYMENT_STREAMING : types.STREAM_PAYMENT_PAUSE,
                    streamId: item.id,
                    uuid: item.id,
                });
                return reducedStreams;
            }, []);
        dispatch(actions.setStreams(streams));
        return successPromise();
    };
}

function clearPrepareStreamPayment() {
    return async (dispatch, getState) => {
        dispatch(actions.streamPaymentPrepare(null));
    };
}

function prepareStreamPayment(
    lightningID,
    price,
    delay = 1000,
    totalParts = 0,
    paymentName = null,
    contact_name = "",
    currentPart = 0,
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
            currentPart,
            date,
            delay,
            fee: fees.response.fee,
            id,
            lightningID,
            memo,
            name,
            price,
            status: types.STREAM_PAYMENT_PAUSE,
            streamId: id,
            totalParts,
            uuid: id,
        };
        dispatch(actions.streamPaymentPrepare(details));
        return successPromise();
    };
}

function addStreamPaymentToList() {
    return async (dispatch, getState) => {
        const details = getState().streamPayment.streamDetails;
        if (!details) {
            return errorPromise(statusCodes.EXCEPTION_STREAM_DETAILS_REQUIRED, addStreamPaymentToList);
        }
        window.ipcRenderer.send("addStream", {
            currentPart: details.currentPart,
            delay: details.delay,
            lightningID: details.lightningID,
            memo: details.memo,
            price: details.price,
            totalParts: details.totalParts,
            uuid: details.uuid,
        });
        dispatch(actions.addStreamToList());
        try {
            await db.streamBuilder()
                .insert()
                .values({
                    currentPart: details.currentPart,
                    date: details.date,
                    delay: details.delay,
                    id: details.uuid,
                    lightningID: details.lightningID,
                    memo: `stream_payment_${details.uuid}`,
                    name: details.name,
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

function stopStreamPayment(streamId) {
    return (dispatch, getState) => {
        const payment = getState().streamPayment.streams.filter(item => item.streamId === streamId);
        // TODO: Multiple parallel stream payments
        dispatch(pauseAllStream());
        if (!payment[0]) {
            return;
        }
        dispatch(actions.streamPaymentStatus(payment[0].streamId, types.FINISHED_STREAM_PAYMENT));
        window.ipcRenderer.send("endStream", { uuid: payment[0].uuid });
        db.streamBuilder()
            .update()
            .set({ currentPart: payment[0].currentPart, status: "end" })
            .where("id = :id", { id: payment[0].uuid })
            .execute();
    };
}

function startStreamPayment(streamId) {
    return (dispatch, getState) => {
        const payment = getState().streamPayment.streams.filter(item => item.streamId === streamId);
        // TODO: Multiple parallel stream payments
        dispatch(pauseAllStream());
        if (!payment[0]) {
            return;
        }
        dispatch(actions.streamPaymentStatus(payment[0].streamId, types.STREAM_PAYMENT_STREAMING));
        db.streamBuilder()
            .update()
            .set({ currentPart: payment[0].currentPart, status: "run" })
            .where("id = :id", { id: payment[0].uuid })
            .execute();
    };
}

window.ipcRenderer.on("ipcMain:pauseStream", async (event, streamId) => {
    const payment = store.getState().streamPayment.streams.filter(item => item.streamId === streamId);
    /* istanbul ignore if */
    if (!payment[0]) {
        console.error("STREAM PAUSED BUT STREAM NOT FOUND IN STORE");
        console.error(`Stream uuid: ${streamId}`);
        return;
    }
    store.dispatch(actions.streamPaymentStatus(streamId, types.STREAM_PAYMENT_PAUSE));
    await db.streamBuilder()
        .update()
        .set({ currentPart: payment[0].currentPart, status: "pause" })
        .where("id = :id", { id: payment[0].uuid })
        .execute();
});

window.ipcRenderer.on("ipcMain:endStream", async (event, streamId) => {
    const payment = store.getState().streamPayment.streams.filter(item => item.streamId === streamId);
    /* istanbul ignore if */
    if (!payment[0]) {
        console.error("STREAM ENDED BUT STREAM NOT FOUND IN STORE");
        console.error(`Stream uuid: ${streamId}`);
        return;
    }
    store.dispatch(actions.streamPaymentSuccessFinish(streamId));
    await db.streamBuilder()
        .update()
        .set({ currentPart: payment[0].currentPart, status: "end" })
        .where("id = :id", { id: payment[0].uuid })
        .execute();
});

window.ipcRenderer.on("ipcMain:finishStream", async (event, streamId) => {
    const payment = store.getState().streamPayment.streams.filter(item => item.streamId === streamId);
    /* istanbul ignore if */
    if (!payment[0]) {
        console.error("STREAM ENDED BUT STREAM NOT FOUND IN STORE");
        console.error(`Stream uuid: ${streamId}`);
        return;
    }
    store.dispatch(actions.streamPaymentSuccessFinish(streamId));
    await db.streamBuilder()
        .update()
        .set({ currentPart: payment[0].currentPart, status: "end" })
        .where("id = :id", { id: payment[0].uuid })
        .execute();
});

window.ipcRenderer.on("ipcMain:errorStream", async (event, streamId, err) => {
    const payment = store.getState().streamPayment.streams.filter(item => item.streamId === streamId);
    if (!payment[0]) {
        /* istanbul ignore next */
        console.error("ERROR ON STREAM PAYMENT BUT STREAM NOT FOUND IN STORE");
        console.error(err);
        return;
    }
    console.error("ERROR ON STREAM PAYMENT");
    console.error(err);
    store.dispatch(actions.streamPaymentStatus(streamId, types.STREAM_PAYMENT_PAUSE));
    store.dispatch(error({
        message: err,
        uid: "stream_error",
    }));
    await db.streamBuilder()
        .update()
        .set({ currentPart: payment[0].currentPart, status: "pause" })
        .where("id = :id", { id: payment[0].uuid })
        .execute();
});

window.ipcRenderer.on("ipcMain:updateStreamSec", (event, streamId, sec) => {
    const payment = store.getState().streamPayment.streams.filter(item => item.streamId === streamId);
    /* istanbul ignore if */
    if (!payment[0]) {
        console.error("SAVE STREAM PART BUT STREAM NOT FOUND IN STORE");
        console.error(`Stream uuid: ${streamId}`);
        return;
    }
    store.dispatch(accountOperations.checkBalance());
    store.dispatch(actions.streamCurrentSec(streamId, sec));
    store.dispatch(channelsOperations.getChannels());
    db.streamBuilder()
        .update()
        .set({ currentPart: payment[0].currentPart })
        .where("id = :id", { id: payment[0].uuid })
        .execute();
});

window.ipcRenderer.on("ipcMain:saveStreamPart", (event, streamId, paymentHash) => {
    const payment = store.getState().streamPayment.streams.filter(item => item.streamId === streamId);
    /* istanbul ignore if */
    if (!payment[0]) {
        console.error("SAVE STREAM PART BUT STREAM NOT FOUND IN STORE");
        console.error(`Stream uuid: ${streamId}`);
    }
    try {
        db.streamPartBuilder()
            .insert()
            .values({
                payment_hash: paymentHash,
                stream: payment[0].uuid,
            })
            .execute();
    } catch (e) {
        /* istanbul ignore next */
        console.error(statusCodes.EXCEPTION_EXTRA, e);
    }
});

export {
    afterCrash,
    prepareStreamPayment,
    startStreamPayment,
    stopStreamPayment,
    pauseStreamPayment,
    openStreamPaymentDetailsModal,
    addStreamPaymentToList,
    loadStreams,
    clearPrepareStreamPayment,
    pauseAllStream,
};
