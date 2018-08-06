import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import NotificationSystem from "react-notification-system";

import { notificationsActions as actions } from "modules/notifications";

class Notifications extends Component {
    componentWillReceiveProps(nextProps) {
        const { dispatch } = this.props;
        const { notifications } = nextProps;
        const notificationsUID = notifications.map(item => item.uid);
        const systemNotifications = this.notificationSystem.state.notifications || [];

        if (notifications.length > 0) {
            systemNotifications.forEach((item) => {
                if (notificationsUID.indexOf(item.uid) < 0) {
                    this.notificationSystem.removeNotification(item.uid);
                }
            });
            notifications.forEach((item) => {
                this.notificationSystem.addNotification({
                    ...item,
                    onRemove: () => {
                        dispatch(actions.hideNotification(item.uid));
                        item.onRemove && item.onRemove();
                    },
                });
            });
        }

        if ((this.props.notifications !== notifications) && notifications.length === 0) {
            this.notificationSystem.clearNotifications();
        }
    }

    shouldComponentUpdate(nextProps) {
        return this.props !== nextProps;
    }

    render() {
        const { notifications, ...rest } = this.props;

        return (
            <NotificationSystem
                ref={(ref) => {
                    this.notificationSystem = ref;
                }}
                {...rest}
            />
        );
    }
}

Notifications.propTypes = {
    dispatch: PropTypes.func.isRequired,
    notifications: PropTypes.arrayOf(PropTypes.shape),
};

export default connect(null)(Notifications);
