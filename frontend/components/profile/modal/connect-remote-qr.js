import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { appOperations } from "modules/app";
import { accountOperations } from "modules/account";
import { helpers, logger, analytics } from "additional";
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
            title=""
            onClose={this.closeModal}
            showCloseButton={true}
            theme="wallet-mode"
        >
            <div className="modal-body">
                <div className="row card__row align-stretch-xs">
                    <div className="col-xs-12 col-md-6 card__col">
                        <div className="card__qr card__qr-container">
                            <img className="card__qr-container-image" src={this.state.qrRemoteAccessString} alt="QR" />
                        </div>
                    </div>
                    <div className="card__col col-xs-12 col-md-6">
                        <div className="card__qr">
                            <div className="card__qr-title">
                                    Mobile wallet access
                                </div>
                            <div className="card__qr-description">
                                    Using this QR code you can control your wallet remotely using the Peach Wallet mobile app.
                                    If your external IP changes on the desktop, you will need to reconnect the mobile app using a new QR code.
                                    <ul className="card__qr-description-list">
                                        <li className="card__qr-description-list-item">
                                            <div className="card__qr-description-list-item-icon">
                                                You need to have public IP address
                                            </div>
                                        </li>
                                        <li className="card__qr-description-list-item">
                                            <div className="card__qr-description-list-item-icon">
                                                Set up router for forwarding from external port 10014 to internal one 10014
                                            </div>
                                        </li>
                                        <li className="card__qr-description-list-item">
                                            <div className="card__qr-description-list-item-icon">
                                                After that you need to regenerate certificate locating within the same network with router
                                            </div>
                                        </li>
                                    </ul>
                                    A node will be available as long as wallet is active and PC is online.
                                </div>
                        </div>
                    </div>
                </div>
                <div className="raw">
                    <div className="col-xs-12 text-left">
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
        </Modal>
        );
    }
}

ConnectRemoteQR.propTypes = {
    dispatch: PropTypes.func.isRequired,
};

export default connect(null)(ConnectRemoteQR);
