import React, { Fragment } from "react";
import { TIME_RANGE_MEASURE } from "config/consts";
import * as statusCodes from "config/status-codes";

/**
 * @param {Date} date - date
 * @param {string} [format="%d.%m.%y %h:%i:%s"] - format for return string
 * @param {boolean} withLeadZero - Add lead zero to 1-9num
 * @returns {string}
 */
const formatDate = (date, format, withLeadZero = true) => {
    let formattedDate = format;
    if (!(date instanceof Date)) {
        throw new Error(statusCodes.EXCEPTION_DATE_INSTANCE);
    }
    if (!formattedDate) {
        formattedDate = "%d.%m.%y %h:%i:%s";
    }
    const leadZero = item => item < 10 ? `0${item}` : item;
    const day = withLeadZero ? leadZero(date.getDate()) : date.getDate();
    const month = withLeadZero ? leadZero(date.getMonth() + 1) : date.getMonth() + 1;
    const hours = withLeadZero ?
        leadZero(date.getHours()
            .toString()) :
        date.getHours()
            .toString();
    const minutes = withLeadZero ?
        leadZero(date.getMinutes()
            .toString()) :
        date.getMinutes()
            .toString();
    const seconds = withLeadZero ?
        leadZero(date.getSeconds()
            .toString()) :
        date.getSeconds()
            .toString();
    const year = date.getYear() % 100;

    return formattedDate
        .replace("%d", day)
        .replace("%m", month)
        .replace("%y", year)
        .replace("%h", hours)
        .replace("%i", minutes)
        .replace("%s", seconds);
};

/**
 * Convert number like 1e-3 to 0.001 string
 * @param {number} num
 * @returns {string}
 */
const noExponents = (num) => {
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
/* istanbul ignore next */
const hasSelection = () => {
    const selection = window.getSelection();
    return selection.type === "Range";
};

/**
 * @param {*} text
 * @returns {*}
 */
/* istanbul ignore next */
const formatMultilineText = (text) => {
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
const formatNotificationMessage = (error, helper) => (
    <Fragment>
        <span className="notification-message--error">{formatMultilineText(error)}</span>
        {helper &&
        <span className="notification-message--helper">
            <span>Please, try the following actions:</span>
            <ul>
                <li>Wait for some time and try again later.</li>
                <li>Open a direct channel with the recipient.</li>
                <li>Send the onchain payment to recipient.</li>
            </ul>
        </span>}
    </Fragment>
);

/**
 * @param {number} time
 * @returns {*}
 */
const formatTimeRange = (time) => {
    let index = -1;
    TIME_RANGE_MEASURE.forEach((item, key) => {
        if (time % item.range === 0) {
            index = key;
        }
    });
    if (index === -1) {
        return null;
    }
    const count = Math.round(time / TIME_RANGE_MEASURE[index].range);
    let response = `${count} ${TIME_RANGE_MEASURE[index].measure}`;
    if (count === 1) {
        response = response.slice(0, -1);
    }
    return response;
};

export {
    formatDate,
    formatTimeRange,
    formatMultilineText,
    hasSelection,
    noExponents,
    formatNotificationMessage,
};
