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
            <Modal onClose={this.closeModal} styleSet="legal" showCloseButton>
                <div className="modal-body">
                    <div className="row">
                        <div className="col-xs-12">
                            <img className="qr-connect" src={this.state.qrRemoteAccessString} alt="QR" />
                        </div>
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
};

export default connect(null)(ConnectRemoteQR);
