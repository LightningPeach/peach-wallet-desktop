import * as types from "./types";

const merchantsRequest = () => ({
    type: types.MERCHANTS_REQUEST,
});

const merchantsSuccess = merchants => ({
    payload: merchants,
    type: types.MERCHANTS_SUCCESS,
});

const merchantsFail = error => ({
    payload: error,
    type: types.MERCHANTS_FAIL,
});

export {
    merchantsRequest,
    merchantsSuccess,
    merchantsFail,
};
