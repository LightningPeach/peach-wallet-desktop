import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import Tooltip from "rc-tooltip";
import { connect } from "react-redux";

import { analytics, tooltips, togglePasswordVisibility, validators, helpers } from "additional";
import { authOperations as operations, authTypes as types } from "modules/auth";

import ErrorFieldTooltip from "components/ui/error-field-tooltip";
import Checkbox from "components/ui/checkbox";
import File from "components/ui/file";

const spinner = <div className="spinner" />;

class UserForm extends Component {
    constructor(props) {
        super(props);

        this.state = {
            confPasswordError: null,
            defaultPath: false,
            lndPath: "",
            lndPathError: null,
            passwordError: null,
            processing: false,
            walletNameError: null,
        };
    }

    cancelRestore = () => {
        analytics.event({ action: "Restore Password", category: "Auth", label: "Return to login" });
        this.props.dispatch(operations.setAuthStep(types.RESTORE_STEP_SELECT_METHOD));
    };

    handleRestore = async (e) => {
        e.preventDefault();
        analytics.event({ action: "Restore Password", category: "Auth", label: "Submit Restore Password" });
        this.setState({ processing: true });
        const { dispatch, onValidUser } = this.props;
        const { lndPath, defaultPath } = this.state;
        await window.ipcClient("setLndPath", { defaultPath, lndPath });

        const walletName = this.walletName.value.trim();
        const password = this.password.value.trim();
        const confPassword = this.confPassword.value.trim();
        const walletNameError = await validators.validateUserExistence(walletName);
        const passwordError = validators.validatePass(password);
        const confPasswordError = validators.validatePassMismatch(password, confPassword);
        const lndPathError = defaultPath ? null : await validators.validateLndPath(lndPath);
        this.setState({
            confPasswordError,
            lndPathError,
            passwordError,
            processing: false,
            walletNameError,
        });
        if (walletNameError || passwordError || confPasswordError || lndPathError) {
            return;
        }
        onValidUser({ password, walletName });
        dispatch(operations.setAuthStep(types.RESTORE_STEP_TERMS));
    };

    render() {
        const disabled = this.state.processing;
        return (
            <Fragment>
                <div className="row row--no-col justify-center-xs">
                    <div className="block__title">
                        Wallet recovery
                    </div>
                </div>
                <form className="form form--home" onSubmit={this.handleRestore}>
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
                                name="wallet-name"
                                type="text"
                                placeholder="Enter your wallet name"
                                disabled={disabled}
                                defaultValue={this.props.walletName}
                                onChange={() => { this.setState({ walletNameError: null }) }}
                            />
                            <ErrorFieldTooltip text={this.state.walletNameError} />
                        </div>
                    </div>
                    <div className="block__row">
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
                                        defaultPath: !this.state.defaultPath, lndPathError: null,
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
                                Proceed
                            </button>
                            {disabled ? spinner : null}
                        </div>
                    </div>
                    <div className="block__row-xs">
                        <div className="col-xs-12">
                            <button
                                type="button"
                                className="button button__solid button__solid--transparent button--fullwide"
                                onClick={this.cancelRestore}
                                disabled={disabled}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            </Fragment>
        );
    }
}

UserForm.propTypes = {
    dispatch: PropTypes.func.isRequired,
    onValidUser: PropTypes.func.isRequired,
    walletName: PropTypes.string,
};

export default connect()(UserForm);
