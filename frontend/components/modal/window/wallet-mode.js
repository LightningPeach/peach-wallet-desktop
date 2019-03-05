import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { analytics } from "additional";
import { WalletPath } from "routes";
import { appOperations } from "modules/app";
import { accountTypes } from "modules/account";

import Modal from "components/modal";
import WalletModeComponent from "components/wallet-mode";

class WalletMode extends Component {
    constructor(props) {
        super(props);

        analytics.pageview(`${WalletPath}/update-wallet-mode`, "Wallet mode choose window");
    }

    onClose = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Close modal", category: "Wallet", label: "Choose Wallet Mode" });
        dispatch(appOperations.closeModal());
    };

    render() {
        const { walletMode } = this.props;
        return (
            <Modal
                title="Wallet Privacy Mode"
                onClose={walletMode !== accountTypes.WALLET_MODE.PENDING ? this.onClose : null}
                showCloseButton={walletMode !== accountTypes.WALLET_MODE.PENDING}
            >
                <div className="modal-body">
                    <WalletModeComponent callback={type => this.onClose(`Choose mode ${type}`)} />
                </div>
            </Modal>
        );
    }
}

WalletMode.propTypes = {
    dispatch: PropTypes.func.isRequired,
    walletMode: PropTypes.oneOf([
        accountTypes.WALLET_MODE.EXTENDED,
        accountTypes.WALLET_MODE.STANDARD,
        accountTypes.WALLET_MODE.PENDING,
    ]),
};

const mapStateToProps = state => ({
    walletMode: state.account.walletMode,
});

export default connect(mapStateToProps)(WalletMode);
