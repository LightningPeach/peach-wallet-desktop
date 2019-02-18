import React, { Fragment, Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { authOperations as operations, authTypes as types } from "modules/auth";
import * as analytics from "additional/analytics";

class Method extends Component {
    useWalletData = () => {
        const { dispatch, callback } = this.props;
        analytics.event({ action: "Restore Password", category: "Auth", label: "Use wallet data" });
        callback(types.RESTORE_TYPE_FOLDER);
        dispatch(operations.setAuthStep(types.RESTORE_STEP_USE_WALLET_DATA));
    };

    useSeed = () => {
        const { dispatch, callback } = this.props;
        analytics.event({ action: "Restore Password", category: "Auth", label: "Use seed words" });
        callback(types.RESTORE_TYPE_SEED);
        dispatch(operations.setAuthStep(types.RESTORE_STEP_USER_PASS));
    };

    cancelRestore = () => {
        const { dispatch, callback } = this.props;
        analytics.event({ action: "Restore Password", category: "Auth", label: "Cancel select method" });
        callback(null);
        dispatch(operations.setForm(types.LOGIN_FORM));
    };

    render() {
        return (
            <Fragment>
                <div className="col-xs-12 text-center">
                    <button
                        type="button"
                        className="button button__orange button__fullwide"
                        onClick={this.useWalletData}
                    >
                        From wallet folder
                    </button>
                </div>
                <div className="col-xs-12">
                    <button
                        type="button"
                        className="button button__orange button__fullwide button__under-button"
                        onClick={this.useSeed}
                    >
                        From seed words
                    </button>
                </div>
                <div className="col-xs-12 text-center">
                    <button
                        type="button"
                        className="button button__link button__under-button"
                        onClick={this.cancelRestore}
                    >
                        Cancel
                    </button>
                </div>
            </Fragment>
        );
    }
}

Method.propTypes = {
    callback: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
};

export default connect()(Method);
