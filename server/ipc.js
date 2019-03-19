const {
    app, ipcMain, dialog,
} = require("electron");
const helpers = require("./utils/helpers");
const Lnd = require("./binaries/Lnd");
const localInvoiceServer = require("./binaries/LocalInvoiceServer");
const baseLogger = require("./utils/logger");
const path = require("path");
const registerIpc = require("electron-ipc-tunnel/server").default;
const settings = require("./settings");
const main = require("../main");
const internalIp = require("internal-ip");
// ToDo: uncomment when will use public ip
// const publicIp = require("public-ip");


const logger = baseLogger.child("ipc");
const grpcStatus = require("grpc").status;

const lnd = new Lnd();

registerIpc("selectFolder", () => {
    const folder = dialog.showOpenDialog(main.getMainWindow(), { properties: ["openDirectory"] });
    return { ok: true, response: { folder: folder ? folder[0] : null } };
});

/**
 * User agreed the eula.txt
 */
ipcMain.on("agreement-checked", async (event, arg) => {
    console.log("Agreement checked", arg);
    try {
        await settings.set("agreement", [arg.gaChecked]);
        event.sender.send("agreement-wrote");
    } catch (err) {
        logger.error({ func: "agreement-checker" }, err);
        event.sender.send("error", err);
    }
});

ipcMain.on("setDefaultLightningApp", () => {
    app.setAsDefaultProtocolClient("lightning");
});

async function _startLndIpc(arg) {
    console.log("Stating lnd");
    const response = await lnd.start(arg.username);
    logger.info(response);
    if (!response.ok) {
        logger.debug("Will call stop from _startLndIpc");
        await lnd.stop();
        logger.info({ func: "startLnd" }, response);
    }
    logger.info({ func: "startLnd" }, response);

    return response;
}

registerIpc("startLnd", async (event, arg) => _startLndIpc(arg));

registerIpc("unlockLnd", async (event, arg) => {
    // ToDo: delete logging password
    logger.debug("Will unlock lnd");
    const response = await lnd.unlockWallet(arg.password);
    logger.debug("Unlock lnd response", response);
    if (!response.ok) {
        logger.debug("Will call stop from unlockLnd ipd");
        await lnd.stop();
        logger.error({ func: "unlockLnd" }, response);
    }
    logger.info({ func: "unlockLnd" }, response);

    return response;
});

registerIpc("createLndWallet", async (event, arg) => lnd.createWallet(arg.password, arg.seed, arg.recovery));

/**
 * Start localInvoiceServer
 */
registerIpc("startLis", async (event, arg) => {
    console.log("Starting local invoice server");
    await localInvoiceServer.openConnection(arg.username);
    return { ok: true };
});

registerIpc("logout", async () => shutdown()); // eslint-disable-line no-use-before-define

registerIpc("checkUsername", async (event, arg) => {
    const usernames = await settings.get.getCustomPathLndUsernames();
    const response = { ok: true };
    if (arg.username in usernames) {
        response.ok = false;
        response.error = "User exist.";
    }
    return response;
});

registerIpc("checkUser", async (event, arg) => {
    const exists = await helpers.checkAccess(path.join(settings.get.lndPath, arg.username, "data"));
    if (!exists.ok) {
        exists.error = "User doesn't exist.";
    }
    return exists;
});

registerIpc("setLndPath", async (event, arg) => {
    const defPath = arg.defaultPath ? settings.get.dataPath : arg.lndPath;
    settings.set("lndPath", defPath);
});

registerIpc("loadLndPath", async (event, arg) => {
    const loadedPath = await settings.get.loadLndPath(arg.username);
    settings.set("lndPath", loadedPath);
});

registerIpc("validateLndPath", async (event, arg) => helpers.checkAccess(path.join(arg.lndPath)));

registerIpc("newAddress", async (event, arg) => lnd.call("NewAddress", arg));

registerIpc("walletBalance", async () => lnd.call("WalletBalance"));

registerIpc("getInfo", async () => lnd.call("GetInfo"));

registerIpc("listInvoices", async (event, arg) => lnd.call("ListInvoices", arg));

registerIpc("addInvoiceRemote", async (event, arg) => localInvoiceServer.requestInvoice(
    arg.value,
    arg.lightning_id,
    arg.memo,
));

registerIpc("addInvoice", async (event, arg) => lnd.call("AddInvoice", arg));

registerIpc("listPayments", async () => lnd.call("ListPayments"));

registerIpc("queryRoutes", async (event, arg) => lnd.call("QueryRoutes", arg));

registerIpc("decodePayReq", async (event, arg) => lnd.call("DecodePayReq", arg));

registerIpc("signMessage", async (event, arg) => lnd.call("SignMessage", {
    msg: Buffer.from(arg.message, "hex"),
}));

registerIpc("genSeed", async () => lnd.call("GenSeed"));

