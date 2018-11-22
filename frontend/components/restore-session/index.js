import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Tooltip from "rc-tooltip";
import { analytics, togglePasswordVisibility, validators, helpers } from "additional";
import ErrorFieldTooltip from "components/ui/error-field-tooltip";
import { push } from "react-router-redux";
import { WalletPath } from "routes";
import { error } from "modules/notifications";
import { authOperations as operations, authTypes as types } from "modules/auth";
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

    handleLogin = async (e) => {
        e.preventDefault();
    };

    render() {
        const disabled = this.state.processing;
        return (
            <form onSubmit={this.handleLogin}>
                <div className="home__title">
                    The session has been expired!
                </div>
                <div className="home__subtitle text-center">
                    You didn&apos;t make any actions for 15 minutes.<br />
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
                <div className="row signup">
                    <div className="col-xs-12 home__restore">
                        <div className="home__logout-block text-right">
                            <button
                                type="button"
                                className="button button__link signup__link"
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
    initStatus: PropTypes.string,
    isIniting: PropTypes.bool,
    lndBlocks: PropTypes.number.isRequired,
    lndBlocksOnLogin: PropTypes.number.isRequired,
    lndSyncedToChain: PropTypes.bool,
    networkBlocks: PropTypes.number.isRequired,
};

const mapStateToProps = state => ({
    initStatus: state.lnd.initStatus,
    isIniting: state.account.isIniting,
    lndBlocks: state.lnd.lndBlocks,
    lndBlocksOnLogin: state.lnd.lndBlocksOnLogin,
    lndSyncedToChain: state.lnd.lndSyncedToChain,
    networkBlocks: state.lnd.networkBlocks,
});

export default connect(mapStateToProps)(RestoreSession);
