import React from "react";
import PropTypes from "prop-types";

const Informer = props => (
    <div className="container">
        <div className="row">
            <div className="col-xs-12">
                <div className="informer">
                    {props.children}
                </div>
            </div>
        </div>
    </div>
);

Informer.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
};

export default Informer;
