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


registerIpc("startLnd", async (event, arg) => {
    console.log("Stating lnd");
    const response = await lnd.start(arg.username);
    logger.info(response);
    if (!response.ok) {
        await lnd.stop();
        logger.info({ func: "startLnd" }, response);
    }
    logger.info({ func: "startLnd" }, response);

    return response;
});

registerIpc("unlockLnd", async (event, arg) => {
    const response = await lnd.unlockWallet(arg.password);
    if (!response.ok) {
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

registerIpc("logout", this.shutdown);

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

registerIpc("newAddress", async (event, arg) => lnd.call("newAddress", arg));

registerIpc("walletBalance", async () => lnd.call("walletBalance"));

registerIpc("getInfo", async () => lnd.call("getInfo"));

registerIpc("listInvoices", async (event, arg) => lnd.call("listInvoices", arg));

registerIpc("addInvoiceRemote", async (event, arg) => localInvoiceServer.requestInvoice(
    arg.value,
    arg.lightning_id,
    arg.memo,
));

registerIpc("addInvoice", async (event, arg) => lnd.call("addInvoice", arg));

registerIpc("listPayments", async () => lnd.call("listPayments"));

registerIpc("queryRoutes", async (event, arg) => lnd.call("queryRoutes", arg));

registerIpc("decodePayReq", async (event, arg) => lnd.call("decodePayReq", arg));

registerIpc("signMessage", async (event, arg) => lnd.call("signMessage", {
    msg: Buffer.from(arg.message, "hex"),
}));

registerIpc("genSeed", async () => lnd.call("genSeed"));

// Peers
registerIpc("listPeers", async () => lnd.call("listPeers"));

registerIpc("connectPeer", async (event, arg) => lnd.call("connectPeer", arg));

registerIpc("connectServerLnd", async () => lnd.call("connectPeer", {
    addr: {
        pubkey: settings.get.peach.pubKey,
        host: `${settings.get.peach.host}:${settings.get.peach.peerPort}`,
    },
}));


// Channels
registerIpc("listChannels", async () => lnd.call("listChannels"));

registerIpc("pendingChannels", async () => lnd.call("pendingChannels"));

registerIpc("openChannel", async (event, arg) => {
    // Set openChannelSync GRPC deadline to 3 minutes to avoid successful channel opening after DEADLINE_EXCEEDED error
    const OPEN_CHANNEL_DEADLINE = 3 * 60;
    const response = await lnd.call("openChannelSync", arg, OPEN_CHANNEL_DEADLINE);
    if (!response.ok) {
        return response;
    }
    let txid;
    if (response.response.funding_txid === "funding_txid_str") {
        txid = response.response.funding_txid_str;
    } else {
        txid = Buffer.from(response.response.funding_txid_bytes.reverse())
            .toString("hex");
    }
    const info = await lnd.call("getInfo");
    return {
        ok: true,
        funding_txid_str: txid,
        output_index: response.response.output_index,
        block_height: info.response.block_height,
    };
});

registerIpc("closeChannel", async (event, arg) => {
    const response = await new Promise((resolve) => {
        const deleteStatus = lnd.streamCall("closeChannel", arg);
        if (deleteStatus.ok) {
            let updated;
            deleteStatus.stream.on("data", (data) => {
                logger.info({ func: "closeChannel" }, "stream data", data);
                if (!updated) {
                    const updateType = data.update === "close_pending" ? "txid" : "closing_txid";
                    const txid = Buffer.from(data[data.update][updateType].reverse())
                        .toString("hex");
                    updated = true;
                    resolve({ ok: true, txid });
                }
            });
            deleteStatus.stream.on("error", (data) => {
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
    const payment = await lnd.call("sendPaymentSync", arg);
    if (!payment.ok) {
        return payment;
    }
    if (payment.response.payment_error) {
        return { ok: false, error: lnd.prettifyMessage(payment.response.payment_error) };
    }
    const payReq = await lnd.call("decodePayReq", { pay_req: arg.payment_request });
    return { ok: true, payment_hash: payReq.response.payment_hash };
});


// Onchain
let subscribeTransactionsCall = null;

registerIpc("getTransactions", async () => lnd.call("getTransactions"));

registerIpc("sendCoins", async (event, arg) => lnd.call("sendCoins", arg));

ipcMain.on("subscribeTransactions", (event) => {
    if (subscribeTransactionsCall) {
        return;
    }
    subscribeTransactionsCall = lnd.streamCall("subscribeTransactions");
    subscribeTransactionsCall.stream.on("data", (data) => {
        if (!parseInt(data.num_confirmations, 10)) {
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
    subscribeInvoicesCall = lnd.streamCall("subscribeInvoices");
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
    await lnd.stop();
});

/**
 * Clear db connection, stopping lnd && lis
 * @return {Promise<{ok: boolean}>}
 */
module.exports.shutdown = async () => {
    try {
        if (subscribeTransactionsCall) {
            subscribeTransactionsCall.stream.cancel();
        }
        if (subscribeInvoicesCall) {
            subscribeInvoicesCall.stream.cancel();
        }
        await localInvoiceServer.closeConnection();
        await lnd.stop();
        return {
            ok: true,
        };
    } catch (err) {
        logger.error("ipc shutdown", err);
        return { ok: false };
    }
};
