import React, { Fragment, Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { authOperations as operations, authTypes as types } from "modules/auth";
import * as analytics from "additional/analytics";

class Method extends Component {
    useWalletData = () => {
        analytics.event({ action: "Restore Password", category: "Auth", label: "Use wallet data" });
        this.props.useData();
    };

    useSeed = () => {
        analytics.event({ action: "Restore Password", category: "Auth", label: "Use seed words" });
        this.props.useSeed();
    };

    cancelRestore = () => {
        analytics.event({ action: "Restore Password", category: "Auth", label: "Cancel select method" });
        this.props.cancelRestore();
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
                        From seeds words
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
    cancelRestore: PropTypes.func.isRequired,
    useData: PropTypes.func.isRequired,
    useSeed: PropTypes.func.isRequired,
};

const mapDispatchToProps = dispatch => ({
    cancelRestore: () => dispatch(operations.setForm(types.LOGIN_FORM)),
    useData: () => dispatch(operations.setAuthStep(types.RESTORE_STEP_USE_WALLET_DATA)),
    useSeed: () => dispatch(operations.setAuthStep(types.RESTORE_STEP_USER_PASS)),
});

export default connect(null, mapDispatchToProps)(Method);