// Peers
registerIpc("listPeers", async () => lnd.call("ListPeers"));

registerIpc("connectPeer", async (event, arg) => lnd.call("ConnectPeer", arg));

registerIpc("connectServerLnd", async () => lnd.call("ConnectPeer", {
    addr: {
        pubkey: settings.get.peach.pubKey,
        host: `${settings.get.peach.host}:${settings.get.peach.peerPort}`,
    },
}));


// Channels
registerIpc("listChannels", async () => lnd.call("ListChannels"));

registerIpc("pendingChannels", async () => lnd.call("PendingChannels"));

// why lnd, why?
registerIpc("openChannel", async (event, arg) => {
    // Set openChannelSync GRPC deadline to 30 seconds to avoid successful channel opening after DEADLINE_EXCEEDED error
    // Lnd will hung or return successful response. 30 seconds enough
    const OPEN_CHANNEL_DEADLINE = 0.5 * 60;
    const response = await lnd.call("OpenChannelSync", arg, OPEN_CHANNEL_DEADLINE);
    if (!response.ok && response.code !== grpcStatus.DEADLINE_EXCEEDED) {
        return response;
    }
    // looks like Lnd hung, so let's find our channel in pendingChannels
    if (!response.ok) {
        const pendingChannels = await lnd.call("pendingChannels");
        if (!pendingChannels.ok) {
            return pendingChannels;
        }
        const chan = pendingChannels.response.pending_open_channels.reduce((findedChan, channel) => {
            if (!findedChan &&
                channel.channel.remote_node_pub === arg.node_pubkey_string &&
                channel.channel.capacity === arg.local_funding_amount
            ) {
                return channel;
            }
            return findedChan;
        }, null);
        if (!chan) {
            return response;
        }
        const [txid, out] = chan.channel.channel_point.split(":");
        const info = await lnd.call("GetInfo");
        return {
            ok: true,
            funding_txid_str: txid,
            output_index: out,
            block_height: info.response.block_height,
        };
    }
    let txid;
    if (response.response.funding_txid === "funding_txid_str") {
        txid = response.response.funding_txid_str;
    } else {
        txid = Buffer.from(response.response.funding_txid_bytes.reverse())
            .toString("hex");
    }
    const info = await lnd.call("GetInfo");
    return {
        ok: true,
        funding_txid_str: txid,
        output_index: response.response.output_index,
        block_height: info.response.block_height,
    };
});

// wtf lnd? why you create channel but not return response
registerIpc("openChannelStream", async (event, arg) => {
    const response = await new Promise((resolve) => {
        const status = lnd.streamCall("OpenChannel", {
            node_pubkey: Buffer.from(arg.node_pubkey_string, "hex"),
            local_funding_amount: arg.local_funding_amount,
        });
        if (status.ok) {
            let updated;
            status.stream.on("data", (data) => {
                logger.info({ func: "openChannel" }, "stream data", data);
                if (data.update !== "chan_pending") {
                    return;
                }
                if (!updated) {
                    updated = true;
                    status.stream.cancel();
                    resolve({
                        ok: true,
                        response: {
                            funding_txid_bytes: data.chan_pending.txid,
                            output_index: data.chan_pending.output_index,
                        },
                    });
                }
            });
            status.stream.on("error", (data) => {
                if (data.code === grpcStatus.CANCELLED) {
                    return;
                }
                logger.error({ func: "openChannel" }, data);
                resolve({ ok: false, error: lnd.prettifyMessage(data.toString()) });
            });
        }
    });
    if (!response.ok) {
        return response;
    }
    const txid = Buffer.from(response.response.funding_txid_bytes.reverse()).toString("hex");
    const info = await lnd.call("GetInfo");
    return {
        ok: true,
        funding_txid_str: txid,
        output_index: response.response.output_index,
        block_height: info.response.block_height,
    };
});

registerIpc("closeChannel", async (event, arg) => {
    const response = await new Promise((resolve) => {
        const deleteStatus = lnd.streamCall("CloseChannel", arg);
        if (deleteStatus.ok) {
            let updated;
            deleteStatus.stream.on("data", (data) => {
                logger.info({ func: "closeChannel" }, "stream data", data);
                if (!updated) {
                    const updateType = data.update === "close_pending" ? "txid" : "closing_txid";
                    const txid = Buffer.from(data[data.update][updateType].reverse())
                        .toString("hex");
                    updated = true;
                    deleteStatus.stream.cancel();
                    resolve({ ok: true, txid });
                }
            });
            deleteStatus.stream.on("error", (data) => {
                if (data.code === grpcStatus.CANCELLED) {
                    return;
                }
                logger.error({ func: "closeChannel" }, data);
                resolve({ ok: false, error: lnd.prettifyMessage(data.toString()) });
            });
        }
        // resolve(deleteStatus);
    });
    if (!response.ok) {
        return response;
    }
    return {
        ok: true,
        txid: response.txid,
    };
});

