import React from "react";
import PropTypes from "prop-types";

const Ellipsis = props => (
    <span className={`js-ellipsis text-ellipsis__container ${props.className || ""}`}>
        <span className="text-ellipsis__text">{props.children}</span>
    </span>
);

Ellipsis.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
    className: PropTypes.string,
};

export default Ellipsis;
