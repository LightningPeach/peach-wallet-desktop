import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { appOperations } from "modules/app";
import { accountOperations } from "modules/account";
import { helpers, logger } from "additional";
import { authOperations } from "modules/auth";
import Modal from "components/modal";
import QRCode from "qrcode";
import { statusCodes } from "config";

class ConnectRemoteQR extends Component {
    constructor(props) {
        super(props);
        this.state = {
            // not in store for more security
            qrRemoteAccessString: null,
        };
    }

    componentWillMount = async () => {
        console.log("Will mount");
        const response = await this.props.dispatch(accountOperations.getRemoteAccressString());
        console.log("Got remote access string: ", response);
        if (response.ok) {
            const qr = await QRCode.toDataURL(response.response.remoteAccessString);
            console.log("Got remote access string: ", response.response.remoteAccessString);
            this.setState({
                qrRemoteAccessString: qr,
            });
        }
    };

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

    generateNewQR = async (e) => {
        e.preventDefault();
        const { dispatch, login } = this.props;
        const password = this.password.value.trim();
        const passwordError = this._validatePassword(password);
        console.log("Password error:", passwordError);
        if (passwordError) {
            return;
        }
        const logout = await dispatch(accountOperations.logout(false, false));
        await dispatch(accountOperations.rebuildCertificate());
        console.log("Will dispatch login with pass and login", password, login);

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        await sleep(10 * 1000);
        await window.ipcClient("loadLndPath", { login });
        const init = await dispatch(authOperations.login(login, password));
        dispatch(accountOperations.initAccount());
    };

    closeModal = () => {
        const { dispatch } = this.props;
        dispatch(appOperations.closeModal());
    };

    render() {
        return (
            <Modal onClose={this.closeModal} styleSet="legal" showCloseButton>
                <div className="modal-body">
                    <div className="row">
                        <div className="col-xs-12">
                            <img className="qr-connect" src={this.state.qrRemoteAccessString} alt="QR" />
                        </div>
                    </div>
                </div>
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
                            />
                        </div>
                    </div>
                </form>
                <div className="modal-footer">
                    <div className="row">
                        <div className="col-xs-12 text-left">
                            <button
                                type="button"
                                className="button button__orange"
                                onClick={this.generateNewQR}
                            >
                                Generate new QR
                            </button>
                        </div>
                        <div className="col-xs-12 text-right">
                            <button
                                type="button"
                                className="button button__orange button__close"
                                onClick={this.closeModal}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

ConnectRemoteQR.propTypes = {
    dispatch: PropTypes.func.isRequired,
    login: PropTypes.string.isRequired,
    password: PropTypes.string,
};

const mapStateToProps = state => ({
    login: state.account.login,
    password: state.auth.password,
});

export default connect(mapStateToProps)(ConnectRemoteQR);
