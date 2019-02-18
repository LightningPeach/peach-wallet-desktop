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
            terms: props.terms || false,
        };
    }

    onChange = (e) => {
        this.setState({ [e.target.name]: e.target.checked });
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
        const { terms } = this.props;
        return (
            <Modal styleSet="legal">
                <div className="modal-body">
                    <div className="row">
                        <div className="col-xs-12">
                            <Legal fromProfile />
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <div className="row">
                        {terms === accountTypes.TERMS_MODE.PENDING &&
                            <div className="col-xs-12">
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
                        }
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
                    <div className="row justify-end-xs">
                        <div className="col-xs-12">
                            <button
                                disabled={!this.state.terms}
                                className="button button__orange"
                                onClick={this.handleConfirm}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

Law.propTypes = {
    analytics: PropTypes.oneOf([
        accountTypes.ANALYTICS_MODE.DISABLED,
        accountTypes.ANALYTICS_MODE.ENABLED,
        accountTypes.ANALYTICS_MODE.PENDING,
    ]),
    dispatch: PropTypes.func.isRequired,
    terms: PropTypes.PropTypes.oneOf([
        accountTypes.TERMS_MODE.ACCEPTED,
        accountTypes.TERMS_MODE.PENDING,
    ]),
};

const mapStateToProps = state => ({
    analytics: state.account.analyticsMode,
    terms: state.account.termsMode,
});

export default connect(mapStateToProps)(Law);
