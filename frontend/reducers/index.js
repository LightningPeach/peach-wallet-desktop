import { combineReducers } from "redux";
import { routerReducer } from "react-router-redux";
import { NODE_ENV } from "config/node-settings";
import accountReducer from "modules/account/reducers";
import authReducer from "modules/auth/reducers";
import lndReducer from "modules/lnd/reducers";
import streamPaymentReducer from "modules/streamPayments/reducers";
import appReducer from "modules/app/reducers";
import lightningReducer from "modules/lightning/reducers";
import channelsReducer from "modules/channels/reducers";
import contactsReducer from "modules/contacts/reducers";
import onChainReducer from "modules/onchain/reducers";
import notificationsReducer from "modules/notifications/reducers";
import serverReducer from "modules/server/reducers";
import filterReducer from "modules/filter/reducers";

const testReducer = NODE_ENV === "test"
    ? {
        listActions: (state = [], action) => action.type.includes("@@redux") ? state : [...state, action],
    }
    : {};

const combinedReducer = {
    ...testReducer,
    account: accountReducer,
    app: appReducer,
    auth: authReducer,
    channels: channelsReducer,
    contacts: contactsReducer,
    filter: filterReducer,
    lightning: lightningReducer,
    lnd: lndReducer,
    notifications: notificationsReducer,
    onchain: onChainReducer,
    routing: routerReducer,
    server: serverReducer,
    streamPayment: streamPaymentReducer,
};

export default combineReducers(combinedReducer);
