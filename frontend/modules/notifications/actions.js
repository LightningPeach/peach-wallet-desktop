import { DEFAULT_NOTIFICATIONS_POSITION, DEFAULT_NOTIFICATIONS_DISMISS } from "config/consts";
import * as types from "./types";

const hideNotification = uid => ({
    payload: uid,
    type: types.HIDE_NOTIFICATION,
});

const removeAllNotifications = () => ({
    type: types.REMOVE_ALL_NOTIFICATIONS,
});

const showNotification = (opts = {}, level = "success") => ({
    payload: {
        ...opts,
        autoDismiss: opts.autoDismiss >= 0 ? opts.autoDismiss : DEFAULT_NOTIFICATIONS_DISMISS,
        level,
        position: opts.position || DEFAULT_NOTIFICATIONS_POSITION,
        uid: opts.uid || Date.now(),
    },
    type: types.SHOW_NOTIFICATION,
});

const success = opts => showNotification(opts, "success");

const error = opts => showNotification({ ...opts, autoDismiss: opts ? opts.autoDismiss || 0 : 0 }, "error");

const warning = opts => showNotification(opts, "warning");

const info = opts => showNotification(opts, "info");

export {
    showNotification,
    hideNotification,
    removeAllNotifications,
    success,
    error,
    warning,
    info,
};
