const ReconnectingWebSocket = require("reconnecting-websocket");
const WebSocket = require("ws");
const crypto = require("crypto");
const settings = require("../settings");
const Lnd = require("./Lnd");
const helpers = require("../utils/helpers");
const logger = (require("../utils/logger")).child("[LIS]");

const LIS_PROTOCOL = `ws${settings.get.peach.replenishTLS ? "s" : ""}://`;
const LIS_HOST = `${LIS_PROTOCOL}${settings.get.peach.replenishUrl}`;

const types = {
    ADD_INVOICE_REMOTE_REQUEST: "ADD_INVOICE_REMOTE_REQUEST",
    SOCKET_SIGN_MESSAGE_REQUEST: "SIGN_MESSAGE_REQUEST",
    SOCKET_SIGN_MESSAGE_RESPONSE: "SIGN_MESSAGE_RESPONSE",
    SOCKET_TYPE: "LOCAL_INVOICE_SERVER",
    SOCKET_CONNECT_REQUEST: "CONNECT_REQUEST",
    SOCKET_ERROR: "ERROR",
    SOCKET_UNAUTHORIZED_CONNECTION: "UNAUTHORIZED_CONNECTION",
    SOCKET_SIGN_MESSAGE_SUCCESS: "SIGN_MESSAGE_SUCCESS",
    SOCKET_ADD_INVOICE_REMOTE_RESPONSE: "ADD_INVOICE_REMOTE_RESPONSE",
    SOCKET_ADD_INVOICE_REMOTE_REQUEST: "ADD_INVOICE_REMOTE_REQUEST",
    ERROR_INVOICE_MAX_RETRIES: "Looks like client offline",
    ERROR_MALFORMED_INVOICE: "Invoice returned with wrong data",
};
let ws;
const invoiceResponse = {};
const lnd = new Lnd();

const closeConnection = () => {
    if (ws) {
        logger.info("Try to close socket connection");
        ws.close();
        ws = null;
    } else {
        logger.info("Socket connection not initialized. Nothing to close");
    }
};

const onOpen = () => {
    logger.info("Connection opened");
};

const onError = (error) => {
    logger.error(`Server socket connect error: ${error.message}`);
    helpers.ipcSend("lis-down");
};

const onClose = () => {
    let reconnect = false;
    // TODO https://github.com/pladaria/reconnecting-websocket/issues/60#issuecomment-389482587
    if (ws && ws._shouldReconnect) {
        reconnect = true;
        ws._connect();
    }
    logger.info(`Connection closed.${reconnect ? " Try to reconnect" : ""}`);
    helpers.ipcSend("lis-down");
};

const onMessage = async (message) => {
    const data = JSON.parse(message.data);
    logger.info("Receive msg:", message.data);
    const msg = data.message;
    switch (msg.action) {
        case types.SOCKET_UNAUTHORIZED_CONNECTION: {
            const info = await lnd.call("getInfo");
            if (!info.ok) {
                logger.error("SOCKET_UNAUTHORIZED_CONNECTION LND.getInfo:", info.error);
                closeConnection();
                return;
            }
            const authorizeParams = {
                action: types.SOCKET_CONNECT_REQUEST,
                lightning_id: info.response.identity_pubkey,
                type: types.SOCKET_TYPE,
            };
            logger.info("Server socket successfully opened. Will send:", authorizeParams);
            ws.send(JSON.stringify(authorizeParams));
            break;
        }
        case types.SOCKET_SIGN_MESSAGE_REQUEST: {
            logger.info("Sign message request");
            const response = await lnd.call("signMessage", { msg: Buffer.from(msg.msg, "hex") });
            if (!response.ok) {
                logger.error("SOCKET_SIGN_MESSAGE_REQUEST LND.signMessage:", response.error);
                closeConnection();
                return;
            }
            const params = {
                action: types.SOCKET_SIGN_MESSAGE_RESPONSE,
                message: response.response.signature,
                type: types.SOCKET_TYPE,
            };
            logger.info("Will send:", params);
            ws.send(JSON.stringify(params));
            break;
        }
        case types.SOCKET_SIGN_MESSAGE_SUCCESS: {
            logger.info("Successfully authorized");
            helpers.ipcSend("lis-up");
            break;
        }
        case types.SOCKET_ADD_INVOICE_REMOTE_RESPONSE: {
            logger.info("Response from request invoice:", msg);
            invoiceResponse[msg._key] = msg;
            break;
        }
        case types.SOCKET_ADD_INVOICE_REMOTE_REQUEST: {
            const amount = parseInt(msg.amount, 10);
            const invoiceData = {
                value: amount,
            };
            if ("memo" in msg) {
                invoiceData.memo = msg.memo;
            }
            const invoice = await lnd.call("addInvoice", invoiceData);
            if (!invoice.ok) {
                logger.error("SOCKET_ADD_INVOICE_REMOTE_REQUEST LND.addInvoice:", invoice);
                closeConnection();
                return;
            }
            const params = {
                _key: msg._key || "",
                action: types.SOCKET_ADD_INVOICE_REMOTE_RESPONSE,
                invoice: invoice.response,
                lightning_id: msg.sender,
                type: types.SOCKET_TYPE,
                value: amount,
            };
            logger.info("Will send:", params);
            ws.send(JSON.stringify(params));
            break;
        }
        case types.SOCKET_ERROR:
            /* closeConnection();
            openConnection(); */
            break;
        default: {
            break;
        }
    }
};

