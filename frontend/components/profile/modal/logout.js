import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { analytics } from "additional";
import { appOperations } from "modules/app";
import { accountOperations } from "modules/account";
import { routes } from "config";

import Modal from "components/modal";

class ConfirmLogout extends Component {
    constructor(props) {
        super(props);
        this.state = {
            processing: this.props.isLogouting || false,
        };

        analytics.pageview(`${routes.ProfileFullPath}/logout`, "Logout");
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
            <Modal
                title="Are you sure you want to switch to another wallet?"
                theme="small"
                onClose={this.closeModal}
                showCloseButton
            >
                <div className="modal__body">
                    <div className="row">
                        <div className="col-xs-12">
                            All data related to this wallet will be securely stored on your hard drive. You can always
                            switch back to this wallet without any data loss.
                        </div>
                    </div>
                </div>
                <div className="modal__footer">
                    <div className="row">
                        <div className="col-xs-12">
                            <span className="button__spinner">
                                <button
                                    type="button"
                                    className="button button__solid button--fullwide"
                                    onClick={this.logout}
                                    disabled={this.state.processing}
                                >
                                    Switch
                                </button>
                                {this.state.processing && <div className="spinner" />}
                            </span>
                        </div>
                    </div>
                    <div className="block__row-xs">
                        <div className="col-xs-12">
                            <button
                                type="button"
                                className="button button__solid button__solid--transparent button--fullwide"
                                onClick={this.closeModal}
                                disabled={this.state.processing}
                            >
                                Cancel
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
