import * as accountTypes from "modules/account/types";
import * as types from "./types";

export const initStateLightning = {
    // FEE FOR LIGTHNING TRANSACTION
    externalPaymentRequest: null,
    fee: 777,
    history: [],
    paymentDetails: [],
    paymentRequest: null,
    paymentRequestAmount: null,
    paymentRequestError: null,
    paymentStatus: "undefined",
    paymentStatusDetails: "",
};

const defaultState = JSON.parse(JSON.stringify(initStateLightning));

const lightningReducer = (state = defaultState, action) => {
    switch (action.type) {
        case accountTypes.LOGOUT_ACCOUNT:
            return defaultState;
        case types.CLEAR_SINGLE_PAYMENT_DETAILS:
            return { ...state, paymentDetails: [] };
        case types.ERROR_PAYMENT:
            return { ...state, paymentStatus: "failed", paymentStatusDetails: action.payload };
        case types.PAYMENT_PREPARING:
            return { ...state, paymentDetails: [action.payload] };
        case types.PENDING_PAYMENT:
            return { ...state, paymentStatus: "pending", paymentStatusDetails: "" };
        case types.SET_HISTORY:
            return { ...state, history: action.payload };
        case types.SUCCESS_PAYMENT:
            return { ...state, paymentStatus: "success", paymentStatusDetails: "" };
        case types.PAYMENT_REQUEST_ERROR_CREATOR:
            return { ...state, paymentRequestError: action.payload };
        case types.PAYMENT_REQUEST_CREATOR:
            return { ...state, ...action.payload, paymentRequestError: null };
        case types.SET_EXTERNAL_PAYMENT_REQUEST:
            return { ...state, externalPaymentRequest: action.payload };
        default:
            return state;
    }
};

export default lightningReducer;
