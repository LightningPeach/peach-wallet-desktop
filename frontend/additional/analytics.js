// Currently use GOOGLE ANALYTICS, rewrite methods for another metrics
import ReactGA from "react-ga";
import ElectronCookies from "@exponent/electron-cookies/cookies";
import { AGREEMENT, ANALYTICS } from "config/node-settings";

let disabled;

/**
 * Init analytics
 */
function init() {
    disabled = !AGREEMENT.sendStatistics || !ANALYTICS.trackingID;
    if (disabled) {
        return;
    }
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
    if (disabled) {
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
    if (disabled) {
        return;
    }
    ReactGA.event(params);
}

export {
    init,
    pageview,
    event,
};
