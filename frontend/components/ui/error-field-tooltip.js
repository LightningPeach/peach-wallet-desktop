import React from "react";
import PropTypes from "prop-types";

const ErrorFieldTooltip = (props) => {
    if (!props.text) {
        return null;
    }
    return (
        <div className={`form-error ${props.class || ""}`}>{props.text}</div>
    );
};

ErrorFieldTooltip.propTypes = {
    class: PropTypes.string,
    text: PropTypes.string,
};

export default ErrorFieldTooltip;
