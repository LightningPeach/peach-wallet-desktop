import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import Tooltip from "rc-tooltip";
import { analytics, togglePasswordVisibility, validators, helpers } from "additional";
import ErrorFieldTooltip from "components/ui/error-field-tooltip";
import Checkbox from "components/ui/checkbox";
import File from "components/ui/file";
import { error } from "modules/notifications";
import { connect } from "react-redux";
import {
    authOperations as operations,
    authTypes as types,
} from "modules/auth";
import { lndOperations, lndActions } from "modules/lnd";
import { USERNAME_MAX_LENGTH } from "config/consts";

const spinner = <div className="spinner" />;

class RegistrationForm extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            confPasswordError: null,
            defaultPath: false,
            lndPath: "",
            lndPathError: null,
            passwordError: null,
            processing: false,
            tooltips: {
                defaultPath: [
                    "Better to set wallet data path in dropbox",
                    "or google drive folder.",
                ],
                password: [
                    "The password must be at least 8 characters and contain",
                    "minimum 1 uppercase letter [A-Z], 1 lower case letter [a-z]",
                    "and 1 digit [0-9]. Also, you can use special characters",
                    "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",
                ],
                username: [
                    "Username is a name of wallet (folder),",
                    "it is stored locally on your PC.",
                ],
            },
            usernameError: null,
        };
    }

    cancelRegistration = () => {
        analytics.event({ action: "Registration", category: "Auth", label: "Cancel Registration" });
        const { dispatch } = this.props;
        dispatch(lndOperations.setClearLndData(false));
        dispatch(operations.setForm(types.LOGIN_FORM));
    };

    handleRegistration = async (e) => {
        e.preventDefault();
        analytics.event({ action: "Registration", category: "Auth", label: "Submit Registration" });
        this.setState({ processing: true });
        const { dispatch, onValid } = this.props;
        const { lndPath, defaultPath } = this.state;
        const username = this.username.value.trim();
        const password = this.password.value.trim();
        const confPassword = this.confPassword.value.trim();
        const usernameError = await validators.validateUserExistence(username);
        const passwordError = validators.validatePass(password);
        const confPasswordError = validators.validatePassMismatch(password, confPassword);
        const lndPathError = defaultPath ? null : await validators.validateLndPath(lndPath);

        if (usernameError || passwordError || confPasswordError || lndPathError) {
            this.setState({
                confPasswordError,
                lndPathError,
                passwordError,
                processing: false,
                usernameError,
            });
            return;
        }

        await window.ipcClient("setLndPath", { defaultPath, lndPath });
        this.setState({ confPasswordError, passwordError, usernameError });
        const response = await dispatch(operations.regStartLnd(username));
        if (!response.ok) {
            this.setState({ processing: false });
            dispatch(error({ message: helpers.formatNotificationMessage(response.error) }));
            return;
        }
        const seed = await dispatch(lndOperations.getSeed());
        this.setState({ processing: false });
        if (!seed.ok) {
            dispatch(error({ message: helpers.formatNotificationMessage(response.error) }));
            return;
        }
        onValid({ password, seed: seed.response.seed });
        dispatch(operations.setTempUsername(username));
        dispatch(lndActions.setLndInitStatus(""));
        dispatch(operations.setAuthStep(types.REGISTRATION_STEP_TERMS));
    };

    render() {
        const disabled = this.state.processing;
        return (
            <form onSubmit={this.handleRegistration}>
                <div className="home__title">
                    Sign up and start working with Peach Wallet
                </div>
                <div className="row">
                    <div className="col-xs-12">
                        <div className="form-label">
                            <label htmlFor="username">
                                Username
                            </label>
                            <Tooltip
                                placement="right"
                                overlay={helpers.formatMultilineText(this.state.tooltips.username)}
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
                            placeholder="Enter your username"
                            defaultValue={this.props.username}
                            disabled={disabled}
                            max={USERNAME_MAX_LENGTH}
                            maxLength={USERNAME_MAX_LENGTH}
                            onChange={() => { this.setState({ usernameError: null }) }}
                        />
                        <ErrorFieldTooltip text={this.state.usernameError} />
                    </div>
                </div>
                <div className="row mt-14">
                    <div className="col-xs-12">
                        <div className="form-label">
                            <label htmlFor="password">
                                Password
                            </label>
                            <Tooltip
                                placement="right"
                                overlay={helpers.formatMultilineText(this.state.tooltips.password)}
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
                            id="password"
                            ref={(ref) => {
                                this.password = ref;
                            }}
                            className={`form-text form-text--icon_eye
                            ${this.state.passwordError ? "form-text__error" : ""}`}
                            name="password"
                            type="password"
                            placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;"
                            disabled={disabled}
                            onChange={() => { this.setState({ passwordError: null }) }}
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
                            onChange={() => { this.setState({ confPasswordError: null }) }}
                        />
                        <ErrorFieldTooltip text={this.state.confPasswordError} />
                    </div>
                </div>
                <div className="row mt-14">
                    <div className="col-xs-12">
                        <div className="form-label">
                            <Checkbox
                                text="Use default path"
                                onChange={() => this.setState({
                                    defaultPath: !this.state.defaultPath,
                                    lndPathError: null,
                                })}
                                checked={this.state.defaultPath}
                                disabled={disabled}
                            />
                            <Tooltip
                                placement="right"
                                overlay={helpers.formatMultilineText(this.state.tooltips.defaultPath)}
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
                        <File
                            disabled={this.state.defaultPath || disabled}
                            value={this.state.lndPath}
                            placeholder="Select folder"
                            className={this.state.lndPathError ? "form-text__error" : ""}
                            onChange={(lndPath) => {
                                this.setState({ lndPath, lndPathError: null });
                            }}
                        />
                        <ErrorFieldTooltip text={this.state.lndPathError} />
                    </div>
                </div>
                <div className="row spinner__wrapper mt-30">
                    <div className="col-xs-12">
                        <button
                            type="submit"
                            className="button button__orange button__fullwide"
                            disabled={disabled}
                        >
                            Next
                        </button>
                        {disabled ? spinner : null}
                    </div>
                </div>
                <div className="row signup">
                    <div className="col-xs-12 text-center">
                        <button
                            type="button"
                            className="button button__link button__under-button"
                            onClick={this.cancelRegistration}
                            disabled={disabled}
                        >
                            Back
                        </button>
                    </div>
                </div>
            </form>
        );
    }
}

RegistrationForm.propTypes = {
    dispatch: PropTypes.func.isRequired,
    onValid: PropTypes.func.isRequired,
    username: PropTypes.string,
};

const mapStateToProps = state => ({
    username: state.auth.tempUsername,
});

export default connect(mapStateToProps)(RegistrationForm);
