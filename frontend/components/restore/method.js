import React, { Fragment, Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { authOperations as operations, authTypes as types } from "modules/auth";
import { analytics } from "additional";

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
                <div className="row row--no-col justify-center-xs">
                    <div className="block__title">
                        Wallet recovery
                    </div>
                </div>
                <div className="form form--home">
                    <div className="block__row-lg">
                        <div className="col-xs-12">
                            <button
                                type="button"
                                className="button button__solid button--fullwide"
                                onClick={this.useWalletData}
                            >
                                From wallet folder
                            </button>
                        </div>
                    </div>
                    <div className="block__row-xs">
                        <div className="col-xs-12">
                            <button
                                type="button"
                                className="button button__solid button--fullwide"
                                onClick={this.useSeed}
                            >
                                From seed words
                            </button>
                        </div>
                    </div>
                    <div className="block__row-xs">
                        <button
                            type="button"
                            className="button button__solid button__solid--transparent button--fullwide"
                            onClick={this.cancelRestore}
                        >
                            Cancel
                        </button>
                    </div>
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
