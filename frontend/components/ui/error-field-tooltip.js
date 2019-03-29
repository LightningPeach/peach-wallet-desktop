import React from "react";
import PropTypes from "prop-types";

import Ellipsis from "components/common/ellipsis";

const ErrorFieldTooltip = (props) => {
    if (!props.text) {
        return null;
    }
    return (
        <div className={`form-error ${props.class || ""}`}>
            <Ellipsis className="text-ellipsis--sm">{props.text}</Ellipsis>
        </div>
    );
};

ErrorFieldTooltip.propTypes = {
    class: PropTypes.string,
    text: PropTypes.string,
};

export default ErrorFieldTooltip;
