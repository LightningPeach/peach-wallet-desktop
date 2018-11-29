import React from "react";
import { NODE_ENV } from "config/node-settings";
import { SUCCESS_RESPONSE, UNSUCCESS_RESPONSE, PENDING_RESPONSE, TIMEOUT_PART } from "config/consts";
import * as validators from "./validators";
import * as helpers from "./helpers";
import * as analytics from "./analytics";
import * as db from "./db";

const timeoutID = {};

export const logger = {
    error: (...args) => {
        if (NODE_ENV !== "test") {
            console.error(...args);
        }
    },
    log: (...args) => {
        if (NODE_ENV !== "test") {
            console.log(...args);
        }
    },
};

export const debounce = (func, interval) => {
    let timeout;
    return () => {
        const call = () => {
            timeout = null;
            func();
        };
        clearTimeout(timeout);
        timeout = setTimeout(call, interval);
    };
};

// Wrappers around native JS functions for proper handling big passed numbers by separation into smaller parts
export const setTimeoutLong = (id = "*", func, interval, initialCall = true) => {
    if (initialCall && id !== "*" && timeoutID[id]) {
        logger.error(`Timeout with id ${id} is already set`);
        return;
    }
    const diff = Math.max((interval - TIMEOUT_PART), 0);
    if (diff > TIMEOUT_PART) {
        timeoutID[id] = setTimeout(() => { setTimeoutLong(id, func, diff, false) }, TIMEOUT_PART);
    } else {
        timeoutID[id] = setTimeout(func, interval);
    }
};

export const delay = (interval, id) =>
    new Promise((resolve, reject) => {
        if (id && timeoutID[id]) {
            logger.error(`Timeout with id ${id} is already set`);
            reject();
        }
        setTimeoutLong(id, resolve, interval);
    });

export const setIntervalLong = (id, func, interval, initialCall = true) => {
    if (initialCall && timeoutID[id]) {
        logger.error(`Timeout with id ${id} is already set`);
        return;
    }
    const intervalTick = () => {
        setTimeoutLong(id, intervalTick, interval, false);
        func();
    };
    setTimeoutLong(id, intervalTick, interval, false);
};

export const setAsyncIntervalLong = (id, func, interval, initialCall = true) => {
    if (initialCall && timeoutID[id]) {
        logger.error(`Timeout with id ${id} is already set`);
        return;
    }
    const intervalTick = async () => {
        await func();
        setTimeoutLong(id, intervalTick, interval, false);
    };
    setTimeoutLong(id, intervalTick, interval, false);
};

export const clearTimeoutLong = (id) => {
    clearTimeout(timeoutID[id]);
    timeoutID[id] = null;
};

export const clearIntervalLong = (id) => {
    clearTimeout(timeoutID[id]);
    timeoutID[id] = null;
};

export const clearDelay = (id) => {
    clearTimeout(timeoutID[id]);
    timeoutID[id] = null;
};

export const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i += 1) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (`${name}=`)) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
};

export const successPromise = (params = null) => {
    const response = {
        ok: true,
        type: SUCCESS_RESPONSE,
    };
    if (params) {
        response.response = params;
    }
    return Promise.resolve(response);
};

export const pendingPromise = () => Promise.resolve({
    ok: false,
    type: PENDING_RESPONSE,
});

export const unsuccessPromise = f => Promise.resolve({
    f: f.name,
    ok: false,
    type: UNSUCCESS_RESPONSE,
});

export const errorPromise = (error, f) => {
    logger.error(`Error in ${f.name}`);
    logger.error(error);
    return Promise.resolve({
        error,
        f: f.name,
        ok: false,
        type: UNSUCCESS_RESPONSE,
    });
};

export function togglePasswordVisibility() {
    const password = document.getElementById("password");
    const eyeIcon = password.nextElementSibling;
    const visible = password.getAttribute("type") === "text";
    if (visible) {
        password.setAttribute("type", "password");
        eyeIcon.className = eyeIcon.className.concat(" form-text__icon--eye_open");
    } else {
        password.setAttribute("type", "text");
        eyeIcon.className = eyeIcon.className.replace("form-text__icon--eye_open", "");
    }
}

export const subscribeToWatchHoverOnEllipsis = () => {
    $(document)
        .on("mouseenter mouseleave", ".js-ellipsis", (e) => {
            const $this = $(e.currentTarget);
            if (e.type === "mouseenter" && $this.first()[0].scrollWidth > $this.width()) {
                $this.addClass("hovered");
            } else {
                $this.removeClass("hovered");
            }
        });
};

export const subscribeOpenLinkExternal = (target) => {
    let subscribed = false;

    return Object.freeze({
        subscribe: () => {
            if (subscribed) {
                return;
            }
            $(document).on("click", `${target} a`, (e) => {
                e.preventDefault();
                const link = e.target.href;
                window.ELECTRON_SHELL.openExternal(link);
            });
            subscribed = true;
        },
        unSubscribe: () => {
            if (!subscribed) {
                return;
            }
            $(document).off("click", `${target} a`);
            subscribed = false;
        },
    });
};

export {
    analytics,
    db,
    helpers,
    validators,
};
