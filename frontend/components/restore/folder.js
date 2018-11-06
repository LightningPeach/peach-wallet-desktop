import { error } from "modules/notifications";
import Tooltip from "rc-tooltip";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics, togglePasswordVisibility, validators, helpers } from "additional";
import ErrorFieldTooltip from "components/ui/error_field_tooltip";
import File from "components/ui/file";
import { authOperations as operations, authTypes as types } from "modules/auth";
import * as statusCodes from "config/status-codes";
import { push } from "react-router-redux";
import { WalletPath } from "routes";

const spinner = <div className="spinner" />;

class Folder extends Component {
    constructor(props) {
        super(props);

        this.state = {
            lndPath: "",
            lndPathError: null,
            passwordError: null,
            processing: false,
            tooltips: {
                walletPath: ["Full path (include username) to wallet data"],
            },
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
        const username = paths.pop();
        const lnPath = paths.join(window.pathSep);
        const lndPathError = await validators.validateLndPath(lnPath) || await this._validateUsername(username);
        const password = this.password.value.trim();
        const passwordError = !password ? statusCodes.EXCEPTION_FIELD_IS_REQUIRED : null;

        if (passwordError || lndPathError) {
            this.setState({ lndPathError, passwordError, processing: false });
            return;
        }
        this.setState({ passwordError });
        await window.ipcClient("setLndPath", { defaultPath: false, lndPath: lnPath });
        await window.ipcClient("saveLndPath", { username });
        const init = await dispatch(operations.login(username, password));
        this.setState({ processing: false });
        if (!init.ok) {
            dispatch(error({ message: helpers.formatNotificationMessage(init.error) }));
            return;
        }
        dispatch(push(WalletPath));
    };

    _validateUsername = async (username) => {
        const { ok } = await window.ipcClient("checkUsername", { username });
        if (!ok) {
            return statusCodes.EXCEPTION_FOLDER_USERNAME_EXISTS;
        }
        return null;
    };

    render() {
        const disabled = this.state.processing;
        return (
            <form onSubmit={this.handleRestore}>
                <div className="row mt-14">
                    <div className="col-xs-12">
                        <div className="form-label">
                            <label htmlFor="wallet_folder">
                                User folder
                                <Tooltip
                                    placement="right"
                                    overlay={helpers.formatMultilineText(this.state.tooltips.walletPath)}
                                    trigger="hover"
                                    arrowContent={
                                        <div className="rc-tooltip-arrow-inner" />
                                    }
                                    prefixCls="rc-tooltip__small rc-tooltip"
                                    mouseLeaveDelay={0}
                                >
                                    <i className="form-label__icon form-label__icon--info" />
                                </Tooltip>
                            </label>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        <File
                            id="wallet_folder"
                            disabled={this.state.defaultPath}
                            value={this.state.lndPath}
                            placeholder="Select folder"
                            className={this.state.lndPathError ? "form-text__error" : ""}
                            onChange={(e) => {
                                if (e.target.files[0]) {
                                    this.setState({ lndPath: e.target.files[0].path, lndPathError: null });
                                } else {
                                    this.setState({ lndPath: "", lndPathError: null });
                                }
                            }}
                        />
                        <ErrorFieldTooltip text={this.state.lndPathError} />
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
                            onChange={() => { this.setState({ passwordError: null }) }}
                        />
                        <i
                            className="form-text__icon form-text__icon--eye form-text__icon--eye_open"
                            onClick={togglePasswordVisibility}
                        />
                        <ErrorFieldTooltip text={this.state.passwordError} />
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

Folder.propTypes = {
    dispatch: PropTypes.func.isRequired,
};

export default connect()(Folder);
