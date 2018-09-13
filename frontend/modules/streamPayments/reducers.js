import * as accountTypes from "modules/account/types";
import * as types from "./types";

export const initStateStreamPayment = {
    streamDetails: null,
    streamId: undefined,
    streams: [],
};

const defaultState = JSON.parse(JSON.stringify(initStateStreamPayment));

const streamPaymentReducer = (state = defaultState, action) => {
    switch (action.type) {
        case accountTypes.LOGOUT_ACCOUNT:
            return defaultState;
        case types.STREAM_PAYMENT_SUCCESS_FINISH:
        case types.STREAM_PAYMENT_FAIL_FINISH:
            return {
                ...state,
                streams: state.streams.map(item =>
                    item.streamId === action.payload ? { ...item, status: types.FINISHED_STREAM_PAYMENT } : item),
            };
        case types.STREAM_PAYMENT_STATUS:
            return {
                ...state,
                streams: state.streams.map(item =>
                    item.streamId === action.payload.streamId ? { ...item, status: action.payload.status } : item),
            };
        case types.STREAM_PAYMENT_PREPARE:
            return { ...state, streamDetails: action.payload };
        case types.STREAM_CURRENT_SEC:
            return {
                ...state,
                streams: state.streams.map(item =>
                    (item.streamId === action.payload.streamId
                        ? { ...item, currentPart: action.payload.currentPart } : item)),
            };
        case types.ADD_STREAM_TO_LIST:
            return {
                ...state,
                streamDetails: null,
                streams: [...state.streams, state.streamDetails],
            };
        case types.SET_STREAMS:
            return { ...state, streams: action.payload };
        default:
            return state;
    }
};

export default streamPaymentReducer;
