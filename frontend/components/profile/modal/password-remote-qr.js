import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { push } from "react-router-redux";
import { appOperations } from "modules/app";
import { accountOperations } from "modules/account";
import { helpers, logger, togglePasswordVisibility } from "additional";
import { authOperations } from "modules/auth";
import { exceptions } from "config";
import Modal from "components/modal";

class PasswordRemoteQR extends Component {
    constructor(props) {
        super(props);
        this.state = {
            // Not in store for more security
            passwordError: null,
            rebuilding: false,
        };
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
        } else if (helpers.hash(restorePass) !== password) {
            return exceptions.PASSWORD_MISMATCH;
        }
        return null;
    };

    rebuildCerts = async (e) => {
        e.preventDefault();
        this.setState({
            rebuilding: true,
        });
        const { dispatch, login } = this.props;
        const savedLogin = login.toString();
        const password = this.password.value.trim();
        const passwordError = this._validatePassword(password);
        if (passwordError) {
            this.setState({
                passwordError,
                rebuilding: false,
            });
            return;
        }
        // Delete old certs and change ip
        const response = await dispatch(accountOperations.rebuildCertificate());
        if (response.ok) {
            await window.ipcClient("loadLndPath", { login });
            const init = await dispatch(authOperations.login(savedLogin, password));
            this.setState({
                rebuilding: false,
            });
            dispatch(appOperations.openConnectRemoteQRModal());
        } else {
            await dispatch(accountOperations.logout());
        }
    };

    closeModal = () => {
        const { dispatch } = this.props;
        if (!this.state.rebuilding) {
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
            >
                <div className="modal__body">
                    <div className="row">
                        <div className="col-xs-12">
                            To generate a new QR code, you will need to restart the wallet node
                        </div>
                    </div>
                </div>
                <div className="modal__footer">
                    <form onSubmit={this.handleLogin}>
                        <div className="row">
                            <div className="col-xs-12">
                                <input
                                    id="password"
                                    className={`form-text form-text--icon_eye form-text--qr-password ${
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
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-xs-12">
                                <span className="button__spinner">
                                    <button
                                        type="button"
                                        className="button button__solid button--fullwide"
                                        onClick={this.rebuildCerts}
                                        disabled={this.state.rebuilding}
                                    >
                                        Wallet restart
                                    </button>
                                    {this.state.rebuilding && <div className="spinner" />}
                                </span>
                            </div>
                        </div>
                    </form>
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
