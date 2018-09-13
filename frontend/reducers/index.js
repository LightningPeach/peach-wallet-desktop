import { combineReducers } from "redux";
import { routerReducer } from "react-router-redux";
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
import hubReducer from "modules/hub/reducers";

export default combineReducers({
    account: accountReducer,
    app: appReducer,
    auth: authReducer,
    channels: channelsReducer,
    contacts: contactsReducer,
    hub: hubReducer,
    lightning: lightningReducer,
    lnd: lndReducer,
    notifications: notificationsReducer,
    onchain: onChainReducer,
    routing: routerReducer,
    streamPayment: streamPaymentReducer,
});
