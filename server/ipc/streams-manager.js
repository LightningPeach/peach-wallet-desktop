const { ipcMain } = require("electron");
const grpcStatus = require("grpc").status;
const Lnd = require("../binaries/Lnd");
const localInvoiceServer = require("../binaries/LocalInvoiceServer");
const helpers = require("../utils/helpers");
const baseLogger = require("../utils/logger");

const logger = baseLogger.child("ipc");
const lnd = new Lnd();

module.exports = () => {
    const streamPayments = {};
    let subscribed = false;

    const handleError = (id, error) => {
        const stream = streamPayments[id];
        logger.error("handleError", error);
        if (!stream) {
            console.log("No such stream");
            return;
        }
        clearTimeout(stream.errorTimeout);
        stream.status = "pause";
        if (stream.sender) {
            stream.sender.send("ipcMain:errorStream", stream.streamId, lnd.prettifyMessage(error));
        }
        logger.error("Stream payment error:", error);
    };

    const streamPay = async (id) => {
        if (!helpers.hasProperty.call(streamPayments, id)) {
            return;
        }
        const stream = streamPayments[id];
        clearTimeout(stream.errorTimeout);
        if (stream.status === "end" || stream.status === "pause") {
            return;
        }
        if (stream.currentPart >= stream.totalParts) {
            stream.status = "end";
            stream.streamCall.cancel();
            if (stream.sender) {
                stream.sender.send("ipcMain:finishStream", stream.streamId);
            }
            return;
        }
        const paymentInvoice = await localInvoiceServer.requestInvoice(stream.price, stream.lightningID, stream.memo);
        if (!paymentInvoice.ok) {
            const error = paymentInvoice.error.toLowerCase()
                .indexOf("invalid json response") > -1 ? "Looks like client is offline" : paymentInvoice.error;
            handleError(id, error);
            return;
        }
        stream.streamCall.write({
            payment_request: paymentInvoice.response.payment_request,
        });
        stream.errorTimeout = setTimeout(() => {
            handleError(id, "LND is not responding");
        }, 10000);
        stream.sender.send(
            "ipcMain:saveStreamPart",
            stream.streamId,
            paymentInvoice.response.decodedPaymentRequest.payment_hash,
        );
    };

    const prepareCall = (id) => {
        const call = lnd.streamCall("sendPayment");
        call.stream.on("data", async (payment) => {
            console.log("Payment sent:");
            console.log(payment);
            const stream = streamPayments[id];
            if (payment.payment_error) {
                handleError(id, payment.payment_error);
                return;
            }
            stream.currentPart += 1;
            stream.sender.send("ipcMain:updateStreamSec", stream.streamId, stream.currentPart);
            await helpers.delay(stream.delay);
            streamPay(id);
        });
        call.stream.on("error", (err) => {
            if (err.code === grpcStatus.CANCELLED) {
                return;
            }
            handleError(id, err);
        });
        call.stream.on("end", () => {
            if (streamPayments[id] && streamPayments[id].sender) {
                clearTimeout(streamPayments[id].errorTimeout);
                // streamPaymentList[id].sender.send("ipcMain:endStream", streamPaymentList[id].streamId);
            }
            console.log("Payment end");
        });
        return call.stream;
    };

    const addStream = async (event, arg) => {
        if (helpers.hasProperty.call(streamPayments, arg.uuid)) {
            return;
        }
        streamPayments[arg.uuid] = {
            streamCall: prepareCall(arg.uuid),
            price: arg.price,
            currentPart: arg.currentPart,
            delay: arg.delay,
            lightningID: arg.lightningID,
            sender: event.sender,
            status: "pause",
            totalParts: arg.totalParts,
            memo: arg.memo,
            uuid: arg.uuid,
        };
    };

    const startStream = async (event, arg) => {
        if (!helpers.hasProperty.call(streamPayments, arg.uuid)) {
            return;
        }
        if (!streamPayments[arg.uuid].streamCall) {
            streamPayments[arg.uuid].streamCall = prepareCall(arg.uuid);
        }
        if (!streamPayments[arg.uuid].sender) {
            streamPayments[arg.uuid].sender = event.sender;
        }
        if (!streamPayments[arg.uuid].delay) {
            streamPayments[arg.uuid].delay = arg.delay;
        }
        if (!streamPayments[arg.uuid].streamId) {
            streamPayments[arg.uuid].streamId = arg.streamId;
        }
        if (!streamPayments[arg.uuid].errorTimeout) {
            streamPayments[arg.uuid].errorTimeout = 0;
        }
        if (!streamPayments[arg.uuid].totalParts) {
            streamPayments[arg.uuid].totalParts = arg.totalParts;
        }
        if (!streamPayments[arg.uuid].currentPart) {
            streamPayments[arg.uuid].currentPart = arg.currentPart;
        }
        if (streamPayments[arg.uuid].status === "run") {
            return;
        }
        streamPayments[arg.uuid].startDelay = setTimeout(() => {
            streamPayments[arg.uuid].status = "run";
            streamPay(arg.uuid);
        }, 1000);
    };

    const pauseStream = (event, arg) => {
        if (!helpers.hasProperty.call(streamPayments, arg.uuid)) {
            return { ok: false };
        }
        clearTimeout(streamPayments[arg.uuid].startDelay);
        clearTimeout(streamPayments[arg.uuid].errorTimeout);
        streamPayments[arg.uuid].status = "pause";
        return { ok: true };
    };

    const endStream = (event, arg) => {
        if (!helpers.hasProperty.call(streamPayments, arg.uuid)) {
            return { ok: false };
        }
        clearTimeout(streamPayments[arg.uuid].errorTimeout);
        streamPayments[arg.uuid].status = "end";
        return { ok: true };
    };

    const ipcEvents = [
        { event: "addStream", func: addStream },
        { event: "startStream", func: startStream },
        { event: "pauseStream", func: pauseStream },
        { event: "endStream", func: endStream },
    ];
    return Object.freeze({
        init: () => {
            if (subscribed) {
                return;
            }
            ipcEvents.forEach((item) => {
                ipcMain.on(item.event, item.func);
            });
            subscribed = true;
        },
        shutdown: async () => {
            ipcEvents.forEach((item) => {
                ipcMain.removeListener(item.event, item.func);
            });
            await Promise.all(Object.values(streamPayments).map(async (item) => {
                if (item.streamCall) {
                    await item.streamCall.cancel();
                }
            }));
            subscribed = false;
        },
    });
};
