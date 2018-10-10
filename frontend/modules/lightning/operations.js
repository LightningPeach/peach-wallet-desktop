import * as statusCodes from "config/status-codes";
import { appOperations, appActions } from "modules/app";
import { accountOperations } from "modules/account";
import { db, successPromise, errorPromise, logger } from "additional";
import orderBy from "lodash/orderBy";
import { store } from "store/configure-store";
import * as actions from "./actions";
import * as types from "./types";

/** IMPORTANT return lightning fee only in satoshi */
function getLightningFee(lightningID, amount) {
    return async (dispatch, getState) => {
        const routes = await window.ipcClient("queryRoutes", {
            amt: amount,
            pub_key: lightningID,
            // lnd broken with this param
            // num_routes: 5
        });
        if (!routes.ok) {
            return errorPromise(routes.error, getLightningFee);
        }
        const fees = routes.response.routes.length ?
            routes.response.routes.reduce((tempFees, fee) => {
                tempFees.push(fee.total_fees);
                return tempFees;
            }, []) : [0];
        const totalFee = fees.reduce((a, b) => a + b, 0);
        const fee = {
            avg: totalFee / fees.length,
            max: Math.max(...fees),
            min: Math.min(...fees),
        };
        return successPromise({ fee });
    };
}

function openPaymentDetailsModal() {
    return dispatch => dispatch(appActions.setModalState(types.MODAL_STATE_PAYMENT_DETAILS));
}

function channelWarningModal() {
    return dispatch => dispatch(appActions.setModalState(types.MODAL_STATE_CHANNEL_WARNING));
}

function pendingPayment() {
    return dispatch => dispatch(actions.pendingPayment());
}

export function preparePayment(
    lightningID,
    amount,
    comment,
    pay_req = null,
    paymentName = null,
    contact_name = null,
) {
    return async (dispatch, getState) => {
        const name = paymentName || "Payment";
        const fees = await dispatch(getLightningFee(lightningID, amount));
        if (!fees.ok) {
            return errorPromise(fees.error, preparePayment);
        }
        dispatch(actions.paymentPreparing(
            lightningID,
            amount,
            comment,
            pay_req,
            name,
            contact_name,
            fees.response.fee,
        ));
        return successPromise();
    };
}

async function getInvoices() {
    const response = await window.ipcClient("listInvoices");
    if (!response.ok) {
        logger.error("ERROR ON GET INVOICES");
        logger.error(response);
        return [];
    }
    const streamInvoices = {};
    const settledInvoices = response.response.invoices.filter(invoice => invoice.settled);
    const invoices = await settledInvoices.reduce(async (invoicePromise, invoice) => {
        const newInvoices = await invoicePromise;
        const payReq = await window.ipcClient("decodePayReq", { pay_req: invoice.payment_request });
        const { memo } = invoice;
        const tempInvoice = {
            amount: parseInt(invoice.value, 10),
            date: parseInt(invoice.creation_date, 10) * 1000,
            lightningID: payReq.response.destination,
            memo,
            name: "Incoming payment",
            payment_hash: payReq.response.payment_hash,
            type: "invoice",
        };
        if (memo.includes("stream_payment_")) {
            tempInvoice.name = "Incoming stream payment";
            tempInvoice.amount = parseInt(invoice.value, 10) + (streamInvoices[memo] ?
                streamInvoices[memo].amount :
                0);
            streamInvoices[memo] = tempInvoice;
        } else {
            newInvoices.push(tempInvoice);
        }
        return newInvoices;
    }, Promise.resolve([]));
    return [...invoices, ...Object.values(streamInvoices)];
}

async function getPayments() {
    const lndPayments = await window.ipcClient("listPayments");
    if (!lndPayments.ok) {
        logger.error("Error on Lightning:getPayments");
        logger.error(lndPayments.error);
        return [];
    }
    const [dbPayments, dbStreams] = await Promise.all([
        db.lightningBuilder()
            .getMany(),
        db.streamBuilder()
            .leftJoinAndSelect("stream.parts", "stream_part")
            .getMany(),
    ]);
    const foundedInDb = [];
    const streamPayments = {};
    const payments = lndPayments.response.payments.reduce((reducedPayments, payment) => {
        // TODO: Add restore db, focus on memo fieldq
        const findInParts = (isFound, item) => isFound || item.payment_hash === payment.payment_hash;
        const dbStream = dbStreams.filter(item => item.parts.reduce(findInParts, false))[0];
        if (dbStream) {
            foundedInDb.push(dbStream.id);
            if (dbStream.status !== "end") {
                return reducedPayments;
            }
            const amount = streamPayments[dbStream.id] ? parseInt(streamPayments[dbStream.id].amount, 10) : 0;
            const date = streamPayments[dbStream.id] ?
                parseInt(streamPayments[dbStream.id].date, 10) :
                parseInt(payment.creation_date, 10) * 1000;
            const partsPaid = streamPayments[dbStream.id] ? streamPayments[dbStream.id].partsPaid + 1 : 1;
            streamPayments[dbStream.id] = {
                amount: parseInt(payment.value, 10) + amount,
                currency: dbStream.currency,
                date,
                delay: dbStream.delay,
                lightningID: payment.path[payment.path.length - 1],
                name: dbStream.name,
                partsPaid,
                path: payment.path,
                totalParts: dbStream.totalParts,
                type: "stream",
            };
            return reducedPayments;
        }
        const dbPayment = dbPayments.filter(item => item.paymentHash === payment.payment_hash)[0];
        reducedPayments.push({
            amount: -parseInt(payment.value, 10),
            date: parseInt(payment.creation_date, 10) * 1000,
            lightningID: payment.path[payment.path.length - 1],
            name: dbPayment ? dbPayment.name : "Outgoing payment",
            path: payment.path,
            payment_hash: payment.payment_hash,
            type: "payment",
        });
        return reducedPayments;
    }, []);
    const orphansStreams = dbStreams.filter(dbStream => !foundedInDb.includes(dbStream.id) && dbStream.status === "end")
        .map(dbStream => ({
            amount: parseInt(dbStream.price, 10),
            currency: dbStream.currency,
            date: dbStream.date,
            delay: dbStream.delay,
            lightningID: dbStream.lightningID,
            name: dbStream.name,
            partsPaid: 0,
            path: [],
            totalParts: dbStream.totalParts,
            type: "stream",
        }));
    return [...payments, ...Object.values(streamPayments), ...orphansStreams];
}

