const ReconnectingWebSocket = require("reconnecting-websocket");
const WebSocket = require("ws");
const crypto = require("crypto");
const settings = require("../settings");
const Lnd = require("./Lnd");
const elliptic = require("elliptic").ec;
const ec = new elliptic("secp256k1");
const aesjs = require("aes-js");
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
    SOCKET_ADD_INVOICE_ENCRYPTED_REMOTE_RESPONSE: "ADD_INVOICE_ENCRYPTED_REMOTE_RESPONSE",
    SOCKET_ADD_INVOICE_REMOTE_REQUEST: "ADD_INVOICE_REMOTE_REQUEST",
    SOCKET_ADD_INVOICE_ENCRYPTED_REMOTE_REQUEST: "ADD_INVOICE_ENCRYPTED_REMOTE_REQUEST",
    SOCKET_PUBKEY_REQUEST: "PUBKEY_REQUEST",
    SOCKET_PUBKEY_RESPONSE: "PUBKEY_RESPONSE",
    ERROR_INVOICE_MAX_RETRIES: "Looks like client offline",
    ERROR_MALFORMED_INVOICE: "Invoice returned with wrong data",
};
let ws;
// for old invoices
const invoiceResponse = {};
// here will be keys for encryption, invoice response and memo for invoice
const invoiceStorage = {};
const lnd = new Lnd();

// generation of local private key for the wallet session to encrypt communication with other wallets
let secret = ec.genKeyPair();
// timout for saving shared keys - 1 hour
const KEY_SAVE_TIMEOUT = 60 * 60 * 1000;
// local storage for shared keys
// let keyStorage = {};

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

const checkAuthority = async (msg, sender) => {
    const responseLnd = await lnd.call("VerifyMessage", {
        signature: msg.sign,
        msg: Buffer.from(msg.data.toString()),
    });
    logger.debug("Response while check auth: ", responseLnd.response);
    if (!responseLnd.response.valid ||
        responseLnd.response.pubkey != sender) {
        return new Promise((resolve) => {
            resolve({ ok: false });
        })
    }
    return new Promise((resolve) => {
        resolve({ ok: true });
    })
};

