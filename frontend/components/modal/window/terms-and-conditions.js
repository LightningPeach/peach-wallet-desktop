import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { appOperations } from "modules/app";
import { accountTypes, accountOperations } from "modules/account";

import Modal from "components/modal";
import Legal from "components/legal";

class Law extends Component {
    constructor(props) {
        super(props);

        this.state = {
            analytics: props.analytics || false,
            processing: false,
            terms: props.terms || false,
        };
    }

    onChange = (e) => {
        this.setState({ [e.target.name]: e.target.checked });
    };
    handleLogout = () => {
        const { dispatch } = this.props;
        if (this.state.processing) {
            return;
        }
        this.setState({
            processing: true,
        });
        dispatch(accountOperations.logout());
    };

    handleConfirm = () => {
        const { dispatch } = this.props;
        if (this.state.terms) {
            const analytics =
                this.state.analytics ? accountTypes.ANALYTICS_MODE.ENABLED : accountTypes.ANALYTICS_MODE.DISABLED;
            dispatch(accountOperations.setAnalyticsMode(analytics));
            dispatch(accountOperations.setTermsMode(accountTypes.TERMS_MODE.ACCEPTED));
            dispatch(appOperations.closeModal());
        }
    };

    render() {
        const { terms, analytics } = this.props;
        const title = terms !== accountTypes.TERMS_MODE.PENDING ? "Privacy policy updated" : "";
        return (
            <Modal theme="legal" title={title}>
                <div className="modal__body">
                    <div className="row">
                        <div className="col-xs-12">
                            <Legal />
                        </div>
                    </div>
                </div>
                <div className="modal__footer">
                    <div className="row">
                        {terms === accountTypes.TERMS_MODE.PENDING &&
                            <div className="col-xs-12">
                                <label className="form-checkbox label__line">
                                    <input
                                        id="eula-agreement-checkbox"
                                        name="terms"
                                        type="checkbox"
                                        checked={this.state.terms}
                                        onChange={this.onChange}
                                        disabled={this.state.processing}
                                    />
                                    <span className="form-checkbox__label">I accept the agreement</span>
                                </label>
                            </div>
                        }
                        {analytics === accountTypes.ANALYTICS_MODE.PENDING &&
                        <div className="col-xs-12">
                            <label className="form-checkbox label__line">
                                <input
                                    id="ga-agreement-checkbox"
                                    name="analytics"
                                    type="checkbox"
                                    checked={this.state.analytics}
                                    onChange={this.onChange}
                                    disabled={this.state.processing}
                                />
                                <span className="form-checkbox__label">I agree to the personal data processing</span>
                            </label>
                        </div>
                        }
                    </div>
                    <div className="block__row justify-end-xs">
                        <button
                            type="button"
                            className="link link--red link--logout"
                            onClick={this.handleLogout}
                            disabled={this.state.processing}
                        >
                            Switch to another wallet
                        </button>
                        <button
                            disabled={!this.state.terms || this.state.processing}
                            className="button button__solid"
                            onClick={this.handleConfirm}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </Modal>
        );
    }
}

Law.propTypes = {
    analytics: PropTypes.oneOf(accountTypes.ANALYTICS_MODES_LIST),
    dispatch: PropTypes.func.isRequired,
    terms: PropTypes.PropTypes.oneOf(accountTypes.TERMS_MODES_LIST),
};

const mapStateToProps = state => ({
    analytics: state.account.analyticsMode,
    terms: state.account.termsMode,
});

export default connect(mapStateToProps)(Law);
