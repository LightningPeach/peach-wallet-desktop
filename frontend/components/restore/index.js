import React, { Component } from "react";
import PropTypes from "prop-types";
import { analytics } from "additional";
import { connect } from "react-redux";
import { authTypes as types, authOperations as operations } from "modules/auth";
import Seed from "./seed";
import UserForm from "./user-form";
import Method from "./method";
import Folder from "./folder";
import Terms from "./terms";
import WalletMode from "./wallet-mode";

class Restore extends Component {
    constructor(props) {
        super(props);
        this.walletName = null;
        this.password = null;
        this.method = null;

        analytics.pageview("/restore", "Restore Password");
    }
    setMethod = (method) => {
        this.method = method;
    };

    setUser = ({ walletName, password }) => {
        const { dispatch } = this.props;
        this.walletName = walletName;
        this.password = password;
        dispatch(operations.setHashedPassword(password));
    };

    render() {
        const { authStep } = this.props;
        switch (authStep) {
            case types.RESTORE_STEP_TERMS:
                return <Terms method={this.method} />;
            case types.RESTORE_STEP_WALLET_MODE:
                return <WalletMode method={this.method} />;
            case types.RESTORE_STEP_SEED:
                return (
                    <Seed
                        walletName={this.walletName}
                        password={this.password}
                    />
                );
            case types.RESTORE_STEP_USER_PASS:
                return (
                    <UserForm
                        walletName={this.walletName}
                        onValidUser={this.setUser}
                    />
                );
            case types.RESTORE_STEP_USE_WALLET_DATA:
                return <Folder />;
            case types.RESTORE_STEP_SELECT_METHOD:
            default:
                return <Method callback={this.setMethod} />;
        }
    }
}

Restore.propTypes = {
    authStep: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
    authStep: state.auth.authStep,
});

export default connect(mapStateToProps)(Restore);