const onMessage = async (message) => {
    const data = JSON.parse(message.data);
    logger.debug("Receive msg:", message.data);
    const msg = data.message;
    let action = msg.action || msg.data.action;
    switch (action) {
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
            };
            logger.debug("Server socket successfully opened. Will send:", authorizeParams);
            ws.send(JSON.stringify(authorizeParams));
            break;
        }
        case types.SOCKET_SIGN_MESSAGE_REQUEST: {
            logger.debug("Sign message request");
            const response = await lnd.call("signMessage", { msg: Buffer.from(msg.msg, "hex") });
            if (!response.ok) {
                logger.error("SOCKET_SIGN_MESSAGE_REQUEST LND.signMessage:", response.error);
                closeConnection();
                return;
            }
            const params = {
                action: types.SOCKET_SIGN_MESSAGE_RESPONSE,
                message: response.response.signature,
            };
            logger.debug("Will send:", params);
            ws.send(JSON.stringify(params));
            break;
        }
        case types.SOCKET_SIGN_MESSAGE_SUCCESS: {
            logger.debug("Successfully authorized");
            helpers.ipcSend("lis-up");
            break;
        }
        case types.SOCKET_ADD_INVOICE_REMOTE_RESPONSE: {
            logger.debug("Response from request invoice:", msg);
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
            logger.debug("Will send:", params);
            ws.send(JSON.stringify(params));
            break;
        }
        case types.SOCKET_PUBKEY_REQUEST: {
            logger.debug("PUBKEY REQUEST", invoiceStorage[msg.data.id]);
            // check authority
            logger.debug("Will check auth");
            const checked = await checkAuthority(msg, data.sender);
            if (!checked.ok) {
                break;
            }
            logger.debug("Checked");

            let pubkey = ec.keyFromPublic(msg.data.pubkey, "hex");
            // remember shared key for particular id

            // for test
            if (!invoiceStorage[msg.data.id]) {
                invoiceStorage[msg.data.id] = {
                    lightningId: data.sender,
                };
            } else {
                invoiceStorage[msg.data.id].lightningId = data.sender;
            }
            invoiceStorage[msg.data.id].sharedKey = secret.derive(pubkey.getPublic());

            let socketResponse = {
                data: {
                    action: types.SOCKET_PUBKEY_RESPONSE,
                    lightning_id: data.sender,
                    id: msg.data.id,
                    pubkey: secret.getPublic().encode('hex'),
                },
            };
            // sign message with lnd private key
            logger.debug("Signing message");
            const response = await lnd.call("signMessage", { msg: Buffer.from(socketResponse.data.toString()) });
            socketResponse.sign = response.response.signature;

            logger.debug("Will send:", socketResponse);
            ws.send(JSON.stringify(socketResponse));
            break;
        }
        case types.SOCKET_PUBKEY_RESPONSE: {
            logger.debug("Will check auth", invoiceStorage[msg.data.id]);
            logger.debug("PUBKEY RESPONSE", invoiceStorage[msg.data.id]);
            let checked = await checkAuthority(msg, data.sender);
            if (!checked.ok || data.sender != invoiceStorage[msg.data.id].lightningId) {
                break;
            }
            logger.debug("Checked");

            // remember shared key for particular id
            let pubkey = ec.keyFromPublic(msg.data.pubkey, "hex");
            invoiceStorage[msg.data.id].sharedKey = secret.derive(pubkey.getPublic());

            let invoiceRequest = {
                amount: invoiceStorage[msg.data.id].amount,
            };
            if ("memo" in invoiceStorage[msg.data.id])
                invoiceRequest.memo = invoiceStorage[msg.data.id].memo;

            let shared = invoiceStorage[msg.data.id].sharedKey;
            let aesCtr = new aesjs.ModeOfOperation.ctr(shared.toArray());
            logger.debug("Invoice:", JSON.stringify(invoiceRequest));
            let msgBytes = aesjs.utils.utf8.toBytes(JSON.stringify(invoiceRequest));
            let encryptedSendedBytes = aesCtr.encrypt(msgBytes);
            const encryptedHex = aesjs.utils.hex.fromBytes(encryptedSendedBytes);
            logger.debug("Msg:", encryptedHex);

            let socketResponse = {
                data: {
                    action: types.SOCKET_ADD_INVOICE_ENCRYPTED_REMOTE_REQUEST,
                    lightning_id: data.sender,
                    msg: encryptedHex,
                    id: msg.data.id
                },
            };
            // sign message with lnd private key
            const response = await lnd.call("signMessage", { msg: Buffer.from(socketResponse.data.toString()) });
            socketResponse.sign = response.response.signature;

            logger.debug("Will send:", socketResponse);
            ws.send(JSON.stringify(socketResponse));
            break;
        }
        case types.SOCKET_ADD_INVOICE_ENCRYPTED_REMOTE_REQUEST: {
            logger.debug("Response from request invoice:", msg);
            logger.debug("INVOICE REQUEST", invoiceStorage[msg.data.id]);
            let checked = await checkAuthority(msg, data.sender);
            if (!checked.ok || data.sender != invoiceStorage[msg.data.id].lightningId) {
                break;
            }

            logger.debug("Checked");
            let shared = invoiceStorage[msg.data.id].sharedKey;
            logger.debug(shared);
            let encryptedReceivedBytes = aesjs.utils.hex.toBytes(msg.data.msg);
            logger.debug(encryptedReceivedBytes);
            let aesCtr = new aesjs.ModeOfOperation.ctr(shared.toArray());
            let decryptedBytes = aesCtr.decrypt(encryptedReceivedBytes);
            let decryptedRequest = aesjs.utils.utf8.fromBytes(decryptedBytes);
            logger.debug("Will generate invoice for data: ", decryptedRequest);
            let invData = JSON.parse(decryptedRequest);
            logger.debug("Will generate invoice for data: ", invData);

            const amount = parseInt(invData.amount, 10);
            const invoiceData = {
                value: amount,
            };
            if ("memo" in invData) {
                invoiceData.memo = invData.memo;
            }
            logger.debug("Will generate invoice for data: ", invoiceData);
            const invoice = await lnd.call("addInvoice", invoiceData);
            if (!invoice.ok) {
                logger.error("SOCKET_ADD_INVOICE_REMOTE_REQUEST LND.addInvoice:", invoice);
                closeConnection();
                return;
            }

            aesCtr = new aesjs.ModeOfOperation.ctr(shared.toArray());
            let msgBytes = aesjs.utils.utf8.toBytes(JSON.stringify(invoice.response));
            let encryptedSendedBytes = aesCtr.encrypt(msgBytes);
            const encryptedHex = aesjs.utils.hex.fromBytes(encryptedSendedBytes);

            const socketResponse = {
                data: {
                    action: types.SOCKET_ADD_INVOICE_ENCRYPTED_REMOTE_RESPONSE,
                    lightning_id: data.sender,
                    id: msg.data.id,
                    msg: encryptedHex,
                },
            };

            const response = await lnd.call("signMessage", { msg: Buffer.from(socketResponse.data.toString()) });
            socketResponse.sign = response.response.signature;

            logger.debug("Will send:", socketResponse);
            ws.send(JSON.stringify(socketResponse));

            break;
        }
        case types.SOCKET_ADD_INVOICE_ENCRYPTED_REMOTE_RESPONSE: {
            logger.debug("INVOICE RESPONSE", invoiceStorage[msg.data.id]);
            logger.debug("Response from request invoice:", msg);
            let checked = await checkAuthority(msg, data.sender);
            if (!checked.ok || data.sender != invoiceStorage[msg.data.id].lightningId) {
                break;
            }

            let shared = invoiceStorage[msg.data.id].sharedKey;
            let encryptedBytes = aesjs.utils.hex.toBytes(msg.data.msg);
            let aesCtr = new aesjs.ModeOfOperation.ctr(shared.toArray());
            let decryptedBytes = aesCtr.decrypt(encryptedBytes);
            let decryptedInvoiceResponse = aesjs.utils.utf8.fromBytes(decryptedBytes);
            logger.debug("DECRYPTED INVOICE RESPONSE", decryptedInvoiceResponse);

            invoiceStorage[msg.data.id].invoice = JSON.parse(decryptedInvoiceResponse);
            logger.debug("INVOICE", invoiceStorage[msg.data.id]);
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
    const id = `${Date.now()}${crypto.randomBytes(5).toString("hex")}`;

    // const defParams = {
    //     _key: key,
    //     action: types.ADD_INVOICE_REMOTE_REQUEST,
    //     lightning_id: lightningId,
    //     type: types.SOCKET_TYPE,
    //     value,
    // };
    const defParams = {
        data: {
            action: types.SOCKET_PUBKEY_REQUEST,
            lightning_id: lightningId,
            id: id,
            pubkey: secret.getPublic().encode('hex'),
        },
    };
    // save with whom we are communicating
    invoiceStorage[id] = {
        lightningId: lightningId,
        amount: amount,
    };
    if (memo) {
        invoiceStorage[id].memo = memo;
    }

    const response = await lnd.call("signMessage", { msg: Buffer.from(defParams.data.toString()) });
    defParams.sign = response.response.signature;

    logger.debug("Will send request invoice with params:", defParams);

    ws.send(JSON.stringify(defParams));
    try {
        const response = await new Promise((resolve, reject) => {
            const retries = 40;
            let currentRetry = 0;
            const intervalId = setInterval(async () => {
                currentRetry += 1;
                if (currentRetry >= retries) {
                    clearInterval(intervalId);
                    reject(new Error(types.ERROR_INVOICE_MAX_RETRIES));
                    return;
                }
                if (invoiceStorage[id] && invoiceStorage[id].invoice) {
                    clearInterval(intervalId);
                    logger.debug("Invoice received:", id, invoiceStorage[id]);
                    const payReq = await lnd.call("decodePayReq", {
                        pay_req: invoiceStorage[id].invoice.payment_request,
                    });
                    if (!payReq.ok) {
                        logger.error("Can't decode payment request:", payReq);
                        reject(new Error(payReq.error));
                        return;
                    }
                    logger.debug("Invoice decoded:", payReq.response);
                    const eqLightning = payReq.response.destination === lightningId;
                    const eqAmount = parseInt(payReq.response.num_satoshis, 10) === value;
                    if (!eqLightning || !eqAmount) {
                        reject(new Error(types.ERROR_MALFORMED_INVOICE));
                        return;
                    }
                    resolve(Object.assign(
                        {},
                        invoiceStorage[id].invoice,
                        { decodedPaymentRequest: payReq.response },
                    ));
                }
            }, 250);
        });
        delete invoiceStorage[id];
        return { ok: true, response: Object.assign({}, response) };
    } catch (e) {
        return { ok: false, error: e.message };
    }
};

module.exports.openConnection = openConnection;
module.exports.requestInvoice = requestInvoice;
module.exports.closeConnection = closeConnection;
