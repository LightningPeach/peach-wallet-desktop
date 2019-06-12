import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { contactsActions, contactsOperations } from "modules/contacts";
import { PAYMENT_REQUEST_LENGTH, LIGHTNING_ID_LENGTH } from "config/consts";
import { debounce } from "additional";

class DebounceInput extends Component {
    constructor(props) {
        super(props);

        const { value } = props;
        this.state = {
            value: value || "",
        };
    }

    handleChange = (e) => {
        this.setState({
            value: e.target.value,
        });

        this.sendData();
    };

    sendData = debounce(() => {
        this.props.onChange(this.state.value.trim());
    }, this.props.timeout);

    reset = () => {
        this.setState({ value: "" });
    };

    render() {
        const {
            timeout, onChange, value, dispatch, ...otherProps
        } = this.props;
        return (
            <input
                {...otherProps}
                value={this.state.value}
                onChange={this.handleChange}
            />
        );
    }
}

DebounceInput.propTypes = {
    className: PropTypes.string,
    dispatch: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    timeout: PropTypes.number.isRequired,
    value: PropTypes.string,
};

export default connect()(DebounceInput);
