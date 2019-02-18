import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { accountActions, accountTypes } from "modules/account";
import { authOperations as operations, authTypes as types } from "modules/auth";
import { lndOperations } from "modules/lnd";

import Legal from "components/legal";

class Terms extends Component {
    constructor(props) {
        super(props);

        this.state = {
            analytics: props.analytics === accountTypes.ANALYTICS_MODE.ENABLED || false,
            terms: props.terms === accountTypes.TERMS_MODE.ACCEPTED || false,
        };
    }

    onChange = (e) => {
        this.setState({ [e.target.name]: e.target.checked });
    };

    goBack = () => {
        const { dispatch, method } = this.props;
        dispatch(operations.setAuthStep(method === types.RESTORE_TYPE_SEED
            ? types.RESTORE_STEP_USER_PASS
            : types.RESTORE_STEP_USE_WALLET_DATA));
    };

    submitTerms = () => {
        const { dispatch } = this.props;
        const analytics =
            this.state.analytics ? accountTypes.ANALYTICS_MODE.ENABLED : accountTypes.ANALYTICS_MODE.DISABLED;
        dispatch(accountActions.setAnalyticsMode(analytics));
        dispatch(accountActions.setTermsMode(accountTypes.TERMS_MODE.ACCEPTED));
        dispatch(operations.setAuthStep(types.RESTORE_STEP_PRIVACY_MODE));
    };

    render() {
        return (
            <div>
                <div className="home__title">
                    Sign up and start working with Peach Wallet
                </div>
                <div className="row">
                    <div className="col-xs-12">
                        <Legal />
                    </div>
                    <div className="col-xs-12 mt-16">
                        <label className="form-checkbox label_line pull-left">
                            <input
                                id="eula-agreement-checkbox"
                                name="terms"
                                type="checkbox"
                                checked={this.state.terms}
                                onChange={this.onChange}
                            />
                            <span className="form-checkbox__label">I accept the agreement</span>
                        </label>
                    </div>
                    <div className="col-xs-12">
                        <label className="form-checkbox label_line pull-left channels__custom">
                            <input
                                id="ga-agreement-checkbox"
                                name="analytics"
                                type="checkbox"
                                checked={this.state.analytics}
                                onChange={this.onChange}
                            />
                            <span className="form-checkbox__label">I agree to the personal data processing</span>
                        </label>
                    </div>
                </div>
                <div className="row mt-30">
                    <div className="col-xs-12">
                        <button
                            type="button"
                            className="button button__orange button__fullwide"
                            onClick={this.submitTerms}
                            disabled={!this.state.terms}
                        >
                            Next
                        </button>
                    </div>
                    <div className="col-xs-12 text-center">
                        <button
                            type="button"
                            className="button button__link button__under-button"
                            onClick={this.goBack}
                        >
                            Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

Terms.propTypes = {
    analytics: PropTypes.oneOf([
        accountTypes.ANALYTICS_MODE.DISABLED,
        accountTypes.ANALYTICS_MODE.ENABLED,
        accountTypes.ANALYTICS_MODE.PENDING,
    ]),
    dispatch: PropTypes.func.isRequired,
    method: PropTypes.PropTypes.oneOf([
        types.RESTORE_TYPE_SEED,
        types.RESTORE_TYPE_FOLDER,
    ]).isRequired,
    terms: PropTypes.PropTypes.oneOf([
        accountTypes.TERMS_MODE.ACCEPTED,
        accountTypes.TERMS_MODE.PENDING,
    ]),
};

const mapStateToProps = state => ({
    analytics: state.account.analyticsMode,
    terms: state.account.termsMode,
});

export default connect(mapStateToProps)(Terms);
