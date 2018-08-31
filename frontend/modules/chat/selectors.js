export const getLightnings = history => [
    ...new Set(history.reduce((ids, item) => {
        if (item.memo && !item.memo.startsWith("stream_payment_")) {
            ids.push(item.lightningID);
        }
        return ids;
    }, [])),
];

export const getMessages = history =>
    history.filter(item => item.type === "invoice" && !item.memo.startsWith("stream_payment_"));
