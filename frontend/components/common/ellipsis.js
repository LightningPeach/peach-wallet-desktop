import React from "react";
import PropTypes from "prop-types";

const Ellipsis = props => (
    <span className={`js-ellipsis text-ellipsis__container ${props.classList || ""}`}>
        <span className="text-ellipsis__text">{props.children}</span>
    </span>
);

Ellipsis.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
    classList: PropTypes.string,
};

export default Ellipsis;
