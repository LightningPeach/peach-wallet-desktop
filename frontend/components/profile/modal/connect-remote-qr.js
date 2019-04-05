import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import QRCode from "qrcode";

import { appOperations } from "modules/app";
import { accountOperations } from "modules/account";
import { helpers, logger, analytics } from "additional";
import { authOperations } from "modules/auth";
import { statusCodes, routes } from "config";

import Modal from "components/modal";

class ConnectRemoteQR extends Component {
    constructor(props) {
        super(props);
        this.state = {
            // not in store for more security
            qrRemoteAccessString: null,
        };
        analytics.pageview(`${routes.ProfileFullPath}/connect-remote-qr`, "QR for remote connect");
    }

    componentDidMount() {
        this.getRemoteAccressString();
    }
    getRemoteAccressString = async () => {
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
                theme="wallet-mode body-20"
            >
                <div className="modal__body">
                    <div className="row">
                        <div className="col-xs-12 text-center">
                            You can connect the Peach mobile wallet to this desktop
                            node by scanning the QR code on this screen.
                        </div>
                    </div>
                    <div className="block__row-lg">
                        <div className="col-xs-12">
                            <div className="row card__row align-stretch-xs">
                                <div className="col-xs-12 col-md-6 card__col">
                                    <div className="card card--qr">
                                        <img
                                            className="card__image"
                                            src={this.state.qrRemoteAccessString}
                                            alt="QR"
                                        />
                                        <div className="block__row-xs justify-center-xs">
                                            <button
                                                type="button"
                                                className="link text-bold"
                                                onClick={this.generateNewQR}
                                            >
                                                Generate new QR
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-xs-12 col-md-6 card__col">
                                    <div className="row">
                                        <div className="col-xs-12">
                                            Please follow these 3 steps to connect:
                                        </div>
                                    </div>
                                    <div className="block__row-xs">
                                        <div className="col-xs-12">
                                            <ul className="list list--disc">
                                                <li className="list__item">
                                                    You need to have public IP address
                                                </li>
                                                <li className="list__item">
                                                    You need to set up port forwarding on your router for port 10014.
                                                    Keep the same port number both externally and internally
                                                </li>
                                                <li className="list__item">
                                                    Finally, you need to generate new QR code being located on the same
                                                    network with the router
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="block__row-xs">
                                        <div className="col-xs-12">
                                            The desktop node will be available as long as the wallet application is
                                            active and the computer is online. If your external IP changes on the
                                            desktop, you will need to reconnect the mobile application using a new QR
                                            code.
                                        </div>
                                    </div>
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
