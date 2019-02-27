import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { authTypes } from "modules/auth";
import Notifications from "components/notifications";
import Login from "components/login";
import Restore from "components/restore";
import Registration from "components/registration";
import RestoreSession from "components/restore-session";
import DeepLinkLightningModal from "components/modal/window/deep-link-lightning";
import ConfirmLogoutModal from "components/profile/modal/logout";
import { appTypes } from "modules/app";

const HomePage = (props) => {
    const { currentForm, modalState, notifications } = props;
    let form;
    switch (currentForm) {
        case authTypes.RESTORE_WALLET_FORM:
            form = <Restore />;
            break;
        case authTypes.REGISTRATION_FORM:
            form = <Registration />;
            break;
        case authTypes.RESTORE_SESSION_FORM:
            form = <RestoreSession />;
            break;
        case authTypes.LOGIN_FORM:
        default:
            form = <Login />;
            break;
    }
    let modal;
    switch (modalState) {
        case appTypes.DEEP_LINK_LIGHTNING_MODAL_STATE:
            modal = <DeepLinkLightningModal />;
            break;
        case appTypes.LOGOUT_MODAL_STATE:
            modal = <ConfirmLogoutModal />;
            break;
        default:
            modal = null;
    }

    return (
        <section className="home">
            <div className="container">
                <div className="column align-center-xs home__content">
                    <div className="home__logo" />
                    <div className="home__body">
                        {form}
                    </div>
                </div>
                <Notifications
                    notifications={notifications}
                    style={false} // eslint-disable-line
                />
                {modal}
            </div>
        </section>
    );
};

HomePage.propTypes = {
    currentForm: PropTypes.string.isRequired,
    modalState: PropTypes.string.isRequired,
    notifications: PropTypes.arrayOf(PropTypes.shape({ // eslint-disable-line
        autoDismiss: PropTypes.number,
        level: PropTypes.string.isRequired,
        message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
        position: PropTypes.string.isRequired,
        uid: PropTypes.any.isRequired,
    })),
};

const mapStateToProps = state => ({
    currentForm: state.auth.currentForm,
    modalState: state.app.modalState,
    notifications: state.notifications,
});

export default connect(mapStateToProps)(HomePage);
