import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { analytics } from "additional";
import { WalletPath } from "routes";
import { appOperations } from "modules/app";
import { accountTypes } from "modules/account";

import Modal from "components/modal";
import PrivacyModeComponent from "components/privacy-mode";

class PrivacyMode extends Component {
    constructor(props) {
        super(props);

        analytics.pageview(`${WalletPath}/update-privacy-mode`, "Privacy mode choose window");
    }

    onClose = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Close modal", category: "Wallet", label: "Privacy Mode" });
        dispatch(appOperations.closeModal());
    };

    render() {
        const { privacyMode } = this.props;
        return (
            <Modal
                title="Wallet Privacy Mode"
                onClose={privacyMode !== accountTypes.PRIVACY_MODE.PENDING ? this.onClose : null}
                showCloseButton={privacyMode !== accountTypes.PRIVACY_MODE.PENDING}
            >
                <div className="modal-body">
                    <PrivacyModeComponent callback={type => this.onClose(`Choose mode ${type}`)} />
                </div>
            </Modal>
        );
    }
}

PrivacyMode.propTypes = {
    dispatch: PropTypes.func.isRequired,
    privacyMode: PropTypes.oneOf([
        accountTypes.PRIVACY_MODE.EXTENDED,
        accountTypes.PRIVACY_MODE.INCOGNITO,
        accountTypes.PRIVACY_MODE.PENDING,
    ]),
};

const mapStateToProps = state => ({
    privacyMode: state.account.privacyMode,
});

export default connect(mapStateToProps)(PrivacyMode);