registerIpc("sendPayment", async (event, arg) => {
    const payment = await lnd.call("SendPaymentSync", arg.details);
    if (!payment.ok) {
        return payment;
    }
    if (payment.response.payment_error) {
        return { ok: false, error: lnd.prettifyMessage(payment.response.payment_error) };
    }
    if (arg.isPayReq) {
        const payReq = await lnd.call("DecodePayReq", { pay_req: arg.payment_request });
        return { ok: true, payment_hash: payReq.response.payment_hash };
    }
    return { ok: true, payment_hash: arg.details.payment_hash_string };
});


// Onchain
let subscribeTransactionsCall = null;

registerIpc("getTransactions", async () => lnd.call("GetTransactions"));

registerIpc("sendCoins", async (event, arg) => lnd.call("SendCoins", arg));

ipcMain.on("subscribeTransactions", (event) => {
    if (subscribeTransactionsCall) {
        return;
    }
    subscribeTransactionsCall = lnd.streamCall("SubscribeTransactions");
    subscribeTransactionsCall.stream.on("data", (data) => {
        if (!data.num_confirmations) {
            return;
        }
        event.sender.send("transactions-update", data);
    });
    subscribeTransactionsCall.stream.on("error", (error) => {
        if (error.code === grpcStatus.CANCELLED) {
            subscribeTransactionsCall = null;
            return;
        }
        console.log("subscribeTransactions error:", error.code);
    });
});

registerIpc("unsubscribeTransactions", async () => {
    if (!subscribeTransactionsCall) {
        return { ok: false, error: "Not subscribed to transactions" };
    }
    subscribeTransactionsCall.stream.cancel();
    return { ok: true };
});

// Lightning
let subscribeInvoicesCall = null;

/**
 * Subscribe to invoices updates
 */
ipcMain.on("subscribeInvoices", (event) => {
    if (subscribeInvoicesCall) {
        return;
    }
    subscribeInvoicesCall = lnd.streamCall("SubscribeInvoices");
    subscribeInvoicesCall.stream.on("data", (data) => {
        // Balance on channel not changing immediately
        setTimeout(() => event.sender.send("invoices-update", data), 1000);
    });
    subscribeInvoicesCall.stream.on("error", (err) => {
        if (err.code === grpcStatus.CANCELLED) {
            subscribeInvoicesCall = null;
            return;
        }
        logger.error("subscribeInvoicesCall", err);
    });
});

/**
 * Unsubscribe from invoices update
 */
registerIpc("unsubscribeInvoices", async () => {
    if (!subscribeInvoicesCall) {
        return { ok: false, error: "Not subscribed to invoices" };
    }
    subscribeInvoicesCall.stream.cancel();
    return { ok: true };
});

/**
 * Clear lnd folder
 */
registerIpc("clearLndData", async () => {
    lnd.shoudClearData = true;
    logger.debug("Will call stop from clearLndData");
    await lnd.stop();
});


registerIpc("rebuildLndCerts", async (event, arg) => {
    logger.debug("Inside rebuildLndCerts");
    const stopResp = await lnd.stop();
    logger.debug("Inside rebuildLndCerts stop resp", stopResp);
    const response = await lnd.rebuildCerts(arg.username);
    logger.debug("Rebuilded cert");
    if (response.ok) {
        return {
            ok: true,
        };
    }
    return {
        ok: false,
        error: response.error,
    };
});

// ToDo: set public ip
registerIpc("generateRemoteAccessString", async (event, arg) => {
    try {
        logger.debug("Inside generate");
        const lndIP = await settings.get.getLndIP(arg.username);
        logger.debug(`IP: ${lndIP}`);
        const macaroons = lnd.getMacaroonsHex();
        logger.debug(`Macaroons: ${macaroons}`);
        const cert = lnd.getCert();
        logger.debug(`Cert: ${cert}`);

        return {
            ok: true,
            remoteAccessString: `https://${lndIP}\n${macaroons}\n${cert}`,
        };
    } catch (err) {
        logger.error("ipc generateRemoteAccessString", err);
        return {
            ok: false,
            error: err,
        };
    }
});

/**
 * Clear db connection, stopping lnd && lis
 * @return {Promise<{ok: boolean}>}
 */
const shutdown = async () => {
    try {
        if (subscribeTransactionsCall) {
            subscribeTransactionsCall.stream.cancel();
        }
        if (subscribeInvoicesCall) {
            subscribeInvoicesCall.stream.cancel();
        }
        await localInvoiceServer.closeConnection();
        logger.debug("Will call stop from shutdown");
        await lnd.stop();
        return {
            ok: true,
        };
    } catch (err) {
        logger.error("ipc shutdown", err);
        return { ok: false };
    }
};

module.exports.shutdown = shutdown;
