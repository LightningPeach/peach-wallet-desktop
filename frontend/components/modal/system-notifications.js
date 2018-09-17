import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics } from "additional";
import { appOperations } from "modules/app";
import { accountOperations, accountTypes } from "modules/account";
import { HomePath } from "routes";
import Modal from "components/modal";
import Checkbox from "components/ui/checkbox";

class SystemNotifications extends Component {
    constructor(props) {
        super(props);

        this.state = {
            showAgain: true,
        };

        analytics.pageview(`${HomePath}/enable-system-notifications`, "Set system notifications status");
    }

    closeModal = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "System Notifications Modal", category: "Modal Windows", label: "Cancel" });
        dispatch(appOperations.closeModal());
    };

    resolveNotifications = () => {
        const { dispatch } = this.props;
        analytics.event({
            action: "System Notifications Modal",
            category: "Modal Windows",
            label: "Enable notifications",
        });
        dispatch(accountOperations.setSystemNotificationsStatus(6));
        dispatch(appOperations.closeModal());
    };

    rejectNotifications = () => {
        const { dispatch } = this.props;
        if (this.state.showAgain) {
            analytics.event({
                action: "System Notifications Modal",
                category: "Modal Windows",
                label: "Disable notifications",
            });
            dispatch(accountOperations.setSystemNotificationsStatus(3));
        } else {
            analytics.event({
                action: "System Notifications Modal",
                category: "Modal Windows",
                label: "Disable notifications, never ask again",
            });
            dispatch(accountOperations.setSystemNotificationsStatus(2));
        }
        dispatch(appOperations.closeModal());
    };

    toggleShowAgain = () => {
        this.setState({
            showAgain: !this.state.showAgain,
        });
    };

    render() {
        return (
            <Modal title="System Notifications" onClose={this.closeModal} showCloseButton>
                <div className="modal-body modal-body-bottom30 text-left text-16">
                    <div className="row">
                        <div className="col-xs-12">
                            Would you like to enable system notifications?<br />
                            You can change that in settings later
                        </div>
                    </div>
                    <div className="row mt-12">
                        <div className="col-xs-12">
                            <Checkbox
                                text="Never ask this question again"
                                checked={!this.state.showAgain}
                                onChange={this.toggleShowAgain}
                                class="label_line channels__custom"
                            />
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <div className="row">
                        <div className="col-xs-12 text-right">
                            <button
                                className="button button__link text-uppercase"
                                type="button"
                                onClick={this.rejectNotifications}
                            >
                                Disable
                            </button>
                            <button
                                className="button button__orange button__create"
                                type="button"
                                onClick={this.resolveNotifications}
                            >
                                Enable
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

SystemNotifications.propTypes = {
    dispatch: PropTypes.func.isRequired,
};

export default connect()(SystemNotifications);
