import orderBy from "lodash/orderBy";
import omit from "lodash/omit";

import { exceptions, consts } from "config";
import { appOperations, appActions } from "modules/app";
import { streamPaymentTypes } from "modules/streamPayments";
import { accountOperations } from "modules/account";
import { db, successPromise, errorPromise, logger, helpers } from "additional";
import { store } from "store/configure-store";
import * as actions from "./actions";
import * as types from "./types";

/** IMPORTANT return lightning fee only in satoshi */
function getLightningFee(lightningID, amount) {
    return async (dispatch, getState) => {
        const routes = await window.ipcClient("queryRoutes", {
            amt: amount,
            num_routes: consts.LIGHTNING_NUM_ROUTES, // TODO not used in rpc.proto?
            pub_key: lightningID,
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
    pay_req_decoded = null,
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
            pay_req_decoded,
            name,
            contact_name,
            fees.response.fee,
        ));
        return successPromise();
    };
}

async function getPaginatedInvoices(offset = 0) {
    const { ok, response } = await window.ipcClient("listInvoices", { index_offset: offset });
    if (!ok) {
        logger.error("ERROR ON GET INVOICES");
        logger.error(response);
        return [];
    }
    const lastOffset = parseInt(response.last_index_offset, 10);
    if (lastOffset === 0 || lastOffset % consts.DEFAULT_MAX_INVOICES !== 0) {
        return response.invoices;
    }
    return [...response.invoices, ...(await getPaginatedInvoices(lastOffset))];
}

async function getInvoices() {
    // use maximum `num_max_invoices` or collect all invoices recursively? That is the question.
    // const response = await window.ipcClient("listInvoices", { num_max_invoices: consts.MAX_INVOICES });
    const allInvoices = await getPaginatedInvoices();
    const streamInvoices = {};
    const settledInvoices = allInvoices.filter(invoice => invoice.state === consts.LIGHTNING_INVOICE_STATE.SETTLED);
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
        if (helpers.isStreamOrRecurring(invoice)) {
            tempInvoice.currency = "BTC";
            tempInvoice.name = consts.INCOMING_RECURRING_NAME;
            tempInvoice.type = "stream";
            // default 1 sec? attach stream delay to invoice.
            tempInvoice.delay = -1;
            tempInvoice.price = tempInvoice.amount;
            tempInvoice.totalAmount = tempInvoice.amount + (streamInvoices[memo] ?
                streamInvoices[memo].totalAmount :
                0);
            tempInvoice.totalParts = (streamInvoices[memo] ? streamInvoices[memo].totalParts : 0) + 1;
            tempInvoice.partsPaid = tempInvoice.totalParts;
            tempInvoice.status = streamPaymentTypes.STREAM_PAYMENT_FINISHED;
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
        // TODO: Add restore db by parts, restore missing streams in db, focus on memo field
        const findInParts = (isFound, item) => isFound || item.payment_hash === payment.payment_hash;
        const dbStream = dbStreams.filter(item => item.parts.reduce(findInParts, false))[0];
        if (dbStream) {
            foundedInDb.push(dbStream.id);
            if (dbStream.status !== streamPaymentTypes.STREAM_PAYMENT_FINISHED) {
                return reducedPayments;
            }
            const partsPaid = streamPayments[dbStream.id] ? streamPayments[dbStream.id].partsPaid + 1 : 1;
            streamPayments[dbStream.id] = {
                ...omit(dbStream, "parts"),
                partsPaid,
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
            payment_hash: payment.payment_hash,
            type: "payment",
        });
        return reducedPayments;
    }, []);
    const orphansStreams = dbStreams.filter(dbStream =>
        !foundedInDb.includes(dbStream.id)
        && dbStream.status === streamPaymentTypes.STREAM_PAYMENT_FINISHED)
        .map(dbStream => ({
            ...omit(dbStream, "parts"),
            partsPaid: 0,
            type: "stream",
        }));
    dbStreams.forEach((dbStream) => {
        if (dbStream.status !== streamPaymentTypes.STREAM_PAYMENT_FINISHED) {
            return;
        }
        const partsPaid = !foundedInDb.includes(dbStream.id)
            ? 0
            : streamPayments[dbStream.id].partsPaid;
        if (dbStream.partsPaid !== partsPaid) {
            try {
                db.streamBuilder()
                    .update()
                    .set({ partsPaid })
                    .where("id = :id", { id: dbStream.id })
                    .execute();
            } catch (e) {
                /* istanbul ignore next */
                logger.error(exceptions.EXTRA, e);
            }
        }
    });
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
                error = exceptions.REMOTE_OFFLINE;
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
        let paymentDetails;
        let isPayReqPayment = true;
        if (details.pay_req_decoded && details.pay_req_decoded.num_satoshis !== details.amount) {
            isPayReqPayment = false;
            paymentDetails = {
                amt: details.amount,
                dest_string: details.pay_req_decoded.destination,
                final_cltv_delta: details.pay_req_decoded.cltv_expiry,
                payment_hash_string: details.pay_req_decoded.payment_hash,
            };
        } else {
            paymentDetails = {
                payment_request: details.pay_req,
            };
        }
        const response = await window.ipcClient("sendPayment", {
            details: paymentDetails,
            isPayReq: isPayReqPayment,
        });
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
            logger.error(exceptions.EXTRA, e);
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
        const payReqDecoded = getState().lightning.paymentDetails[0].pay_req_decoded || null;
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
            pay_req_decoded: payReqDecoded,
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
    getPaginatedInvoices,
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
