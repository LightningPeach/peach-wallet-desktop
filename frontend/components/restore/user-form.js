import React, { Component } from "react";
import PropTypes from "prop-types";
import Tooltip from "rc-tooltip";
import { connect } from "react-redux";
import { analytics, togglePasswordVisibility, validators, helpers } from "additional";
import ErrorFieldTooltip from "components/ui/error_field_tooltip";
import { authOperations as operations, authTypes as types } from "modules/auth";

const spinner = <div className="spinner" />;

class UserForm extends Component {
    constructor(props) {
        super(props);

        this.state = {
            confPasswordError: null,
            passwordError: null,
            processing: false,
            tooltips: {
                username: [
                    "Username is a name of wallet (folder),",
                    "it is stored locally on your PC.",
                ],
            },
            usernameError: null,
        };
    }

    cancelRestore = () => {
        analytics.event({ action: "Restore Password", category: "Auth", label: "Return to login" });
        this.props.dispatch(operations.setForm(types.LOGIN_FORM));
    };

    handleRestore = async (e) => {
        e.preventDefault();
        analytics.event({ action: "Restore Password", category: "Auth", label: "Submit Restore Password" });
        this.setState({ processing: true });
        const { dispatch, onValidUser } = this.props;
        const username = this.username.value.trim();
        const password = this.password.value.trim();
        const confPassword = this.confPassword.value.trim();
        const usernameError = await validators.validateUserExistence(username);
        const passwordError = validators.validatePass(password);
        const confPasswordError = validators.validatePassMismatch(password, confPassword);
        this.setState({
            confPasswordError,
            passwordError,
            processing: false,
            usernameError,
        });
        if (usernameError || passwordError || confPasswordError) {
            return;
        }
        onValidUser({ password, username });
        dispatch(operations.setAuthStep(types.RESTORE_STEP_SEED));
    };

    render() {
        const disabled = this.state.processing;
        return (
            <form onSubmit={this.handleRestore}>
                <div className="row">
                    <div className="col-xs-12">
                        <div className="form-label">
                            <label htmlFor="username">
                                Username
                            </label>
                            <Tooltip
                                placement="right"
                                overlay={helpers.formatTooltips(this.state.tooltips.username)}
                                trigger="hover"
                                arrowContent={
                                    <div className="rc-tooltip-arrow-inner" />
                                }
                                prefixCls="rc-tooltip__small rc-tooltip"
                                mouseLeaveDelay={0}
                            >
                                <i className="form-label__icon form-label__icon--info" />
                            </Tooltip>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        <input
                            id="username"
                            ref={(ref) => {
                                this.username = ref;
                            }}
                            className={`form-text ${this.state.usernameError ? "form-text__error" : ""}`}
                            name="username"
                            type="text"
                            placeholder="Enter your username"
                            disabled={disabled}
                            defaultValue={this.props.username}
                        />
                        <ErrorFieldTooltip text={this.state.usernameError} />
                    </div>
                </div>
                <div className="row mt-14">
                    <div className="col-xs-12">
                        <div className="form-label">
                            <label htmlFor="password">Password</label>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        <input
                            id="password"
                            ref={(ref) => {
                                this.password = ref;
                            }}
                            className={`form-text form-text--icon_eye ${this.state.passwordError ?
                                "form-text__error" :
                                ""}`}
                            name="password"
                            type="password"
                            placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;"
                            disabled={disabled}
                        />
                        <i
                            className="form-text__icon form-text__icon--eye form-text__icon--eye_open"
                            onClick={togglePasswordVisibility}
                        />
                        <ErrorFieldTooltip text={this.state.passwordError} />
                    </div>
                </div>
                <div className="row mt-14">
                    <div className="col-xs-12">
                        <div className="form-label">
                            <label htmlFor="conf_password">
                                Confirm password
                            </label>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        <input
                            id="conf_password"
                            ref={(ref) => {
                                this.confPassword = ref;
                            }}
                            className={`form-text ${this.state.confPasswordError ? "form-text__error" : ""}`}
                            name="password"
                            type="password"
                            placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;"
                            disabled={disabled}
                        />
                        <ErrorFieldTooltip text={this.state.confPasswordError} />
                    </div>
                </div>
                <div className="row spinner__wrapper mt-30">
                    <div className="col-xs-12">
                        <button type="submit" className="button button__orange button__fullwide" disabled={disabled}>
                            Proceed
                        </button>
                        {disabled ? spinner : null}
                    </div>
                    <div className="col-xs-12 text-center">
                        <button
                            type="button"
                            className="button button__link button__under-button"
                            onClick={this.cancelRestore}
                            disabled={disabled}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </form>
        );
    }
}

UserForm.propTypes = {
    dispatch: PropTypes.func.isRequired,
    onValidUser: PropTypes.func.isRequired,
    username: PropTypes.string,
};

export default connect()(UserForm);
