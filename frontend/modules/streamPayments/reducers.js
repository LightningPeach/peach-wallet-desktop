import * as accountTypes from "modules/account/types";
import * as types from "./types";

export const initStateStreamPayment = {
    currentStream: null,
    streamDetails: null,
    streamId: undefined,
    streams: [],
};

const defaultState = JSON.parse(JSON.stringify(initStateStreamPayment));

const streamPaymentReducer = (state = defaultState, action) => {
    switch (action.type) {
        case accountTypes.LOGOUT_ACCOUNT:
            return defaultState;
        case types.SET_STREAM_PAYMENT_STATUS:
            return {
                ...state,
                streams: state.streams.map(item =>
                    item.streamId === action.payload.streamId
                        ? { ...item, status: action.payload.status } : item),
            };
        case types.PREPARE_STREAM_PAYMENT:
            return { ...state, streamDetails: action.payload };
        case types.SET_CURRENT_STREAM:
            return { ...state, currentStream: action.payload };
        case types.CHANGE_STREAM_PARTS_PAID:
            return {
                ...state,
                streams: state.streams.map(item =>
                    (item.streamId === action.payload.streamId
                        ? { ...item, partsPaid: item.partsPaid + action.payload.change } : item)),
            };
        case types.CHANGE_STREAM_PARTS_PENDING:
            return {
                ...state,
                streams: state.streams.map(item =>
                    (item.streamId === action.payload.streamId
                        ? { ...item, partsPending: item.partsPending + action.payload.change } : item)),
            };
        case types.ADD_STREAM_PAYMENT_TO_LIST:
            return {
                ...state,
                streamDetails: null,
                streams: [...state.streams, state.streamDetails],
            };
        case types.SET_STREAM_PAYMENTS:
            return { ...state, streams: action.payload };
        case types.SET_STREAM_PAYMENT_INTERVAL_ID:
            return {
                ...state,
                streams: state.streams.map(item =>
                    item.streamId === action.payload.streamId
                        ? { ...item, paymentIntervalId: action.payload.paymentIntervalId } : item),
            };
        case types.CLEAR_STREAM_PAYMENT_INTERVAL_ID:
            return {
                ...state,
                streams: state.streams.map(item =>
                    item.streamId === action.payload
                        ? { ...item, paymentIntervalId: null } : item),
            };
        case types.SET_STREAM_LAST_PAYMENT:
            return {
                ...state,
                streams: state.streams.map(item =>
                    item.streamId === action.payload.streamId
                        ? { ...item, lastPayment: action.payload.lastPayment } : item),
            };
        default:
            return state;
    }
};

export default streamPaymentReducer;
