import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics, togglePasswordVisibility, validators, helpers, logger } from "additional";
import { appOperations } from "modules/app";
import ErrorFieldTooltip from "components/ui/error-field-tooltip";
import { push } from "react-router-redux";
import { WalletPath } from "routes";
import { error } from "modules/notifications";
import { statusCodes } from "config";
import { USERNAME_MAX_LENGTH } from "config/consts";

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
            return statusCodes.EXCEPTION_PASSWORD_MISMATCH;
        }
        if (!restorePass) {
            return statusCodes.EXCEPTION_FIELD_IS_REQUIRED;
        } else if (helpers.hash(restorePass) !== password) {
            return statusCodes.EXCEPTION_PASSWORD_MISMATCH;
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
        dispatch(push(WalletPath));
    };

    render() {
        const disabled = this.state.processing;
        return (
            <form onSubmit={this.handleRestore}>
                <div className="home__title">
                    The session has been expired!
                </div>
                <div className="home__subtitle text-center">
                    You haven&apos;t performed any action for 15 minutes.<br />
                    Due to security reasons, you need to enter your password again.
                </div>
                <div className="row mt-14">
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
                <div className="row spinner__wrapper mt-30">
                    <div className="col-xs-12">
                        <button
                            type="submit"
                            className="button button__orange button__fullwide"
                            disabled={disabled}
                        >
                            Restore session
                        </button>
                        {disabled ? spinner : null}
                    </div>
                </div>
                <div className="row logout">
                    <div className="col-xs-12 home__logout">
                        <div className="text-right">
                            <button
                                type="button"
                                className="button button__link button__link--logout home__logout-button"
                                onClick={this.handleLogout}
                                disabled={disabled}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </form>
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
