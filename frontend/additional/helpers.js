import React, { Fragment } from "react";
import crypto from "crypto";
import moment from "moment";

import { exceptions, consts } from "config";

/**
 * @param {Date} date - date
 * @param {string} [format="%d.%m.%y %h:%i:%s"] - format for return string
 * @returns {string}
 */
export const formatDate = (date, format) => {
    const formattedDate = format || "DD.MM.YY hh:mm:ss A";
    if (!(date instanceof Date)) {
        throw new Error(exceptions.DATE_INSTANCE);
    }
    return moment(date).format(formattedDate);
};

/**
 * Convert number like 1e-3 to 0.001 string
 * @param {number} num
 * @returns {string}
 */
export const noExponents = (num) => {
    const sign = num < 0 ? "-" : "";
    const data = String(num).split(/[eE]/);
    if (data.length === 1) {
        return data[0];
    }
    const str = data[0].replace(".", "").replace("-", "");
    let mag = Number(data[1]) + 1;
    let z = "";
    if (mag < 0) {
        z = `${sign}0.`;
        while (mag) {
            z += "0";
            mag += 1;
        }
        return z + str.replace(/^-/, "");
    }
    if (mag >= str.length) {
        mag -= str.length;
        while (mag) {
            z += "0";
            mag -= 1;
        }
        return sign + str + z;
    }
    return mag ? `${str.slice(0, mag)}.${str.slice(mag)}` : str;
};

/**
 * @returns {boolean}
 */

export const hasSelection = /* istanbul ignore next */ () => {
    const selection = window.getSelection();
    return selection.type === "Range";
};

/**
 * @param {*} text
 * @returns {*}
 */
export const formatMultilineText = /* istanbul ignore next */ (text) => {
    if (text instanceof Array) {
        return text.map((i, k) => <span key={k}>{i}<br /></span>); // eslint-disable-line
    }
    return text;
};

/**
 * @param {*} error
 * @param {boolean} helper
 * @returns {*}
 */
/* istanbul ignore next */
export const formatNotificationMessage =
    (
        error,
        helper = false,
        helperActions = [
            "Wait for some time and try again later.",
            "Open a direct channel with the recipient.",
            "Send the on-chain payment to recipient.",
        ],
    ) => (
        <Fragment>
            <span className="notification-message--error">{formatMultilineText(error)}</span>
            {helper &&
            <span className="notification-message--helper">
                <span>Please, try the following actions:</span>
                <ul>
                    {helperActions.map(item => <li key={item}>{item}</li>)}
                </ul>
            </span>}
        </Fragment>
    );

/**
 * @param time
 * @param removeQuantity
 * @returns {*}
 */
export const formatTimeRange = (time, removeQuantity = true) => {
    let index = -1;
    consts.TIME_RANGE_MEASURE.forEach((item, key) => {
        if (time % item.range === 0) {
            index = key;
        }
    });
    if (index === -1) {
        return null;
    }
    const count = Math.round(time / consts.TIME_RANGE_MEASURE[index].range);
    let response = `${count} ${consts.TIME_RANGE_MEASURE[index].measure}`;
    if (removeQuantity && count === 1) {
        response = response.slice(0, -1);
    }
    return response;
};

export const isStreamOrRecurring = ({ memo = "" }) => (
    memo.includes(consts.STREAM_MEMO_PREFIX) || memo.includes(consts.RECURRING_MEMO_PREFIX)
);

export const hash = data =>
    crypto.createHash("sha256").update(data).digest("hex");
