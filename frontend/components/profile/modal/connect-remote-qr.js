import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import QRCode from "qrcode";
import { appOperations } from "modules/app";
import { accountOperations } from "modules/account";
import { helpers, logger, analytics } from "additional";
import { authOperations } from "modules/auth";
import Modal from "components/modal";
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
        const response = await this.props.dispatch(accountOperations.getRemoteAccressString());
        if (response.ok) {
            const qrRemoteAccessString = await QRCode.toDataURL(response.response.remoteAccessString);
            this.setState({
                qrRemoteAccessString,
            });
        }
    };

    generateNewQR = async () => {
        analytics.event({
            action: "Generate new QR",
            category: "Profile",
        });
        this.props.dispatch(appOperations.openPasswordRemoteQRModal());
    };

    closeModal = () => {
        const { dispatch } = this.props;
        dispatch(appOperations.closeModal());
    };

    render() {
        return (
            <Modal
                title="Mobile wallet access"
                onClose={this.closeModal}
                showCloseButton
                theme="wallet-mode"
            >
                <div className="modal-body">
                    <div className="raw qr-raw">
                        <div className="col-xs-12 text-center">
                            You can connect the Peach mobile wallet to this desktop
                            node by scanning the QR code on this screen.
                        </div>
                    </div>
                    <div className="row card__row align-stretch-xs">
                        <div className="col-xs-12 col-md-6 card__col">
                            <div className="card__qr card__qr-container card__qr-description">
                                <img
                                    className="card__qr-container-image"
                                    src={this.state.qrRemoteAccessString}
                                    alt="QR"
                                />
                            </div>
                            <div className="raw">
                                <div className="col-xs-12 text-center">
                                    <button
                                        type="button"
                                        className="profile__button-label link"
                                        onClick={this.generateNewQR}
                                    >
                                        Generate new QR
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="card__col col-xs-12 col-md-6">
                            <div className="card__qr">
                                <div className="card__qr-description">
                                    Please follow these 3 steps to connect:
                                    <ul className="card__qr-description-list">
                                        <li className="card__qr-description-list-item">
                                            <div className="card__qr-description-list-item-icon">
                                                You need to have public IP address
                                            </div>
                                        </li>
                                        <li className="card__qr-description-list-item">
                                            <div className="card__qr-description-list-item-icon">
                                                You need to set up port forwarding on your<br />
                                                router for port 10014. Keep the same port<br />
                                                number both externally and internally
                                            </div>
                                        </li>
                                        <li className="card__qr-description-list-item">
                                            <div className="card__qr-description-list-item-icon">
                                                Finally, you need to generate new QR<br />
                                                code being located on the same network with the router
                                            </div>
                                        </li>
                                    </ul>
                                    The desktop node will be available as long as the<br />
                                    wallet application is active and the computer is<br />
                                    online. If your external IP changes on the desktop,<br />
                                    you will need to reconnect the mobile application<br />
                                    using a new QR code.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

ConnectRemoteQR.propTypes = {
    dispatch: PropTypes.func.isRequired,
};

export default connect(null)(ConnectRemoteQR);
