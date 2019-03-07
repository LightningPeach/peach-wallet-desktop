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
            processing: this.props.isLogouting || false,
        };

        analytics.pageview(`${ProfileFullPath}/logout`, "Logout");
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.isLogouting !== this.props.isLogouting) {
            this.setState({
                processing: nextProps.isLogouting || false,
            });
        }
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
        if (this.state.processing) {
            return;
        }
        analytics.event({ action: "Logout Modal", category: "Profile", label: e.target.innerText });
        dispatch(accountOperations.logout());
    };

    render() {
        return (
            <Modal title="Log out" onClose={this.closeModal} disabled={this.state.processing}>
                <div className="modal__body">
                    <div className="row">
                        <div className="col-xs-12 channel-close__text">
                            Are you sure you want to log out?
                        </div>
                    </div>
                </div>
                <div className="modal__footer">
                    <div className="row">
                        <div className="col-xs-12 text-right">
                            <button
                                type="button"
                                className="button button__link"
                                onClick={this.closeModal}
                                disabled={this.state.processing}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="button button__solid"
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
    isLogouting: PropTypes.bool,
};

const mapStateToProps = state => ({
    isLogouting: state.account.isLogouting,
});

export default connect(mapStateToProps)(ConfirmLogout);
