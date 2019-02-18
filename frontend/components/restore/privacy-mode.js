import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { push } from "react-router-redux";

import { WalletPath } from "routes";
import { accountActions, accountTypes } from "modules/account";
import { authOperations as operations, authTypes as types } from "modules/auth";
import { lndOperations } from "modules/lnd";

import PrivacyModeComponent from "components/privacy-mode";

class Terms extends Component {
    onChooseMode = () => {
        const { dispatch, method } = this.props;
        if (method === types.RESTORE_TYPE_SEED) {
            dispatch(operations.setAuthStep(types.RESTORE_STEP_SEED));
        } else {
            dispatch(push(WalletPath));
        }
    };

    goBack = () => {
        const { dispatch } = this.props;
        dispatch(accountActions.setPrivacyMode(accountTypes.PRIVACY_MODE.PENDING));
        dispatch(operations.setAuthStep(types.RESTORE_STEP_TERMS));
    };

    render() {
        return (
            <div>
                <div className="home__title">
                    Choose Wallet Privacy Mode
                </div>
                <div className="row">
                    <div className="col-xs-12">
                        <PrivacyModeComponent callback={this.onChooseMode} onlyToStore />
                    </div>
                </div>
                <div className="row mt-30">
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
    dispatch: PropTypes.func.isRequired,
    method: PropTypes.PropTypes.oneOf([
        types.RESTORE_TYPE_SEED,
        types.RESTORE_TYPE_FOLDER,
    ]).isRequired,
};

export default connect()(Terms);
