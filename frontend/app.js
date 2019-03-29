import React from "react";
import { Provider } from "react-redux";
import { render } from "react-dom";
import { syncHistoryWithStore } from "react-router-redux";
import { Router, hashHistory, Route, IndexRedirect, IndexRoute } from "react-router";

import { store } from "store/configure-store";
import { analytics } from "additional";

import ChannelsPage from "components/channels";
import App from "containers/app";
import {
    AddressBookPath,
    ChannelsPath, GuidePath,
    HomePath,
    LightningPath,
    MerchantsPath,
    OnchainPath,
    ProfilePath,
    WalletPath,
} from "config/routes";
import Onchain from "components/onchain";
import WalletPage from "containers/wallet-page";
import GuidePage from "containers/guide-page";
import MerchantsPage from "components/merchants";
import ContactsPage from "components/contacts";
import HomePage from "containers/home-page";
import Lightning from "components/lightning";
import ProfilePage from "components/profile";

analytics.init();

const history = syncHistoryWithStore(hashHistory, store);

render(
    <Provider store={store}>
        <Router history={history}>
            <Route path="/" component={App}>
                <IndexRedirect to={HomePath} />
                <Route path={WalletPath} component={WalletPage}>
                    <IndexRoute component={Lightning} />
                    <Route path={LightningPath} component={Lightning} />
                    <Route path={OnchainPath} component={Onchain} />
                    <Route path={ChannelsPath} component={ChannelsPage} />
                    <Route path={AddressBookPath} component={ContactsPage} />
                    <Route path={ProfilePath} component={ProfilePage} />
                    <Route path={MerchantsPath} components={MerchantsPage} />
                </Route>
                <Route path={HomePath} component={HomePage} />
                <Route path={GuidePath} component={GuidePage} />
            </Route>
        </Router>
    </Provider>,
    document.getElementById("root"),
);
