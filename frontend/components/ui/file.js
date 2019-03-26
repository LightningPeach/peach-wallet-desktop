import React from "react";
import PropTypes from "prop-types";

const File = ({
    buttonPlaceholder,
    value,
    placeholder,
    disabled,
    className,
    onChange,
}) => (
    <div
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
        <button type="button" className="button button__solid file__button">{buttonPlaceholder}</button>
    </div>
);

File.propTypes = {
    buttonPlaceholder: PropTypes.string,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    value: PropTypes.string,
};

File.defaultProps = {
    buttonPlaceholder: "Select",
    className: "",
    disabled: false,
    onChange: () => ({}),
    placeholder: "Select file",
    value: "",
};

export default File;
