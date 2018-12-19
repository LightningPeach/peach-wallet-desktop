import React from "react";
import { NODE_ENV } from "config/node-settings";
import { SUCCESS_RESPONSE, UNSUCCESS_RESPONSE, PENDING_RESPONSE, TIMEOUT_PART } from "config/consts";
import * as validators from "./validators";
import * as helpers from "./helpers";
import * as analytics from "./analytics";
import * as db from "./db";

const timeoutsList = {};
const resolversList = {};

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
export const clearTimeoutLong = (id) => {
    clearTimeout(timeoutsList[id]);
    timeoutsList[id] = null;
};

export const setTimeoutLong = (func, interval, id = "*", initialCall = true) => {
    if (initialCall && id !== "*" && timeoutsList[id]) {
        logger.error(`setTimeoutLong: id ${id} is already used`);
        return;
    }
    const diff = Math.max((interval - TIMEOUT_PART), 0);
    if (diff > TIMEOUT_PART) {
        timeoutsList[id] = setTimeout(() => { setTimeoutLong(func, diff, id, false) }, TIMEOUT_PART);
    } else {
        timeoutsList[id] = setTimeout(func, interval);
    }
};

export const clearDelay = (id) => {
    clearTimeout(timeoutsList[id]);
    timeoutsList[id] = null;
    if (resolversList[id]) {
        resolversList[id]();
        resolversList[id] = null;
    }
};

export const delay = (interval, id) =>
    new Promise((resolve, reject) => {
        const response = () => {
            if (timeoutsList[id]) {
                timeoutsList[id] = null;
            }
            resolve();
        };
        if (id && (timeoutsList[id] || resolversList[id])) {
            logger.error(`delay: id ${id} is already used`);
            reject();
        }
        if (id) {
            resolversList[id] = resolve;
        }
        setTimeoutLong(response, interval, id);
    });

export const clearIntervalLong = (id) => {
    clearTimeout(timeoutsList[id]);
    timeoutsList[id] = null;
};

export const setIntervalLong = (func, interval, id, initialCall = true) => {
    if (initialCall && timeoutsList[id]) {
        logger.error(`setIntervalLong: id ${id} is already used`);
        return;
    }
    const intervalTick = () => {
        setTimeoutLong(intervalTick, interval, id, false);
        func();
    };
    setTimeoutLong(intervalTick, interval, id, false);
};

export const setAsyncIntervalLong = (func, interval, id, initialCall = true) => {
    if (initialCall && timeoutsList[id]) {
        logger.error(`setAsyncIntervalLong: id ${id} is already used`);
        return;
    }
    const intervalTick = async () => {
        await func();
        setTimeoutLong(intervalTick, interval, id, false);
    };
    setTimeoutLong(intervalTick, interval, id, false);
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
