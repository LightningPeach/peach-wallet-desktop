/* eslint-disable import/prefer-default-export */
import fetch from "isomorphic-fetch";
import { PEACH_API_HOST } from "config/node-settings";
import { EXCEPTION_HUB_UNAVAILABLE } from "config/status-codes";
import { error } from "modules/notifications";
import * as actions from "./actions";
import * as types from "./types";

function getMerchants() {
    return async (dispatch) => {
        dispatch(actions.merchantsRequest());
        const url = PEACH_API_HOST + types.ENDPOINT_MERCHANTS;
        let response = await fetch(url);
        if (response.status !== 200) {
            dispatch(actions.merchantsFail(EXCEPTION_HUB_UNAVAILABLE));
            dispatch(error({ message: EXCEPTION_HUB_UNAVAILABLE }));
            return;
        }
        try {
            response = await response.json();
            dispatch(actions.merchantsSuccess(response));
        } catch (e) {
            console.error(e.message);
            dispatch(actions.merchantsFail(EXCEPTION_HUB_UNAVAILABLE));
            dispatch(error({ message: EXCEPTION_HUB_UNAVAILABLE }));
        }
    };
}

export { getMerchants };
/* eslint-enable import/prefer-default-export */
