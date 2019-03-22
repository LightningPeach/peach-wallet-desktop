import React, { PureComponent, Fragment } from "react";
import PropTypes from "prop-types";
import Tooltip from "rc-tooltip";
import { push } from "react-router-redux";
import { connect } from "react-redux";

import { analytics, validators, helpers, tooltips } from "additional";
import { error } from "modules/notifications";
import { authOperations as operations, authTypes as types } from "modules/auth";
import { nodeSettings, routes } from "config";

import ErrorFieldTooltip from "components/ui/error-field-tooltip";

const spinner = <div className="spinner" />;

class SeedVerify extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            processing: false,
            seedError: null,
        };
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    cancelSeedVerify = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Registration", category: "Auth", label: "Cancel Enter Seed Words" });
        dispatch(operations.setAuthStep(types.REGISTRATION_STEP_SEED_DISPLAY));
    };

    submitSeedVerify = async (e) => {
        e.preventDefault();
        analytics.event({ action: "Registration", category: "Auth", label: "Submit Enter Seed Words" });
        this.setState({ processing: true });
        const {
            dispatch, walletName, password, seed,
        } = this.props;
        const userSeed = this.seed.value.trim();
        const seedError = validators.validatePassSeed(userSeed, this.props.seed.join(" "));

        if (seedError) {
            this.setState({ processing: false, seedError });
            return;
        }
        this.setState({ seedError });
        const response = await dispatch(operations.regFinish(walletName, password, seed));
        if (this._isMounted) {
            this.setState({ processing: false });
        }
        if (!response.ok) {
            dispatch(error({ message: helpers.formatNotificationMessage(response.error) }));
            return;
        }
        dispatch(push(routes.GuidePath));
    };

    handleSeedPaste = (e) => {
        if (!nodeSettings.DEV_MODE) {
            e.preventDefault();
        }
    };

    handleSeedContextMenu = (e) => {
        if (!nodeSettings.DEV_MODE) {
            e.preventDefault();
        }
    };

    handleSeedInput = (e) => {
        e.target.setAttribute("placeholder", !e.target.value ? "Write here" : "");
    };
    handleSeedChange = () => {
        this.setState({
            seedError: null,
        });
    };

    render() {
        const disabled = this.state.processing;
        return (
            <Fragment>
                <div className="row row--no-col justify-center-xs">
                    <div className="block__title">
                        Create a new wallet
                    </div>
                </div>
                <form className="form form--home" onSubmit={this.submitSeedVerify}>
                    <div className="block__row-lg">
                        <div className="col-xs-12">
                            <div className="form-label">
                                <label htmlFor="verify-seed">
                                    Enter your seed words
                                </label>
                                <Tooltip
                                    placement="right"
                                    overlay={tooltips.SEED_VERIFY}
                                    trigger="hover"
                                    arrowContent={
                                        <div className="rc-tooltip-arrow-inner" />
                                    }
                                    prefixCls="rc-tooltip__small rc-tooltip"
                                    mouseLeaveDelay={0}
                                >
                                    <i className="tooltip tooltip--info" />
                                </Tooltip>
                            </div>
                        </div>
                        <div className="col-xs-12">
                            <textarea
                                ref={(ref) => {
                                    this.seed = ref;
                                }}
                                className={`form-textarea ${this.state.seedError ? "form-textarea__error" : ""}`}
                                id="verify-seed"
                                placeholder="Write here"
                                onPaste={this.handleSeedPaste}
                                onContextMenu={this.handleSeedContextMenu}
                                onInput={this.handleSeedInput}
                                onChange={this.handleSeedChange}
                                disabled={disabled}
                            />
                            <ErrorFieldTooltip text={this.state.seedError} />
                        </div>
                    </div>
                    <div className="block__row-lg">
                        <div className="col-xs-12">
                            <button
                                type="submit"
                                className="button button__solid button--fullwide"
                                disabled={disabled}
                            >
                                Create wallet
                            </button>
                            {disabled ? spinner : null}
                        </div>
                    </div>
                    <div className="block__row-xs">
                        <div className="col-xs-12">
                            <button
                                type="button"
                                className="button button__solid button__solid--transparent button--fullwide"
                                onClick={this.cancelSeedVerify}
                                disabled={disabled}
                            >
                                Back
                            </button>
                        </div>
                    </div>
                </form>
            </Fragment>
        );
    }
}

SeedVerify.propTypes = {
    dispatch: PropTypes.func.isRequired,
    password: PropTypes.string.isRequired,
    seed: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    walletName: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
    walletName: state.auth.tempWalletName,
});

export default connect(mapStateToProps)(SeedVerify);
