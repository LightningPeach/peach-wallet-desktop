import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics } from "additional";
import { accountOperations } from "modules/account";
import { WalletPath } from "routes";
import Modal from "components/modal";

class ForceLogout extends Component {
    constructor(props) {
        super(props);

        analytics.pageview(`${WalletPath}/force-logout`, "Error. Force logout");
    }

    onClose = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Force Logout Modal", category: "Wallet", label: "Force Logout" });
        dispatch(accountOperations.logout());
    };

    render() {
        return (
            <Modal title="Some problem acquired" onClose={this.onClose} styleSet="error" showCloseButton>
                <div className="modal-body modal-body-bottom30 text-left text-16">
                    <div className="row">
                        <div className="col-xs-12 modal-body__error-message">
                            {this.props.forceLogoutError}
                        </div>
                        <div className="col-xs-12">
                            Please log in again
                        </div>
                    </div>
                </div>
                <div className="modal-footer text-right">
                    <div className="row">
                        <div className="col-xs-12">
                            <button
                                type="button"
                                className="button button__scarlett-two"
                                onClick={this.onClose}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

ForceLogout.propTypes = {
    dispatch: PropTypes.func.isRequired,
    forceLogoutError: PropTypes.string,
};

const mapStateToProps = state => ({
    forceLogoutError: state.app.forceLogoutError,
});

export default connect(mapStateToProps)(ForceLogout);
