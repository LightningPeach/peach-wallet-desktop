import React from "react";
import PropTypes from "prop-types";

const Button = props => (
    <button
        className={`button ${props.class}`}
        onClick={props.onClick}
        disabled={props.disabled}
    >
        {props.text}
    </button>
);

Button.propTypes = {
    class: PropTypes.string,
    disabled: PropTypes.bool,
    onClick: PropTypes.func,
    text: PropTypes.string,
};

export default Button;
