import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics } from "additional";
import { appOperations } from "modules/app";
import { accountOperations } from "modules/account";
import { ProfileFullPath } from "routes";
import Modal from "components/modal";

class ConfirmLogout extends Component {
    constructor(props) {
        super(props);
        this.state = {
            processing: false,
        };

        analytics.pageview(`${ProfileFullPath}/logout`, "Logout");
    }

    closeModal = () => {
        const { dispatch } = this.props;
        if (this.state.processing) {
            return;
        }
        analytics.event({ action: "Logout Modal", category: "Profile", label: "Cancel" });
        dispatch(appOperations.closeModal());
    };

    logout = async (e) => {
        const { dispatch } = this.props;
        analytics.event({ action: "Logout Modal", category: "Profile", label: e.target.innerText });
        dispatch(accountOperations.logout());
    };

    render() {
        return (
            <Modal title="Log out" onClose={this.closeModal}>
                <div className="modal-body">
                    <div className="row form-row">
                        <div className="col-xs-12 channel-close__text">
                            Are you sure you want to log out?
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <div className="row">
                        <div className="col-xs-12 text-right">
                            <button
                                type="button"
                                id="cancel-logout-button"
                                className="button button__link text-uppercase"
                                onClick={this.closeModal}
                                disabled={this.state.processing}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                id="confirm-logout-button"
                                className="button button__orange button__close"
                                onClick={this.logout}
                                disabled={this.state.processing}
                            >
                                Log out
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

ConfirmLogout.propTypes = {
    dispatch: PropTypes.func.isRequired,
};

export default connect(null)(ConfirmLogout);
