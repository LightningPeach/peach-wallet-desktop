import * as types from "./types";

const addMsg = (amt, lightningId, msg) => ({
    payload: {
        amount: amt,
        date: Date.now(),
        lightningID: lightningId,
        memo: msg,
        type: "payment",
    },
    type: types.ADD_MESSAGE,
});

export {
    addMsg,
};
