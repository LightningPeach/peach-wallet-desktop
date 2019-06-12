import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
// eslint-disable-next-line import/no-extraneous-dependencies
import createLogger from "redux-logger";
import { hashHistory } from "react-router";
import { routerMiddleware } from "react-router-redux";
import { NODE_ENV } from "config/node-settings";
import rootReducer from "reducers";
import { initStateAccount } from "modules/account/reducers";
import { initStateApp } from "modules/app/reducers";
import { initStateAuth } from "modules/auth/reducers";
import { initStateLnd } from "modules/lnd/reducers";
import { initStateLightning } from "modules/lightning/reducers";
import { initStateStreamPayment } from "modules/streamPayments/reducers";
import { initStateContacts } from "modules/contacts/reducers";
import { initStateChannels } from "modules/channels/reducers";
import { initStateOnchain } from "modules/onchain/reducers";
import { initStateFilter } from "modules/filter/reducers";
import { initStateServer } from "modules/server/reducers";

const testStore = NODE_ENV === "test"
    ? { listActions: [] }
    : null;

export const persistedState = {
    ...testStore,
    account: JSON.parse(JSON.stringify(initStateAccount)),
    app: JSON.parse(JSON.stringify(initStateApp)),
    auth: JSON.parse(JSON.stringify(initStateAuth)),
    channels: JSON.parse(JSON.stringify(initStateChannels)),
    contacts: JSON.parse(JSON.stringify(initStateContacts)),
    filter: JSON.parse(JSON.stringify(initStateFilter)),
    lightning: JSON.parse(JSON.stringify(initStateLightning)),
    lnd: JSON.parse(JSON.stringify(initStateLnd)),
    notifications: [],
    onchain: JSON.parse(JSON.stringify(initStateOnchain)),
    server: JSON.parse(JSON.stringify(initStateServer)),
    streamPayment: JSON.parse(JSON.stringify(initStateStreamPayment)),
};

const router = routerMiddleware(hashHistory);

const logger = createLogger({
    collapsed: true,
    level: "info",
});

const enhancer = NODE_ENV === "test"
    ? applyMiddleware(thunk, router)
    : applyMiddleware(thunk, router, logger);

export const configureStore = (initialState = JSON.parse(JSON.stringify(persistedState))) => {
    const store = createStore(
        rootReducer,
        initialState,
        enhancer,
    );

    if (window.devToolsExtension) {
        window.devToolsExtension.updateStore(store);
    }

    return store;
};

export const store = configureStore();
