import React, { Component } from "react";
import PropTypes from "prop-types";

const validDigit = /^([0-9]+)?(\.)?([0-9]+)?$/;

class DigitsField extends Component {
    constructor(props) {
        super(props);

        const { value } = this.props;
        if (value && validDigit.test(value)) {
            this.state = { value };
        } else {
            this.state = { value: "" };
        }

        this.cachedSelection = {
            end: 0,
            start: 0,
        };
    }

    reset = () => {
        this.setState({ value: "" });
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
        if (!e.target.value || validDigit.test(e.target.value)) {
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
            value, setRef, setOnChange, ...otherProps
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
    setOnChange: PropTypes.func,
    setRef: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default DigitsField;
