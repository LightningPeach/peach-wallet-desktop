import { errorPromise, successPromise } from "additional";

import * as actions from "./actions";

function sendMsg(lightningId, msg) {
    return async (dispatch) => {
        const amt = 1;
        const response = await window.ipcClient("sendPayment", {
            amt,
            dest_string: lightningId,
            message: msg,
        });
        if (!response.ok) {
            return errorPromise(response.error, sendMsg);
        }
        dispatch(actions.addMsg(amt, lightningId, msg));
        return successPromise();
    };
}

export {
    sendMsg,
};
