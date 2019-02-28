import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { accountActions, accountTypes } from "modules/account";
import { authOperations as operations, authTypes as types } from "modules/auth";
import { lndOperations } from "modules/lnd";

import PrivacyModeComponent from "components/privacy-mode";

class Terms extends Component {
    onChooseMode = () => {
        const { dispatch } = this.props;
        dispatch(operations.setAuthStep(types.REGISTRATION_STEP_SEED_DISPLAY));
    };

    goBack = () => {
        const { dispatch } = this.props;
        dispatch(accountActions.setPrivacyMode(accountTypes.PRIVACY_MODE.PENDING));
        dispatch(operations.setAuthStep(types.REGISTRATION_STEP_TERMS));
    };

    render() {
        return (
            <Fragment>
                <div className="row justify-center-xs">
                    <div className="block__title">
                        Choose Wallet Privacy Mode
                    </div>
                </div>
                <div className="privacy">
                    <div className="block__row-lg">
                        <div className="col-xs-12">
                            <PrivacyModeComponent callback={this.onChooseMode} onlyToStore />
                        </div>
                    </div>
                    <div className="block__row-lg row--no-col justify-center-xs">
                        <button
                            type="button"
                            className="button button__solid button__solid--transparent"
                            onClick={this.goBack}
                        >
                            Back
                        </button>
                    </div>
                </div>
            </Fragment>
        );
    }
}

Terms.propTypes = {
    dispatch: PropTypes.func.isRequired,
};

export default connect()(Terms);
