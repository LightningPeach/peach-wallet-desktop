import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { appOperations } from "modules/app";
import { accountOperations } from "modules/account";
import { helpers, logger, togglePasswordVisibility, analytics } from "additional";
import { authOperations } from "modules/auth";
import { exceptions, routes } from "config";

import Modal from "components/modal";
import ErrorFieldTooltip from "components/ui/error-field-tooltip";

class PasswordRemoteQR extends Component {
    constructor(props) {
        super(props);
        this.state = {
            // Not in store for more security
            passwordError: null,
            processing: false,
        };
        analytics.pageview(`${routes.ProfileFullPath}/password-remote-qr`, "Password for remote connect");
    }

    _validatePassword = (restorePass) => {
        const { password } = this.props;
        const hashedPassword = helpers.hash(restorePass);
        if (!password) {
            logger.error("User password not found in store");
            return exceptions.PASSWORD_MISMATCH;
        }
        if (!restorePass) {
            return exceptions.FIELD_IS_REQUIRED;
        } else if (hashedPassword !== password) {
            return exceptions.PASSWORD_MISMATCH;
        }
        return null;
    };

    rebuildCerts = async (e) => {
        e.preventDefault();
        analytics.event({
            action: "Rebuilding certs",
            category: "Profile",
            label: "Start",
        });
        this.setState({
            processing: true,
        });
        const { dispatch, login } = this.props;
        const savedLogin = login.toString();
        const password = this.password.value.trim();
        const passwordError = this._validatePassword(password);
        if (passwordError) {
            analytics.event({
                action: "Rebuilding certs",
                category: "Profile",
                label: "Password error",
            });
            this.setState({
                passwordError,
                processing: false,
            });
            return;
        }
        // Delete old certs and change ip
        const response = await dispatch(accountOperations.rebuildCertificate());
        if (response.ok) {
            await window.ipcClient("loadLndPath", { login });
            await dispatch(authOperations.login(savedLogin, password));
            this.setState({
                processing: false,
            });
            analytics.event({
                action: "Rebuilding certs",
                category: "Profile",
                label: "Success",
            });
            dispatch(appOperations.openConnectRemoteQRModal());
        } else {
            analytics.event({
                action: "Rebuilding certs",
                category: "Profile",
                label: "Error",
            });
            await dispatch(accountOperations.logout());
        }
    };

    closeModal = () => {
        const { dispatch } = this.props;
        if (!this.state.processing) {
            dispatch(appOperations.closeModal());
        }
    };

    render() {
        return (
            <Modal
                title="Enter your password"
                theme="small"
                onClose={this.closeModal}
                showCloseButton
                disabled={this.state.processing}
            >
                <div className="modal__body">
                    <div className="row">
                        <div className="col-xs-12">
                            To generate a new QR code, you will need to restart the wallet node
                        </div>
                    </div>
                    <div className="block__row">
                        <div className="col-xs-12">
                            <input
                                id="password"
                                className={`form-text form-text--icon_eye ${
                                    this.state.passwordError ? "form-text__error" : ""}`}
                                name="password"
                                type="password"
                                placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;"
                                ref={(ref) => {
                                    this.password = ref;
                                }}
                                onChange={() => { this.setState({ passwordError: null }) }}
                                disabled={this.state.processing}
                            />
                            <i
                                className="form-text__icon form-text__icon--eye form-text__icon--eye_open"
                                onClick={togglePasswordVisibility}
                            />
                            <ErrorFieldTooltip text={this.state.passwordError} />
                        </div>
                    </div>
                </div>
                <div className="modal__footer">
                    <div className="row">
                        <div className="col-xs-12">
                            <span className="button__spinner">
                                <button
                                    type="button"
                                    className="button button__solid button--fullwide"
                                    onClick={this.rebuildCerts}
                                    disabled={this.state.processing}
                                >
                                    Wallet restart
                                </button>
                                {this.state.processing && <div className="spinner" />}
                            </span>
                        </div>
                    </div>
                    <div className="block__row-xs">
                        <div className="col-xs-12">
                            <button
                                type="button"
                                className="button button__solid button__solid--transparent button--fullwide"
                                onClick={this.closeModal}
                                disabled={this.state.processing}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

PasswordRemoteQR.propTypes = {
    dispatch: PropTypes.func.isRequired,
    login: PropTypes.string.isRequired,
    password: PropTypes.string,
};

const mapStateToProps = state => ({
    login: state.account.login,
    password: state.auth.password,
});

export default connect(mapStateToProps)(PasswordRemoteQR);
