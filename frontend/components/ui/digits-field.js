import React, { Component } from "react";
import PropTypes from "prop-types";

const validAboveZeroFloat = /^([0-9]+)?(\.)?([0-9]+)?$/;
const validAboveZeroInt = /^(?:[1-9]\d*)$/;
const validInt = /^(?:(-)?[1-9]\d*|0)$/;

class DigitsField extends Component {
    static defaultProps = {
        pattern: "above_zero_float",
    };

    constructor(props) {
        super(props);
        this.cachedSelection = {
            end: 0,
            start: 0,
        };
        const { pattern } = this.props;
        let { value, defaultValue } = this.props;
        switch (pattern) {
            case "above_zero_int":
                this.pattern = validAboveZeroInt;
                break;
            case "above_zero_float":
                this.pattern = validAboveZeroFloat;
                break;
            default:
                this.pattern = pattern;
                break;
        }
        value = value && this.pattern.test(value) ? value : "";
        defaultValue = defaultValue && this.pattern.test(defaultValue) ? defaultValue : "";
        this.state = {
            defaultValue,
            value: value || defaultValue,
        };
    }

    componentWillReceiveProps(nextProps) {
        const pattern = nextProps.pattern || "above_zero_float";
        if (nextProps.pattern !== this.props.pattern) {
            switch (pattern) {
                case "above_zero_int":
                    this.pattern = validAboveZeroInt;
                    break;
                case "above_zero_float":
                    this.pattern = validAboveZeroFloat;
                    break;
                default:
                    this.pattern = pattern;
                    break;
            }
        }
    }

    setValue = (value) => {
        this.setState({ value });
    };

    reset = () => {
        this.setState({ value: this.state.defaultValue || "" });
    };

    reference = (input) => {
        this.input = input;
        this.props.setRef(input);
    };

    handleKeyDown = () => {
        this.cachedSelection.start = this.input.selectionStart;
        this.cachedSelection.end = this.input.selectionEnd;
    };

    handleChange = (e) => {
        if (!e.target.value || this.pattern.test(e.target.value)) {
            this.setState({ value: e.target.value });
            if (this.props.setOnChange) {
                this.props.setOnChange(e);
            }
        } else {
            setImmediate(() => {
                this.input.selectionStart = this.cachedSelection.start;
                this.input.selectionEnd = this.cachedSelection.end;
            });
        }
    };

    render() {
        const {
            value, setRef, setOnChange, pattern, defaultValue, ...otherProps
        } = this.props;
        return (
            <input
                {...otherProps}
                ref={this.reference}
                value={this.state.value}
                onKeyDown={this.handleKeyDown}
                onChange={this.handleChange}
            />
        );
    }
}

DigitsField.propTypes = {
    defaultValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    pattern: PropTypes.oneOfType([
        PropTypes.instanceOf(RegExp),
        PropTypes.oneOf([
            "above_zero_int",
            "above_zero_float",
        ]),
    ]),
    setOnChange: PropTypes.func,
    setRef: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default DigitsField;
