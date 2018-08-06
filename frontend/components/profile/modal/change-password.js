import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics, validators } from "additional";
import { appOperations } from "modules/app";
import ErrorFieldTooltip from "components/ui/error_field_tooltip";
import { info } from "modules/notifications";
import { ProfileFullPath } from "routes";
import Modal from "components/modal";

class ChangePassword extends Component {
    constructor(props) {
        super(props);
        this.closeModal = this.closeModal.bind(this);
        this.changePassword = this.changePassword.bind(this);
        this.state = {
            confPasswordError: null,
            newPasswordError: null,
            oldPasswordError: null,
        };

        analytics.pageview(`${ProfileFullPath}/change-password`, "Change Password");
    }

    closeModal() {
        const { dispatch } = this.props;
        analytics.event({ action: "Change Password Modal", category: "Profile", label: "Back" });
        dispatch(appOperations.closeModal());
    }

    async changePassword(event) {
        event.preventDefault();
        const { dispatch } = this.props;
        analytics.event({ action: "Change Password Modal", category: "Profile", label: "Change" });
        const oldPassword = this.old_password.value.trim();
        const newPassword = this.new_password.value.trim();
        const confPassword = this.conf_new_password.value.trim();
        const oldPasswordError = validators.validatePass(oldPassword);
        const newPasswordError =
            validators.validatePass(newPassword) ||
            validators.validatePassDiff(oldPassword, newPassword);
        const confPasswordError =
            validators.validatePass(confPassword) ||
            validators.validatePassMismatch(newPassword, confPassword);

        if (oldPasswordError || newPasswordError || confPasswordError) {
            this.setState({
                confPasswordError,
                newPasswordError,
                oldPasswordError,
            });
            return;
        }
        this.setState({
            confPasswordError,
            newPasswordError,
            oldPasswordError,
        });
        dispatch(info({ message: "Password updated" }));
        this.closeModal();
    }

    render() {
        return (
            <Modal title="Change password" onClose={this.closeModal}>
                <form onSubmit={this.changePassword}>
                    <div className="modal-body">
                        <div className="row form-row">
                            <div className="col-xs-12">
                                <div className="form-label">
                                    <label htmlFor="old_password">
                                        Old password
                                    </label>
                                </div>
                            </div>
                            <div className="col-xs-12">
                                <input
                                    id="old_password"
                                    className={`form-text ${this.state.oldPasswordError ? "form-text__error" : ""}`}
                                    name="old_password"
                                    placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;"
                                    ref={(input) => {
                                        this.old_password = input;
                                    }}
                                    onChange={() => this.setState({ oldPasswordError: null })}
                                    type="password"
                                />
                                <ErrorFieldTooltip text={this.state.oldPasswordError} />
                            </div>
                        </div>
                        <div className="row form-row">
                            <div className="col-xs-12">
                                <div className="form-label">
                                    <label htmlFor="new_password">
                                        New password
                                    </label>
                                </div>
                            </div>
                            <div className="col-xs-12">
                                <input
                                    id="new_password"
                                    className={`form-text ${this.state.newPasswordError ? "form-text__error" : ""}`}
                                    name="new_password"
                                    placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;"
                                    ref={(input) => {
                                        this.new_password = input;
                                    }}
                                    onChange={() => this.setState({ newPasswordError: null })}
                                    type="password"
                                />
                                <ErrorFieldTooltip text={this.state.newPasswordError} />
                            </div>
                        </div>
                        <div className="row form-row">
                            <div className="col-xs-12">
                                <div className="form-label">
                                    <label htmlFor="conf_new_password">
                                        Confirm password
                                    </label>
                                </div>
                            </div>
                            <div className="col-xs-12">
                                <input
                                    id="conf_new_password"
                                    className={`form-text ${this.state.confPasswordError ? "form-text__error" : ""}`}
                                    name="conf_new_password"
                                    placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;"
                                    ref={(input) => {
                                        this.conf_new_password = input;
                                    }}
                                    onChange={() => this.setState({ confPasswordError: null })}
                                    type="password"
                                />
                                <ErrorFieldTooltip text={this.state.confPasswordError} />
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <div className="row">
                            <div className="col-xs-12 text-right">
                                <button
                                    className="button button__link text-uppercase"
                                    type="button"
                                    onClick={this.closeModal}
                                >
                                    Back
                                </button>
                                <button
                                    className="button button__orange button__create"
                                    type="submit"
                                >
                                    CHANGE
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>
        );
    }
}

ChangePassword.propTypes = {
    dispatch: PropTypes.func.isRequired,
};

export default connect()(ChangePassword);
