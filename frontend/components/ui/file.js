import React from "react";
import PropTypes from "prop-types";

const File = ({
    value, placeholder, disabled, className, ...props
}) => (
    <label className={`file__wrapper ${disabled ? "file__wrapper--disabled" : ""} ${className}`}>
        <span className="file__value">{value || placeholder}</span>
        <span className="button button__orange file__button">Select folder</span>
        <input
            {...props}
            className="file__input"
            type="file"
            webkitdirectory="true"
        />
    </label>
);

File.propTypes = {
    className: PropTypes.string,
    disabled: PropTypes.bool,
    placeholder: PropTypes.string,
    value: PropTypes.string,
};

File.defaultProps = {
    className: "",
    disabled: false,
    placeholder: "Select file",
    value: "",
};

export default File;
