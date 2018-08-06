import React from "react";
import { SUCCESS_RESPONSE, UNSUCCESS_RESPONSE, PENDING_RESPONSE } from "config/consts";
import * as validators from "./validators";
import * as helpers from "./helpers";
import * as analytics from "./analytics";
import * as db from "./db";

export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

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
    console.error(`Error in ${f.name}`);
    console.error(error);
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
