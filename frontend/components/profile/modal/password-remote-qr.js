import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { appOperations } from "modules/app";
import { accountOperations } from "modules/account";
import { helpers, logger } from "additional";
import { authOperations } from "modules/auth";
import { statusCodes } from "config";

class PasswordRemoteQR extends Component {
    constructor(props) {
        super(props);
        this.state = {
            // not in store for more security
            passwordError: null,
            rebuilding: false,
        };
    }

    _validatePassword = (restorePass) => {
        const { password } = this.props;

        // ToDo: remove console.log
        console.log("Hashed password:", password);
        console.log("Password:", restorePass);
        if (!password) {
            logger.error("User password not found in store");
            return statusCodes.EXCEPTION_PASSWORD_MISMATCH;
        }
        if (!restorePass) {
            return statusCodes.EXCEPTION_FIELD_IS_REQUIRED;
        } else if (helpers.hash(restorePass) !== password) {
            return statusCodes.EXCEPTION_PASSWORD_MISMATCH;
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
        // delete old certs and change ip
        await dispatch(accountOperations.rebuildCertificate());
        console.log("Will dispatch login with pass and login", password, savedLogin);

        // test
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        await sleep(10 * 1000);

        await window.ipcClient("loadLndPath", { login });
        const init = await dispatch(authOperations.login(savedLogin, password));
        this.setState({
            rebuilding: false,
        });
        dispatch(appOperations.openConnectRemoteQRModal());
    };

    closeModal = () => {
        const { dispatch } = this.props;
        if (!this.state.rebuilding) {
            dispatch(appOperations.closeModal());
        }
    };

    render() {
        const spinner = this.state.rebuilding ? <div className="spinner" /> : null;

        return (
            <div className="modal-wrapper">
                <div className="modal-layout" onClick={this.closeModal} />
                <div className="modal modal-qr-password" tabIndex="-1" role="dialog">
                    <form onSubmit={this.handleLogin}>
                        <div className="row mt-14">
                            <div className="col-xs-12">
                                <div className="form-label">
                                    <label htmlFor="password">
                                        Password
                                    </label>
                                </div>
                            </div>
                            <div className="col-xs-12">
                                <input
                                    id="password"
                                    className={`form-text form-text--icon_eye ${this.state.passwordError ?
                                        "form-text__error" :
                                        ""}`}
                                    name="password"
                                    type="password"
                                    placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;"
                                    ref={(ref) => {
                                        this.password = ref;
                                    }}
                                    onChange={() => { this.setState({ passwordError: null }) }}
                                    disabled={this.state.processing}
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-xs-12 text-left">
                                <span className="button_with_spinner">
                                    <button
                                        type="button"
                                        className="button button__orange button__side-padding50"
                                        onClick={this.rebuildCerts}
                                        disabled={this.state.rebuilding}
                                    >
                                        Wallet restart
                                    </button>
                                    {spinner}
                                </span>
                            </div>
                        </div>
                    </form>
                    <div className="row payment_result__btn-row">
                        <div className="col-xs-12">
                            <button
                                type="button"
                                className="button button__link text-uppercase button__side-padding50"
                                onClick={this.closeModal}
                                disabled={this.state.rebuilding}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
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
