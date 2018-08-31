import * as accountTypes from "modules/account/types";
import * as types from "./types";

export const initStateChat = {
    messages: [],
};

const chatReducer = (state = initStateChat, action) => {
    switch (action.type) {
        case accountTypes.LOGOUT_ACCOUNT:
            return initStateChat;
        case types.ADD_MESSAGE:
            return { ...state, messages: [...state.messages, action.payload] };
        default:
            return state;
    }
};

export default chatReducer;
