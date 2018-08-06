import React from "react";
import { Provider } from "react-redux";
import { render } from "react-dom";
import routes from "routes";
import { syncHistoryWithStore } from "react-router-redux";
import { Router, hashHistory } from "react-router";
import { store } from "store/configure-store";
import { analytics, subscribeToWatchHoverOnEllipsis } from "additional";

analytics.init();
subscribeToWatchHoverOnEllipsis();

const history = syncHistoryWithStore(hashHistory, store);

render(
    <Provider store={store}>
        <Router history={history}>
            {routes}
        </Router>
    </Provider>,
    document.getElementById("root"),
);
