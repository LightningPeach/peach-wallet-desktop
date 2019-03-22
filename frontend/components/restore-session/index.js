import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { push } from "react-router-redux";

import { analytics, togglePasswordVisibility, validators, helpers, logger } from "additional";
import { appOperations } from "modules/app";
import { authActions, authTypes } from "modules/auth";
import { error } from "modules/notifications";
import { exceptions, routes, consts } from "config";

import ErrorFieldTooltip from "components/ui/error-field-tooltip";

const spinner = <div className="spinner" />;

class RestoreSession extends Component {
    constructor(props) {
        super(props);
        this.state = {
            passwordError: null,
            processing: false,
        };
        analytics.pageview("/restore-session", "Restore session");
    }

    _validatePassword = (restorePass) => {
        const { password } = this.props;
        if (!password) {
            logger.error("User password not found in store");
            return exceptions.PASSWORD_MISMATCH;
        }
        if (!restorePass) {
            return exceptions.FIELD_IS_REQUIRED;
        } else if (helpers.hash(restorePass) !== password) {
            return exceptions.PASSWORD_MISMATCH;
        }
        return null;
    };

    handleLogout = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Session", category: "Auth", label: "Logout" });
        dispatch(appOperations.openLogoutModal());
    };

    handleRestore = (e) => {
        e.preventDefault();
        analytics.event({ action: "Session", category: "Auth", label: "Restore" });
        this.setState({ processing: true });
        const { dispatch } = this.props;
        const password = this.password.value.trim();
        const passwordError = this._validatePassword(password);

        if (passwordError) {
            this.setState({ passwordError, processing: false });
            return;
        }
        this.setState({ passwordError });
        dispatch(authActions.setSessionStatus(authTypes.SESSION_ACTIVE));
        dispatch(push(routes.WalletPath));
    };

    render() {
        const disabled = this.state.processing;
        return (
            <Fragment>
                <div className="row row--no-col justify-center-xs">
                    <div className="block__title">
                        The session has been expired!
                    </div>
                </div>
                <div className="block__row-lg row--no-col justify-center-xs">
                    <div className="block__subheader">
                        You haven&apos;t performed any action for&nbsp;
                        {helpers.formatTimeRange(consts.SESSION_EXPIRE_TIMEOUT)}.<br />
                        Due to security reasons, you need to enter your password again.
                    </div>
                </div>
                <form className="form form--home" onSubmit={this.handleRestore}>
                    <div className="block__row">
                        <div className="col-xs-12">
                            <div className="form-label">
                                <label htmlFor="password">
                                    Password
                                </label>
                            </div>
                        </div>
                        <div className="col-xs-12">
                            <input
                                id="password"
                                className={`form-text form-text--icon_eye ${this.state.passwordError ?
                                    "form-text__error" :
                                    ""}`}
                                name="password"
                                type="password"
                                placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;"
                                ref={(ref) => {
                                    this.password = ref;
                                }}
                                disabled={disabled}
                                onChange={() => { this.setState({ passwordError: null }) }}
                            />
                            <i
                                className="form-text__icon form-text__icon--eye form-text__icon--eye_open"
                                onClick={togglePasswordVisibility}
                            />
                            <ErrorFieldTooltip text={this.state.passwordError} />
                        </div>
                    </div>
                    <div className="block__row-lg">
                        <div className="col-xs-12">
                            <button
                                type="submit"
                                className="button button__solid button--fullwide"
                                disabled={disabled}
                            >
                                Restore session
                            </button>
                            {disabled ? spinner : null}
                        </div>
                    </div>
                    <div className="block__row row--no-col justify-end-xs">
                        <button
                            type="button"
                            className="link link--red link--logout"
                            onClick={this.handleLogout}
                            disabled={disabled}
                        >
                            Switch to another wallet
                        </button>
                    </div>
                </form>
            </Fragment>
        );
    }
}

RestoreSession.propTypes = {
    dispatch: PropTypes.func.isRequired,
    password: PropTypes.string,
};

const mapStateToProps = state => ({
    password: state.auth.password,
});

export default connect(mapStateToProps)(RestoreSession);
