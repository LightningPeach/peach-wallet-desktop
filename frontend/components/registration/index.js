import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics } from "additional";
import { authTypes as types, authOperations as operations } from "modules/auth";
import RegistrationForm from "./reg-form";
import SeedDisplay from "./seed-display";
import SeedVerify from "./seed-verify";
import Terms from "./terms";
import WalletMode from "./wallet-mode";

class Registration extends Component {
    constructor(props) {
        super(props);
        this.state = {
            password: null,
            seed: null,
        };

        analytics.pageview("/sign-up", "Sign Up");
    }

    onReloadSeed = (seed) => {
        this.setState({ seed });
    };

    onValidRegForm = ({ password, seed }) => {
        const { dispatch } = this.props;
        this.setState({ password, seed });
        dispatch(operations.setHashedPassword(password));
    };

    render() {
        const { authStep } = this.props;
        switch (authStep) {
            case types.REGISTRATION_STEP_TERMS:
                return <Terms />;
            case types.REGISTRATION_STEP_WALLET_MODE:
                return <WalletMode />;
            case types.REGISTRATION_STEP_SEED_DISPLAY:
                return (
                    <SeedDisplay
                        dispatch={this.props.dispatch}
                        onReload={this.onReloadSeed}
                        seed={this.state.seed}
                    />
                );
            case types.REGISTRATION_STEP_SEED_VERIFY:
                return (
                    <SeedVerify
                        password={this.state.password}
                        seed={this.state.seed}
                    />
                );
            case types.REGISTRATION_STEP_INIT:
            default:
                return <RegistrationForm onValid={this.onValidRegForm} />;
        }
    }
}

Registration.propTypes = {
    authStep: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
    authStep: state.auth.authStep,
});

export default connect(mapStateToProps)(Registration);
