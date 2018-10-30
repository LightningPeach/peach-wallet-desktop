import fetch from "isomorphic-fetch";
import { PEACH_API_HOST, BLOCK_HEIGHT_URL } from "config/node-settings";
import { EXCEPTION_SERVER_UNAVAILABLE } from "config/status-codes";
import { error } from "modules/notifications";
import { successPromise, logger } from "additional";
import * as actions from "./actions";
import * as types from "./types";

function getBlocksHeight() {
    return async (dispatch) => {
        let response;
        try {
            response = await fetch(BLOCK_HEIGHT_URL, { method: "GET" });
            response = await response.json();
        } catch (e) {
            return dispatch(actions.setNetworkBlocksHeight(0));
        }
        dispatch(actions.setNetworkBlocksHeight(response.height));
        return successPromise();
    };
}

function getMerchants() {
    return async (dispatch) => {
        dispatch(actions.merchantsRequest());
        const url = PEACH_API_HOST + types.ENDPOINT_MERCHANTS;
        let response = await fetch(url);
        if (response.status !== 200) {
            dispatch(actions.merchantsFail(EXCEPTION_SERVER_UNAVAILABLE));
            dispatch(error({ message: EXCEPTION_SERVER_UNAVAILABLE }));
            return;
        }
        try {
            response = await response.json();
            dispatch(actions.merchantsSuccess(response));
        } catch (e) {
            logger.error(e.message);
            dispatch(actions.merchantsFail(EXCEPTION_SERVER_UNAVAILABLE));
            dispatch(error({ message: EXCEPTION_SERVER_UNAVAILABLE }));
        }
    };
}

export {
    getBlocksHeight,
    getMerchants,
};
