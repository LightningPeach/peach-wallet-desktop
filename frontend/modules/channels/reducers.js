import * as accountTypes from "modules/account/types";
import * as types from "./types";

export const initStateChannels = {
    channels: [],
    creatingNewChannel: false,
    currentChannel: null,
    deleteQueue: [],
    expectedBitcoinBalance: 0,
    newChannelStatus: "",
    newChannelStatusDetails: "",
    prepareNewChannel: null,
    skipCreateTutorial: types.PENDING,
};

const defaultState = JSON.parse(JSON.stringify(initStateChannels));

const channelsReducer = (state = defaultState, action) => {
    switch (action.type) {
        case accountTypes.LOGOUT_ACCOUNT:
            return defaultState;
        case types.NEW_CHANNEL_PREPARING:
            return { ...state, prepareNewChannel: action.payload };
        case types.CLEAR_NEW_CHANNEL_PREPARING:
            return { ...state, prepareNewChannel: null };
        case types.SET_CHANNELS:
            return { ...state, channels: action.payload };
        case types.SUCCESS_CREATE_NEW_CHANNEL:
            return { ...state, expectedBitcoinBalance: action.payload };
        case types.ERROR_CREATE_NEW_CHANNEL:
            return { ...state, ...action.payload };
        case types.SET_CURRENT_CHANNEL:
            return { ...state, currentChannel: action.payload };
        case types.CLEAR_CURRENT_CHANNEL:
            return { ...state, currentChannel: null };
        case types.UPDATE_CREATE_TUTORIAL_STATUS:
            return { ...state, skipCreateTutorial: action.payload };
        case types.START_CREATE_NEW_CHANNEL:
            return { ...state, creatingNewChannel: true };
        case types.END_CREATE_NEW_CHANNEL:
            return { ...state, creatingNewChannel: false };
        case types.ADD_TO_DELETE:
            return { ...state, deleteQueue: [...state.deleteQueue, action.payload] };
        case types.REMOVE_FROM_DELETE:
            return { ...state, deleteQueue: state.deleteQueue.filter(item => item !== action.payload) };
        default:
            return state;
    }
};

export default channelsReducer;
