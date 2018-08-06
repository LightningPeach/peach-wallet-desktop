import React from "react";
import PropTypes from "prop-types";

const Checkbox = props => (
    <label className={`form-checkbox ${props.class || ""}`}>
        <input
            type="checkbox"
            value={props.value}
            onChange={props.onChange}
            disabled={props.disabled}
            checked={props.checked}
        />
        <span className="form-checkbox__label">{props.text}</span>
    </label>
);

Checkbox.propTypes = {
    checked: PropTypes.bool,
    class: PropTypes.string,
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    text: PropTypes.any, // eslint-disable-line
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]),
};

export default Checkbox;
