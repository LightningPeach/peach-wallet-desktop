import React from "react";

export const pageBlockerHelper = (show = false) => {
    const $body = document.body;
    if (show) {
        $body.className += " body-disabled";
    } else {
        const reg = new RegExp("(\\s|^)body-disabled(\\s|$)");
        $body.className = $body.className.replace(reg, " ");
    }
};

export const PageBlocker = () => (
    <div className="page-confirmation__container">
        <div className="page-confirmation__wrapper">
            <div className="progress">
                <div className="indeterminate" />
            </div>
            <h2 className="page-confirmation__title text-center">Some errors appeared, we fixing it...</h2>
        </div>
    </div>
);