const openConnection = () => {
    logger.info(`Will connect socket to host: ${LIS_HOST}`);
    ws = new ReconnectingWebSocket(
        LIS_HOST,
        [],
        {
            WebSocket,
            connectionTimeout: 3000,
            reconnectionDelayGrowFactor: 1,
        },
    );
    ws.addEventListener("open", onOpen);
    ws.addEventListener("message", onMessage);
    ws.addEventListener("close", onClose);
    ws.addEventListener("error", onError);
};

const requestInvoice = async (amount, lightningId, memo) => {
    const value = parseInt(amount, 10);
    const key = `${Date.now()}${crypto.randomBytes(5).toString("hex")}`;
    invoiceResponse[key] = null;
    const defParams = {
        _key: key,
        action: types.ADD_INVOICE_REMOTE_REQUEST,
        lightning_id: lightningId,
        type: types.SOCKET_TYPE,
        value,
    };
    if (memo) {
        defParams.memo = memo;
    }
    logger.info("Will send request invoice with params:", defParams);
    ws.send(JSON.stringify(defParams));
    try {
        const response = await new Promise((resolve, reject) => {
            const retries = 40;
            let currentRetry = 0;
            let intervalId;
            const makeRequest = async () => {
                currentRetry += 1;
                if (currentRetry >= retries) {
                    reject(new Error(types.ERROR_INVOICE_MAX_RETRIES));
                    return;
                }
                if (invoiceResponse[key]) {
                    logger.info("Invoice received:", key, invoiceResponse[key]);
                    const payReq = await lnd.call("decodePayReq", {
                        pay_req: invoiceResponse[key].invoice.payment_request,
                    });
                    if (!payReq.ok) {
                        logger.error("Can't decode payment request:", payReq);
                        reject(new Error(payReq.error));
                        return;
                    }
                    logger.info("Invoice decoded:", payReq.response);
                    const eqLightning = payReq.response.destination === lightningId;
                    const eqAmount = parseInt(payReq.response.num_satoshis, 10) === value;
                    if (!eqLightning || !eqAmount) {
                        reject(new Error(types.ERROR_MALFORMED_INVOICE));
                        return;
                    }
                    resolve(Object.assign(
                        {},
                        invoiceResponse[key].invoice,
                        { decodedPaymentRequest: payReq.response },
                    ));
                    return;
                }
                intervalId = setTimeout(makeRequest, 250);
            };
            intervalId = setTimeout(makeRequest, 250);
        });
        delete invoiceResponse[key];
        return { ok: true, response: Object.assign({}, response) };
    } catch (e) {
        return { ok: false, error: e.message };
    }
};

module.exports.openConnection = openConnection;
module.exports.requestInvoice = requestInvoice;
module.exports.closeConnection = closeConnection;
