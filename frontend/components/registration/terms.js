import React, { Component, Fragment } from "react";
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
        const { dispatch } = this.props;
        dispatch(accountActions.setAnalyticsMode(accountTypes.ANALYTICS_MODE.PENDING));
        dispatch(accountActions.setTermsMode(accountTypes.TERMS_MODE.PENDING));
        dispatch(operations.setAuthStep(types.REGISTRATION_STEP_INIT));
        dispatch(lndOperations.clearLndData());
        dispatch(accountActions.finishInitAccount());
    };

    submitTerms = () => {
        const { dispatch } = this.props;
        const analytics =
            this.state.analytics ? accountTypes.ANALYTICS_MODE.ENABLED : accountTypes.ANALYTICS_MODE.DISABLED;
        dispatch(accountActions.setAnalyticsMode(analytics));
        dispatch(accountActions.setTermsMode(accountTypes.TERMS_MODE.ACCEPTED));
        dispatch(operations.setAuthStep(types.REGISTRATION_STEP_WALLET_MODE));
    };

    render() {
        return (
            <Fragment>
                <div className="row row--no-col justify-center-xs">
                    <div className="block__title">
                        Create a new wallet
                    </div>
                </div>
                <div className="legal__wrapper">
                    <div className="block__row-lg">
                        <div className="col-xs-12">
                            <Legal />
                        </div>
                    </div>
                    <div className="block__row">
                        <div className="col-xs-12">
                            <label className="form-checkbox">
                                <input
                                    id="eula-agreement-checkbox"
                                    name="terms"
                                    type="checkbox"
                                    checked={this.state.terms}
                                    onChange={this.onChange}
                                />
                                <span className="form-checkbox__label">
                                    (Required) I accept the Terms and Privacy Policy
                                </span>
                            </label>
                        </div>
                    </div>
                    <div className="block__row-sm">
                        <div className="col-xs-12">
                            <label className="form-checkbox">
                                <input
                                    id="ga-agreement-checkbox"
                                    name="analytics"
                                    type="checkbox"
                                    checked={this.state.analytics}
                                    onChange={this.onChange}
                                />
                                <span className="form-checkbox__label">
                                    (Optional) I agree to anonymized app analytics
                                </span>
                            </label>
                        </div>
                    </div>
                    <div className="block__row-lg">
                        <div className="col-xs-12 col-md-6">
                            <button
                                type="button"
                                className="button button__solid button__solid--transparent button--fullwide"
                                onClick={this.goBack}
                            >
                                Back
                            </button>
                        </div>
                        <div className="col-xs-12 col-md-6">
                            <button
                                type="button"
                                className="button button__solid button--fullwide"
                                onClick={this.submitTerms}
                                disabled={!this.state.terms}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </Fragment>
        );
    }
}

Terms.propTypes = {
    analytics: PropTypes.oneOf(accountTypes.ANALYTICS_MODES_LIST),
    dispatch: PropTypes.func.isRequired,
    terms: PropTypes.PropTypes.oneOf(accountTypes.TERMS_MODES_LIST),
};

const mapStateToProps = state => ({
    analytics: state.account.analyticsMode,
    terms: state.account.termsMode,
});

export default connect(mapStateToProps)(Terms);
