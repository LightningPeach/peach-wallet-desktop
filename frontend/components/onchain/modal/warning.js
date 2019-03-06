import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics } from "additional";
import { appOperations } from "modules/app";
import { OnchainFullPath } from "routes";
import Modal from "components/modal";
import { onChainOperations as operations } from "modules/onchain";

class OnchainWarning extends Component {
    constructor(props) {
        super(props);

        analytics.pageview(`${OnchainFullPath}/address-warning`, "Attention. Address Warning");
    }

    closeModal = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Onchain Warning Modal", category: "Onchain", label: "Cancel" });
        dispatch(appOperations.closeModal());
    };

    sendPayment = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Warning Modal", category: "Onchain", label: "Send payment" });
        dispatch(operations.openSendCoinsModal());
    };

    render() {
        return (
            <Modal title="Attention!" onClose={this.closeModal} showCloseButton>
                <div className="modal__body">
                    <div className="row">
                        <div className="col-xs-12">
                            Recipient address looks like Lightning Id address instead of bitcoin address.
                        </div>
                    </div>
                </div>
                <div className="modal__footer">
                    <div className="row">
                        <div className="col-xs-12">
                            <button
                                type="button"
                                className="button button__solid"
                                onClick={this.sendPayment}
                            >
                                I&rsquo;m sure, take me to details.
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

OnchainWarning.propTypes = {
    dispatch: PropTypes.func.isRequired,
};

export default connect()(OnchainWarning);
