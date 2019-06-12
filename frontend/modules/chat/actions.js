/* eslint-disable import/prefer-default-export */
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

export { addMsg };
/* eslint-enable import/prefer-default-export */
