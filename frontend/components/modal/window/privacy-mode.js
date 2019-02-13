import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { analytics } from "additional";
import { WalletPath } from "routes";
import { appOperations } from "modules/app";

import Modal from "components/modal";
import PrivacyModeComponent from "components/privacy-mode";

class PrivacyMode extends Component {
    constructor(props) {
        super(props);

        analytics.pageview(`${WalletPath}/update-privacy-mode`, "Privacy mode choose window");
    }

    onClose = (action) => {
        const { dispatch } = this.props;
        analytics.event({ action: action || "Close modal", category: "Wallet", label: "Privacy Mode" });
        dispatch(appOperations.closeModal());
    };

    render() {
        return (
            <Modal
                title="Wallet Privacy Mode"
                onClose={this.onClose}
                showCloseButton
            >
                <div className="modal-body">
                    <PrivacyModeComponent callback={(type) => this.onClose(`Choose mode ${type}`)} />
                </div>
            </Modal>
        );
    }
}

PrivacyMode.propTypes = {
    dispatch: PropTypes.func.isRequired,
};

export default connect()(PrivacyMode);
