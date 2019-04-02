import React, { Component, Fragment } from "react";
import Tooltip from "rc-tooltip";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { error } from "modules/notifications";
import { analytics, togglePasswordVisibility, validators, helpers, tooltips } from "additional";
import { authOperations as operations, authTypes as types } from "modules/auth";
import { exceptions } from "config";

import File from "components/ui/file";
import ErrorFieldTooltip from "components/ui/error-field-tooltip";

const spinner = <div className="spinner" />;

class Folder extends Component {
    constructor(props) {
        super(props);

        this.state = {
            lndPath: "",
            lndPathError: null,
            passwordError: null,
            processing: false,
        };
    }

    cancelRestore = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Restore Password", category: "Auth", label: "Return to method" });
        dispatch(operations.setAuthStep(types.RESTORE_STEP_SELECT_METHOD));
    };

    handleRestore = async (e) => {
        e.preventDefault();
        const { dispatch } = this.props;
        analytics.event({ action: "Restore Password", category: "Auth", label: "Submit Restore folder" });
        this.setState({ processing: true });
        const { lndPath } = this.state;
        const paths = lndPath.split(window.pathSep);
        const walletName = paths.pop();
        const lnPath = paths.join(window.pathSep);
        const lndPathError = await validators.validateLndPath(lnPath) || await this._validatewalletName(walletName);
        const password = this.password.value.trim();
        const passwordError = !password ? exceptions.FIELD_IS_REQUIRED : null;

        if (passwordError || lndPathError) {
            this.setState({ lndPathError, passwordError, processing: false });
            return;
        }
        this.setState({ passwordError });
        await window.ipcClient("setLndPath", { defaultPath: false, lndPath: lnPath });
        const init = await dispatch(operations.login(walletName, password));
        this.setState({ processing: false });
        if (!init.ok) {
            dispatch(error({ message: helpers.formatNotificationMessage(init.error) }));
            return;
        }
        dispatch(operations.setHashedPassword(password));
        dispatch(operations.setAuthStep(types.RESTORE_STEP_TERMS));
    };

    _validateWalletName = async (walletName) => {
        const response = await validators.validateUserExistence(walletName);
        if (response) {
            return exceptions.FOLDER_WALLET_NAME_EXISTS;
        }
        return null;
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
                                <label htmlFor="wallet_folder">
                                    User folder
                                    <Tooltip
                                        placement="right"
                                        overlay={tooltips.WALLET_PATH}
                                        trigger="hover"
                                        arrowContent={
                                            <div className="rc-tooltip-arrow-inner" />
                                        }
                                        prefixCls="rc-tooltip__small rc-tooltip"
                                        mouseLeaveDelay={0}
                                    >
                                        <i className="tooltip tooltip--info" />
                                    </Tooltip>
                                </label>
                            </div>
                        </div>
                        <div className="col-xs-12">
                            <File
                                id="wallet_folder"
                                disabled={disabled}
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

Folder.propTypes = {
    dispatch: PropTypes.func.isRequired,
};

export default connect()(Folder);
