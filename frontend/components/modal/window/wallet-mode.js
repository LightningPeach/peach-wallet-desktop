import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { analytics } from "additional";
import { routes } from "config";
import { appOperations } from "modules/app";
import { accountTypes } from "modules/account";

import Modal from "components/modal";
import WalletModeComponent from "components/wallet-mode";

class WalletMode extends Component {
    constructor(props) {
        super(props);

        analytics.pageview(`${routes.WalletPath}/update-wallet-mode`, "Wallet mode choose window");
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
                title="Choose Wallet Privacy Mode"
                onClose={walletMode !== accountTypes.WALLET_MODE.PENDING ? this.onClose : null}
                showCloseButton={walletMode !== accountTypes.WALLET_MODE.PENDING}
                theme="wallet-mode"
            >
                <div className="modal__body">
                    <WalletModeComponent callback={type => this.onClose(`Choose mode ${type}`)} />
                </div>
            </Modal>
        );
    }
}

WalletMode.propTypes = {
    dispatch: PropTypes.func.isRequired,
    walletMode: PropTypes.oneOf(accountTypes.WALLET_MODES_LIST),
};

const mapStateToProps = state => ({
    walletMode: state.account.walletMode,
});

export default connect(mapStateToProps)(WalletMode);
