import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { analytics } from "additional";
import { appOperations } from "modules/app";
import { accountOperations, accountTypes } from "modules/account";
import { routes } from "config";

import Modal from "components/modal";
import Checkbox from "components/ui/checkbox";

class SystemNotifications extends Component {
    constructor(props) {
        super(props);

        this.state = {
            showAgain: true,
        };

        analytics.pageview(`${routes.HomePath}/enable-system-notifications`, "Set system notifications status");
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
        dispatch(accountOperations
            .setSystemNotificationsStatus(accountTypes.NOTIFICATIONS.ENABLED_LOUD_DONT_SHOW_AGAIN));
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
            dispatch(accountOperations
                .setSystemNotificationsStatus(accountTypes.NOTIFICATIONS.DISABLED_LOUD_SHOW_AGAIN));
        } else {
            analytics.event({
                action: "System Notifications Modal",
                category: "Modal Windows",
                label: "Disable notifications, never ask again",
            });
            dispatch(accountOperations
                .setSystemNotificationsStatus(accountTypes.NOTIFICATIONS.DISABLED_LOUD_DONT_SHOW_AGAIN));
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
            <Modal title="System Notifications" theme="small" onClose={this.closeModal} showCloseButton>
                <div className="modal__body">
                    <div className="row">
                        <div className="col-xs-12">
                            Would you like to enable system notifications? You can change that in settings later
                        </div>
                    </div>
                    <div className="block__row">
                        <div className="col-xs-12">
                            <Checkbox
                                text="Never ask this question again"
                                checked={!this.state.showAgain}
                                onChange={this.toggleShowAgain}
                            />
                        </div>
                    </div>
                </div>
                <div className="modal__footer">
                    <div className="row">
                        <div className="col-xs-12">
                            <button
                                className="button button__solid button--fullwide"
                                type="button"
                                onClick={this.resolveNotifications}
                            >
                                Enable
                            </button>
                        </div>
                    </div>
                    <div className="block__row-xs">
                        <div className="col-xs-12">
                            <button
                                className="button button__solid button__solid--transparent button--fullwide"
                                type="button"
                                onClick={this.rejectNotifications}
                            >
                                Disable
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
