import React, { PureComponent, Fragment } from "react";
import PropTypes from "prop-types";
import Tooltip from "rc-tooltip";

import { analytics, togglePasswordVisibility, validators, helpers, tooltips } from "additional";
import { error } from "modules/notifications";
import { connect } from "react-redux";
import {
    authOperations as operations,
    authTypes as types,
} from "modules/auth";
import { lndOperations, lndActions } from "modules/lnd";
import { WALLET_NAME_MAX_LENGTH } from "config/consts";

import ErrorFieldTooltip from "components/ui/error-field-tooltip";
import Checkbox from "components/ui/checkbox";
import File from "components/ui/file";

const spinner = <div className="spinner" />;

class RegistrationForm extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            confPasswordError: null,
            defaultPath: true,
            lndPath: "",
            lndPathError: null,
            passwordError: null,
            processing: false,
            walletNameError: null,
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
        const walletName = this.walletName.value.trim();
        const password = this.password.value.trim();
        const confPassword = this.confPassword.value.trim();
        const walletNameError = await validators.validateUserExistence(walletName);
        const passwordError = validators.validatePass(password);
        const confPasswordError = validators.validatePassMismatch(password, confPassword);
        const lndPathError = defaultPath ? null : await validators.validateLndPath(lndPath);

        if (walletNameError || passwordError || confPasswordError || lndPathError) {
            this.setState({
                confPasswordError,
                lndPathError,
                passwordError,
                processing: false,
                walletNameError,
            });
            return;
        }

        await window.ipcClient("setLndPath", { defaultPath, lndPath });
        this.setState({ confPasswordError, passwordError, walletNameError });
        const response = await dispatch(operations.regStartLnd(walletName));
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
        dispatch(operations.setTempWalletName(walletName));
        dispatch(lndActions.setLndInitStatus(""));
        dispatch(operations.setAuthStep(types.REGISTRATION_STEP_TERMS));
    };

    render() {
        const disabled = this.state.processing;
        return (
            <Fragment>
                <div className="row row--no-col justify-center-xs">
                    <div className="block__title">
                        Create a new wallet
                    </div>
                </div>
                <form className="form form--home" onSubmit={this.handleRegistration}>
                    <div className="block__row-lg">
                        <div className="col-xs-12">
                            <div className="form-label">
                                <label htmlFor="wallet-name">
                                    Wallet Name
                                </label>
                                <Tooltip
                                    placement="right"
                                    overlay={tooltips.WALLET_NAME}
                                    trigger="hover"
                                    arrowContent={
                                        <div className="rc-tooltip-arrow-inner" />
                                    }
                                    prefixCls="rc-tooltip__small rc-tooltip"
                                    mouseLeaveDelay={0}
                                >
                                    <i className="tooltip tooltip--info" />
                                </Tooltip>
                            </div>
                        </div>
                        <div className="col-xs-12">
                            <input
                                id="wallet-name"
                                ref={(ref) => {
                                    this.walletName = ref;
                                }}
                                className={`form-text ${this.state.walletNameError ? "form-text__error" : ""}`}
                                placeholder="Enter your wallet name"
                                defaultValue={this.props.walletName}
                                disabled={disabled}
                                max={WALLET_NAME_MAX_LENGTH}
                                maxLength={WALLET_NAME_MAX_LENGTH}
                                onChange={() => { this.setState({ walletNameError: null }) }}
                            />
                            <ErrorFieldTooltip text={this.state.walletNameError} />
                        </div>
                    </div>
                    <div className="block__row">
                        <div className="col-xs-12">
                            <div className="form-label">
                                <label htmlFor="password">
                                    Password
                                </label>
                                <Tooltip
                                    placement="right"
                                    overlay={tooltips.PASSWORD}
                                    trigger="hover"
                                    arrowContent={
                                        <div className="rc-tooltip-arrow-inner" />
                                    }
                                    prefixCls="rc-tooltip__small rc-tooltip"
                                    mouseLeaveDelay={0}
                                >
                                    <i className="tooltip tooltip--info" />
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
                    <div className="block__row">
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
                    <div className="block__row">
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
                                    overlay={tooltips.DEFAULT_WALLET_PATH}
                                    trigger="hover"
                                    arrowContent={
                                        <div className="rc-tooltip-arrow-inner" />
                                    }
                                    prefixCls="rc-tooltip__small rc-tooltip"
                                    mouseLeaveDelay={0}
                                >
                                    <i className="tooltip tooltip--info" />
                                </Tooltip>
                            </div>
                        </div>
                        <div className="col-xs-12">
                            <File
                                disabled={this.state.defaultPath || disabled}
                                value={this.state.lndPath}
                                placeholder="Wallet folder"
                                buttonPlaceholder="Select"
                                className={this.state.lndPathError ? "form-text__error" : ""}
                                onChange={(lndPath) => {
                                    this.setState({ lndPath, lndPathError: null });
                                }}
                            />
                            <ErrorFieldTooltip text={this.state.lndPathError} />
                        </div>
                    </div>
                    <div className="block__row-lg">
                        <div className="col-xs-12">
                            <button
                                type="submit"
                                className="button button__solid button--fullwide"
                                disabled={disabled}
                            >
                                Next
                            </button>
                            {disabled ? spinner : null}
                        </div>
                    </div>
                    <div className="block__row-xs">
                        <div className="col-xs-12">
                            <button
                                type="button"
                                className="button button__solid button__solid--transparent button--fullwide"
                                onClick={this.cancelRegistration}
                                disabled={disabled}
                            >
                                Back
                            </button>
                        </div>
                    </div>
                </form>
            </Fragment>
        );
    }
}

RegistrationForm.propTypes = {
    dispatch: PropTypes.func.isRequired,
    onValid: PropTypes.func.isRequired,
    walletName: PropTypes.string,
};

const mapStateToProps = state => ({
    walletName: state.auth.tempWalletName,
});

export default connect(mapStateToProps)(RegistrationForm);