// get all transactions history
function getHistory() {
    return async (dispatch, getState) => {
        try {
            const payments = await getPayments();
            const invoices = await getInvoices();
            const history = orderBy([...payments, ...invoices], "date", "desc");
            dispatch(actions.setHistory(history));
            return successPromise();
        } catch (error) {
            return errorPromise(error, getHistory);
        }
    };
}

function addInvoiceRemote(lightningID, amount, memo = "") {
    return async (dispatch, getState) => {
        logger.log("Sending rpc");
        const response = await window.ipcClient("addInvoiceRemote", {
            lightning_id: lightningID,
            memo: memo || getState().account.lightningID,
            value: amount.toString(),
        });
        if (!response.ok) {
            let error;
            if (response.error.indexOf("invalid json response body") !== -1) {
                error = statusCodes.EXCEPTION_REMOTE_OFFLINE;
            } else {
                error = response.error; // eslint-disable-line
            }
            return errorPromise(error, addInvoiceRemote);
        }
        return response;
    };
}

function pay(details) {
    return async (dispatch, getState) => {
        const response = await window.ipcClient("sendPayment", { payment_request: details.pay_req });
        if (!response.ok) {
            dispatch(actions.errorPayment(response.error));
            return errorPromise(response.error, pay);
        }
        try {
            await db.lightningBuilder()
                .insert()
                .values({ name: details.name, paymentHash: response.payment_hash })
                .execute();
        } catch (e) {
            /* istanbul ignore next */
            logger.error(statusCodes.EXCEPTION_EXTRA, e);
        }
        dispatch(actions.successPayment());
        dispatch(accountOperations.checkBalance());
        return successPromise({
            amount: details.amount,
            payment_hash: response.payment_hash,
        });
    };
}

function makePayment() {
    return async (dispatch, getState) => {
        logger.log("Will send payment");
        dispatch(pendingPayment());
        let payReq = getState().lightning.paymentDetails[0].pay_req || null;
        const details = {
            amount: getState().lightning.paymentDetails[0].amount,
            comment: getState().lightning.paymentDetails[0].comment,
            lightningID: getState().lightning.paymentDetails[0].lightningID,
            name: getState().lightning.paymentDetails[0].name,
        };
        if (!payReq) {
            logger.log("Will add remote invoice");
            logger.log(details.lightningID, details.amount);
            const response = await dispatch(addInvoiceRemote(details.lightningID, details.amount));
            if (!response.ok) {
                dispatch(actions.errorPayment(response.error));
                dispatch(accountOperations.checkBalance());
                return errorPromise(response.error, makePayment);
            }
            payReq = response.response.payment_request;
        }
        return dispatch(pay({
            amount: details.amount,
            comment: details.comment,
            lightningID: details.lightningID,
            name: details.name,
            pay_req: payReq,
        }));
    };
}

function clearSinglePayment() {
    return async (dispatch, getState) => {
        dispatch(actions.clearSinglePaymentDetails());
    };
}

function decodePaymentRequest(payReq) {
    return async () => {
        const paymentRequest = await window.ipcClient("decodePayReq", { pay_req: payReq });
        if (!paymentRequest.ok) {
            return errorPromise(paymentRequest.error, decodePaymentRequest);
        }
        return successPromise(paymentRequest.response);
    };
}

function generatePaymentRequest(amount) {
    return async (dispatch, getState) => {
        const value = dispatch(appOperations.convertToSatoshi(amount));
        const invoice = await window.ipcClient("addInvoice", { value });
        if (!invoice.ok) {
            dispatch(actions.paymentRequestErrorCreator(invoice.error));
            return errorPromise(invoice.error, generatePaymentRequest);
        }
        dispatch(actions.paymentRequestCreator(invoice.response.payment_request, value));
        return successPromise();
    };
}

function subscribeInvoices() {
    return (dispatch) => {
        window.ipcRenderer.send("subscribeInvoices");
    };
}

function unSubscribeInvoices() {
    return async (dispatch) => {
        await window.ipcClient("unsubscribeInvoices");
    };
}

window.ipcRenderer.on("invoices-update", (event) => {
    store.dispatch(accountOperations.checkBalance());
    store.dispatch(getHistory());
});

export {
    addInvoiceRemote,
    channelWarningModal,
    getInvoices,
    getHistory,
    getLightningFee,
    getPayments,
    openPaymentDetailsModal,
    pendingPayment,
    makePayment,
    clearSinglePayment,
    decodePaymentRequest,
    generatePaymentRequest,
    pay,
    subscribeInvoices,
    unSubscribeInvoices,
};
