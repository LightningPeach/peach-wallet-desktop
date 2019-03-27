import ReactGA from "react-ga";
import ElectronCookies from "@exponent/electron-cookies/cookies";
import { ANALYTICS } from "config/node-settings";
import { store } from "store/configure-store";
import { accountTypes } from "modules/account";

/**
 * Init analytics
 */
function init() {
    const testMode = ANALYTICS.trackingID === "UA-XXXXXXXX-X";
    ElectronCookies.enable({ origin: ANALYTICS.appUrl });
    ReactGA.initialize(ANALYTICS.trackingID, { testMode });
    ReactGA.set({ location: ANALYTICS.appUrl });
    ReactGA.set({ checkProtocolTask: null });
}

/**
 * Send pageview
 * @param {string} path - Url of page
 * @param {string} [title] - Title of page
 * @param {array} [trackerNames] - Some additional params. trackerNames for ga
 */
function pageview(path, title = "", trackerNames = []) {
    if (store.getState().account.analyticsMode !== accountTypes.ANALYTICS_MODE.ENABLED) {
        return;
    }
    ReactGA.set({ page: path, title });
    ReactGA.pageview(path, trackerNames, title);
}

/**
 * Send event
 * @param {object} params - Params of event
 */
function event(params) {
    if (store.getState().account.analyticsMode !== accountTypes.ANALYTICS_MODE.ENABLED) {
        return;
    }
    ReactGA.event(params);
}

export {
    init,
    pageview,
    event,
};
