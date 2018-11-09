import * as accountTypes from "modules/account/types";
import * as types from "./types";

export const initStateStreamPayment = {
    currentStream: null,
    streamDetails: null,
    streams: [],
};

const defaultState = JSON.parse(JSON.stringify(initStateStreamPayment));

const streamPaymentReducer = (state = defaultState, action) => {
    switch (action.type) {
        case accountTypes.LOGOUT_ACCOUNT:
            return defaultState;
        case types.PREPARE_STREAM_PAYMENT:
            return { ...state, streamDetails: action.payload };
        case types.SET_CURRENT_STREAM:
            return { ...state, currentStream: action.payload };
        case types.UPDATE_STREAM_PAYMENT:
            return {
                ...state,
                streams: state.streams.map(item =>
                    (item.id === action.payload.streamId
                        ? { ...item, ...action.payload.details } : item)),
            };
        case types.CHANGE_STREAM_PARTS_PAID:
            return {
                ...state,
                streams: state.streams.map(item =>
                    (item.id === action.payload.streamId
                        ? { ...item, partsPaid: item.partsPaid + action.payload.change } : item)),
            };
        case types.CHANGE_STREAM_PARTS_PENDING:
            return {
                ...state,
                streams: state.streams.map(item =>
                    (item.id === action.payload.streamId
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
        default:
            return state;
    }
};

export default streamPaymentReducer;
