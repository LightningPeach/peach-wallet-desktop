import * as accountTypes from "modules/account/types";
import { MAX_NOTIFICATIONS } from "config/consts";
import * as types from "./types";

export const initStateNotifications = [];

const defaultState = JSON.parse(JSON.stringify(initStateNotifications));

const notificationsReducer = (state = defaultState, action) => {
    switch (action.type) {
        case accountTypes.LOGOUT_ACCOUNT:
        case types.REMOVE_ALL_NOTIFICATIONS:
            return defaultState;
        case types.HIDE_NOTIFICATION:
            return state.filter(notification => notification.uid !== action.payload);
        case types.SHOW_NOTIFICATION: {
            const nextState = [...state, action.payload];
            const errorCount = nextState.filter(item => item.level === "error").length;
            if (errorCount > MAX_NOTIFICATIONS) {
                nextState.splice(nextState.findIndex(item => item.level === "error"), 1);
            }
            return nextState;
        }
        default:
            return state;
    }
};

export default notificationsReducer;
