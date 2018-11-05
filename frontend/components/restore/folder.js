import { error } from "modules/notifications";
import Tooltip from "rc-tooltip";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics, togglePasswordVisibility, helpers } from "additional";
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
            passwordError: null,
            processing: false,
            tooltips: {
                walletPath: ["Full path (include username) to wallet data"],
            },
        };
    }

    cancelRestore = () => {
        analytics.event({ action: "Restore Password", category: "Auth", label: "Return to method" });
        this.props.cancelRestore();
    };

    handleRestore = async (e) => {
        e.preventDefault();
        analytics.event({ action: "Restore Password", category: "Auth", label: "Submit Restore folder" });
        this.setState({ processing: true });
        const { lndPath } = this.state;
        const paths = lndPath.split(window.pathSep);
        const username = paths.pop();
        const lnPath = paths.join(window.pathSep);
        const password = this.password.value.trim();
        const passwordError = !password ? statusCodes.EXCEPTION_FIELD_IS_REQUIRED : null;

        if (passwordError) {
            this.setState({ passwordError, processing: false });
            return;
        }
        this.setState({ passwordError });
        await window.ipcClient("setLndPath", { defaultPath: false, lndPath: lnPath });
        await window.ipcClient("saveLndPath", { username });
        const init = await this.props.login(username, password);
        this.setState({ processing: false });
        if (!init.ok) {
            this.props.handleError(init.error);
            return;
        }
        this.props.goToMain();
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
                                    this.setState({ lndPath: e.target.files[0].path });
                                } else {
                                    this.setState({ lndPath: "" });
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
    cancelRestore: PropTypes.func.isRequired,
    goToMain: PropTypes.func.isRequired,
    handleError: PropTypes.func.isRequired,
    login: PropTypes.func.isRequired,
};

const mapDispatchToProps = dispatch => ({
    cancelRestore: () => dispatch(operations.setAuthStep(types.RESTORE_STEP_SELECT_METHOD)),
    goToMain: () => dispatch(push(WalletPath)),
    handleError: msg => dispatch(error({ message: helpers.formatNotificationMessage(msg) })),
    login: (username, password) => dispatch(operations.login(username, password)),
});

export default connect(null, mapDispatchToProps)(Folder);
