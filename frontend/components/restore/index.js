import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { analytics } from "additional";
import { connect } from "react-redux";
import { authTypes as types, authOperations as operations } from "modules/auth";
import Seed from "./seed";
import UserForm from "./user-form";
import Method from "./method";
import Folder from "./folder";
import Terms from "./terms";
import PrivacyMode from "./privacy-mode";

class Restore extends Component {
    constructor(props) {
        super(props);
        this.username = null;
        this.password = null;

        analytics.pageview("/restore", "Restore Password");
    }

    setUser = ({ username, password }) => {
        const { dispatch } = this.props;
        this.username = username;
        this.password = password;
        dispatch(operations.setHashedPassword(password));
    };

    render() {
        let content;
        switch (this.props.authStep) {
            case types.RESTORE_STEP_TERMS:
                return <Terms />;
            case types.RESTORE_STEP_PRIVACY_MODE:
                return <PrivacyMode />;
            case types.RESTORE_STEP_SEED:
                content = <Seed username={this.username} password={this.password} />;
                break;
            case types.RESTORE_STEP_USER_PASS:
                content = <UserForm username={this.username} onValidUser={this.setUser} />;
                break;
            case types.RESTORE_STEP_USE_WALLET_DATA:
                content = <Folder />;
                break;
            case types.RESTORE_STEP_SELECT_METHOD:
            default:
                content = <Method />;
                break;
        }

        return (
            <Fragment>
                <div className="home__title">
                    Wallet recovery
                </div>
                {content}
            </Fragment>
        );
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
