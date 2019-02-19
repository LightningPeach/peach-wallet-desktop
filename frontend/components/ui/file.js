import React from "react";
import PropTypes from "prop-types";

const File = ({ value, placeholder, disabled, className, onChange }) => ( // eslint-disable-line object-curly-newline
    <label // eslint-disable-line
        className={`file__wrapper ${disabled ? "file__wrapper--disabled" : ""} ${className}`}
        onClick={async () => {
            if (disabled) {
                return;
            }
            const { response: { folder = "" } } = await window.ipcClient("selectFolder");
            onChange(folder);
        }}
    >
        <span className="file__value">{value || placeholder}</span>
        <span className="button button__solid file__button">Select folder</span>
    </label>
);

File.propTypes = {
    className: PropTypes.string,
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    value: PropTypes.string,
};

File.defaultProps = {
    className: "",
    disabled: false,
    onChange: () => ({}),
    placeholder: "Select file",
    value: "",
};

export default File;
