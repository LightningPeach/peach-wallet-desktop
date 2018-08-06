import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { authTypes } from "modules/auth";
import Notifications from "components/notifications";
import Login from "components/login";
import Restore from "components/restore";
import Registration from "components/registration";
import DeepLinkLightning from "components/modal/deep-link-lightning";
import { appTypes } from "modules/app";

const HomePage = (props) => {
    const { currentForm, modalState, notifications } = props;
    let form;
    switch (currentForm) {
        case authTypes.RESTORE_FORM:
            form = <Restore />;
            break;
        case authTypes.REGISTRATION_FORM:
            form = <Registration />;
            break;
        case authTypes.LOGIN_FORM:
        default:
            form = <Login />;
            break;
    }
    let modal;
    switch (modalState) {
        case appTypes.DEEP_LINK_LIGHTNING_MODAL_STATE:
            modal = <DeepLinkLightning />;
            break;
        default:
            modal = null;
    }

    return (
        <section className="home">
            <div className="container home__container">
                <div className="row">
                    <div className="col-xs-12 home__logo">
                        <img src="public/assets/images/logo-black.svg" alt="" />
                    </div>
                </div>
                {form}
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
